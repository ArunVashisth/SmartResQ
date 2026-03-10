"""
Accident Detection Model Module
Uses TensorFlow/Keras for accident classification when available,
or falls back to an OpenCV motion/optical-flow detector that works
on any Python version without TensorFlow.
"""
import numpy as np
import cv2

# ── Try to import TensorFlow ────────────────────────────────────────────────
try:
    from tensorflow.keras.models import model_from_json
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    model_from_json = None
    print("Warning: TensorFlow not available. Using OpenCV fallback detector.")


# ── OpenCV-based fallback accident detector ─────────────────────────────────
class _CVFallbackDetector:
    """
    Lightweight, self-calibrating accident detector using frame differencing.

    Instead of fixed pixel-difference thresholds (which depend on resolution
    and scene brightness), this detector computes *adaptive* thresholds using
    a rolling Z-score.  A frame is flagged as an accident when its mean pixel
    difference is more than `z_thresh` standard deviations above the rolling
    mean — this fires reliably on any video without manual tuning.

    Key signals:
      • mean_diff  – average absolute pixel change grey(t) vs grey(t-1)
      • flow_mag   – dense optical-flow magnitude (amount of motion)
      • z_score    – how many σ above the rolling mean the current diff is

    An accident is declared when BOTH z_score AND flow_mag are high.
    """

    def __init__(self, warmup_frames: int = 10, z_thresh: float = 2.5,
                 min_flow: float = 0.5):
        """
        Args:
            warmup_frames: Frames used to build the rolling baseline
                           before any detections are allowed.
            z_thresh:      Z-score above which a frame is considered anomalous.
            min_flow:      Minimum optical-flow magnitude (px/frame) that must
                           accompany the spike (filters static-scene flashes).
        """
        self.warmup_frames = warmup_frames
        self.z_thresh      = z_thresh
        self.min_flow      = min_flow

        self._history: list[float] = []  # rolling diff values
        self._prev_grey = None
        self._frame_idx = 0

    @staticmethod
    def _grey(frame_rgb: np.ndarray) -> np.ndarray:
        g = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2GRAY)
        return cv2.GaussianBlur(g, (5, 5), 0)

    def predict(self, frame_rgb: np.ndarray):
        """
        Analyse one frame.

        Returns:
            (label, prob_0_to_100)
              label – 'Accident' | 'No Accident'
              prob  – float in [0, 100]
        """
        self._frame_idx += 1
        grey = self._grey(frame_rgb)

        if self._prev_grey is None:
            self._prev_grey = grey
            return 'No Accident', 0.0

        # ── Frame difference ──────────────────────────────────────────
        diff      = cv2.absdiff(grey, self._prev_grey)
        mean_diff = float(diff.mean())

        # ── Optical flow ──────────────────────────────────────────────
        flow = cv2.calcOpticalFlowFarneback(
            self._prev_grey, grey, None,
            pyr_scale=0.5, levels=2, winsize=9,
            iterations=2, poly_n=5, poly_sigma=1.1, flags=0
        )
        mag = float(np.sqrt(flow[..., 0] ** 2 + flow[..., 1] ** 2).mean())

        self._prev_grey = grey

        # ── Rolling statistics ────────────────────────────────────────
        self._history.append(mean_diff)
        # Keep a longer window for a stable baseline
        if len(self._history) > 30:
            self._history.pop(0)

        if len(self._history) < self.warmup_frames:
            # Still warming up — not enough data to detect anything
            return 'No Accident', 0.0

        roll_mean = float(np.mean(self._history))
        roll_std  = float(np.std(self._history)) + 1e-6  # avoid /0

        # ── Z-score ───────────────────────────────────────────────────
        z = (mean_diff - roll_mean) / roll_std

        if z >= self.z_thresh and mag >= self.min_flow:
            # Map Z-score to a confidence percentage
            # z_thresh   → ~65 %, z_thresh*2 → ~95 %
            prob = min(65.0 + (z - self.z_thresh) * 15.0, 99.5)
            return 'Accident', prob
        else:
            # Confidence of NO accident proportional to how far below threshold
            prob = max(0.0, min((self.z_thresh - z) / self.z_thresh * 50.0, 50.0))
            return 'No Accident', prob


# ── Public model class ───────────────────────────────────────────────────────
class AccidentDetectionModel:
    """
    Wraps either the TF/Keras model or the OpenCV fallback.
    The caller does not need to know which backend is running.
    """
    class_nums = ['Accident', 'No Accident']

    def __init__(self, model_json_file: str, model_weights_file: str):
        self._tf_model   = None
        self._cv_model   = None
        self._use_tf     = False

        if TENSORFLOW_AVAILABLE:
            try:
                with open(model_json_file, "r") as f:
                    self._tf_model = model_from_json(f.read())
                self._tf_model.load_weights(model_weights_file)
                self._tf_model.make_predict_function()
                self._use_tf = True
                print("✓ TF model loaded successfully.")
            except Exception as e:
                print(f"⚠ TF model load failed ({e}). Using OpenCV fallback.")

        if not self._use_tf:
            self._cv_model = _CVFallbackDetector()
            print("✓ OpenCV fallback detector active (no TensorFlow required).")

    def predict_accident(self, img: np.ndarray):
        """
        Predict whether an accident occurred.

        Args:
            img: shape (1, H, W, 3) uint8 RGB array.

        Returns:
            (label, preds_array)
              label       – 'Accident' | 'No Accident'
              preds_array – shape (1, 2) float32 [p_accident, p_no_accident]
                            (matches the existing caller expectation)
        """
        frame = img[0]  # (H, W, 3)

        if self._use_tf and self._tf_model is not None:
            preds = self._tf_model.predict(img, verbose=0)
            label = AccidentDetectionModel.class_nums[int(np.argmax(preds))]
            return label, preds
        else:
            # OpenCV fallback
            label, prob = self._cv_model.predict(frame)
            # Build a (1, 2) probability array to match TF output shape:
            # index 0 = Accident prob, index 1 = No Accident prob
            p_acc    = prob / 100.0
            p_no_acc = 1.0 - p_acc
            preds = np.array([[p_acc, p_no_acc]], dtype=np.float32)
            return label, preds

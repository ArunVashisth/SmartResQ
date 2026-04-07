"""
License Plate Detection — Tesseract-only (production build)
EasyOCR has been removed: it installs PyTorch internally (~2.4 GB),
which pushes the Docker image over Railway's 4 GB limit.
Tesseract is lighter, already a system dependency, and sufficient
for license-plate-grade OCR with our pre-processing pipeline.
"""
import cv2
import numpy as np
import os
import re
from typing import Any, Dict
from config import Config

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("Warning: pytesseract not available — OCR disabled.")


class LicensePlateDetector:
    """License plate detector using Tesseract OCR."""

    def __init__(self, ocr_engine: str = 'tesseract'):
        # Always use tesseract in production regardless of passed value
        self.ocr_engine = 'tesseract'
        if not TESSERACT_AVAILABLE:
            print("[LPD] Tesseract not available — plates will not be read.")
    
    def preprocess_plate_image(self, plate_img):
        """
        Preprocess plate image for better OCR results
        
        Args:
            plate_img: Cropped license plate image
            
        Returns:
            Preprocessed image
        """
        # Convert to grayscale
        gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
        
        # Apply bilateral filter to reduce noise while keeping edges sharp
        filtered = cv2.bilateralFilter(gray, 11, 17, 17)
        
        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
        
        return denoised
    
    def extract_text_tesseract(self, plate_img):
        """Extract text using Tesseract OCR."""
        if not TESSERACT_AVAILABLE:
            return ""
        try:
            custom_config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            text = pytesseract.image_to_string(plate_img, config=custom_config)
            return self.clean_plate_text(text)
        except Exception as e:
            print(f"[LPD] Tesseract error: {e}")
            return ""
    
    def clean_plate_text(self, text):
        """
        Clean and format extracted license plate text
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned text
        """
        # Remove special characters and extra spaces
        text = re.sub(r'[^A-Z0-9\s]', '', text.upper())
        text = ' '.join(text.split())
        
        return text
    
    def detect_and_extract(self, image_path):
        """
        Detect license plate and extract text
        
        Args:
            image_path: Path to image file
            
        Returns:
            dict with 'success', 'plate_path', 'text', 'confidence'
        """
        result: Dict[str, Any] = {
            'success': False,
            'plate_path': None,
            'text': '',
            'confidence': 0.0,
            'bbox': None
        }
        
        try:
            # Read the image
            image = cv2.imread(image_path)
            if image is None:
                print(f"Error: Unable to load image from {image_path}")
                return result
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply bilateral filter
            gray = cv2.bilateralFilter(gray, 11, 17, 17)
            
            # Find edges
            edged = cv2.Canny(gray, 30, 200)
            
            # Find contours
            contours, _ = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            raw_contours = sorted(list(contours), key=cv2.contourArea, reverse=True)
            # Use islice-style comprehension to get top 10 (avoids Pyre2 list-slice error)
            contours_list = [raw_contours[i] for i in range(min(10, len(raw_contours)))]
            
            plate_found = False
            for contour in contours_list:
                perimeter = cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
                
                # Look for rectangle-like contours (4 corners)
                if len(approx) == 4:
                    x, y, w, h = cv2.boundingRect(approx)
                    
                    # Check aspect ratio
                    aspect_ratio = float(w) / h
                    if 2.0 < aspect_ratio < 5.5:  # Common license plate aspect ratios
                        plate = image[y:y+h, x:x+w]
                        
                        # Create directory if it doesn't exist
                        os.makedirs(Config.VEHICLE_PLATES_DIR, exist_ok=True)
                        
                        # Save the plate image
                        base_name = os.path.splitext(os.path.basename(image_path))[0]
                        plate_filename = os.path.join(Config.VEHICLE_PLATES_DIR, f"{base_name}_plate.jpg")
                        
                        # Enhance the plate image
                        plate_enhanced = cv2.resize(plate, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
                        cv2.imwrite(plate_filename, plate_enhanced)
                        
                        # Preprocess for OCR
                        plate_processed = self.preprocess_plate_image(plate_enhanced)
                        
                        # Extract text using Tesseract only
                        text = self.extract_text_tesseract(plate_processed)
                        
                        result['success'] = True
                        result['plate_path'] = plate_filename
                        result['text'] = text
                        result['bbox'] = f"{x},{y},{w},{h}"  # store as string to avoid type mismatch
                        result['confidence'] = 0.85  # Placeholder confidence
                        
                        print(f"License plate detected: {text}")
                        print(f"Saved as: {plate_filename}")
                        
                        plate_found = True
                        break
            
            return result
            
        except Exception as e:
            print(f"Error during license plate detection: {e}")
            return result


# Legacy function for backward compatibility
def detect_license_plate(image_path):
    """
    Legacy function for backward compatibility
    
    Args:
        image_path: Path to image file
        
    Returns:
        Boolean indicating success
    """
    detector = LicensePlateDetector(ocr_engine=Config.OCR_ENGINE)
    result = detector.detect_and_extract(image_path)
    return result['success']
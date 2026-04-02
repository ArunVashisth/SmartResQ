import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Video, Cpu, Brain, Radio, ArrowRight } from 'lucide-react';

const stages = [
  {
    id: 1,
    title: 'Sensor Input (RTSP/USB)',
    description: 'Live CCTV feed ingestion from multiple camera sources',
    icon: Video,
    color: 'blue',
    details: ['4K Resolution', 'H.264 Codec', 'Multi-stream']
  },
  {
    id: 2,
    title: 'CV2 Frame Processing',
    description: 'Real-time frame extraction and preprocessing pipeline',
    icon: Cpu,
    color: 'purple',
    details: ['60 FPS', 'Frame Buffer', 'Color Normalization']
  },
  {
    id: 3,
    title: 'AI Inference (CNN)',
    description: 'Deep learning model inference for accident detection',
    icon: Brain,
    color: 'pink',
    details: ['GPU Accelerated', 'Batch Processing', 'Confidence Score']
  },
  {
    id: 4,
    title: 'Telemetry Export',
    description: 'Real-time data transmission to emergency systems',
    icon: Radio,
    color: 'green',
    details: ['WebSocket', 'JSON Payload', 'Auto-retry']
  },
];

export default function PipelineVisualizer() {
  const [activeStage, setActiveStage] = useState(0);
  const [dataFlow, setDataFlow] = useState(0);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % stages.length);
    }, 2000);

    const flowInterval = setInterval(() => {
      setDataFlow((prev) => (prev + 1) % 100);
    }, 30);

    return () => {
      clearInterval(stageInterval);
      clearInterval(flowInterval);
    };
  }, []);

  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', glow: 'bg-blue-400', activeBorder: 'border-blue-400' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', glow: 'bg-purple-400', activeBorder: 'border-purple-400' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', glow: 'bg-pink-400', activeBorder: 'border-pink-400' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', glow: 'bg-green-400', activeBorder: 'border-green-400' },
  };

  return (
    <div className="relative">
      {/* Pipeline stages */}
      <div className="grid md:grid-cols-4 gap-6 relative">
        {stages.map((stage, index) => {
          const colors = colorMap[stage.color as keyof typeof colorMap];
          const isActive = activeStage === index;
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Glow effect */}
                <motion.div
                  animate={{
                    opacity: isActive ? [0.15, 0.3, 0.15] : 0.05,
                    scale: isActive ? [1, 1.05, 1] : 1,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={`absolute inset-0 ${colors.glow} rounded-2xl blur-2xl opacity-30`}
                />

                {/* Card */}
                <div className={`relative bg-white border-2 ${isActive ? colors.activeBorder : colors.border} rounded-2xl p-6 transition-all duration-500 shadow-md hover:shadow-lg`}>
                  {/* Stage number */}
                  <div className={`absolute -top-4 -left-4 w-10 h-10 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center shadow-md bg-white`}>
                    <span className={`text-lg font-bold ${colors.text}`}>{stage.id < 10 ? `0${stage.id}` : stage.id}</span>
                  </div>

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-4 mx-auto`}>
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg mb-2 text-center text-slate-900 font-medium">{stage.title}</h3>

                  {/* Description */}
                  <p className="text-sm text-slate-600 mb-4 text-center">
                    {stage.description}
                  </p>

                  {/* Details */}
                  <div className="space-y-2">
                    {stage.details.map((detail) => (
                      <div
                        key={detail}
                        className={`text-xs ${colors.text} ${colors.bg} px-3 py-1 rounded-full text-center border ${colors.border}`}
                      >
                        {detail}
                      </div>
                    ))}
                  </div>

                  {/* Activity indicator */}
                  <motion.div
                    animate={{
                      opacity: isActive ? 1 : 0,
                    }}
                    className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full ${colors.glow}`}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [1, 0, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className={`absolute inset-0 rounded-full ${colors.glow}`}
                    />
                  </motion.div>
                </div>
              </motion.div>

              {/* Arrow connector */}
              {index < stages.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
                  <motion.div
                    animate={{
                      x: [0, 10, 0],
                      opacity: activeStage === index ? [0.5, 1, 0.5] : 0.3,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <ArrowRight className="w-6 h-6 text-blue-400" />
                  </motion.div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Data flow visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        viewport={{ once: true }}
        className="mt-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg text-slate-900 font-medium">Real-time Data Flow</h4>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
              className="w-2 h-2 rounded-full bg-green-500"
            />
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <motion.div
            animate={{
              width: `${dataFlow}%`,
            }}
            transition={{
              duration: 0.1,
            }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 rounded-full"
          >
            <motion.div
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl text-blue-600 mb-1 font-bold">60</div>
            <div className="text-xs text-slate-600">Frames/sec</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-blue-600 mb-1 font-bold">&lt;250ms</div>
            <div className="text-xs text-slate-600">Processing Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-blue-600 mb-1 font-bold">97.3%</div>
            <div className="text-xs text-slate-600">Accuracy</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

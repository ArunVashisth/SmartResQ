import { motion } from 'framer-motion';
import { Camera, Database, Server, Cloud, Brain, Phone } from 'lucide-react';

export default function ArchitectureDiagram() {
  const nodes = [
    { id: 'camera', label: 'CCTV Cameras', icon: Camera, position: { x: 0, y: 0 }, color: 'blue' },
    { id: 'ingestion', label: 'Stream Ingestion', icon: Server, position: { x: 1, y: 0 }, color: 'purple' },
    { id: 'ml', label: 'ML Pipeline', icon: Brain, position: { x: 2, y: 0 }, color: 'pink' },
    { id: 'db', label: 'Database Layer', icon: Database, position: { x: 1, y: 1 }, color: 'green' },
    { id: 'cloud', label: 'Cloud Services', icon: Cloud, position: { x: 2, y: 1 }, color: 'cyan' },
    { id: 'dispatch', label: 'Emergency Dispatch', icon: Phone, position: { x: 3, y: 0 }, color: 'red' },
  ];

  const connections = [
    { from: 'camera', to: 'ingestion' },
    { from: 'ingestion', to: 'ml' },
    { from: 'ingestion', to: 'db' },
    { from: 'ml', to: 'cloud' },
    { from: 'ml', to: 'dispatch' },
    { from: 'cloud', to: 'dispatch' },
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' },
    cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' },
  };

  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl p-8 lg:p-12 overflow-hidden shadow-md">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40" />

      <div className="relative">
        {/* Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map((conn, index) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);

            if (!fromNode || !toNode) return null;

            const gridCols = 4;
            const gridRows = 2;
            const cellWidth = 100 / gridCols;
            const cellHeight = 100 / gridRows;

            const x1 = (fromNode.position.x * cellWidth) + (cellWidth / 2);
            const y1 = (fromNode.position.y * cellHeight) + (cellHeight / 2);
            const x2 = (toNode.position.x * cellWidth) + (cellWidth / 2);
            const y2 = (toNode.position.y * cellHeight) + (cellHeight / 2);

            return (
              <motion.line
                key={`${conn.from}-${conn.to}`}
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.5 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            );
          })}
        </svg>

        {/* Nodes */}
        <div className="relative grid grid-cols-4 grid-rows-2 gap-8" style={{ zIndex: 2 }}>
          {nodes.map((node, index) => {
            const Icon = node.icon;
            const colors = colorMap[node.color as keyof typeof colorMap];
            const gridColumn = node.position.x + 1;
            const gridRow = node.position.y + 1;

            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.1, y: -5 }}
                style={{
                  gridColumn,
                  gridRow,
                }}
                className="flex justify-center items-center"
              >
                <div className={`relative ${colors.bg} border-2 ${colors.border} rounded-xl p-4 bg-white hover:shadow-lg transition-all duration-300 group`}>
                  <div className="flex flex-col items-center gap-2 min-w-[120px]">
                    <div className={`w-12 h-12 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div className="text-sm text-center font-medium text-slate-900">{node.label}</div>
                  </div>

                  {/* Pulse animation */}
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.3,
                    }}
                    className={`absolute inset-0 rounded-xl border-2 ${colors.border}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t border-slate-200"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Input Layer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span>AI Inference</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span>Cloud Services</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Output/Alert</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface TechCardProps {
  icon: ReactNode;
  title: string;
  category: string;
  tags: string[];
  description: string;
  color: 'blue' | 'purple' | 'amber' | 'green' | 'red';
  delay: number;
  onHover: () => void;
  isActive: boolean;
  metrics?: { label: string; value: string }[];
}

export default function TechCard({
  icon,
  title,
  category,
  tags,
  description,
  color,
  delay,
  onHover,
  isActive,
  metrics
}: TechCardProps) {
  const colorMap = {
    blue: 'border-blue-200 group-hover:border-blue-400 group-hover:shadow-lg',
    purple: 'border-purple-200 group-hover:border-purple-400 group-hover:shadow-lg',
    amber: 'border-amber-200 group-hover:border-amber-400 group-hover:shadow-lg',
    green: 'border-green-200 group-hover:border-green-400 group-hover:shadow-lg',
    red: 'border-red-200 group-hover:border-red-400 group-hover:shadow-lg',
  };

  const iconColorMap = {
    blue: 'text-blue-600 bg-blue-50 border border-blue-200',
    purple: 'text-purple-600 bg-purple-50 border border-purple-200',
    amber: 'text-amber-600 bg-amber-50 border border-amber-200',
    green: 'text-green-600 bg-green-50 border border-green-200',
    red: 'text-red-600 bg-red-50 border border-red-200',
  };

  const badgeColorMap = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  const glowColorMap = {
    blue: 'bg-blue-200/40',
    purple: 'bg-purple-200/40',
    amber: 'bg-amber-200/40',
    green: 'bg-green-200/40',
    red: 'bg-red-200/40',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      onHoverStart={onHover}
      className="relative group h-full"
    >
      {/* Glow effect */}
      <motion.div
        animate={{
          opacity: isActive ? [0.3, 0.5, 0.3] : 0.15,
          scale: isActive ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute inset-0 ${glowColorMap[color]} rounded-2xl blur-xl`}
      />

      {/* Card */}
      <div className={`relative h-full bg-white border-2 ${colorMap[color]} rounded-2xl p-6 transition-all duration-300`}>
        {/* Icon */}
        <div className={`w-14 h-14 rounded-xl ${iconColorMap[color]} flex items-center justify-center mb-4`}>
          {icon}
        </div>

        {/* Header */}
        <div className="mb-4">
          <h3 className="text-2xl mb-2 text-slate-900">{title}</h3>
          <div className={`inline-block px-3 py-1 rounded-full text-xs border ${badgeColorMap[color]}`}>
            {category}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700 border border-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          {description}
        </p>

        {/* Metrics */}
        {metrics && metrics.length > 0 && (
          <div className="border-t border-slate-200 pt-4 space-y-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="flex justify-between items-center">
                <span className="text-xs text-slate-500">{metric.label}</span>
                <span className="text-sm text-green-600 font-medium" dangerouslySetInnerHTML={{ __html: metric.value }} />
              </div>
            ))}
          </div>
        )}

        {/* Animated corner accent */}
        <motion.div
          animate={{
            opacity: isActive ? 1 : 0,
            scale: isActive ? 1 : 0.8,
          }}
          className={`absolute top-4 right-4 w-2 h-2 rounded-full ${iconColorMap[color]}`}
        />
      </div>
    </motion.div>
  );
}

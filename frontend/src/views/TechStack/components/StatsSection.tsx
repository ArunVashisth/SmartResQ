import { motion } from 'framer-motion';
import { TrendingUp, Zap, Globe, Shield } from 'lucide-react';

export default function StatsSection() {
  const stats = [
    {
      icon: TrendingUp,
      value: '10,000+',
      label: 'Training Scenarios',
      description: 'Diverse accident patterns',
      color: 'blue'
    },
    {
      icon: Zap,
      value: '&lt; 100ms',
      label: 'Response Time',
      description: 'Ultra-low latency',
      color: 'amber'
    },
    {
      icon: Globe,
      value: '128+',
      label: 'Concurrent Streams',
      description: 'Simultaneous CCTV feeds',
      color: 'purple'
    },
    {
      icon: Shield,
      value: '99.9%',
      label: 'System Reliability',
      description: 'Mission-critical uptime',
      color: 'green'
    }
  ];

  const colorMap = {
    blue: 'from-blue-600 to-cyan-600',
    amber: 'from-amber-600 to-yellow-600',
    purple: 'from-purple-600 to-pink-600',
    green: 'from-green-600 to-emerald-600'
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50/50 border-y border-blue-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${colorMap[stat.color as keyof typeof colorMap]} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity duration-300`} />

                <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
                  <Icon className="w-8 h-8 text-blue-600 mb-4" />
                  <div className={`text-4xl mb-2 bg-gradient-to-r ${colorMap[stat.color as keyof typeof colorMap]} bg-clip-text text-transparent font-bold`} dangerouslySetInnerHTML={{ __html: stat.value }} />

                  <div className="text-lg mb-1 text-slate-900">{stat.label}</div>
                  <div className="text-sm text-slate-600">{stat.description}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

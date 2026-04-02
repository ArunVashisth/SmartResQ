import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Camera, Phone, Zap, Network, Server, Shield,
  MessageSquare, Radio, Activity,
  TrendingUp, Globe, Video, Cpu, ArrowRight, Database
} from 'lucide-react';
import './TechStack.css';

/* ─── Pipeline stages ─── */
const pipelineStages = [
  { id: 1, color: 'blue',   Icon: Video,  title: 'Sensor Input (RTSP/USB)',   description: 'Live CCTV feed ingestion from multiple camera sources',        details: ['4K Resolution','H.264 Codec','Multi-stream'] },
  { id: 2, color: 'purple', Icon: Cpu,    title: 'CV2 Frame Processing',      description: 'Real-time frame extraction and preprocessing pipeline',          details: ['60 FPS','Frame Buffer','Color Normalization'] },
  { id: 3, color: 'pink',   Icon: Brain,  title: 'AI Inference (CNN)',         description: 'Deep learning model inference for accident detection',           details: ['GPU Accelerated','Batch Processing','Confidence Score'] },
  { id: 4, color: 'green',  Icon: Radio,  title: 'Telemetry Export',          description: 'Real-time data transmission to emergency systems',              details: ['WebSocket','JSON Payload','Auto-retry'] },
];

/* ─── Stats ─── */
const stats = [
  { Icon: TrendingUp, value: '10,000+', label: 'Training Scenarios', desc: 'Diverse accident patterns',   color: 'blue'   },
  { Icon: Zap,        value: '< 100ms', label: 'Response Time',       desc: 'Ultra-low latency',           color: 'amber'  },
  { Icon: Globe,      value: '128+',    label: 'Concurrent Streams',  desc: 'Simultaneous CCTV feeds',     color: 'purple' },
  { Icon: Shield,     value: '99.9%',   label: 'System Reliability',  desc: 'Mission-critical uptime',     color: 'green'  },
];

/* ─── Tech stack grid ─── */
const techItems = [
  { name: 'TensorFlow', category: 'ML Framework' },     { name: 'PyTorch',    category: 'Deep Learning' },
  { name: 'OpenCV',     category: 'Computer Vision' },  { name: 'YOLO v8',   category: 'Object Detection' },
  { name: 'Flask',      category: 'Backend API' },       { name: 'Socket.io',  category: 'Real-time' },
  { name: 'Redis',      category: 'Caching' },           { name: 'PostgreSQL', category: 'Database' },
  { name: 'MongoDB',    category: 'Document DB' },       { name: 'Docker',     category: 'Containers' },
  { name: 'Kubernetes', category: 'Orchestration' },     { name: 'Twilio',     category: 'Communications' },
  { name: 'AWS',        category: 'Cloud Infrastructure' }, { name: 'CUDA',    category: 'GPU Acceleration' },
  { name: 'ONNX',       category: 'Model Export' },      { name: 'Grafana',    category: 'Monitoring' },
];

/* ─── Arch Row 1 nodes ─── */
const archRow1 = [
  { label: 'CCTV Cameras',      sublabel: 'Input Layer',   color: 'blue',   dotColor: '#3b82f6', Icon: Camera },
  { label: 'Stream Ingestion',  sublabel: 'Processing',    color: 'purple', dotColor: '#a855f7', Icon: Server },
  { label: 'ML Pipeline',       sublabel: 'AI Inference',  color: 'pink',   dotColor: '#ec4899', Icon: Brain  },
  { label: 'Emergency Dispatch',sublabel: 'Output/Alert',  color: 'red',    dotColor: '#ef4444', Icon: Phone  },
];

/* ─── Arch Row 2 nodes ─── */
const archRow2 = [
  { label: 'Database Layer', sublabel: 'Processing',    color: 'green', dotColor: '#22c55e', Icon: Database },
  { label: 'Cloud Services', sublabel: 'Cloud Services',color: 'amber', dotColor: '#f59e0b', Icon: Globe    },
];

/* ─── Legend ─── */
const archLegend = [
  { color: '#3b82f6', label: 'Input Layer'   },
  { color: '#22c55e', label: 'Storage'       },
  { color: '#a855f7', label: 'Processing'    },
  { color: '#f59e0b', label: 'Cloud Services'},
  { color: '#ec4899', label: 'AI Inference'  },
  { color: '#ef4444', label: 'Output/Alert'  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6 },
  viewport: { once: true },
});

export default function TechStack() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeStage, setActiveStage] = useState(0);
  const [dataFlow, setDataFlow]       = useState(0);

  useEffect(() => {
    const stageT = setInterval(() => setActiveStage(p => (p + 1) % pipelineStages.length), 2000);
    const flowT  = setInterval(() => setDataFlow(p => (p + 1) % 101), 30);
    return () => { clearInterval(stageT); clearInterval(flowT); };
  }, []);

  return (
    <div id="techstack-root">

      {/* ══════════ HERO ══════════ */}
      <section className="ts-hero">
        <div className="ts-hero-bg-grid" />
        <div className="ts-hero-pulse-1" />
        <div className="ts-hero-pulse-2" />

        <div className="ts-container ts-text-center" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ y:-30,opacity:0 }} animate={{ y:0,opacity:1 }} transition={{ delay:0.2,duration:0.7 }}>
            <div className="ts-hero-badge">
              <Shield size={16} color="#1d4ed8" />
              <span>Enterprise-Grade Infrastructure</span>
            </div>
          </motion.div>

          <motion.h1 className="ts-hero-title" initial={{ y:40,opacity:0 }} animate={{ y:0,opacity:1 }} transition={{ delay:0.4,duration:0.8 }}>
            Neural Engine &amp; Systems
          </motion.h1>

          <motion.p className="ts-hero-subtitle" initial={{ y:40,opacity:0 }} animate={{ y:0,opacity:1 }} transition={{ delay:0.6,duration:0.8 }}>
            Exposing the high-performance architecture powering SmartResQ&apos;s life-saving accident detection and emergency response system
          </motion.p>

          <motion.div className="ts-hero-badges" initial={{ y:40,opacity:0 }} animate={{ y:0,opacity:1 }} transition={{ delay:0.8,duration:0.8 }}>
            {['Real-time AI','60 FPS Processing','&lt; 100ms Response','99.9% Uptime'].map((b,i) => (
              <motion.div key={b} className="ts-badge-pill" initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:1+i*0.1 }} dangerouslySetInnerHTML={{ __html: b }} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section className="ts-stats-section">
        <div className="ts-container">
          <div className="ts-grid-4">
            {stats.map(({ Icon, value, label, desc, color }, i) => (
              <motion.div key={label} {...fadeUp(i * 0.1)} whileHover={{ scale:1.04 }}>
                <div className="ts-stat-card">
                  <Icon className="ts-stat-icon" />
                  <div className={`ts-stat-value ${color}`}>{value}</div>
                  <div className="ts-stat-label">{label}</div>
                  <div className="ts-stat-desc">{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ INTELLIGENCE CORE ══════════ */}
      <section className="ts-neural-bg">
        <motion.div className="ts-section-header" {...fadeUp()}>
          <div className="ts-section-icon-row" style={{ justifyContent:'center' }}>
            <Brain size={32} color="#2563eb" />
            <h2 className="ts-section-title">Intelligence Core</h2>
          </div>
          <p className="ts-section-subtitle">
            Deep learning models trained on 10,000+ accident scenarios using custom CNN architectures for real-time temporal analysis
          </p>
        </motion.div>

        <div className="ts-grid-3">
          {[
            { Icon:Brain,   id:'core', title:'Intelligence Core',    category:'NEURAL READY', color:'blue',
              tags:['CNN','LSTM','YOLOv8'],
              desc:'Deep Learning model trained on 10,000+ accident scenarios using custom CNN architectures for real-time temporal analysis',
              metrics:[{label:'Accuracy',value:'97.3%'},{label:'Detection Time',value:'< 250ms'},{label:'False Positives',value:'0.3%'}] },
            { Icon:Camera,  id:'cv',   title:'Computer Vision',      category:'CV PIPELINE',  color:'purple',
              tags:['OpenCV','OCR Neural','NLP'],
              desc:'Advanced computer vision for license plate extraction (EasyOCR) and high-speed frame processing at 60 FPS',
              metrics:[{label:'FPS',value:'60'},{label:'OCR Accuracy',value:'99.1%'},{label:'Resolution',value:'4K'}] },
            { Icon:Zap,     id:'edge', title:'Real-time Processing', category:'EDGE COMPUTE', color:'amber',
              tags:['Flask','Socket.io','EventNet'],
              desc:'Ultra-low latency WebSocket pipeline for bi-directional communication between the neural engine and dashboard',
              metrics:[{label:'Latency',value:'< 100ms'},{label:'Throughput',value:'10K/s'},{label:'Streams',value:'128+'}] },
          ].map(({ Icon, id, title, category, color, tags, desc, metrics }, i) => (
            <motion.div key={id} className="ts-techcard-wrapper"
              initial={{ opacity:0, y:50 }} whileInView={{ opacity:1, y:0 }}
              transition={{ delay:i*0.1, duration:0.6 }} viewport={{ once:true }}
              whileHover={{ y:-10 }}
              onHoverStart={() => setHoveredCard(id)}
              onHoverEnd={() => setHoveredCard(null)}
            >
              <motion.div className={`ts-techcard-glow ${color}`}
                animate={{ opacity: hoveredCard===id ? [0.3,0.5,0.3] : 0.15, scale: hoveredCard===id ? [1,1.05,1] : 1 }}
                transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
              />
              <div className={`ts-techcard ${color}`}>
                <div className={`ts-techcard-icon ${color}`}><Icon size={28} /></div>
                <h3 className="ts-techcard-title">{title}</h3>
                <div className={`ts-techcard-badge ${color}`}>{category}</div>
                <div className="ts-techcard-tags">{tags.map(t => <span key={t} className="ts-tag">{t}</span>)}</div>
                <p className="ts-techcard-desc">{desc}</p>
                <div className="ts-techcard-metrics">
                  {metrics.map(m => (
                    <div key={m.label} className="ts-metric-row">
                      <span className="ts-metric-label">{m.label}</span>
                      <span className="ts-metric-value">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════ EMERGENCY RESPONSE ══════════ */}
      <section className="ts-emergency-section">
        <div className="ts-container">
          <motion.div className="ts-section-header" {...fadeUp()}>
            <div className="ts-section-icon-row" style={{ justifyContent:'center' }}>
              <Phone size={32} color="#dc2626" />
              <h2 className="ts-section-title">Emergency Response</h2>
            </div>
            <p className="ts-section-subtitle">Instantaneous automated dispatch system with multi-channel redundancy</p>
          </motion.div>

          <div className="ts-emergency-grid">
            {/* Twilio */}
            <motion.div className="ts-emergency-card" initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} transition={{ duration:0.8 }} viewport={{ once:true }}>
              <div className="ts-emergency-card-glow red" />
              <div className="ts-emergency-card-inner red">
                <div className="ts-emergency-icon red"><Phone size={28} /></div>
                <div className="ts-emergency-title-row">
                  <h3 className="ts-emergency-title">Twilio API</h3>
                  <span className="ts-emergency-sub-badge red">REST</span>
                </div>
                <p className="ts-emergency-desc">Automated TwiML-based dispatch system that handles instantaneous emergency calls and SMS notifications</p>
                <div className="ts-techcard-metrics">
                  {[['Call Initiation','< 1 second'],['SMS Delivery','< 3 seconds'],['Success Rate','99.95%']].map(([l,v]) => (
                    <div key={l} className="ts-metric-row">
                      <span className="ts-metric-label">{l}</span>
                      <span className="ts-metric-value">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Multi-Channel */}
            <motion.div className="ts-emergency-card" initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} transition={{ duration:0.8 }} viewport={{ once:true }}>
              <div className="ts-emergency-card-glow blue" />
              <div className="ts-emergency-card-inner blue">
                <div className="ts-emergency-icon blue"><MessageSquare size={28} /></div>
                <div className="ts-emergency-title-row">
                  <h3 className="ts-emergency-title">Multi-Channel Alerts</h3>
                  <span className="ts-emergency-sub-badge blue">REDUNDANT</span>
                </div>
                <p className="ts-emergency-desc">Parallel notification system across SMS, Voice, and Push channels with intelligent fallback mechanisms</p>
                <div className="ts-channel-grid">
                  {[{Icon:Radio,label:'SMS'},{Icon:Phone,label:'Voice'},{Icon:Activity,label:'Push'}].map(({ Icon, label }) => (
                    <div key={label} className="ts-channel-item">
                      <Icon size={22} style={{ display:'block', margin:'0 auto 0.5rem auto' }} color="#2563eb" />
                      <div className="ts-channel-label">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ NEURAL PIPELINE VISUALIZER ══════════ */}
      <section className="ts-neural-bg">
        <motion.div className="ts-section-header" {...fadeUp()}>
          <div className="ts-section-icon-row" style={{ justifyContent:'center' }}>
            <Network size={32} color="#2563eb" />
            <h2 className="ts-section-title">Neural Pipeline Visualizer</h2>
          </div>
          <p className="ts-section-subtitle">Real-time data flow from sensor input to emergency dispatch in under 500ms</p>
        </motion.div>

        <div className="ts-pipeline-grid">
          {pipelineStages.map((stage, index) => {
            const { Icon } = stage;
            const isActive = activeStage === index;
            const dotBg = stage.color==='blue'?'#3b82f6':stage.color==='purple'?'#a855f7':stage.color==='pink'?'#ec4899':'#22c55e';
            return (
              <div key={stage.id} className="ts-pipeline-stage" style={{ position:'relative' }}>
                <motion.div initial={{ opacity:0, y:50 }} whileInView={{ opacity:1, y:0 }} transition={{ delay:index*0.2, duration:0.6 }} viewport={{ once:true }} style={{ position:'relative' }}>
                  <motion.div
                    className={`ts-pipeline-stage-glow ${stage.color}${isActive?' active':''}`}
                    animate={{ opacity: isActive?[0.2,0.4,0.2]:0.1, scale: isActive?[1,1.05,1]:1 }}
                    transition={{ duration:1.5, repeat:Infinity, ease:'easeInOut' }}
                  />
                  <div className={`ts-pipeline-card ${stage.color}${isActive?' active':''}`}>
                    <div className={`ts-stage-num ${stage.color}`}>{stage.id<10?`0${stage.id}`:stage.id}</div>
                    <div className={`ts-stage-icon ${stage.color}`}><Icon size={26} /></div>
                    <h3 className="ts-stage-title">{stage.title}</h3>
                    <p className="ts-stage-desc">{stage.description}</p>
                    <div className="ts-stage-details">
                      {stage.details.map(d => <div key={d} className={`ts-stage-detail ${stage.color}`}>{d}</div>)}
                    </div>
                    <motion.div animate={{ opacity: isActive?1:0 }}
                      style={{ position:'absolute', bottom:'-0.5rem', left:'50%', transform:'translateX(-50%)', width:'0.5rem', height:'0.5rem', borderRadius:'9999px', background:dotBg }}
                    />
                  </div>
                </motion.div>
                {index < pipelineStages.length - 1 && (
                  <div className="ts-pipeline-arrow">
                    <motion.div animate={{ x:[0,8,0], opacity: isActive?[0.5,1,0.5]:0.3 }} transition={{ duration:1.5, repeat:Infinity, ease:'easeInOut' }}>
                      <ArrowRight size={24} color="#93c5fd" />
                    </motion.div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Data-flow bar */}
        <motion.div className="ts-dataflow-box" initial={{ opacity:0 }} whileInView={{ opacity:1 }} transition={{ delay:1, duration:1 }} viewport={{ once:true }}>
          <div className="ts-dataflow-header">
            <h4 className="ts-dataflow-label">Real-time Data Flow</h4>
            <div style={{ display:'flex', alignItems:'center' }}>
              <motion.span animate={{ scale:[1,1.4,1] }} transition={{ duration:1, repeat:Infinity }} className="ts-live-dot" style={{ display:'inline-block' }} />
              <span className="ts-live-text">Active</span>
            </div>
          </div>
          <div className="ts-progress-track">
            <motion.div className="ts-progress-bar" animate={{ width:`${dataFlow}%` }} transition={{ duration:0.1 }} />
          </div>
          <div className="ts-flow-stats">
            {[['60','Frames/sec'],['<250ms','Processing Time'],['97.3%','Accuracy']].map(([v,l]) => (
              <div key={l}>
                <div className="ts-flow-val">{v}</div>
                <div className="ts-flow-desc">{l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════════ SYSTEM ARCHITECTURE ══════════ */}
      <section className="ts-emergency-section">
        <div className="ts-container">
          <motion.div className="ts-section-header" {...fadeUp()}>
            <div className="ts-section-icon-row" style={{ justifyContent:'center' }}>
              <Server size={32} color="#2563eb" />
              <h2 className="ts-section-title">System Architecture</h2>
            </div>
            <p className="ts-section-subtitle">Distributed microservices architecture with horizontal scaling and automatic failover</p>
          </motion.div>

          <motion.div {...fadeUp(0.2)}>
            <div className="ts-arch-wrapper">

              {/* ── Row 1: 4 main nodes connected by a horizontal line ── */}
              <div className="ts-arch-row1">
                {archRow1.map(({ label, sublabel, color, dotColor, Icon }, i) => (
                  <div key={label} className="ts-arch-col">
                    {/* horizontal connector (drawn BETWEEN nodes via the col's right border area) */}
                    <motion.div className={`ts-arch-node ${color}`} whileHover={{ scale:1.05, y:-4 }} transition={{ duration:0.2 }}>
                      <div className={`ts-arch-icon ${color}`}><Icon size={22} /></div>
                      <div className="ts-arch-node-label">{label}</div>
                      <div className="ts-arch-node-sublabel">
                        <span className="ts-arch-dot" style={{ background:dotColor }} />
                        {sublabel}
                      </div>
                    </motion.div>
                    {/* vertical line down for centre-two columns */}
                    {(i === 1 || i === 2) && <div className="ts-arch-vline" />}
                  </div>
                ))}
              </div>

              {/* horizontal line spanning col 1 → col 2 → col 3 above row 1 */}
              <div className="ts-arch-hline-row" />

              {/* ── Row 2: 2 centred nodes ── */}
              <div className="ts-arch-row2">
                {archRow2.map(({ label, sublabel, color, dotColor, Icon }) => (
                  <motion.div key={label} className={`ts-arch-node ${color}`} whileHover={{ scale:1.05, y:-4 }} transition={{ duration:0.2 }}>
                    <div className={`ts-arch-icon ${color}`}><Icon size={22} /></div>
                    <div className="ts-arch-node-label">{label}</div>
                    <div className="ts-arch-node-sublabel">
                      <span className="ts-arch-dot" style={{ background:dotColor }} />
                      {sublabel}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Legend */}
              <div className="ts-arch-legend">
                {archLegend.map(({ color, label }) => (
                  <div key={label} className="ts-legend-item">
                    <div className="ts-legend-dot" style={{ background:color }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ COMPLETE TECH STACK ══════════ */}
      <section className="ts-neural-bg">
        <motion.div className="ts-section-header" {...fadeUp()}>
          <h2 className="ts-section-title">Complete Technology Stack</h2>
          <p className="ts-section-subtitle">Battle-tested technologies powering mission-critical infrastructure</p>
        </motion.div>

        <div className="ts-tech-grid">
          {techItems.map((tech, i) => (
            <motion.div key={tech.name} className="ts-tech-item"
              initial={{ opacity:0, scale:0.85 }} whileInView={{ opacity:1, scale:1 }}
              transition={{ delay:i*0.04, duration:0.45 }} viewport={{ once:true }}
              whileHover={{ scale:1.05, y:-4 }}
            >
              <div className="ts-tech-item-hover-glow" />
              <div className="ts-tech-item-inner">
                <div className="ts-tech-name">{tech.name}</div>
                <div className="ts-tech-category">{tech.category}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════ PERFORMANCE GUARANTEE ══════════ */}
      <section className="ts-performance-section">
        <div style={{ maxWidth:'56rem', margin:'0 auto', textAlign:'center' }}>
          <motion.div initial={{ opacity:0, scale:0.9 }} whileInView={{ opacity:1, scale:1 }} transition={{ duration:0.8 }} viewport={{ once:true }}>
            <Shield size={56} color="#2563eb" style={{ margin:'0 auto 1.5rem', display:'block' }} />
            <h2 className="ts-section-title" style={{ marginBottom:'1rem' }}>Built for Mission-Critical Operations</h2>
            <p style={{ fontSize:'1.1rem', color:'#334155', lineHeight:1.6 }}>
              Every millisecond counts when lives are on the line. Our infrastructure is engineered for reliability, speed, and accuracy.
            </p>
            <div className="ts-perf-stats">
              <div><div className="ts-perf-val green">99.9%</div>  <div className="ts-perf-desc">System Uptime</div></div>
              <div><div className="ts-perf-val blue">&lt;500ms</div><div className="ts-perf-desc">End-to-End Latency</div></div>
              <div><div className="ts-perf-val indigo">97.3%</div> <div className="ts-perf-desc">Detection Accuracy</div></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="ts-footer">
        <p>SmartResQ - Saving Lives Through Intelligent Technology</p>
        <p>Enterprise-grade accident detection and emergency response system powered by deep learning</p>
      </footer>
    </div>
  );
}

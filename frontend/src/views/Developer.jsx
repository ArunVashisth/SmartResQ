import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import './Developer.css';

/* Custom hook for scroll-in animations */
const FadeInWhenVisible = ({ children, delay = 0, direction = 'up' }) => {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px 0px' });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const variants = {
    hidden: { 
      opacity: 0, 
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
      x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0
    },
    visible: { opacity: 1, y: 0, x: 0, transition: { duration: 0.8, delay, ease: [0.17, 0.67, 0.83, 0.67] } }
  };

  return (
    <motion.div ref={ref} initial="hidden" animate={controls} variants={variants}>
      {children}
    </motion.div>
  );
};

/* Interactive Glass Card with Mouse Glow */
const InteractiveCard = ({ children, className = '' }) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={cardRef} 
      className={`dev-glass dev-glass-card ${className}`} 
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
};

const Developer = () => {
  return (
    <div className="dev-root">
      
      {/* Background Ambience */}
      <div className="dev-bg-grid" />
      <div className="dev-cosmic-orb-1" />
      <div className="dev-cosmic-orb-2" />

      {/* ── STAGE 1: THE INCEPTION (Hero) ── */}
      <section className="dev-hero">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <div className="dev-subtitle" style={{ marginBottom: '1rem' }}>Architecting Intelligence</div>
        </motion.div>

        <motion.h1 
          className="dev-hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
        >
          Hello, we're <br/>
          <span className="dev-text-gradient">Arun & Tushar</span>
        </motion.h1>

        <motion.p 
          style={{ fontSize: '1.2rem', color: '#475569', maxWidth: '700px', lineHeight: 1.8, margin: '1rem auto 2.5rem auto' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          We are a duo of Computer Science engineers bridging the gap between raw data logic and breathtaking user experiences.
        </motion.p>

        <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', marginBottom: '1rem', border: '3px solid #2563EB', padding: '3px', background: '#ffffff', boxShadow: '0 10px 25px -5px rgba(37,99,235,0.3)' }}>
              <img src="/arun.png" alt="Arun Vashisth" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.6rem', color: '#1e293b' }}>Arun Vashisth</div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
              <button className="dev-btn" onClick={() => window.open('https://github.com/ArunVashisth', '_blank')} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>GitHub</button>
              <button className="dev-btn-alt" onClick={() => window.location.href='mailto:arunvashisth80@gmail.com'} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Email</button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', marginBottom: '1rem', border: '3px solid #94A3B8', padding: '3px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: 800, fontSize: '1.5rem' }}>
              TS
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.6rem', color: '#1e293b' }}>Tushar Sharma</div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
              <button className="dev-btn" onClick={() => window.open('https://github.com/TusharSh06', '_blank')} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>GitHub</button>
              <button className="dev-btn-alt" onClick={() => window.location.href='mailto:tsharmak10@gmail.com'} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Email</button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STAGE 2: THE ORIGIN STORY ── */}
      <section style={{ position: 'relative', zIndex: 10, padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <FadeInWhenVisible>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <div className="dev-subtitle">The Origin</div>
              <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', fontWeight: 800 }}>The Visionaries Behind Smart Resq</h2>
            </div>
          </FadeInWhenVisible>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '4rem', alignItems: 'center' }}>
            <FadeInWhenVisible direction="right">
              <InteractiveCard>
                <div style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#334155' }}>
                  <p style={{ marginBottom: '1.5rem' }}>
                    Our journey started at <strong>K.R. Mangalam University</strong>, driven by an obsession to solve complex problems through code. While learning theory is great, we wanted to build <span className="dev-text-cyan">systems that matter</span>.
                  </p>
                  <p>
                    We engineered <strong>Smart Resq</strong> completely from scratch—merging TensorFlow Computer Vision algorithms with extremely robust backend networking (Flask & Twilio) to detect accidents in milliseconds. Our philosophy? The heaviest backend logic is worthless if the frontend dashboard isn't smooth enough to use effortlessly during a crisis.
                  </p>
                </div>
              </InteractiveCard>
            </FadeInWhenVisible>

            {/* Profile Icons Layered */}
            <FadeInWhenVisible direction="left" delay={0.2}>
              <div style={{ position: 'relative', width: 300, height: 300 }}>
                <div style={{ 
                  width: 220, height: 220, borderRadius: '2rem',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', position: 'absolute', top: 0, left: 0,
                  boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.4)',
                  zIndex: 2, color: 'white', fontSize: '4rem', fontWeight: 900
                }}>A</div>
                <div style={{ 
                  width: 220, height: 220, borderRadius: '2rem',
                  background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', position: 'absolute', bottom: 0, right: 0,
                  boxShadow: '0 25px 50px -12px rgba(6, 182, 212, 0.4)',
                  zIndex: 1, color: 'white', fontSize: '4rem', fontWeight: 900,
                  opacity: 0.8
                }}>T</div>
              </div>
            </FadeInWhenVisible>
          </div>
        </div>
      </section>

      {/* ── STAGE 3: THE ARSENAL (Skills) ── */}
      <section style={{ padding: '6rem 2rem', background: 'rgba(0,0,0,0.3)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <FadeInWhenVisible>
            <div className="dev-subtitle">The Arsenal</div>
            <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', fontWeight: 800, marginBottom: '3rem' }}>Languages & Frameworks</h2>
          </FadeInWhenVisible>

          <FadeInWhenVisible delay={0.2}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', maxWidth: 800, margin: '0 auto' }}>
              {['React.js', 'Node.js', 'Express.js', 'Python', 'JavaScript (ES6+)', 'MongoDB', 'SQL', 'HTML5', 'CSS3', 'Git', 'GitHub', 'Figma', 'Visual Studio Code'].map((skill, i) => (
                <div key={skill} className="dev-skill-pill" style={{ animationDelay: `${i * 0.1}s` }}>
                  {skill}
                </div>
              ))}
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* ── STAGE 4: THE MASTERPIECES (Projects) ── */}
      <section style={{ padding: '6rem 2rem', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <FadeInWhenVisible>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <div className="dev-subtitle">The Masterpieces</div>
              <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0 0 0', fontWeight: 800 }}>Production Repositories</h2>
            </div>
          </FadeInWhenVisible>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            
            <FadeInWhenVisible delay={0.1}>
              <InteractiveCard className="h-full">
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Smart Resq System</h3>
                  <p style={{ color: '#475569', lineHeight: 1.6, flex: 1 }}>
                    An AI computer vision pipeline detecting road accidents instantly. Armed with a React dashboard, real-time WebSocket telemetry, and multi-gateway emergency SMS/Calls.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <span className="dev-text-cyan" style={{ fontSize: '0.8rem', fontWeight: 600 }}>#Python</span>
                    <span className="dev-text-cyan" style={{ fontSize: '0.8rem', fontWeight: 600 }}>#React</span>
                    <span className="dev-text-cyan" style={{ fontSize: '0.8rem', fontWeight: 600 }}>#Flask</span>
                  </div>
                </div>
              </InteractiveCard>
            </FadeInWhenVisible>

            <FadeInWhenVisible delay={0.3}>
              <InteractiveCard className="h-full">
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛒</div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 1rem 0' }}>E-Commerce Platform</h3>
                  <p style={{ color: '#475569', lineHeight: 1.6, flex: 1 }}>
                    Full-stack delivery application facilitating user shopping workflows, payment gateway logic, and a secure administrative panel for live order management.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <span className="dev-text-cyan" style={{ fontSize: '0.8rem', fontWeight: 600 }}>#Node.js</span>
                    <span className="dev-text-cyan" style={{ fontSize: '0.8rem', fontWeight: 600 }}>#Express</span>
                    <span className="dev-text-cyan" style={{ fontSize: '0.8rem', fontWeight: 600 }}>#MongoDB</span>
                  </div>
                </div>
              </InteractiveCard>
            </FadeInWhenVisible>

            <FadeInWhenVisible delay={0.5}>
              <InteractiveCard className="h-full">
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Nutrition & Ed Trackers</h3>
                  <p style={{ color: '#475569', lineHeight: 1.6, flex: 1 }}>
                    Twin data-driven web applications mapped to track precise macros, healthy habits, and complex educational curricula tracking algorithms.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    <span className="dev-text-cyan" style={{ fontSize: '0.8rem', fontWeight: 600 }}>#JavaScript</span>
                    <span className="dev-text-cyan" style={{ fontSize: '0.8rem', fontWeight: 600 }}>#CSS3</span>
                    <span className="dev-text-cyan" style={{ fontSize: '0.8rem', fontWeight: 600 }}>#HTML5</span>
                  </div>
                </div>
              </InteractiveCard>
            </FadeInWhenVisible>

          </div>
        </div>
      </section>

    </div>
  );
};

export default Developer;

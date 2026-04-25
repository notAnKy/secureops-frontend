import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// ─── Hook: reveals element when it enters viewport ────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, visible } = useReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const t = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(t); }
      else setVal(start);
    }, 16);
    return () => clearInterval(t);
  }, [visible, to]);
  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {val.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      padding: "32px 28px",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      cursor: "default",
      position: "relative",
      overflow: "hidden",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,255,210,0.4)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 40px rgba(0,255,210,0.08)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 700, color: "var(--tp)", marginBottom: 10, letterSpacing: "-0.01em" }}>{title}</div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", lineHeight: 1.7 }}>{desc}</div>
      {/* subtle glow corner */}
      <div style={{ position: "absolute", bottom: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,210,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
    </div>
  );
}

// ─── Step item ────────────────────────────────────────────────────────────────
function StepItem({ num, title, desc, delay }: { num: string; title: string; desc: string; delay: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      display: "flex", gap: 24, alignItems: "flex-start",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(-24px)",
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid var(--accent)", background: "rgba(0,255,210,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--accent)", boxShadow: "0 0 16px rgba(0,255,210,0.15)" }}>
        {num}
      </div>
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--tp)", marginBottom: 6 }}>{title}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", lineHeight: 1.7 }}>{desc}</div>
      </div>
    </div>
  );
}

// ─── Main Home Component ──────────────────────────────────────────────────────
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const statsRef = useReveal();
  const featuresRef = useReveal();
  const stepsRef = useReveal();
  const ctaRef = useReveal();

  const features = [
    { icon: "🛡️", title: "Threat Management", desc: "Submit and track security requests from detection to resolution with full audit trails and priority queuing." },
    { icon: "⚡", title: "Real-time Task Assignment", desc: "Admins break requests into granular tasks and assign them to the right security specialists instantly." },
    { icon: "📊", title: "Live Dashboards", desc: "Every role gets a tailored dashboard. Clients see their requests, employees see their tasks, admins see everything." },
    { icon: "📝", title: "Report Generation", desc: "Employees submit detailed reports per task. Admins validate and clients receive professional security reports." },
    { icon: "🔐", title: "Zero-Trust Security", desc: "JWT authentication, role-based access control, and AES-256 encryption protect every layer of the platform." },
    { icon: "🏢", title: "Multi-Service Catalog", desc: "A rich catalog of cybersecurity services with fixed pricing. Clients attach services directly to their requests." },
  ];

  const steps = [
    { num: "01", title: "Register your company", desc: "Create an account in 3 simple steps. Your company profile, contact info, and credentials — all secured." },
    { num: "02", title: "Submit a security request", desc: "Choose from our service catalog, describe your issue, set priority and deadline. Done in under a minute." },
    { num: "03", title: "We assign specialists", desc: "Our admin team breaks your request into tasks and assigns the right cybersecurity experts to your case." },
    { num: "04", title: "Track everything live", desc: "Follow every task, read expert reports, and get notified at each milestone until full resolution." },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:      #0a0c0f;
          --card:    #0f1218;
          --card2:   #131820;
          --accent:  #00ffd2;
          --adim:    #00c9a7;
          --aglow:   rgba(0,255,210,0.12);
          --border:  rgba(0,255,210,0.12);
          --tp:      #e8edf5;
          --ts:      #6b7a8d;
          --tm:      #3d4a5c;
          --danger:  #ff4d6d;
          --mono:    'JetBrains Mono', monospace;
          --display: 'Syne', sans-serif;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--tp); font-family: var(--display); overflow-x: hidden; }

        /* ── NAV ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 64px; height: 68px;
          transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
        }
        .nav.scrolled {
          background: rgba(10,12,15,0.85);
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(16px);
        }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .nav-logo-box { width: 34px; height: 34px; border: 1.5px solid var(--accent); border-radius: 7px; display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 15px; }
        .nav-logo-text { font-family: var(--display); font-size: 15px; font-weight: 700; color: var(--tp); }
        .nav-logo-text span { color: var(--accent); }
        .nav-links { display: flex; align-items: center; gap: 8px; }
        .nav-link { font-family: var(--mono); font-size: 12px; color: var(--ts); text-decoration: none; padding: 8px 16px; border-radius: 8px; transition: color 0.2s, background 0.2s; }
        .nav-link:hover { color: var(--tp); background: rgba(255,255,255,0.04); }
        .nav-btn { font-family: var(--display); font-size: 13px; font-weight: 700; color: #0a0c0f; background: var(--accent); border: none; border-radius: 8px; padding: 9px 20px; cursor: pointer; text-decoration: none; transition: background 0.2s, box-shadow 0.2s; letter-spacing: 0.03em; }
        .nav-btn:hover { background: #00ffe5; box-shadow: 0 0 16px rgba(0,255,210,0.3); }

        /* ── HERO ── */
        .hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 120px 24px 80px; text-align: center;
          position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,255,210,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 80% 80%, rgba(0,255,210,0.04) 0%, transparent 60%);
        }
        .hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(0,255,210,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,210,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 16px; border-radius: 20px;
          border: 1px solid var(--border); background: var(--aglow);
          font-family: var(--mono); font-size: 11px; color: var(--accent);
          letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 32px;
          opacity: 0; animation: fadeUp 0.6s ease 0.2s forwards;
        }
        .hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s ease infinite; }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,255,210,0.5)} 50%{box-shadow:0 0 0 6px rgba(0,255,210,0)} }
        .hero-title {
          font-size: clamp(42px, 7vw, 88px); font-weight: 800;
          line-height: 1.02; letter-spacing: -0.03em; color: var(--tp);
          max-width: 900px; margin: 0 auto 24px;
          opacity: 0; animation: fadeUp 0.7s ease 0.35s forwards;
        }
        .hero-title .accent { color: var(--accent); text-shadow: 0 0 60px rgba(0,255,210,0.3); }
        .hero-sub {
          font-family: var(--mono); font-size: clamp(14px, 1.5vw, 17px);
          color: var(--ts); line-height: 1.7; max-width: 560px;
          margin: 0 auto 48px;
          opacity: 0; animation: fadeUp 0.7s ease 0.5s forwards;
        }
        .hero-btns {
          display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
          opacity: 0; animation: fadeUp 0.7s ease 0.65s forwards;
        }
        .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px; background: var(--accent); color: #0a0c0f; border: none; border-radius: 10px; font-family: var(--display); font-size: 14px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; cursor: pointer; text-decoration: none; transition: background 0.2s, box-shadow 0.2s, transform 0.15s; }
        .btn-primary:hover { background: #00ffe5; box-shadow: 0 0 28px rgba(0,255,210,0.4); transform: translateY(-2px); }
        .btn-secondary { display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px; background: transparent; color: var(--tp); border: 1px solid var(--border); border-radius: 10px; font-family: var(--display); font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; transition: border-color 0.2s, background 0.2s, transform 0.15s; }
        .btn-secondary:hover { border-color: rgba(0,255,210,0.4); background: rgba(0,255,210,0.04); transform: translateY(-2px); }

        /* Scroll indicator */
        .scroll-hint {
          position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          opacity: 0; animation: fadeUp 0.7s ease 1s forwards;
        }
        .scroll-hint span { font-family: var(--mono); font-size: 9px; color: var(--tm); letter-spacing: 0.12em; text-transform: uppercase; }
        .scroll-arrow { width: 20px; height: 20px; border-right: 1.5px solid var(--tm); border-bottom: 1.5px solid var(--tm); transform: rotate(45deg); animation: bounce 1.6s ease infinite; }
        @keyframes bounce { 0%,100%{transform:rotate(45deg) translateY(0)} 50%{transform:rotate(45deg) translateY(4px)} }

        /* ── STATS ── */
        .stats-section { padding: 80px 24px; }
        .stats-inner { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .stat-box { background: var(--card); padding: 36px 24px; text-align: center; }
        .stat-val { font-family: var(--display); font-size: 38px; font-weight: 800; color: var(--accent); letter-spacing: -0.03em; line-height: 1; margin-bottom: 8px; }
        .stat-label { font-family: var(--mono); font-size: 11px; color: var(--ts); text-transform: uppercase; letter-spacing: 0.08em; }

        /* ── SECTIONS ── */
        .section { padding: 100px 24px; max-width: 1200px; margin: 0 auto; }
        .section-eyebrow { font-family: var(--mono); font-size: 11px; color: var(--accent); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 16px; }
        .section-title { font-family: var(--display); font-size: clamp(28px, 4vw, 46px); font-weight: 800; letter-spacing: -0.02em; color: var(--tp); line-height: 1.08; margin-bottom: 16px; }
        .section-sub { font-family: var(--mono); font-size: 14px; color: var(--ts); line-height: 1.7; max-width: 480px; }

        /* Features grid */
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 56px; }

        /* Steps */
        .steps-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 48px 80px; margin-top: 56px; }

        /* Roles section */
        .roles-wrap { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 56px; }
        .role-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 36px 28px; text-align: center; }
        .role-icon { font-size: 32px; margin-bottom: 16px; }
        .role-title { font-family: var(--display); font-size: 18px; font-weight: 700; color: var(--tp); margin-bottom: 12px; }
        .role-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .role-list li { font-family: var(--mono); font-size: 12px; color: var(--ts); display: flex; align-items: center; gap: 8px; }
        .role-list li::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); opacity: 0.6; flex-shrink: 0; }

        /* ── CTA ── */
        .cta-section { padding: 120px 24px; text-align: center; position: relative; overflow: hidden; }
        .cta-bg { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 60% 70% at 50% 50%, rgba(0,255,210,0.06) 0%, transparent 70%); }
        .cta-inner { position: relative; max-width: 640px; margin: 0 auto; }
        .cta-title { font-family: var(--display); font-size: clamp(32px, 5vw, 56px); font-weight: 800; letter-spacing: -0.02em; color: var(--tp); line-height: 1.08; margin-bottom: 20px; }
        .cta-title .accent { color: var(--accent); }
        .cta-sub { font-family: var(--mono); font-size: 14px; color: var(--ts); line-height: 1.7; margin-bottom: 40px; }

        /* ── FOOTER ── */
        .footer { border-top: 1px solid var(--border); padding: 40px 64px; display: flex; align-items: center; justify-content: space-between; }
        .footer-logo { display: flex; align-items: center; gap: 10px; }
        .footer-logo-box { width: 28px; height: 28px; border: 1px solid var(--accent); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 12px; }
        .footer-logo-text { font-family: var(--display); font-size: 13px; font-weight: 700; color: var(--tp); }
        .footer-logo-text span { color: var(--accent); }
        .footer-copy { font-family: var(--mono); font-size: 11px; color: var(--tm); }
        .footer-links { display: flex; gap: 20px; }
        .footer-links a { font-family: var(--mono); font-size: 11px; color: var(--ts); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--accent); }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .nav { padding: 0 24px; }
          .features-grid { grid-template-columns: 1fr 1fr; }
          .steps-wrap { grid-template-columns: 1fr; gap: 32px; }
          .roles-wrap { grid-template-columns: 1fr; }
          .stats-inner { grid-template-columns: repeat(2, 1fr); }
          .footer { flex-direction: column; gap: 20px; text-align: center; padding: 32px 24px; }
          .footer-links { justify-content: center; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
          .stats-inner { grid-template-columns: repeat(2, 1fr); }
          .nav-links .nav-link { display: none; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className={`nav${scrolled ? " scrolled" : ""}`}>
        <Link to="/" className="nav-logo">
          <div className="nav-logo-box">⬡</div>
          <div className="nav-logo-text">Secure<span>Ops</span></div>
        </Link>
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="#roles" className="nav-link">For who</a>
          <Link to="/login" className="nav-link">Sign in</Link>
          <Link to="/signup" className="nav-btn">Get started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />

        <div className="hero-badge">
          <div className="hero-badge-dot" />
          Cybersecurity Management Platform
        </div>

        <h1 className="hero-title">
          Secure your business.<br />
          <span className="accent">Track every threat.</span>
        </h1>

        <p className="hero-sub">
          SecureOps connects companies with expert cybersecurity professionals.
          Submit requests, get specialists assigned, and track resolution — all in one place.
        </p>

        <div className="hero-btns">
          <Link to="/signup" className="btn-primary">
            Get started free →
          </Link>
          <Link to="/login" className="btn-secondary">
            Sign in to dashboard
          </Link>
        </div>

        <div className="scroll-hint">
          <span>Scroll to explore</span>
          <div className="scroll-arrow" />
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="stats-section">
        <div className="stats-inner">
          {[
            { val: 500, suffix: "+", label: "Companies protected" },
            { val: 99, suffix: ".9%", label: "Platform uptime" },
            { val: 2400, suffix: "+", label: "Threats resolved" },
            { val: 48, suffix: "h", label: "Avg. response time" },
          ].map((s, i) => (
            <div key={i} className="stat-box">
              <div className="stat-val"><Counter to={s.val} suffix={s.suffix} /></div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div id="features">
        <div className="section">
          <div ref={featuresRef.ref} style={{ opacity: featuresRef.visible ? 1 : 0, transform: featuresRef.visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}>
            <div className="section-eyebrow">// What we offer</div>
            <h2 className="section-title">Everything you need<br />to stay protected</h2>
            <p className="section-sub">A complete platform built for modern cybersecurity operations — from first alert to final report.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 80} />
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="how-it-works" style={{ background: "var(--card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="section">
          <div ref={stepsRef.ref} style={{ opacity: stepsRef.visible ? 1 : 0, transform: stepsRef.visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}>
            <div className="section-eyebrow">// How it works</div>
            <h2 className="section-title">From request to<br />resolution in 4 steps</h2>
            <p className="section-sub">A streamlined process that keeps you informed at every stage of your security operation.</p>
          </div>
          <div className="steps-wrap">
            {steps.map((s, i) => (
              <StepItem key={i} {...s} delay={i * 120} />
            ))}
          </div>
        </div>
      </div>

      {/* ── ROLES ── */}
      <div id="roles">
        <div className="section">
          <div ref={featuresRef.ref} style={{ opacity: featuresRef.visible ? 1 : 0, transition: "opacity 0.6s ease" }}>
            <div className="section-eyebrow">// Built for every role</div>
            <h2 className="section-title">One platform,<br />three powerful views</h2>
            <p className="section-sub">Each user type gets a tailored experience designed around their specific needs and responsibilities.</p>
          </div>
          <div className="roles-wrap">
            {[
              {
                icon: "🏢", title: "Client",
                items: ["Submit security requests", "Choose from service catalog", "Track request status live", "Receive validated reports", "Manage company profile"],
              },
              {
                icon: "⚙️", title: "Admin",
                items: ["Oversee all requests", "Assign tasks to employees", "Manage services & pricing", "Create & manage users", "Validate employee reports"],
              },
              {
                icon: "🔍", title: "Employee",
                items: ["View assigned tasks", "Update task status", "Submit detailed reports", "Collaborate on requests", "Track resolution progress"],
              },
            ].map((r, i) => {
              const { ref, visible } = useReveal();
              return (
                <div key={i} ref={ref} className="role-card" style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(32px)",
                  transition: `opacity 0.6s ease ${i * 120}ms, transform 0.6s ease ${i * 120}ms`,
                  borderColor: i === 1 ? "rgba(0,255,210,0.3)" : undefined,
                  boxShadow: i === 1 ? "0 0 32px rgba(0,255,210,0.06)" : undefined,
                }}>
                  <div className="role-icon">{r.icon}</div>
                  <div className="role-title">{r.title}</div>
                  <ul className="role-list">
                    {r.items.map((item, j) => <li key={j}>{item}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-bg" />
        <div ref={ctaRef.ref} className="cta-inner" style={{ opacity: ctaRef.visible ? 1 : 0, transform: ctaRef.visible ? "translateY(0)" : "translateY(32px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}>
          <div className="section-eyebrow" style={{ marginBottom: 20 }}>// Ready to start?</div>
          <h2 className="cta-title">
            Your security operations<br />
            start <span className="accent">right here.</span>
          </h2>
          <p className="cta-sub">
            Join hundreds of companies already using SecureOps to manage threats, assign experts, and stay protected — 24/7.
          </p>
          <div className="hero-btns">
            <Link to="/signup" className="btn-primary">Create free account →</Link>
            <Link to="/login" className="btn-secondary">Sign in</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-logo">
          <div className="footer-logo-box">⬡</div>
          <div className="footer-logo-text">Secure<span>Ops</span></div>
        </div>
        <div className="footer-copy">© 2026 SecureOps. All rights reserved.</div>
        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <Link to="/login">Sign in</Link>
          <Link to="/signup">Register</Link>
        </div>
      </footer>
    </>
  );
}
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "@/services/auth.service";

interface SignUpForm {
  raison_sociale: string; siret: string; adresse_siege: string; telephone_entreprise: string;
  nom_contact: string; prenom_contact: string; email: string; telephone: string;
  code: string; mot_de_passe: string; confirm_password: string;
}

const EMPTY_FORM: SignUpForm = {
  raison_sociale: "", siret: "", adresse_siege: "", telephone_entreprise: "",
  nom_contact: "", prenom_contact: "", email: "", telephone: "",
  code: "", mot_de_passe: "", confirm_password: "",
};

// ─── Canvas with full NaN/Infinity guard ──────────────────────────────────────
function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let t = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const GRID = 48;
    const draw = () => {
      if (canvas.width === 0 || canvas.height === 0) {
        animId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cols = Math.ceil(canvas.width / GRID) + 1;
      const rows = Math.ceil(canvas.height / GRID) + 1;
      ctx.strokeStyle = "rgba(0,255,210,0.04)"; ctx.lineWidth = 0.5;
      for (let c = 0; c < cols; c++) { ctx.beginPath(); ctx.moveTo(c * GRID, 0); ctx.lineTo(c * GRID, canvas.height); ctx.stroke(); }
      for (let r = 0; r < rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * GRID); ctx.lineTo(canvas.width, r * GRID); ctx.stroke(); }
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const phase = (c * 3 + r * 7 + t * 0.015) % (Math.PI * 2);
          const alpha = (Math.sin(phase) + 1) / 2;
          if (alpha < 0.15) continue;
          ctx.beginPath(); ctx.arc(c * GRID, r * GRID, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,210,${alpha * 0.35})`; ctx.fill();
        }
      }
      const scanY = (t * 0.4) % canvas.height;
      if (isFinite(scanY) && isFinite(canvas.height)) {
        const y0 = scanY - 60;
        const y1 = scanY + 60;
        if (isFinite(y0) && isFinite(y1) && y0 !== y1) {
          const grad = ctx.createLinearGradient(0, y0, 0, y1);
          grad.addColorStop(0, "rgba(0,255,210,0)");
          grad.addColorStop(0.5, "rgba(0,255,210,0.05)");
          grad.addColorStop(1, "rgba(0,255,210,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, y0, canvas.width, 120);
        }
      }
      t++; animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// ─── Password strength ────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase",     ok: /[A-Z]/.test(password) },
    { label: "Number",        ok: /[0-9]/.test(password) },
    { label: "Symbol",        ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["#3d4a5c", "#ff4d6d", "#f59e0b", "#00c9a7", "#00ffd2"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score] : "rgba(0,255,210,0.1)", transition: "background 0.3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: c.ok ? "var(--accent)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, transition: "color 0.2s" }}>
              {c.ok ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: colors[score], fontWeight: 600 }}>{labels[score]}</span>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  const stepLabels = ["Company", "Contact", "Account"];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < total - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${i <= current ? "var(--accent)" : "var(--border)"}`, background: i < current ? "var(--accent)" : i === current ? "var(--accent-glow)" : "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, color: i < current ? "#0a0c0f" : i === current ? "var(--accent)" : "var(--text-muted)", transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)", boxShadow: i === current ? "0 0 12px rgba(0,255,210,0.3)" : "none" }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: i === current ? "var(--accent)" : i < current ? "var(--accent-dim)" : "var(--text-muted)", transition: "color 0.35s" }}>
              {stepLabels[i]}
            </span>
          </div>
          {i < total - 1 && (
            <div style={{ flex: 1, height: 1, margin: "0 8px", marginBottom: 22, background: i < current ? "var(--accent-dim)" : "var(--border)", transition: "background 0.4s" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Reusable Field ───────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, type = "text", placeholder, icon, hint, rightEl }: {
  label: string; name: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; icon?: string; hint?: string; rightEl?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="su-field">
      <label className="su-field-label">
        <span>{label}<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span></span>
        {hint && <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{hint}</span>}
      </label>
      <div className="su-field-wrap">
        {icon && (
          <span className="su-field-icon" style={{ color: focused ? "var(--accent)" : undefined }}>
            {icon}
          </span>
        )}
        <input
          className="su-field-input"
          style={{ paddingLeft: icon ? 42 : 14, paddingRight: rightEl ? 42 : 14 }}
          type={type} name={name} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={name}
        />
        {rightEl && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
            {rightEl}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main SignUp ──────────────────────────────────────────────────────────────
export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep]             = useState(0);
  const [form, setForm]             = useState<SignUpForm>(EMPTY_FORM);
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [direction, setDirection]   = useState<"forward" | "back">("forward");
  const [animating, setAnimating]   = useState(false);

  const TOTAL_STEPS = 3;
  const set = (key: keyof SignUpForm) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const goTo = (next: number, dir: "forward" | "back") => {
    if (animating) return;
    setDirection(dir); setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 220);
  };

  const goBack = () => { setError(null); goTo(step - 1, "back"); };

  // ─── NEW: email validation regex ─────────────────────────────────────────
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const stepValid = [
    !!(form.raison_sociale && form.siret && form.adresse_siege && form.telephone_entreprise),
    !!(form.nom_contact && form.prenom_contact && form.email && form.telephone && emailValid),
    !!(form.code && form.mot_de_passe && form.confirm_password && form.mot_de_passe === form.confirm_password),
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (step < TOTAL_STEPS - 1) {
      setError(null);
      goTo(step + 1, "forward");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.register({
        raisonSociale: form.raison_sociale,
        siret: form.siret,
        adresseSiege: form.adresse_siege,
        telephoneEntreprise: form.telephone_entreprise,
        nom: form.nom_contact,
        prenom: form.prenom_contact,
        nomContact: form.nom_contact,
        prenomContact: form.prenom_contact,
        email: form.email,
        telephone: form.telephone,
        code: form.code.trim(),
        motDePasse: form.mot_de_passe,
        confirmMotDePasse: form.confirm_password,
      });
      navigate("/client/dashboard");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        (err.response?.status === 409 ? "This email or code is already in use." : null) ||
        "Registration failed. Please try again.";
      setError(typeof msg === "string" ? msg : "Registration failed.");
      setLoading(false);
    }
  };

  const leftContent = [
    { icon: "◈", title: "Register your company",    sub: "Set up your organization profile to get started with the platform.",         bullets: ["Full access to security services", "Manage multiple requests", "Track all tasks in real-time"] },
    { icon: "◇", title: "Who's the point of contact?", sub: "We'll use this information to communicate with your team.",                bullets: ["Dedicated account manager", "Direct ticket notifications", "Report delivery to your inbox"] },
    { icon: "◆", title: "Secure your access",        sub: "Your credentials are encrypted end-to-end. We never store plain-text passwords.", bullets: ["AES-256 encryption at rest", "Zero-knowledge auth flow", "Session token rotation"] },
  ];
  const current = leftContent[step];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg-primary:#0a0c0f; --bg-secondary:#0f1218; --bg-input:#0d1117;
          --accent:#00ffd2; --accent-dim:#00c9a7;
          --accent-glow:rgba(0,255,210,0.15); --accent-glow2:rgba(0,255,210,0.08);
          --border:rgba(0,255,210,0.12); --border-focus:rgba(0,255,210,0.7);
          --text-primary:#e8edf5; --text-secondary:#6b7a8d; --text-muted:#3d4a5c;
          --danger:#ff4d6d;
          --font-display:'Syne',sans-serif; --font-mono:'JetBrains Mono',monospace;
          --radius:10px; --radius-lg:16px;
          --transition:all 0.22s cubic-bezier(0.4,0,0.2,1);
        }
        body { background: var(--bg-primary); }
        .signup-root { min-height:100vh; display:flex; font-family:var(--font-display); background:var(--bg-primary); overflow:hidden; }
        .su-left { position:relative; flex:1; display:flex; flex-direction:column; justify-content:center; padding:64px 56px; background:var(--bg-secondary); border-right:1px solid var(--border); overflow:hidden; }
        .su-left::before { content:''; position:absolute; top:-100px; left:-100px; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle,rgba(0,255,210,0.07) 0%,transparent 70%); pointer-events:none; }
        .su-left::after  { content:''; position:absolute; bottom:-80px; right:-80px; width:300px; height:300px; border-radius:50%; background:radial-gradient(circle,rgba(0,255,210,0.05) 0%,transparent 70%); pointer-events:none; }
        .su-logo { position:absolute; top:48px; left:56px; display:flex; align-items:center; gap:12px; }
        .su-logo-icon { width:38px; height:38px; border:1.5px solid var(--accent); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:18px; color:var(--accent); background:var(--accent-glow2); }
        .su-logo-name { font-size:17px; font-weight:700; color:var(--text-primary); letter-spacing:0.02em; }
        .su-logo-name span { color:var(--accent); }
        .su-step-icon { width:52px; height:52px; border:1.5px solid rgba(0,255,210,0.3); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:22px; color:var(--accent); background:var(--accent-glow2); margin-bottom:28px; box-shadow:0 0 24px rgba(0,255,210,0.1); }
        .su-left-title { font-size:clamp(26px,2.8vw,38px); font-weight:800; color:var(--text-primary); line-height:1.1; letter-spacing:-0.02em; margin-bottom:16px; }
        .su-left-sub { font-size:14px; color:var(--text-secondary); font-family:var(--font-mono); line-height:1.7; margin-bottom:36px; max-width:360px; }
        .su-bullets { display:flex; flex-direction:column; gap:14px; }
        .su-bullet { display:flex; align-items:center; gap:12px; font-family:var(--font-mono); font-size:13px; color:var(--text-secondary); }
        .su-bullet-dot { width:6px; height:6px; border-radius:50%; background:var(--accent); flex-shrink:0; box-shadow:0 0 6px rgba(0,255,210,0.5); }
        .su-progress { position:absolute; bottom:48px; left:56px; right:56px; }
        .su-progress-track { height:2px; background:var(--border); border-radius:2px; overflow:hidden; margin-bottom:10px; }
        .su-progress-fill { height:100%; border-radius:2px; background:linear-gradient(90deg,var(--accent-dim),var(--accent)); transition:width 0.5s cubic-bezier(0.4,0,0.2,1); box-shadow:0 0 8px rgba(0,255,210,0.4); }
        .su-progress-label { font-family:var(--font-mono); font-size:10px; color:var(--text-muted); letter-spacing:0.1em; text-transform:uppercase; }
        .su-right { flex:1.1; display:flex; align-items:center; justify-content:center; padding:48px 56px; overflow-y:auto; }
        .su-wrapper { width:100%; max-width:460px; animation:suSlideIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes suSlideIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        .su-eyebrow { font-family:var(--font-mono); font-size:11px; color:var(--accent); letter-spacing:0.14em; text-transform:uppercase; margin-bottom:8px; }
        .su-title { font-size:26px; font-weight:800; color:var(--text-primary); letter-spacing:-0.02em; margin-bottom:6px; }
        .su-sub { font-size:13px; color:var(--text-secondary); font-family:var(--font-mono); margin-bottom:28px; }
        .su-field { margin-bottom:16px; }
        .su-field-label { display:flex; align-items:center; justify-content:space-between; font-size:11px; font-family:var(--font-mono); color:var(--text-secondary); letter-spacing:0.08em; text-transform:uppercase; margin-bottom:8px; }
        .su-field-wrap { position:relative; }
        .su-field-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:13px; pointer-events:none; transition:color 0.2s; font-family:var(--font-mono); }
        .su-field-input { width:100%; padding:12px 14px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius); color:var(--text-primary); font-family:var(--font-mono); font-size:13px; outline:none; transition:var(--transition); }
        .su-field-input::placeholder { color:var(--text-muted); font-size:12px; }
        .su-field-input:focus { border-color:var(--border-focus); background:rgba(0,255,210,0.02); box-shadow:0 0 0 3px rgba(0,255,210,0.07); }
        .su-field-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .su-error { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; margin-top:16px; background:rgba(255,77,109,0.08); border:1px solid rgba(255,77,109,0.35); border-radius:var(--radius); font-family:var(--font-mono); font-size:12px; color:var(--danger); line-height:1.5; animation:shakeError 0.4s ease; }
        @keyframes shakeError { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .su-btn-primary { flex:1; padding:13px; background:var(--accent); color:#0a0c0f; border:none; border-radius:var(--radius); font-family:var(--font-display); font-size:14px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; cursor:pointer; transition:var(--transition); display:flex; align-items:center; justify-content:center; gap:10px; position:relative; overflow:hidden; }
        .su-btn-primary::before { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent); transition:left 0.5s; }
        .su-btn-primary:hover::before { left:100%; }
        .su-btn-primary:hover { background:#00ffe5; box-shadow:0 0 24px rgba(0,255,210,0.4),0 4px 16px rgba(0,255,210,0.2); transform:translateY(-1px); }
        .su-btn-primary:active { transform:translateY(0); }
        .su-btn-primary:disabled { opacity:0.5; cursor:not-allowed; transform:none; box-shadow:none; }
        .su-btn-secondary { padding:13px 20px; background:transparent; color:var(--text-secondary); border:1px solid var(--border); border-radius:var(--radius); font-family:var(--font-display); font-size:14px; font-weight:600; cursor:pointer; transition:var(--transition); display:flex; align-items:center; gap:8px; }
        .su-btn-secondary:hover { border-color:rgba(0,255,210,0.3); color:var(--text-primary); background:rgba(255,255,255,0.02); }
        .su-btn-row { display:flex; gap:12px; margin-top:24px; }
        .su-pass-toggle { background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:13px; transition:color 0.2s; font-family:var(--font-mono); line-height:1; position:absolute; right:14px; top:50%; transform:translateY(-50%); }
        .su-pass-toggle:hover { color:var(--accent); }
        .su-spinner { width:15px; height:15px; border:2px solid rgba(10,12,15,0.3); border-top-color:#0a0c0f; border-radius:50%; animation:suSpin 0.7s linear infinite; }
        @keyframes suSpin { to{transform:rotate(360deg)} }
        .su-info-box { background:var(--accent-glow2); border:1px solid var(--border); border-radius:var(--radius); padding:12px 16px; margin-top:4px; display:flex; gap:10px; align-items:flex-start; }
        .su-field-ok  { font-family:var(--font-mono); font-size:10px; color:var(--accent); margin-top:6px; display:flex; gap:5px; }
        .su-field-err { font-family:var(--font-mono); font-size:10px; color:var(--danger); margin-top:6px; display:flex; gap:5px; }
        .su-login-link { text-align:center; font-family:var(--font-mono); font-size:12px; color:var(--text-muted); margin-top:20px; }
        .su-footer-link { color:var(--accent); text-decoration:none; transition:var(--transition); }
        .su-footer-link:hover { text-shadow:0 0 8px rgba(0,255,210,0.5); }
        .su-security { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:28px; padding-top:20px; border-top:1px solid var(--border); font-family:var(--font-mono); font-size:10px; color:var(--text-muted); letter-spacing:0.08em; text-transform:uppercase; }
        .su-sec-dot { width:5px; height:5px; border-radius:50%; background:var(--accent); opacity:0.6; }
        @media (max-width:900px) { .su-left{display:none} .su-right{flex:1;padding:32px 24px} .su-field-row{grid-template-columns:1fr} }
      `}</style>

      <div className="signup-root">
        {/* LEFT */}
        <div className="su-left">
          <GridCanvas />
          <div className="su-logo">
            <div className="su-logo-icon">⬡</div>
            <div className="su-logo-name">Secure<span>Ops</span></div>
          </div>
          <div style={{ opacity: animating ? 0 : 1, transform: animating ? (direction === "forward" ? "translateY(10px)" : "translateY(-10px)") : "translateY(0)", transition: "opacity 0.25s ease, transform 0.25s ease" }}>
            <div className="su-step-icon">{current.icon}</div>
            <h2 className="su-left-title">{current.title}</h2>
            <p className="su-left-sub">{current.sub}</p>
            <div className="su-bullets">
              {current.bullets.map(b => <div key={b} className="su-bullet"><div className="su-bullet-dot" />{b}</div>)}
            </div>
          </div>
          <div className="su-progress">
            <div className="su-progress-track">
              <div className="su-progress-fill" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
            </div>
            <div className="su-progress-label">Step {step + 1} of {TOTAL_STEPS} — {leftContent[step].title.split(" ").slice(-1)[0]}</div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="su-right">
          <div className="su-wrapper">
            <div className="su-eyebrow">// New Account</div>
            <h1 className="su-title">Create your account</h1>
            <p className="su-sub">Company registration — complete all 3 steps</p>
            <StepIndicator current={step} total={TOTAL_STEPS} />

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ opacity: animating ? 0 : 1, transform: animating ? (direction === "forward" ? "translateX(-18px)" : "translateX(18px)") : "translateX(0)", transition: "opacity 0.22s ease, transform 0.22s ease" }}>

                {/* ── Step 0: Company info ── */}
                {step === 0 && <>
                  <Field label="Company name"      name="raison_sociale"      value={form.raison_sociale}      onChange={set("raison_sociale")}      placeholder="Acme Security Inc." icon="◈" />
                  <Field label="SIRET number"      name="siret"               value={form.siret}               onChange={v => set("siret")(v.replace(/\D/g, ""))}              placeholder="12345678901234" icon="#" hint="14 digits" />
                  <Field label="Registered address" name="adresse_siege"      value={form.adresse_siege}       onChange={set("adresse_siege")}       placeholder="12 Rue de la Paix, Paris" icon="◎" />
                  <Field label="Company phone"     name="telephone_entreprise" value={form.telephone_entreprise} onChange={v => set("telephone_entreprise")(v.replace(/[^\d\s\+\-\(\)]/g, ""))} placeholder="+33 1 23 45 67 89" icon="⬡" type="tel" />
                </>}

                {/* ── Step 1: Contact info ── */}
                {step === 1 && <>
                  <div className="su-field-row">
                    <Field label="Last name"  name="nom_contact"    value={form.nom_contact}    onChange={set("nom_contact")}    placeholder="Dupont" icon="◇" />
                    <Field label="First name" name="prenom_contact" value={form.prenom_contact} onChange={set("prenom_contact")} placeholder="Marc"   icon="◇" />
                  </div>

                  {/* Email field */}
                  <Field
                    label="Professional email"
                    name="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="marc@company.com"
                    icon="@"
                    type="email"
                  />

                  {/* ── NEW: Email validation feedback ── */}
                  {form.email && !emailValid && (
                    <div className="su-field-err" style={{ marginTop: -8, marginBottom: 12 }}>
                      <span>✕</span> Please enter a valid email address (e.g. name@company.com)
                    </div>
                  )}
                  {form.email && emailValid && (
                    <div className="su-field-ok" style={{ marginTop: -8, marginBottom: 12 }}>
                      <span>✓</span> Valid email address
                    </div>
                  )}

                  <Field label="Contact phone" name="telephone" value={form.telephone} onChange={v => set("telephone")(v.replace(/[^\d\s\+\-\(\)]/g, ""))} placeholder="+33 6 12 34 56 78" icon="⬡" type="tel" />

                  <div className="su-info-box">
                    <span style={{ color: "var(--accent)", fontSize: 12, marginTop: 1 }}>ℹ</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      This contact will receive all security reports and task notifications.
                    </span>
                  </div>
                </>}

                {/* ── Step 2: Account credentials ── */}
                {step === 2 && <>
                  <Field label="User code" name="code" value={form.code} onChange={set("code")} placeholder="Your unique login identifier" icon="#" hint="No spaces" />

                  <div className="su-field">
                    <label className="su-field-label">
                      <span>Password<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span></span>
                    </label>
                    <div className="su-field-wrap">
                      <span className="su-field-icon">⬡</span>
                      <input
                        className="su-field-input"
                        style={{ paddingLeft: 42, paddingRight: 42 }}
                        type={showPass ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={form.mot_de_passe}
                        onChange={e => set("mot_de_passe")(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button type="button" className="su-pass-toggle" onClick={() => setShowPass(s => !s)}>
                        {showPass ? "◉" : "◎"}
                      </button>
                    </div>
                    <PasswordStrength password={form.mot_de_passe} />
                  </div>

                  <div className="su-field">
                    <label className="su-field-label">
                      <span>Confirm password<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span></span>
                    </label>
                    <div className="su-field-wrap">
                      <span className="su-field-icon">⬡</span>
                      <input
                        className="su-field-input"
                        style={{
                          paddingLeft: 42, paddingRight: 42,
                          borderColor: form.confirm_password && form.confirm_password !== form.mot_de_passe
                            ? "rgba(255,77,109,0.6)"
                            : undefined,
                        }}
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repeat your password"
                        value={form.confirm_password}
                        onChange={e => set("confirm_password")(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button type="button" className="su-pass-toggle" onClick={() => setShowConfirm(s => !s)}>
                        {showConfirm ? "◉" : "◎"}
                      </button>
                    </div>
                    {form.confirm_password && form.confirm_password !== form.mot_de_passe && (
                      <div className="su-field-err"><span>✕</span> Passwords do not match</div>
                    )}
                    {form.confirm_password && form.confirm_password === form.mot_de_passe && (
                      <div className="su-field-ok"><span>✓</span> Passwords match</div>
                    )}
                  </div>

                  <div className="su-info-box">
                    <span style={{ color: "var(--accent)", fontSize: 12 }}>⬡</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      By creating an account you agree to our{" "}
                      <Link to="/legal" className="su-footer-link" target="_blank" rel="noopener noreferrer">Terms of Service</Link>{" "}and{" "}
                      <Link to="/legal#privacy" className="su-footer-link" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
                    </span>
                  </div>
                </>}
              </div>

              {error && (
                <div className="su-error" role="alert">
                  <span style={{ flexShrink: 0 }}>✕</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="su-btn-row">
                {step > 0 && (
                  <button type="button" className="su-btn-secondary" onClick={goBack}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>←</span> Back
                  </button>
                )}
                <button
                  type="submit"
                  className="su-btn-primary"
                  disabled={!stepValid[step] || loading}
                >
                  {loading
                    ? <><div className="su-spinner" /> Creating account...</>
                    : step < TOTAL_STEPS - 1
                      ? <>Continue <span style={{ fontFamily: "var(--font-mono)" }}>→</span></>
                      : <>Create account <span style={{ fontFamily: "var(--font-mono)" }}>→</span></>}
                </button>
              </div>
            </form>

            <div className="su-login-link">
              Already have an account?{" "}
              <Link to="/login" className="su-footer-link">Sign in →</Link>
            </div>

            <div className="su-security">
              <div className="su-sec-dot" /> TLS 1.3 Encrypted <div className="su-sec-dot" /> GDPR Compliant <div className="su-sec-dot" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
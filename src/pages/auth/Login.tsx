import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "@/services/auth.service";

// ─── Animated grid background canvas ─────────────────────────────────────────
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

      ctx.strokeStyle = "rgba(0,255,210,0.04)";
      ctx.lineWidth = 0.5;
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * GRID, 0);
        ctx.lineTo(c * GRID, canvas.height);
        ctx.stroke();
      }
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * GRID);
        ctx.lineTo(canvas.width, r * GRID);
        ctx.stroke();
      }

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const phase = (c * 3 + r * 7 + t * 0.015) % (Math.PI * 2);
          const alpha = (Math.sin(phase) + 1) / 2;
          if (alpha < 0.15) continue;
          ctx.beginPath();
          ctx.arc(c * GRID, r * GRID, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,210,${alpha * 0.35})`;
          ctx.fill();
        }
      }

      const scanY = (t * 0.4) % canvas.height;
      if (isFinite(scanY) && isFinite(canvas.height)) {
        const y0 = scanY - 60;
        const y1 = scanY + 60;
        if (isFinite(y0) && isFinite(y1) && y0 !== y1) {
          const grad = ctx.createLinearGradient(0, y0, 0, y1);
          grad.addColorStop(0, "rgba(0,255,210,0)");
          grad.addColorStop(0.5, "rgba(0,255,210,0.06)");
          grad.addColorStop(1, "rgba(0,255,210,0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, y0, canvas.width, 120);
        }
      }

      t++;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

// ─── Typing animation ─────────────────────────────────────────────────────────
function TypingText({ lines }: { lines: string[] }) {
  const [displayed, setDisplayed] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (lineIdx >= lines.length) return;
    const current = lines[lineIdx];
    if (charIdx < current.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), 38);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setLineIdx((l) => l + 1); setCharIdx(0); }, 900);
      return () => clearTimeout(t);
    }
  }, [charIdx, lineIdx, lines]);

  useEffect(() => {
    const full =
      lines.slice(0, lineIdx).join("\n") +
      (lineIdx < lines.length
        ? (lineIdx > 0 ? "\n" : "") + lines[lineIdx].slice(0, charIdx)
        : "");
    setDisplayed(full);
  }, [charIdx, lineIdx, lines]);

  useEffect(() => {
    const t = setInterval(() => setShowCursor((c) => !c), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#00ffd2", lineHeight: 1.9, whiteSpace: "pre" }}>
      {displayed}
      <span style={{ opacity: showCursor ? 1 : 0 }}>▋</span>
    </div>
  );
}

// ─── Main Login Component ─────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const terminalLines = [
    "> Initializing SecureOps v2.4.1",
    "> Loading threat intelligence modules...",
    "> Encryption protocols: ACTIVE",
    "> Zero-trust framework: ENABLED",
    "> System ready. Authenticate to proceed.",
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authService.login({
        code: code.trim(),
        motDePasse: password,
      });

      switch (response.role) {
        case "ADMIN":    navigate("/admin/dashboard");  break;
        case "EMPLOYEE": navigate("/employee/tasks");   break;
        case "CLIENT":
        default:         navigate("/client/dashboard"); break;
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        (err.response?.status === 401 ? "Invalid code or password." : null) ||
        (err.response?.status === 404 ? "Account not found." : null) ||
        "Something went wrong. Please try again.";
      setError(typeof msg === "string" ? msg : "Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg-primary:    #0a0c0f;
          --bg-secondary:  #0f1218;
          --bg-input:      #0d1117;
          --accent:        #00ffd2;
          --accent-dim:    #00c9a7;
          --accent-glow:   rgba(0,255,210,0.15);
          --accent-glow2:  rgba(0,255,210,0.08);
          --border:        rgba(0,255,210,0.12);
          --border-focus:  rgba(0,255,210,0.7);
          --text-primary:  #e8edf5;
          --text-secondary:#6b7a8d;
          --text-muted:    #3d4a5c;
          --danger:        #ff4d6d;
          --font-display:  'Syne', sans-serif;
          --font-mono:     'JetBrains Mono', monospace;
          --radius:        10px;
          --radius-lg:     16px;
          --transition:    all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        }
        body { background: var(--bg-primary); }
        .login-root { min-height: 100vh; display: flex; font-family: var(--font-display); background: var(--bg-primary); overflow: hidden; }
        .left-panel { position: relative; flex: 1.1; display: flex; flex-direction: column; justify-content: space-between; padding: 48px 56px; background: var(--bg-secondary); overflow: hidden; border-right: 1px solid var(--border); }
        .left-panel::before { content: ''; position: absolute; bottom: -120px; right: -120px; width: 480px; height: 480px; border-radius: 50%; background: radial-gradient(circle, rgba(0,255,210,0.08) 0%, transparent 70%); pointer-events: none; }
        .logo-mark { display: flex; align-items: center; gap: 12px; opacity: 0; transform: translateY(-12px); animation: fadeUp 0.5s ease 0.1s forwards; }
        .logo-icon { width: 38px; height: 38px; border: 1.5px solid var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--accent); background: var(--accent-glow2); position: relative; }
        .logo-icon::after { content: ''; position: absolute; inset: -4px; border-radius: 10px; border: 1px solid rgba(0,255,210,0.15); }
        .logo-name { font-size: 17px; font-weight: 700; color: var(--text-primary); letter-spacing: 0.02em; }
        .logo-name span { color: var(--accent); }
        .hero-content { opacity: 0; transform: translateY(20px); animation: fadeUp 0.6s ease 0.3s forwards; }
        .hero-badge { display: inline-flex; align-items: center; gap: 7px; padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border); background: var(--accent-glow2); font-size: 11px; font-family: var(--font-mono); color: var(--accent); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 28px; }
        .hero-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(0,255,210,0.4)} 50%{opacity:.7;box-shadow:0 0 0 6px rgba(0,255,210,0)} }
        .hero-title { font-size: clamp(32px, 3.5vw, 48px); font-weight: 800; line-height: 1.08; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 20px; }
        .hero-title .accent-line { display: block; color: var(--accent); text-shadow: 0 0 40px rgba(0,255,210,0.4); }
        .hero-sub { font-size: 15px; color: var(--text-secondary); line-height: 1.7; max-width: 380px; font-family: var(--font-mono); }
        .terminal { background: rgba(0,0,0,0.5); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px 24px; margin-top: 40px; backdrop-filter: blur(8px); }
        .terminal-bar { display: flex; align-items: center; gap: 7px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
        .terminal-dot { width: 10px; height: 10px; border-radius: 50%; }
        .stats-row { display: flex; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; opacity: 0; transform: translateY(12px); animation: fadeUp 0.6s ease 0.5s forwards; }
        .stat-item { flex: 1; padding: 16px 20px; border-right: 1px solid var(--border); text-align: center; }
        .stat-item:last-child { border-right: none; }
        .stat-value { font-size: 22px; font-weight: 800; color: var(--accent); font-family: var(--font-mono); letter-spacing: -0.02em; }
        .stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 3px; font-family: var(--font-mono); }
        .right-panel { flex: 0.9; display: flex; align-items: center; justify-content: center; padding: 48px 56px; background: var(--bg-primary); }
        .form-wrapper { width: 100%; max-width: 400px; opacity: 0; transform: translateX(24px); animation: slideIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.2s forwards; }
        @keyframes slideIn { to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp  { to { opacity:1; transform:translateY(0); } }
        .form-eyebrow { font-family: var(--font-mono); font-size: 11px; color: var(--accent); letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 10px; }
        .form-title { font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; line-height: 1.15; margin-bottom: 6px; }
        .form-sub { font-size: 13px; color: var(--text-secondary); font-family: var(--font-mono); margin-bottom: 32px; }
        .field { margin-bottom: 18px; }
        .field-label { display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-family: var(--font-mono); color: var(--text-secondary); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
        .field-wrap { position: relative; }
        .field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 14px; pointer-events: none; transition: var(--transition); font-family: var(--font-mono); }
        .field-wrap:focus-within .field-icon { color: var(--accent); }
        .field-input { width: 100%; padding: 13px 42px; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-primary); font-family: var(--font-mono); font-size: 13.5px; outline: none; transition: var(--transition); letter-spacing: 0.02em; }
        .field-input::placeholder { color: var(--text-muted); font-size: 12px; }
        .field-input:focus { border-color: var(--border-focus); background: rgba(0,255,210,0.03); box-shadow: 0 0 0 3px rgba(0,255,210,0.07); }
        .field-input.has-error { border-color: rgba(255,77,109,0.5); }
        .pass-toggle { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 13px; padding: 4px; transition: var(--transition); font-family: var(--font-mono); line-height: 1; }
        .pass-toggle:hover { color: var(--accent); }
        .forgot-btn { background: none; border: none; color: var(--accent); font-family: var(--font-mono); font-size: 11px; opacity: 0.7; cursor: pointer; padding: 0; transition: var(--transition); }
        .forgot-btn:hover { opacity: 1; text-decoration: underline; }
        .error-box { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; margin-bottom: 16px; background: rgba(255,77,109,0.08); border: 1px solid rgba(255,77,109,0.35); border-radius: var(--radius); font-family: var(--font-mono); font-size: 12px; color: var(--danger); line-height: 1.5; animation: shakeError 0.4s ease; }
        @keyframes shakeError { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .submit-btn { width: 100%; padding: 14px; margin-top: 4px; background: var(--accent); color: #0a0c0f; border: none; border-radius: var(--radius); font-family: var(--font-display); font-size: 14px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: var(--transition); position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .submit-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); transition: left 0.5s ease; }
        .submit-btn:hover::before { left: 100%; }
        .submit-btn:hover { background: #00ffe5; box-shadow: 0 0 24px rgba(0,255,210,0.4), 0 4px 16px rgba(0,255,210,0.2); transform: translateY(-1px); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(10,12,15,0.3); border-top-color: #0a0c0f; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .divider { display: flex; align-items: center; gap: 12px; margin: 28px 0 20px; }
        .divider-line { flex: 1; height: 1px; background: var(--border); }
        .divider-text { font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); letter-spacing: 0.1em; text-transform: uppercase; }
        .form-footer { text-align: center; font-size: 12px; color: var(--text-muted); font-family: var(--font-mono); }
        .footer-link { color: var(--accent); text-decoration: none; font-weight: 500; transition: var(--transition); }
        .footer-link:hover { text-shadow: 0 0 8px rgba(0,255,210,0.5); }
        .security-badge { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; }
        .security-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); opacity: 0.6; }
        @media (max-width: 900px) { .left-panel { display: none; } .right-panel { flex: 1; padding: 32px 24px; } }
      `}</style>

      <div className="login-root">

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <GridCanvas />
          <div className="logo-mark">
            <div className="logo-icon">⬡</div>
            <div className="logo-name">Secure<span>Ops</span></div>
          </div>
          <div className="hero-content">
            <div className="hero-badge">System Operational</div>
            <h1 className="hero-title">
              Cyber Security
              <span className="accent-line">Management</span>
              Platform
            </h1>
            <p className="hero-sub">
              End-to-end security operations. Manage threats, assign tasks, and track resolution — all in one place.
            </p>
            <div className="terminal">
              <div className="terminal-bar">
                <div className="terminal-dot" style={{ background: "#ff5f57" }} />
                <div className="terminal-dot" style={{ background: "#febc2e" }} />
                <div className="terminal-dot" style={{ background: "#28c840" }} />
                <span style={{ marginLeft: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                  secureops ~ terminal
                </span>
              </div>
              <TypingText lines={terminalLines} />
            </div>
          </div>
          <div className="stats-row">
            <div className="stat-item"><div className="stat-value">99.9%</div><div className="stat-label">Uptime</div></div>
            <div className="stat-item"><div className="stat-value">256</div><div className="stat-label">AES Enc.</div></div>
            <div className="stat-item"><div className="stat-value">0-Trust</div><div className="stat-label">Framework</div></div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="form-wrapper">
            <div className="form-eyebrow">// Access Portal</div>
            <h2 className="form-title">Welcome back</h2>
            <p className="form-sub">Enter your credentials to access your dashboard</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label className="field-label"><span>User Code</span></label>
                <div className="field-wrap">
                  <span className="field-icon">#</span>
                  <input
                    className={`field-input${error ? " has-error" : ""}`}
                    type="text"
                    placeholder="Enter your unique code"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError(null); }}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">
                  <span>Password</span>
                  {/* ── Forgot password link — navigates to /forgot-password ── */}
                  <button
                    type="button"
                    className="forgot-btn"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </label>
                <div className="field-wrap">
                  <span className="field-icon">⬡</span>
                  <input
                    className={`field-input${error ? " has-error" : ""}`}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    autoComplete="current-password"
                  />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass((s) => !s)}>
                    {showPass ? "◉" : "◎"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-box" role="alert">
                  <span style={{ flexShrink: 0 }}>✕</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="submit-btn"
                disabled={loading || !code.trim() || !password}
              >
                {loading
                  ? <><div className="spinner" /> Authenticating...</>
                  : <>Authenticate <span style={{ fontSize: 16, fontFamily: "var(--font-mono)" }}>→</span></>
                }
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">New to the platform?</span>
              <div className="divider-line" />
            </div>

            <div className="form-footer">
              Are you a company?{" "}
              <Link to="/signup" className="footer-link">Create an account →</Link>
            </div>

            <div className="security-badge">
              <div className="security-dot" /> TLS 1.3 Encrypted
              <div className="security-dot" /> Zero-Trust Auth
              <div className="security-dot" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
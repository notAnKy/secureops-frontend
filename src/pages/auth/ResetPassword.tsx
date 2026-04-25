import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "@/services/api";

export default function ResetPassword() {
  const [searchParams]              = useSearchParams();
  const navigate                    = useNavigate();
  const token                       = searchParams.get("token");

  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // If no token in URL — redirect to forgot password
  useEffect(() => {
    if (!token) navigate("/forgot-password");
  }, [token]);

  const passwordsMatch = confirm && password === confirm;
  const passwordValid  = password.length >= 8;
  const canSubmit      = passwordValid && passwordsMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setDone(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid or expired reset link. Please request a new one.";
      setError(typeof msg === "string" ? msg : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 44px 12px 16px",
    background: "#0d1117",
    border: "1px solid rgba(0,255,210,0.12)",
    borderRadius: 10, color: "#e8edf5",
    fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
    outline: "none", marginBottom: 6, transition: "all 0.2s",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:      #0a0c0f;
          --card:    #0f1218;
          --accent:  #00ffd2;
          --border:  rgba(0,255,210,0.12);
          --tp:      #e8edf5;
          --ts:      #6b7a8d;
          --tm:      #3d4a5c;
          --danger:  #ff4d6d;
          --mono:    'JetBrains Mono', monospace;
          --display: 'Syne', sans-serif;
        }
        body { background: var(--bg); }
        .rp-root {
          min-height: 100vh; display: flex;
          align-items: center; justify-content: center;
          background: var(--bg); padding: 24px;
          font-family: var(--display);
        }
        .rp-card {
          width: 100%; max-width: 420px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px; overflow: hidden;
          animation: cardIn 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .rp-top { height: 4px; background: linear-gradient(90deg, var(--accent), rgba(0,255,210,0.2)); }
        .rp-body { padding: 40px 36px; }
        .rp-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(0,255,210,0.08);
          border: 1px solid rgba(0,255,210,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; margin-bottom: 20px;
        }
        .rp-eyebrow { font-family: var(--mono); font-size: 10px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 8px; }
        .rp-title { font-family: var(--display); font-size: 24px; font-weight: 800; color: var(--tp); letter-spacing: -0.02em; margin-bottom: 8px; }
        .rp-sub { font-family: var(--mono); font-size: 12px; color: var(--ts); line-height: 1.7; margin-bottom: 28px; }
        .rp-label { font-family: var(--mono); font-size: 10px; color: var(--ts); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; display: block; }
        .rp-field { position: relative; margin-bottom: 16px; }
        .rp-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-60%);
          background: none; border: none; color: var(--tm);
          cursor: pointer; font-size: 13px; transition: color 0.2s;
        }
        .rp-toggle:hover { color: var(--accent); }
        .rp-hint { font-family: var(--mono); font-size: 10px; margin-top: -10px; margin-bottom: 16px; display: flex; align-items: center; gap: 5px; }
        .rp-btn {
          width: 100%; padding: 13px; margin-top: 8px;
          background: var(--accent); color: #0a0c0f;
          border: none; border-radius: 10px;
          font-family: var(--display); font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .rp-btn:hover:not(:disabled) { background: #00ffe5; transform: translateY(-1px); }
        .rp-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .rp-spinner { width: 14px; height: 14px; border: 2px solid rgba(10,12,15,0.3); border-top-color: #0a0c0f; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .rp-error { padding: 10px 14px; margin-bottom: 16px; background: rgba(255,77,109,0.08); border: 1px solid rgba(255,77,109,0.25); border-radius: 8px; color: var(--danger); font-family: var(--mono); font-size: 12px; }
        /* Password strength bar */
        .rp-strength { height: 3px; border-radius: 2px; margin-bottom: 16px; transition: all 0.3s; }
        /* Success */
        .rp-success { text-align: center; padding: 8px 0; }
        .rp-success-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 20px;
          animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes popIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
        .rp-success-title { font-family: var(--display); font-size: 20px; font-weight: 800; color: var(--tp); margin-bottom: 12px; }
        .rp-success-text { font-family: var(--mono); font-size: 12px; color: var(--ts); line-height: 1.8; margin-bottom: 24px; }
        .rp-login-link { display: inline-flex; align-items: center; gap: 6px; padding: 11px 24px; background: var(--accent); border-radius: 10px; color: #0a0c0f; font-family: var(--display); font-size: 13px; font-weight: 700; text-decoration: none; transition: all 0.2s; }
        .rp-login-link:hover { background: #00ffe5; }
      `}</style>

      <div className="rp-root">
        <div className="rp-card">
          <div className="rp-top" />
          <div className="rp-body">

            {!done ? (
              <>
                <div className="rp-icon">🔐</div>
                <div className="rp-eyebrow">// Account recovery</div>
                <div className="rp-title">Set new password</div>
                <div className="rp-sub">
                  Choose a strong password with at least 8 characters.
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {error && <div className="rp-error">✕ {error}</div>}

                  {/* New password */}
                  <label className="rp-label">New password *</label>
                  <div className="rp-field">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(null); }}
                      placeholder="Min. 8 characters"
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = "rgba(0,255,210,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,255,210,0.07)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(0,255,210,0.12)"; e.target.style.boxShadow = "none"; }}
                    />
                    <button type="button" className="rp-toggle" onClick={() => setShowPass(s => !s)}>
                      {showPass ? "◉" : "◎"}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {password && (
                    <div
                      className="rp-strength"
                      style={{
                        background: password.length < 8
                          ? "rgba(255,77,109,0.5)"
                          : password.length < 12
                            ? "rgba(245,158,11,0.6)"
                            : "rgba(16,185,129,0.6)",
                        width: password.length < 8 ? "30%" : password.length < 12 ? "65%" : "100%",
                      }}
                    />
                  )}

                  {/* Confirm password */}
                  <label className="rp-label">Confirm password *</label>
                  <div className="rp-field">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError(null); }}
                      placeholder="Repeat new password"
                      style={{
                        ...inputStyle,
                        borderColor: confirm
                          ? confirm === password
                            ? "rgba(16,185,129,0.5)"
                            : "rgba(255,77,109,0.5)"
                          : "rgba(0,255,210,0.12)",
                      }}
                      onFocus={e => { e.target.style.borderColor = "rgba(0,255,210,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,255,210,0.07)"; }}
                      onBlur={e => {
                        e.target.style.borderColor = confirm
                          ? confirm === password ? "rgba(16,185,129,0.5)" : "rgba(255,77,109,0.5)"
                          : "rgba(0,255,210,0.12)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                    <button type="button" className="rp-toggle" onClick={() => setShowConfirm(s => !s)}>
                      {showConfirm ? "◉" : "◎"}
                    </button>
                  </div>

                  {/* Match indicator */}
                  {confirm && (
                    <div className="rp-hint" style={{ color: passwordsMatch ? "#10b981" : "#ff4d6d" }}>
                      <span>{passwordsMatch ? "✓" : "✕"}</span>
                      <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
                    </div>
                  )}

                  <button type="submit" className="rp-btn" disabled={!canSubmit}>
                    {loading
                      ? <><div className="rp-spinner" /> Resetting...</>
                      : <>Reset Password →</>
                    }
                  </button>
                </form>
              </>
            ) : (
              /* ── Success state ── */
              <div className="rp-success">
                <div className="rp-success-icon">✅</div>
                <div className="rp-success-title">Password reset!</div>
                <div className="rp-success-text">
                  Your password has been successfully updated. You can now log in with your new password.
                  <br /><br />
                  <span style={{ color: "var(--accent)" }}>Redirecting to login in 3 seconds...</span>
                </div>
                <Link to="/login" className="rp-login-link">
                  Go to Login →
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
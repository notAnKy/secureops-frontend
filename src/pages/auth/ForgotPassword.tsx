import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/services/api";

export default function ForgotPassword() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
        .fp-root {
          min-height: 100vh; display: flex;
          align-items: center; justify-content: center;
          background: var(--bg); padding: 24px;
          font-family: var(--display);
        }
        .fp-card {
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
        .fp-top {
          height: 4px;
          background: linear-gradient(90deg, var(--accent), rgba(0,255,210,0.2));
        }
        .fp-body { padding: 40px 36px; }
        .fp-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--mono); font-size: 11px; color: var(--ts);
          text-decoration: none; margin-bottom: 28px;
          transition: color 0.2s;
        }
        .fp-back:hover { color: var(--accent); }
        .fp-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(0,255,210,0.08);
          border: 1px solid rgba(0,255,210,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; margin-bottom: 20px;
        }
        .fp-eyebrow {
          font-family: var(--mono); font-size: 10px; color: var(--accent);
          text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 8px;
        }
        .fp-title {
          font-family: var(--display); font-size: 24px; font-weight: 800;
          color: var(--tp); letter-spacing: -0.02em; margin-bottom: 8px;
        }
        .fp-sub {
          font-family: var(--mono); font-size: 12px; color: var(--ts);
          line-height: 1.7; margin-bottom: 28px;
        }
        .fp-label {
          font-family: var(--mono); font-size: 10px; color: var(--ts);
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;
          display: block;
        }
        .fp-input {
          width: 100%; padding: 12px 16px;
          background: #0d1117;
          border: 1px solid var(--border);
          border-radius: 10px; color: var(--tp);
          font-family: var(--mono); font-size: 13px;
          outline: none; margin-bottom: 20px;
          transition: all 0.2s;
        }
        .fp-input::placeholder { color: var(--tm); }
        .fp-input:focus {
          border-color: rgba(0,255,210,0.6);
          box-shadow: 0 0 0 3px rgba(0,255,210,0.07);
        }
        .fp-btn {
          width: 100%; padding: 13px;
          background: var(--accent); color: #0a0c0f;
          border: none; border-radius: 10px;
          font-family: var(--display); font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .fp-btn:hover:not(:disabled) { background: #00ffe5; transform: translateY(-1px); }
        .fp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .fp-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(10,12,15,0.3);
          border-top-color: #0a0c0f;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fp-error {
          padding: 10px 14px; margin-bottom: 16px;
          background: rgba(255,77,109,0.08);
          border: 1px solid rgba(255,77,109,0.25);
          border-radius: 8px; color: var(--danger);
          font-family: var(--mono); font-size: 12px;
        }
        /* Success state */
        .fp-success {
          text-align: center; padding: 8px 0;
        }
        .fp-success-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 20px;
          animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .fp-success-title {
          font-family: var(--display); font-size: 20px; font-weight: 800;
          color: var(--tp); margin-bottom: 12px;
        }
        .fp-success-text {
          font-family: var(--mono); font-size: 12px; color: var(--ts);
          line-height: 1.8; margin-bottom: 24px;
        }
        .fp-success-email {
          color: var(--accent); font-weight: 600;
        }
        .fp-login-link {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 11px 24px;
          background: rgba(0,255,210,0.08);
          border: 1px solid rgba(0,255,210,0.25);
          border-radius: 10px; color: var(--accent);
          font-family: var(--mono); font-size: 12px;
          text-decoration: none; transition: all 0.2s;
        }
        .fp-login-link:hover {
          background: rgba(0,255,210,0.15);
          border-color: rgba(0,255,210,0.4);
        }
      `}</style>

      <div className="fp-root">
        <div className="fp-card">
          <div className="fp-top" />
          <div className="fp-body">

            {!sent ? (
              <>
                <Link to="/login" className="fp-back">← Back to login</Link>

                <div className="fp-icon">🔑</div>
                <div className="fp-eyebrow">// Account recovery</div>
                <div className="fp-title">Forgot your password?</div>
                <div className="fp-sub">
                  Enter the email address associated with your account. We'll send you a link to reset your password.
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {error && <div className="fp-error">✕ {error}</div>}

                  <label className="fp-label">Email address *</label>
                  <input
                    className="fp-input"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    autoFocus
                  />

                  <button
                    type="submit"
                    className="fp-btn"
                    disabled={!email.trim() || loading}
                  >
                    {loading
                      ? <><div className="fp-spinner" /> Sending...</>
                      : <>Send Reset Link →</>
                    }
                  </button>
                </form>
              </>
            ) : (
              /* ── Success state ── */
              <div className="fp-success">
                <div className="fp-success-icon">✉️</div>
                <div className="fp-success-title">Check your inbox!</div>
                <div className="fp-success-text">
                  If an account exists for{" "}
                  <span className="fp-success-email">{email}</span>,
                  we've sent a password reset link. Check your inbox and follow the instructions.
                  <br /><br />
                  The link expires in <strong style={{ color: "var(--tp)" }}>1 hour</strong>.
                </div>
                <Link to="/login" className="fp-login-link">
                  ← Back to login
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
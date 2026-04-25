import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function LegalPage() {
  const { hash } = useLocation();

  // Scroll to the correct section based on hash
  useEffect(() => {
    if (hash === "#privacy") {
      document.getElementById("privacy")?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hash]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:#0a0c0f; --card:#0f1218;
          --accent:#00ffd2; --border:rgba(0,255,210,0.12);
          --tp:#e8edf5; --ts:#6b7a8d; --tm:#3d4a5c;
          --mono:'JetBrains Mono',monospace;
          --display:'Syne',sans-serif;
        }
        body { background: var(--bg); }
        .legal-root { min-height: 100vh; background: var(--bg); font-family: var(--display); }
        .legal-nav { position: sticky; top: 0; z-index: 10; background: rgba(10,12,15,0.95); border-bottom: 1px solid var(--border); padding: 16px 48px; display: flex; align-items: center; justify-content: space-between; backdrop-filter: blur(12px); }
        .legal-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .legal-logo-icon { width: 32px; height: 32px; border: 1.5px solid var(--accent); border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 15px; color: var(--accent); }
        .legal-logo-name { font-size: 15px; font-weight: 700; color: var(--tp); }
        .legal-logo-name span { color: var(--accent); }
        .legal-back { font-family: var(--mono); font-size: 12px; color: var(--ts); text-decoration: none; display: flex; align-items: center; gap: 6px; transition: color 0.2s; }
        .legal-back:hover { color: var(--accent); }
        .legal-body { max-width: 780px; margin: 0 auto; padding: 64px 32px 120px; }
        .legal-toc { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 24px 28px; margin-bottom: 56px; }
        .legal-toc-title { font-family: var(--mono); font-size: 10px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 14px; }
        .legal-toc a { display: block; font-family: var(--mono); font-size: 12px; color: var(--ts); text-decoration: none; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.04); transition: color 0.2s; }
        .legal-toc a:last-child { border-bottom: none; }
        .legal-toc a:hover { color: var(--accent); }
        .legal-section { margin-bottom: 64px; scroll-margin-top: 80px; }
        .legal-section-eyebrow { font-family: var(--mono); font-size: 10px; color: var(--accent); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px; }
        .legal-section-title { font-size: 28px; font-weight: 800; color: var(--tp); letter-spacing: -0.02em; margin-bottom: 6px; }
        .legal-section-date { font-family: var(--mono); font-size: 11px; color: var(--tm); margin-bottom: 32px; }
        .legal-h2 { font-size: 16px; font-weight: 700; color: var(--tp); margin: 28px 0 10px; }
        .legal-p { font-family: var(--mono); font-size: 13px; color: var(--ts); line-height: 1.8; margin-bottom: 14px; }
        .legal-ul { margin: 0 0 14px 0; padding-left: 0; list-style: none; }
        .legal-ul li { font-family: var(--mono); font-size: 13px; color: var(--ts); line-height: 1.8; padding: 4px 0 4px 20px; position: relative; }
        .legal-ul li::before { content: '—'; position: absolute; left: 0; color: var(--accent); opacity: 0.6; }
        .legal-divider { height: 1px; background: var(--border); margin: 56px 0; }
        .legal-highlight { background: rgba(0,255,210,0.06); border: 1px solid var(--border); border-radius: 10px; padding: 16px 20px; margin-bottom: 14px; }
        .legal-highlight p { margin-bottom: 0; }
      `}</style>

      <div className="legal-root">
        {/* Nav */}
        <nav className="legal-nav">
          <Link to="/" className="legal-logo">
            <div className="legal-logo-icon">⬡</div>
            <div className="legal-logo-name">Secure<span>Ops</span></div>
          </Link>
          <Link to="/signup" className="legal-back">
            ← Back to sign up
          </Link>
        </nav>

        <div className="legal-body">
          {/* Table of contents */}
          <div className="legal-toc">
            <div className="legal-toc-title">// On this page</div>
            <a href="#terms">Terms of Service</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#security">Security Practices</a>
            <a href="#contact">Contact</a>
          </div>

          {/* ── Terms of Service ── */}
          <section className="legal-section" id="terms">
            <div className="legal-section-eyebrow">// Legal</div>
            <h1 className="legal-section-title">Terms of Service</h1>
            <div className="legal-section-date">Last updated: April 2026</div>

            <div className="legal-highlight">
              <p className="legal-p">By registering and using SecureOps, you agree to these terms. Please read them carefully before creating your account.</p>
            </div>

            <h2 className="legal-h2">1. Acceptance of Terms</h2>
            <p className="legal-p">By accessing or using the SecureOps platform, you confirm that you are authorized to represent your organization and agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>

            <h2 className="legal-h2">2. Use of the Platform</h2>
            <p className="legal-p">SecureOps is a cybersecurity management platform designed for businesses. You agree to use the platform only for lawful purposes and in accordance with these terms. You may not:</p>
            <ul className="legal-ul">
              <li>Use the platform to engage in any fraudulent or illegal activity</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Upload malicious code, scripts, or harmful content</li>
              <li>Interfere with or disrupt the platform's infrastructure</li>
              <li>Share your login credentials with unauthorized individuals</li>
            </ul>

            <h2 className="legal-h2">3. Account Responsibilities</h2>
            <p className="legal-p">You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use of your account. SecureOps is not liable for any loss resulting from unauthorized access due to your failure to protect your credentials.</p>

            <h2 className="legal-h2">4. Service Availability</h2>
            <p className="legal-p">We strive to maintain 99.9% platform uptime. However, we reserve the right to perform scheduled maintenance and cannot guarantee uninterrupted access. We will notify registered users of planned downtime in advance when possible.</p>

            <h2 className="legal-h2">5. Intellectual Property</h2>
            <p className="legal-p">All content, features, and functionality of the SecureOps platform — including but not limited to software, design, logos, and reports — are owned by SecureOps and protected by applicable intellectual property laws.</p>

            <h2 className="legal-h2">6. Limitation of Liability</h2>
            <p className="legal-p">SecureOps shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount paid by you for the services in the three months preceding the claim.</p>

            <h2 className="legal-h2">7. Modifications</h2>
            <p className="legal-p">We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms. We will notify registered users of significant changes by email.</p>
          </section>

          <div className="legal-divider" />

          {/* ── Privacy Policy ── */}
          <section className="legal-section" id="privacy">
            <div className="legal-section-eyebrow">// Privacy</div>
            <h1 className="legal-section-title">Privacy Policy</h1>
            <div className="legal-section-date">Last updated: April 2026</div>

            <div className="legal-highlight">
              <p className="legal-p">We take your privacy seriously. This policy explains what data we collect, how we use it, and your rights regarding your personal information.</p>
            </div>

            <h2 className="legal-h2">1. Data We Collect</h2>
            <p className="legal-p">When you register and use SecureOps, we collect the following information:</p>
            <ul className="legal-ul">
              <li>Company information: name, SIRET number, registered address, company phone</li>
              <li>Contact information: name, professional email, phone number</li>
              <li>Account credentials: user code and encrypted password (never stored in plain text)</li>
              <li>Usage data: request history, task assignments, and report interactions</li>
              <li>Technical data: IP address, browser type, and session tokens for security</li>
            </ul>

            <h2 className="legal-h2">2. How We Use Your Data</h2>
            <p className="legal-p">Your data is used exclusively to:</p>
            <ul className="legal-ul">
              <li>Provide and operate the SecureOps platform and its services</li>
              <li>Authenticate your identity and secure your account</li>
              <li>Deliver security reports and task notifications to your contact</li>
              <li>Improve platform performance and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="legal-h2">3. Data Sharing</h2>
            <p className="legal-p">We do not sell, rent, or share your personal data with third parties for marketing purposes. Your data may be shared only in the following circumstances:</p>
            <ul className="legal-ul">
              <li>With service providers who help us operate the platform (under strict confidentiality agreements)</li>
              <li>When required by law or valid legal process</li>
              <li>To protect the rights, property, or safety of SecureOps, our users, or the public</li>
            </ul>

            <h2 className="legal-h2">4. Data Retention</h2>
            <p className="legal-p">We retain your data for as long as your account is active. If you request account deletion, your personal data will be permanently removed within 30 days, except where retention is required by law.</p>

            <h2 className="legal-h2">5. Your Rights (GDPR)</h2>
            <p className="legal-p">If you are located in the European Union, you have the following rights regarding your personal data:</p>
            <ul className="legal-ul">
              <li>Right to access — request a copy of your personal data</li>
              <li>Right to rectification — correct inaccurate or incomplete data</li>
              <li>Right to erasure — request deletion of your personal data</li>
              <li>Right to portability — receive your data in a structured format</li>
              <li>Right to object — oppose processing of your data for specific purposes</li>
            </ul>

            <h2 className="legal-h2">6. Cookies</h2>
            <p className="legal-p">SecureOps uses only essential session cookies required for authentication. We do not use tracking, advertising, or analytics cookies. You cannot opt out of essential cookies as they are required for the platform to function.</p>
          </section>

          <div className="legal-divider" />

          {/* ── Security Practices ── */}
          <section className="legal-section" id="security">
            <div className="legal-section-eyebrow">// Security</div>
            <h1 className="legal-section-title">Security Practices</h1>
            <div className="legal-section-date">Last updated: April 2026</div>

            <h2 className="legal-h2">Encryption</h2>
            <p className="legal-p">All data transmitted between your browser and our servers is encrypted using TLS 1.3. Passwords are hashed using bcrypt with a minimum cost factor of 12. We never store plain-text passwords under any circumstances.</p>

            <h2 className="legal-h2">Authentication</h2>
            <p className="legal-p">We use JWT (JSON Web Tokens) with a 24-hour expiry for session management. Tokens are rotated on each login and invalidated on logout. All sensitive endpoints require valid authentication.</p>

            <h2 className="legal-h2">Infrastructure</h2>
            <p className="legal-p">Our platform runs on secured servers with regular security patches applied. Access to production infrastructure is restricted to authorized personnel only, with full audit logging of all administrative actions.</p>
          </section>

          <div className="legal-divider" />

          {/* ── Contact ── */}
          <section className="legal-section" id="contact">
            <div className="legal-section-eyebrow">// Contact</div>
            <h1 className="legal-section-title">Contact Us</h1>

            <p className="legal-p">For any questions regarding these terms or your privacy rights, please contact us:</p>
            <div className="legal-highlight">
              <p className="legal-p">
                <strong style={{ color: "var(--tp)" }}>SecureOps Legal Team</strong><br />
                Email: <span style={{ color: "var(--accent)" }}>legal@secureops.com</span><br />
                Response time: within 5 business days
              </p>
            </div>

            <div style={{ marginTop: 40, textAlign: "center" as const }}>
              <Link
                to="/signup"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "rgba(0,255,210,0.08)", border: "1px solid rgba(0,255,210,0.25)", borderRadius: 10, color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 13, textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,255,210,0.16)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,255,210,0.08)"}
              >
                ← Back to sign up
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
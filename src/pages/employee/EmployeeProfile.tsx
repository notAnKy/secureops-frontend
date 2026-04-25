import { useState, useEffect } from "react";
import api from "@/services/api";
import EmployeeLayout from "./EmployeeLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserDTO {
  id: number;
  code: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  specialite: string | null;
  createdAt: string | null;
}

interface ContactForm {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, type = "text",
  placeholder, locked = false, required = true,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; locked?: boolean; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)",
        textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7,
      }}>
        {label}
        {required && !locked && <span style={{ color: "var(--accent)" }}>*</span>}
        {locked && (
          <span style={{
            fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em",
          }}>locked</span>
        )}
      </div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={locked}
        onChange={e => onChange?.(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px",
          background: locked ? "rgba(255,255,255,0.02)" : "var(--bg)",
          border: `1px solid ${locked ? "rgba(255,255,255,0.06)" : "var(--border)"}`,
          borderRadius: 8, color: locked ? "var(--ts)" : "var(--tp)",
          fontFamily: "var(--mono)", fontSize: 13, outline: "none",
          cursor: locked ? "not-allowed" : "text",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={e => {
          if (!locked) {
            e.target.style.borderColor = "rgba(0,255,210,0.6)";
            e.target.style.boxShadow = "0 0 0 3px rgba(0,255,210,0.07)";
          }
        }}
        onBlur={e => {
          e.target.style.borderColor = locked ? "rgba(255,255,255,0.06)" : "var(--border)";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ eyebrow, title, children }: {
  eyebrow: string; title: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 16, padding: "28px",
    }}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 6 }}>
        {eyebrow}
      </div>
      <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--tp)", marginBottom: 24 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
function Feedback({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 8, marginBottom: 16,
      fontFamily: "var(--mono)", fontSize: 12,
      display: "flex", gap: 8, alignItems: "center",
      background: type === "success" ? "rgba(16,185,129,0.08)" : "rgba(255,77,109,0.08)",
      border: `1px solid ${type === "success" ? "rgba(16,185,129,0.25)" : "rgba(255,77,109,0.25)"}`,
      color: type === "success" ? "#10b981" : "#ff4d6d",
    }}>
      <span>{type === "success" ? "✓" : "✕"}</span>
      <span>{message}</span>
    </div>
  );
}

// ─── Employee Profile page ─────────────────────────────────────────────────────
export default function EmployeeProfile() {
  const [profile, setProfile]   = useState<UserDTO | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [contactForm, setContactForm] = useState<ContactForm>({
    nom: "", prenom: "", email: "", telephone: "",
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactFeedback, setContactFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    api.get<UserDTO>("/employee/profile")
      .then(({ data }) => {
        setProfile(data);
        setContactForm({
          nom:       data.nom       ?? "",
          prenom:    data.prenom    ?? "",
          email:     data.email     ?? "",
          telephone: data.telephone ?? "",
        });
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const setContact  = (k: keyof ContactForm)  => (v: string) => setContactForm(f  => ({ ...f,  [k]: v }));
  const setPassword = (k: keyof PasswordForm) => (v: string) => setPasswordForm(f => ({ ...f, [k]: v }));

  const handleContactSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactFeedback(null);
    try {
      const { data } = await api.put<UserDTO>("/employee/profile", {
        nom:       contactForm.nom.trim(),
        prenom:    contactForm.prenom.trim(),
        email:     contactForm.email.trim(),
        telephone: contactForm.telephone.trim(),
      });
      setProfile(data);
      setContactFeedback({ type: "success", message: "Profile updated successfully!" });
      setTimeout(() => setContactFeedback(null), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update profile.";
      setContactFeedback({ type: "error", message: typeof msg === "string" ? msg : "Failed to update profile." });
    } finally {
      setContactLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: "error", message: "New passwords do not match." });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordFeedback({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put("/employee/profile", {
        currentPassword: passwordForm.currentPassword,
        newPassword:     passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordFeedback({ type: "success", message: "Password changed successfully!" });
      setTimeout(() => setPasswordFeedback(null), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to change password.";
      setPasswordFeedback({ type: "error", message: typeof msg === "string" ? msg : "Failed to change password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const passwordValid =
    passwordForm.currentPassword &&
    passwordForm.newPassword &&
    passwordForm.confirmPassword &&
    passwordForm.newPassword === passwordForm.confirmPassword &&
    passwordForm.newPassword.length >= 8;

  const passwordInputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 40px 10px 14px",
    background: "var(--bg)", border: "1px solid var(--border)",
    borderRadius: 8, color: "var(--tp)",
    fontFamily: "var(--mono)", fontSize: 13, outline: "none",
  };

  const toggleBtnStyle: React.CSSProperties = {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", color: "var(--tm)",
    cursor: "pointer", fontSize: 13, transition: "color 0.2s",
  };

  return (
    <EmployeeLayout currentPage="profile">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="emp-page-eyebrow">// Account</div>
        <div className="emp-page-title">My Profile</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>
          Manage your contact information and security settings
        </div>
      </div>

      {loading && <div className="emp-loading"><div className="emp-spinner" /></div>}
      {error   && <div className="emp-error">✕ {error}</div>}

      {!loading && profile && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
          animation: "fadeUp 0.35s ease both",
        }}>

          {/* ── LEFT: Identity + change password ── */}
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 24 }}>

            {/* Identity card */}
            <SectionCard eyebrow="// Identity" title="Employee Info">

              {/* Avatar + name badge */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", marginBottom: 20,
                background: "rgba(0,255,210,0.05)",
                border: "1px solid rgba(0,255,210,0.12)", borderRadius: 10,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "rgba(0,255,210,0.12)",
                  border: "1px solid rgba(0,255,210,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--display)", fontSize: 18, fontWeight: 800,
                  color: "var(--accent)",
                }}>
                  {(profile.prenom?.[0] ?? profile.code[0]).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, color: "var(--tp)" }}>
                    {profile.prenom} {profile.nom}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)" }}>
                    {profile.code}
                    {profile.createdAt && (
                      <span style={{ marginLeft: 8, color: "var(--tm)" }}>
                        · since {new Date(profile.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
                {profile.specialite && (
                  <div style={{
                    marginLeft: "auto", padding: "3px 10px",
                    background: "rgba(0,255,210,0.08)",
                    border: "1px solid rgba(0,255,210,0.2)",
                    borderRadius: 20, fontFamily: "var(--mono)",
                    fontSize: 10, color: "var(--accent)",
                  }}>
                    {profile.specialite}
                  </div>
                )}
              </div>

              <Field label="Employee code" value={profile.code}            locked />
              <Field label="Speciality"    value={profile.specialite ?? "—"} locked />

              {/* Account details */}
              <div style={{
                marginTop: 8, padding: "14px 16px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10,
              }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 10 }}>
                  Account details
                </div>
                {[
                  { label: "Role",   value: "Employee" },
                  { label: "Code",   value: profile.code },
                  { label: "Joined", value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)" }}>{item.label}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Change password */}
            <SectionCard eyebrow="// Security" title="Change Password">
              <form onSubmit={handlePasswordSave} noValidate>
                {passwordFeedback && <Feedback type={passwordFeedback.type} message={passwordFeedback.message} />}

                {/* Current password */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7 }}>
                    Current password<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input type={showCurrent ? "text" : "password"} value={passwordForm.currentPassword} onChange={e => setPassword("currentPassword")(e.target.value)} placeholder="Enter current password" style={passwordInputStyle}
                      onFocus={e => { e.target.style.borderColor = "rgba(0,255,210,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,255,210,0.07)"; }}
                      onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                    />
                    <button type="button" style={toggleBtnStyle} onClick={() => setShowCurrent(s => !s)}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--tm)"}
                    >{showCurrent ? "◉" : "◎"}</button>
                  </div>
                </div>

                {/* New password */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7 }}>
                    New password<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input type={showNew ? "text" : "password"} value={passwordForm.newPassword} onChange={e => setPassword("newPassword")(e.target.value)} placeholder="Min. 8 characters" style={passwordInputStyle}
                      onFocus={e => { e.target.style.borderColor = "rgba(0,255,210,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,255,210,0.07)"; }}
                      onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                    />
                    <button type="button" style={toggleBtnStyle} onClick={() => setShowNew(s => !s)}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--tm)"}
                    >{showNew ? "◉" : "◎"}</button>
                  </div>
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7 }}>
                    Confirm new password<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={e => setPassword("confirmPassword")(e.target.value)}
                      placeholder="Repeat new password"
                      style={{
                        ...passwordInputStyle,
                        borderColor: passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword
                          ? "rgba(255,77,109,0.5)" : "var(--border)",
                      }}
                      onFocus={e => { e.target.style.borderColor = "rgba(0,255,210,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,255,210,0.07)"; }}
                      onBlur={e => {
                        e.target.style.borderColor = passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword ? "rgba(255,77,109,0.5)" : "var(--border)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                    <button type="button" style={toggleBtnStyle} onClick={() => setShowConfirm(s => !s)}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--tm)"}
                    >{showConfirm ? "◉" : "◎"}</button>
                  </div>
                  {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#ff4d6d", marginTop: 6 }}>✕ Passwords do not match</div>
                  )}
                  {passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword && (
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#10b981", marginTop: 6 }}>✓ Passwords match</div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!passwordValid || passwordLoading}
                  style={{
                    width: "100%", padding: "11px",
                    background: "rgba(0,255,210,0.08)",
                    border: "1px solid rgba(0,255,210,0.25)",
                    borderRadius: 8, color: "var(--accent)",
                    fontFamily: "var(--display)", fontSize: 13, fontWeight: 700,
                    cursor: passwordValid && !passwordLoading ? "pointer" : "not-allowed",
                    opacity: passwordValid && !passwordLoading ? 1 : 0.5,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { if (passwordValid && !passwordLoading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,210,0.15)"; }}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,210,0.08)"}
                >
                  {passwordLoading ? "Saving..." : "Change Password →"}
                </button>
              </form>
            </SectionCard>
          </div>

          {/* ── RIGHT: Contact info form ── */}
          <div>
            <SectionCard eyebrow="// Contact" title="Contact Information">
              <form onSubmit={handleContactSave} noValidate>
                {contactFeedback && <Feedback type={contactFeedback.type} message={contactFeedback.message} />}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                  <Field label="Last name"  value={contactForm.nom}    onChange={setContact("nom")}    placeholder="Dupont" />
                  <Field label="First name" value={contactForm.prenom} onChange={setContact("prenom")} placeholder="Marc"   />
                </div>

                <Field
                  label="Email address"
                  value={contactForm.email}
                  onChange={setContact("email")}
                  placeholder="marc@company.com"
                  type="email"
                />

                <Field
                  label="Phone number"
                  value={contactForm.telephone}
                  onChange={v => setContact("telephone")(v.replace(/[^\d\s\+\-\(\)]/g, ""))}
                  placeholder="+33 6 12 34 56 78"
                  type="tel"
                  required={false}
                />

                <div style={{ marginTop: 8 }}>
                  <button
                    type="submit"
                    disabled={contactLoading}
                    style={{
                      width: "100%", padding: "11px",
                      background: "var(--accent)", color: "#0a0c0f",
                      border: "none", borderRadius: 8,
                      fontFamily: "var(--display)", fontSize: 13, fontWeight: 700,
                      cursor: contactLoading ? "not-allowed" : "pointer",
                      opacity: contactLoading ? 0.6 : 1,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { if (!contactLoading) (e.currentTarget as HTMLButtonElement).style.background = "#00ffe5"; }}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"}
                  >
                    {contactLoading ? "Saving..." : "Save Changes →"}
                  </button>
                </div>
              </form>
            </SectionCard>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
}
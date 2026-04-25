import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import ClientLayout from "./ClientLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceDTO {
  id: number;
  nom: string;
  description: string | null;
  type: string | null;
  prix: number;
}

// ─── Service type colors (same as ManageServices) ─────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  "Offensive Security": { bg: "rgba(255,77,109,0.1)",  color: "#ff4d6d" },
  "Assessment":         { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b" },
  "Audit":              { bg: "rgba(99,102,241,0.1)",  color: "#818cf8" },
  "Emergency":          { bg: "rgba(239,68,68,0.1)",   color: "#ef4444" },
  "Training":           { bg: "rgba(16,185,129,0.1)",  color: "#10b981" },
  "Consulting":         { bg: "rgba(0,255,210,0.1)",   color: "#00ffd2" },
  "Monitoring":         { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6" },
};

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const c = TYPE_COLORS[type] ?? { bg: "rgba(255,255,255,0.06)", color: "var(--ts)" };
  return (
    <span style={{
      fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
      padding: "3px 10px", borderRadius: 20,
      background: c.bg, color: c.color,
      letterSpacing: "0.05em", whiteSpace: "nowrap" as const,
    }}>
      {type}
    </span>
  );
}

// ─── Priority option ──────────────────────────────────────────────────────────
const PRIORITIES = [
  { value: "LOW",    label: "Low",    icon: "▽", color: "#10b981", desc: "Not urgent, can wait"         },
  { value: "MEDIUM", label: "Medium", icon: "◇", color: "#f59e0b", desc: "Moderate urgency"             },
  { value: "HIGH",   label: "High",   icon: "▲", color: "#ff4d6d", desc: "Urgent, needs quick response" },
];

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const steps = ["Select Services", "Request Details", "Review & Submit"];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: `1.5px solid ${i <= step ? "var(--accent)" : "var(--border)"}`,
              background: i < step ? "var(--accent)" : i === step ? "rgba(0,255,210,0.12)" : "var(--card2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontFamily: "var(--mono)", fontWeight: 600,
              color: i < step ? "#0a0c0f" : i === step ? "var(--accent)" : "var(--tm)",
              transition: "all 0.3s",
              boxShadow: i === step ? "0 0 12px rgba(0,255,210,0.25)" : "none",
            }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 10, fontFamily: "var(--mono)", letterSpacing: "0.06em",
              textTransform: "uppercase" as const, whiteSpace: "nowrap" as const,
              color: i === step ? "var(--accent)" : i < step ? "var(--adim)" : "var(--tm)",
            }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 1, margin: "0 8px", marginBottom: 22,
              background: i < step ? "var(--accent)" : "var(--border)",
              transition: "background 0.4s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main CreateRequest ───────────────────────────────────────────────────────
export default function CreateRequest() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Form state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [deadline, setDeadline] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch services catalog
  useEffect(() => {
    api.get<ServiceDTO[]>("/services")
      .then(({ data }) => setServices(data))
      .catch(() => setServicesError("Failed to load services."))
      .finally(() => setServicesLoading(false));
  }, []);

  // Toggle service selection
  const toggleService = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Filtered services
  const filteredServices = typeFilter === "ALL"
    ? services
    : services.filter(s => s.type === typeFilter);

  // Unique types from services
  const types = ["ALL", ...Array.from(new Set(services.map(s => s.type).filter(Boolean))) as string[]];

  // Selected service objects
  const selectedServices = services.filter(s => selectedIds.includes(s.id));

  // Total price
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.prix, 0);

  // Validation per step
  const stepValid = [
    selectedIds.length > 0,
    description.trim().length > 0,
    true, // review step always valid
  ];

  const handleNext = () => {
    if (step < 2 && stepValid[step]) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post("/client/requests", {
        description: description.trim(),
        priorite: priority,
        dateLimite: deadline || null,
        serviceIds: selectedIds,
      });
      navigate("/client/requests");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        "Failed to submit request. Please try again.";
      setSubmitError(typeof msg === "string" ? msg : "Submission failed.");
      setSubmitting(false);
    }
  };

  return (
    <ClientLayout currentPage="create-request">
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .srv-card { transition: all 0.2s !important; cursor: pointer; }
        .srv-card:hover { transform: translateY(-2px) !important; }
        .pri-btn { transition: all 0.2s !important; cursor: pointer; }
        .pri-btn:hover { transform: translateY(-1px) !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div className="cl-page-eyebrow">// New Security Request</div>
        <div className="cl-page-title">Create a Request</div>
        <div className="cl-page-sub">
          Select the services you need, describe your situation and submit — our team will be in touch.
        </div>
      </div>

      {/* ── Step indicator ── */}
      <StepIndicator step={step} />

      {/* ════════════════════════════════════
          STEP 1 — Select services
      ════════════════════════════════════ */}
      {step === 0 && (
        <>
          {/* Type filter */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 20 }}>
            {types.map(t => {
              const c = t === "ALL" ? { color: "var(--accent)", bg: "rgba(0,255,210,0.1)" } : (TYPE_COLORS[t] ?? { color: "var(--ts)", bg: "transparent" });
              const active = typeFilter === t;
              return (
                <button key={t} onClick={() => setTypeFilter(t)} style={{
                  padding: "6px 14px", borderRadius: 20, border: active ? `1px solid ${c.color}50` : "1px solid var(--border)",
                  background: active ? c.bg : "transparent",
                  color: active ? c.color : "var(--ts)",
                  fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer",
                  transition: "all 0.2s", fontWeight: active ? 600 : 400,
                }}>
                  {t}
                </button>
              );
            })}
          </div>

          {/* Selected summary */}
          {selectedIds.length > 0 && (
            <div style={{
              padding: "12px 18px", marginBottom: 20,
              background: "rgba(0,255,210,0.06)", border: "1px solid rgba(0,255,210,0.2)",
              borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)" }}>
                ✓ {selectedIds.length} service{selectedIds.length > 1 ? "s" : ""} selected
              </div>
              <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                Total: €{totalPrice.toLocaleString("en", { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}

          {servicesLoading && (
            <div className="cl-loading"><div className="cl-spinner" /></div>
          )}

          {servicesError && (
            <div className="cl-error">✕ {servicesError}</div>
          )}

          {/* Services grid */}
          {!servicesLoading && !servicesError && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 32 }}>
              {filteredServices.map((service, i) => {
                const selected = selectedIds.includes(service.id);
                return (
                  <div
                    key={service.id}
                    className="srv-card"
                    onClick={() => toggleService(service.id)}
                    style={{
                      background: selected
                        ? "linear-gradient(135deg, rgba(0,255,210,0.1) 0%, rgba(0,255,210,0.04) 100%)"
                        : "var(--card)",
                      border: selected ? "1.5px solid rgba(0,255,210,0.4)" : "1px solid var(--border)",
                      borderRadius: 14, padding: "20px",
                      animation: `fadeUp 0.3s ease ${i * 40}ms both`,
                      position: "relative" as const,
                      boxShadow: selected ? "0 0 24px rgba(0,255,210,0.08)" : "none",
                    }}
                  >
                    {/* Selected check */}
                    {selected && (
                      <div style={{
                        position: "absolute", top: 14, right: 14,
                        width: 22, height: 22, borderRadius: "50%",
                        background: "var(--accent)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: "#0a0c0f", fontWeight: 700,
                      }}>✓</div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <TypeBadge type={service.type} />
                      <span style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 800, color: selected ? "var(--accent)" : "var(--tp)", letterSpacing: "-0.02em" }}>
                        €{service.prix.toLocaleString("en", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div style={{ fontFamily: "var(--display)", fontSize: 15, fontWeight: 700, color: "var(--tp)", marginBottom: 8 }}>
                      {service.nom}
                    </div>

                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)", lineHeight: 1.6 }}>
                      {service.description ?? "No description available."}
                    </div>
                  </div>
                );
              })}

              {filteredServices.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center" as const, padding: "48px 24px", fontFamily: "var(--mono)", fontSize: 13, color: "var(--ts)" }}>
                  No services found in this category.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════
          STEP 2 — Request details
      ════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ maxWidth: 640 }}>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>
              Description<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your security need in detail. What systems are involved? What do you want to achieve? Any specific concerns?"
              rows={6}
              style={{
                width: "100%", padding: "14px",
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 10, color: "var(--tp)",
                fontFamily: "var(--mono)", fontSize: 13, outline: "none",
                resize: "vertical" as const, lineHeight: 1.7,
                transition: "border-color 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.5)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", marginTop: 6 }}>
              {description.length} characters — be as detailed as possible
            </div>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>
              Priority<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {PRIORITIES.map(p => {
                const selected = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    className="pri-btn"
                    onClick={() => setPriority(p.value)}
                    style={{
                      flex: 1, padding: "16px 12px",
                      background: selected ? `${p.color}15` : "var(--card)",
                      border: selected ? `1.5px solid ${p.color}60` : "1px solid var(--border)",
                      borderRadius: 10, textAlign: "center" as const,
                      boxShadow: selected ? `0 0 16px ${p.color}20` : "none",
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 6, color: p.color }}>{p.icon}</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, color: selected ? p.color : "var(--tp)", marginBottom: 4 }}>
                      {p.label}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)" }}>
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deadline */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>
              Deadline <span style={{ color: "var(--tm)", fontWeight: 400, letterSpacing: 0, textTransform: "none" as const }}>(optional)</span>
            </div>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              style={{
                padding: "11px 14px", width: "100%", maxWidth: 260,
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--tp)",
                fontFamily: "var(--mono)", fontSize: 13, outline: "none",
                colorScheme: "dark",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.5)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          STEP 3 — Review & submit
      ════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ maxWidth: 640 }}>

          {/* Selected services */}
          <div className="cl-section-label">Selected services</div>
          <div style={{ marginBottom: 24 }}>
            {selectedServices.map(s => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", marginBottom: 8,
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <TypeBadge type={s.type} />
                  <span style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 600, color: "var(--tp)" }}>{s.nom}</span>
                </div>
                <span style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                  €{s.prix.toLocaleString("en", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}

            {/* Total */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 16px",
              background: "rgba(0,255,210,0.06)", border: "1px solid rgba(0,255,210,0.2)",
              borderRadius: 10, marginTop: 4,
            }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                Total estimate
              </span>
              <span style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>
                €{totalPrice.toLocaleString("en", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Request details */}
          <div className="cl-section-label">Request details</div>
          <div className="cl-card" style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Description</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--tp)", lineHeight: 1.7 }}>{description}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Priority</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 700, color: PRIORITIES.find(p => p.value === priority)?.color ?? "var(--tp)" }}>
                  {PRIORITIES.find(p => p.value === priority)?.label ?? priority}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>Deadline</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: deadline ? "var(--tp)" : "var(--tm)" }}>
                  {deadline ? new Date(deadline).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "No deadline set"}
                </div>
              </div>
            </div>
          </div>

          {/* Info note */}
          <div style={{
            padding: "14px 16px", marginBottom: 20,
            background: "rgba(0,255,210,0.05)", border: "1px solid rgba(0,255,210,0.15)",
            borderRadius: 10, display: "flex", gap: 10,
          }}>
            <span style={{ color: "var(--accent)", fontSize: 14, flexShrink: 0 }}>ℹ</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", lineHeight: 1.6 }}>
              Your request will be submitted as <strong style={{ color: "var(--tp)" }}>PENDING</strong>. Our admin team will review it, break it into tasks and assign specialists. You will be able to track progress from your dashboard.
            </span>
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="cl-error" style={{ marginBottom: 16 }}>✕ {submitError}</div>
          )}
        </div>
      )}

      {/* ── Navigation buttons ── */}
      <div style={{ display: "flex", gap: 12, marginTop: 8, maxWidth: 640 }}>
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            style={{
              padding: "12px 24px", background: "transparent",
              border: "1px solid var(--border)", borderRadius: 10,
              color: "var(--ts)", fontFamily: "var(--display)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,210,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--tp)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ts)"; }}
          >
            ← Back
          </button>
        )}

        {step < 2 && (
          <button
            type="button"
            onClick={handleNext}
            disabled={!stepValid[step]}
            style={{
              flex: 1, padding: "12px 24px",
              background: stepValid[step] ? "var(--accent)" : "rgba(0,255,210,0.2)",
              color: stepValid[step] ? "#0a0c0f" : "rgba(0,255,210,0.4)",
              border: "none", borderRadius: 10,
              fontFamily: "var(--display)", fontSize: 13, fontWeight: 700,
              cursor: stepValid[step] ? "pointer" : "not-allowed",
              letterSpacing: "0.04em", transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (stepValid[step]) { (e.currentTarget as HTMLButtonElement).style.background = "#00ffe5"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(0,255,210,0.3)"; } }}
            onMouseLeave={e => { if (stepValid[step]) { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; } }}
          >
            {step === 0 ? `Continue with ${selectedIds.length} service${selectedIds.length !== 1 ? "s" : ""} →` : "Review Request →"}
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 1, padding: "12px 24px",
              background: "var(--accent)", color: "#0a0c0f",
              border: "none", borderRadius: 10,
              fontFamily: "var(--display)", fontSize: 13, fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              letterSpacing: "0.04em", opacity: submitting ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!submitting) { (e.currentTarget as HTMLButtonElement).style.background = "#00ffe5"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(0,255,210,0.3)"; } }}
            onMouseLeave={e => { if (!submitting) { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; } }}
          >
            {submitting ? (
              <><div style={{ width: 15, height: 15, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#0a0c0f", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Submitting...</>
            ) : (
              <>Submit Request ✓</>
            )}
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </ClientLayout>
  );
}
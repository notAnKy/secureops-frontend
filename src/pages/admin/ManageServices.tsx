import { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import AdminLayout from "./AdminLayout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceDTO {
  id: number;
  nom: string;
  description: string | null;
  type: string | null;
  prix: number;
  createdAt: string | null;
}

interface ServiceForm {
  nom: string;
  description: string;
  type: string;
  prix: string;
}

const EMPTY_FORM: ServiceForm = {
  nom: "", description: "", type: "", prix: "",
};

// ─── Fixed service types ──────────────────────────────────────────────────────
const SERVICE_TYPES = [
  "Offensive Security",
  "Assessment",
  "Audit",
  "Emergency",
  "Training",
  "Consulting",
  "Monitoring",
];

// ─── Type badge ───────────────────────────────────────────────────────────────
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
  if (!type) return <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)" }}>—</span>;
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

// ─── Confirm delete modal — with usage warning ────────────────────────────────
function ConfirmModal({
  service, onConfirm, onCancel, loading,
}: {
  service: ServiceDTO; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    api.get<number>(`/admin/services/${service.id}/usage`)
      .then(({ data }) => setUsageCount(data))
      .catch(() => setUsageCount(0))
      .finally(() => setUsageLoading(false));
  }, [service.id]);

  const isInUse = usageCount !== null && usageCount > 0;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "var(--card)",
        border: `1px solid ${isInUse ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
        borderRadius: 16, padding: 32, width: "100%", maxWidth: 420,
        animation: "fadeUp 0.2s ease",
      }}>
        <div style={{ fontSize: 28, marginBottom: 16 }}>
          {isInUse ? "⚠️" : "🗑️"}
        </div>

        <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--tp)", marginBottom: 8 }}>
          Delete service?
        </div>

        <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", lineHeight: 1.6, marginBottom: 16 }}>
          You are about to delete <strong style={{ color: "var(--tp)" }}>{service.nom}</strong>.
          This cannot be undone.
        </div>

        {/* Usage loading */}
        {usageLoading && (
          <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 20, fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)" }}>
            Checking usage...
          </div>
        )}

        {/* In use warning */}
        {!usageLoading && isInUse && (
          <div style={{
            padding: "14px 16px", marginBottom: 20,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#f59e0b", lineHeight: 1.6 }}>
              This service is currently used in{" "}
              <strong>{usageCount} request{usageCount! > 1 ? "s" : ""}</strong>.
              Deleting it will remove it from those requests — the requests themselves will remain intact.
            </div>
          </div>
        )}

        {/* No issues */}
        {!usageLoading && !isInUse && (
          <div style={{
            padding: "12px 14px", marginBottom: 20,
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 8, display: "flex", gap: 8, alignItems: "center",
          }}>
            <span style={{ fontSize: 13 }}>✓</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#10b981" }}>
              This service is not used in any requests.
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: 10, background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || usageLoading}
            style={{
              flex: 1, padding: 10,
              background: isInUse ? "rgba(245,158,11,0.15)" : "rgba(255,77,109,0.12)",
              border: `1px solid ${isInUse ? "rgba(245,158,11,0.4)" : "rgba(255,77,109,0.3)"}`,
              borderRadius: 8,
              color: isInUse ? "#f59e0b" : "#ff4d6d",
              fontFamily: "var(--mono)", fontSize: 12,
              cursor: loading || usageLoading ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity: loading || usageLoading ? 0.6 : 1,
            }}
          >
            {loading ? "Deleting..." : isInUse ? "Delete anyway" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Service form panel (create & edit) — UNCHANGED ──────────────────────────
function ServiceFormPanel({
  mode, initial, onClose, onSuccess,
}: {
  mode: "create" | "edit";
  initial?: ServiceDTO;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<ServiceForm>(
    initial
      ? { nom: initial.nom, description: initial.description ?? "", type: initial.type ?? "", prix: String(initial.prix) }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = (k: keyof ServiceForm) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.nom.trim() && form.type && form.prix && Number(form.prix) >= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    const payload = {
      nom: form.nom.trim(),
      description: form.description.trim() || null,
      type: form.type,
      prix: parseFloat(form.prix),
    };
    try {
      if (mode === "create") {
        await api.post("/admin/services", payload);
      } else {
        await api.put(`/admin/services/${initial!.id}`, payload);
      }
      setSuccess(true);
      onSuccess();
      setTimeout(() => { setSuccess(false); onClose(); }, 1400);
    } catch (err: any) {
      const msg = err.response?.data?.message || (typeof err.response?.data === "string" ? err.response.data : null) || "Operation failed.";
      setError(typeof msg === "string" ? msg : "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 480, background: "var(--card)", borderLeft: "1px solid var(--border)", height: "100%", overflowY: "auto", padding: "32px 28px", animation: "slideInRight 0.25s cubic-bezier(0.22,1,0.36,1)" }}>
        <style>{`@keyframes slideInRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}`}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 4 }}>
              // {mode === "create" ? "New Service" : "Edit Service"}
            </div>
            <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--tp)" }}>
              {mode === "create" ? "Add Service" : "Update Service"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ts)", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7 }}>
              Service name<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>
            </div>
            <input type="text" value={form.nom} onChange={e => set("nom")(e.target.value)} placeholder="e.g. Penetration Testing" style={{ width: "100%", padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--tp)", fontFamily: "var(--mono)", fontSize: 13, outline: "none" }} onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.6)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7 }}>
              Type<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {SERVICE_TYPES.map(t => {
                const c = TYPE_COLORS[t] ?? { bg: "rgba(255,255,255,0.06)", color: "var(--ts)" };
                const selected = form.type === t;
                return (
                  <button key={t} type="button" onClick={() => set("type")(t)} style={{ padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11, fontWeight: selected ? 600 : 400, background: selected ? c.bg : "transparent", color: selected ? c.color : "var(--ts)", border: selected ? `1px solid ${c.color}40` : "1px solid var(--border)", transition: "all 0.2s" }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7 }}>
              Price (€)<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--mono)", fontSize: 13, color: "var(--ts)" }}>€</span>
              <input type="number" min="0" step="0.01" value={form.prix} onChange={e => set("prix")(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "10px 14px 10px 28px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--tp)", fontFamily: "var(--mono)", fontSize: 13, outline: "none" }} onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.6)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7 }}>
              Description <span style={{ color: "var(--tm)", fontWeight: 400, textTransform: "none" as const, letterSpacing: 0 }}>(optional)</span>
            </div>
            <textarea value={form.description} onChange={e => set("description")(e.target.value)} placeholder="Describe what this service includes..." rows={4} style={{ width: "100%", padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--tp)", fontFamily: "var(--mono)", fontSize: 13, outline: "none", resize: "vertical" as const, lineHeight: 1.6 }} onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.6)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          {error && <div style={{ padding: "10px 14px", background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.25)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)", marginBottom: 16, display: "flex", gap: 8 }}><span>✕</span><span>{error}</span></div>}
          {success && <div style={{ padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12, color: "#10b981", marginBottom: 16, display: "flex", gap: 8 }}><span>✓</span><span>{mode === "create" ? "Service created!" : "Service updated!"}</span></div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 11, background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={!valid || loading} style={{ flex: 2, padding: 11, background: "var(--accent)", color: "#0a0c0f", border: "none", borderRadius: 8, fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", opacity: (!valid || loading) ? 0.55 : 1, transition: "opacity 0.2s" }}>
              {loading ? "Saving..." : mode === "create" ? "Create Service →" : "Save Changes →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main ManageServices — UNCHANGED ─────────────────────────────────────────
export default function ManageServices() {
  const [services, setServices] = useState<ServiceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<ServiceDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ServiceDTO[]>("/admin/services");
      setServices(data);
    } catch {
      setError("Failed to load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const filtered = useMemo(() => {
    let list = services;
    if (typeFilter !== "ALL") list = list.filter(s => s.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.nom.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q) ||
        (s.type ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [services, typeFilter, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/services/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchServices();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete service.";
      setError(typeof msg === "string" ? msg : "Failed to delete service.");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalValue = services.reduce((sum, s) => sum + s.prix, 0);

  return (
    <AdminLayout currentPage="services">
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .ms-card:hover { border-color: rgba(0,255,210,0.25) !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .ms-card { transition: all 0.2s !important; }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap" as const, gap: 16 }}>
        <div>
          <div className="adm-page-eyebrow">// Service Catalog</div>
          <div className="adm-page-title">Manage Services</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>
            {services.length} service{services.length !== 1 ? "s" : ""} · Total catalog value: <span style={{ color: "var(--accent)" }}>€{totalValue.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "var(--accent)", color: "#0a0c0f", border: "none", borderRadius: 10, fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.03em", transition: "all 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#00ffe5"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(0,255,210,0.3)"; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
          <span style={{ fontSize: 16 }}>+</span> Add Service
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap" as const, gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
          <button onClick={() => setTypeFilter("ALL")} style={{ padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11, background: typeFilter === "ALL" ? "rgba(0,255,210,0.12)" : "transparent", color: typeFilter === "ALL" ? "var(--accent)" : "var(--ts)", border: typeFilter === "ALL" ? "1px solid rgba(0,255,210,0.3)" : "1px solid var(--border)", transition: "all 0.2s" }}>
            All <span style={{ opacity: 0.6, marginLeft: 4 }}>{services.length}</span>
          </button>
          {SERVICE_TYPES.map(t => {
            const c = TYPE_COLORS[t] ?? { bg: "transparent", color: "var(--ts)" };
            const count = services.filter(s => s.type === t).length;
            const active = typeFilter === t;
            return (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11, background: active ? c.bg : "transparent", color: active ? c.color : "var(--ts)", border: active ? `1px solid ${c.color}40` : "1px solid var(--border)", transition: "all 0.2s" }}>
                {t} <span style={{ opacity: 0.6, marginLeft: 4 }}>{count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tm)", fontSize: 13 }}>⌕</span>
          <input type="text" placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "9px 14px 9px 34px", width: 240, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--tp)", fontFamily: "var(--mono)", fontSize: 12, outline: "none" }} onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.4)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
        </div>
      </div>

      {error && <div className="adm-error" style={{ marginBottom: 16 }}>✕ {error}</div>}
      {loading && <div className="adm-loading"><div className="adm-spinner" /><span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>Loading services...</span></div>}

      {!loading && (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center" as const, padding: "64px 24px", fontFamily: "var(--mono)", fontSize: 13, color: "var(--ts)" }}>
              No services found{search ? ` matching "${search}"` : typeFilter !== "ALL" ? ` in ${typeFilter}` : ""}.<br />
              <span style={{ fontSize: 11, color: "var(--tm)", marginTop: 6, display: "block" }}>Click "Add Service" to create your first one.</span>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {filtered.map((service, i) => (
                <div key={service.id} className="ms-card" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "24px", animation: `fadeUp 0.35s ease ${i * 50}ms both`, position: "relative" as const, overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -16, right: -16, width: 64, height: 64, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,210,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <TypeBadge type={service.type} />
                    <span style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.02em" }}>
                      €{service.prix.toLocaleString("en", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div style={{ fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: "var(--tp)", marginBottom: 8, letterSpacing: "-0.01em" }}>{service.nom}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", lineHeight: 1.6, marginBottom: 20, minHeight: 36 }}>
                    {service.description ?? <span style={{ color: "var(--tm)" }}>No description provided.</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)" }}>
                      {service.createdAt ? new Date(service.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditTarget(service)} style={{ padding: "5px 12px", background: "rgba(0,255,210,0.07)", border: "1px solid rgba(0,255,210,0.2)", borderRadius: 6, color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,210,0.14)"} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,210,0.07)"}>Edit</button>
                      <button onClick={() => setDeleteTarget(service)} style={{ padding: "5px 12px", background: "rgba(255,77,109,0.07)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: 6, color: "#ff4d6d", fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,109,0.14)"} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,109,0.07)"}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showCreate && <ServiceFormPanel mode="create" onClose={() => setShowCreate(false)} onSuccess={fetchServices} />}
      {editTarget && <ServiceFormPanel mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onSuccess={fetchServices} />}
      {deleteTarget && <ConfirmModal service={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
    </AdminLayout>
  );
}
import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import api from "@/services/api";
import AdminLayout from "./AdminLayout";
import { useToast, ToastContainer } from "@/components/Toast";

const PAGE_SIZE = 15;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ServiceDTO {
  id: number;
  nom: string;
  type: string | null;
  prix: number;
}

interface DemandeDTO {
  idDemande: number;
  description: string | null;
  etat: string | null;
  priorite: string | null;
  dateSoumission: string | null;
  dateLimite: string | null;
  clientCode: string | null;
  clientRaisonSociale: string | null;
  services: ServiceDTO[];
}

interface PagedResponse {
  content: DemandeDTO[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  PENDING:     { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Pending",     icon: "⏳" },
  IN_PROGRESS: { color: "#00ffd2", bg: "rgba(0,255,210,0.1)",   label: "In Progress", icon: "⚡" },
  COMPLETED:   { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Completed",   icon: "✅" },
  CANCELLED:   { color: "#ff4d6d", bg: "rgba(255,77,109,0.1)",  label: "Cancelled",   icon: "✕"  },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  HIGH:   { color: "#ff4d6d", label: "High"   },
  MEDIUM: { color: "#f59e0b", label: "Medium" },
  LOW:    { color: "#10b981", label: "Low"    },
};

const ALL_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

// ─── Skeleton row — matches the 7-column grid of the requests table ───────────
function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60px 1fr 140px 90px 120px 130px 110px",
        padding: "14px 20px", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        gap: 8,
        animation: `skeletonFadeIn 0.3s ease ${index * 40}ms both`,
      }}
    >
      {/* ID */}
      <div style={{ height: 12, width: 36, borderRadius: 6, background: "rgba(0,255,210,0.1)" }} className="sk-pulse" />
      {/* Client + description */}
      <div>
        <div style={{ height: 12, width: "55%", borderRadius: 6, background: "rgba(255,255,255,0.07)", marginBottom: 7 }} className="sk-pulse" />
        <div style={{ height: 10, width: "80%", borderRadius: 6, background: "rgba(255,255,255,0.04)", marginBottom: 6 }} className="sk-pulse" />
        <div style={{ display: "flex", gap: 4 }}>
          <div style={{ height: 18, width: 56, borderRadius: 20, background: "rgba(255,255,255,0.04)" }} className="sk-pulse" />
          <div style={{ height: 18, width: 48, borderRadius: 20, background: "rgba(255,255,255,0.04)" }} className="sk-pulse" />
        </div>
      </div>
      {/* Date */}
      <div style={{ height: 11, width: "70%", borderRadius: 6, background: "rgba(255,255,255,0.06)" }} className="sk-pulse" />
      {/* Priority */}
      <div style={{ height: 11, width: 44, borderRadius: 6, background: "rgba(255,255,255,0.06)" }} className="sk-pulse" />
      {/* Value */}
      <div style={{ height: 13, width: 64, borderRadius: 6, background: "rgba(255,255,255,0.06)" }} className="sk-pulse" />
      {/* Status badge */}
      <div style={{ height: 26, width: 90, borderRadius: 20, background: "rgba(255,255,255,0.06)" }} className="sk-pulse" />
      {/* Action button */}
      <div style={{ height: 28, width: 72, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginLeft: "auto" }} className="sk-pulse" />
    </div>
  );
}

// ─── Skeleton table ───────────────────────────────────────────────────────────
function SkeletonTable({ rows = PAGE_SIZE }: { rows?: number }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14 }}>
      {/* Header — identical to real table */}
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 140px 90px 120px 130px 110px", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", gap: 8 }}>
        {["ID", "Client / Description", "Submitted", "Priority", "Value", "Status", ""].map(h => (
          <div key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>{h}</div>
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} index={i} />
      ))}
    </div>
  );
}

// ─── Status dropdown ──────────────────────────────────────────────────────────
function StatusDropdown({
  current, requestId, onUpdated, onToast,
}: {
  current: string | null;
  requestId: number;
  onUpdated: (id: number, newStatus: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords]   = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  const handleChange = async (newStatus: string) => {
    if (newStatus === current) { setOpen(false); return; }
    setLoading(true);
    setOpen(false);
    try {
      await api.put(`/admin/requests/${requestId}/status`, { etat: newStatus });
      onUpdated(requestId, newStatus);
      const label = STATUS_CONFIG[newStatus]?.label ?? newStatus;
      onToast(`Request #${requestId} status updated to ${label}`, "success");
    } catch {
      onToast(`Failed to update status for request #${requestId}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [open]);

  const s = STATUS_CONFIG[current ?? ""] ?? {
    color: "var(--ts)", bg: "rgba(255,255,255,0.06)", label: "—", icon: "",
  };

  return (
    <div>
      <button ref={btnRef} onClick={handleOpen} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.color}40`, fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em", opacity: loading ? 0.6 : 1, transition: "all 0.2s", whiteSpace: "nowrap" as const }}>
        {loading ? "..." : <><span>{s.icon}</span> {s.label} <span style={{ fontSize: 8, opacity: 0.7 }}>▼</span></>}
      </button>

      {open && createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div style={{ position: "fixed", top: coords.top, right: coords.right, background: "#131820", border: "1px solid rgba(0,255,210,0.15)", borderRadius: 10, overflow: "hidden", zIndex: 9999, minWidth: 170, boxShadow: "0 12px 32px rgba(0,0,0,0.6)", animation: "fadeUp 0.15s ease" }}>
            {ALL_STATUSES.map(st => {
              const sc = STATUS_CONFIG[st];
              const isActive = st === current;
              return (
                <button key={st} onClick={() => handleChange(st)} style={{ width: "100%", padding: "10px 16px", background: isActive ? sc.bg : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--mono)", fontSize: 12, color: isActive ? sc.color : "#6b7a8d", fontWeight: isActive ? 600 : 400, textAlign: "left" as const, transition: "background 0.15s" }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 13 }}>{sc.icon}</span>
                  {sc.label}
                  {isActive && <span style={{ marginLeft: "auto", fontSize: 11, color: sc.color }}>✓</span>}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ─── Request row ──────────────────────────────────────────────────────────────
function RequestRow({
  request, index, onStatusUpdated, onToast,
}: {
  request: DemandeDTO;
  index: number;
  onStatusUpdated: (id: number, status: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const totalPrice = request.services.reduce((sum, s) => sum + s.prix, 0);
  const priority   = PRIORITY_CONFIG[request.priorite ?? ""];

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "60px 1fr 140px 90px 120px 130px 110px", padding: "14px 20px", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)", animation: `fadeUp 0.3s ease ${index * 30}ms both`, transition: "background 0.15s", gap: 8 }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
    >
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>#{request.idDemande}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 12, fontWeight: 700, color: "var(--tp)", marginBottom: 3 }}>{request.clientRaisonSociale ?? request.clientCode ?? "—"}</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ts)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{request.description ?? "No description"}</div>
        {request.services.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" as const }}>
            {request.services.slice(0, 2).map(s => (
              <span key={s.id} style={{ fontFamily: "var(--mono)", fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--ts)" }}>{s.nom}</span>
            ))}
            {request.services.length > 2 && <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--tm)" }}>+{request.services.length - 2} more</span>}
          </div>
        )}
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)" }}>
        {request.dateSoumission ? new Date(request.dateSoumission).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
      </div>
      <div>
        {priority ? (
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: priority.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: priority.color, display: "inline-block" }} />{priority.label}
          </span>
        ) : <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)" }}>—</span>}
      </div>
      <div style={{ fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, color: totalPrice > 0 ? "var(--accent)" : "var(--tm)" }}>
        {totalPrice > 0 ? `€${totalPrice.toLocaleString("en", { minimumFractionDigits: 2 })}` : "—"}
      </div>
      <div>
        <StatusDropdown current={request.etat} requestId={request.idDemande} onUpdated={onStatusUpdated} onToast={onToast} />
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <Link to={`/admin/requests/${request.idDemande}`} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", textDecoration: "none", padding: "5px 10px", border: "1px solid rgba(0,255,210,0.2)", borderRadius: 6, background: "rgba(0,255,210,0.06)", transition: "all 0.2s", whiteSpace: "nowrap" as const }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,255,210,0.12)"}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,255,210,0.06)"}
        >Details →</Link>
      </div>
    </div>
  );
}

// ─── Main ViewRequests ────────────────────────────────────────────────────────
export default function ViewRequests() {
  const [requests, setRequests]         = useState<DemandeDTO[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch]             = useState("");

  const [currentPage, setCurrentPage]     = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const { toasts, removeToast, toast } = useToast();

  const fetchRequests = async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("size", String(PAGE_SIZE));
      const { data } = await api.get<PagedResponse>(`/admin/requests?${params.toString()}`);
      setRequests(data.content);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
    fetchRequests(0);
  }, [statusFilter]);

  const handleStatusUpdated = (id: number, newStatus: string) => {
    setRequests(prev => prev.map(r => r.idDemande === id ? { ...r, etat: newStatus } : r));
  };

  const handlePageChange = (newPage: number) => {
    setSearch("");
    setCurrentPage(newPage);
    fetchRequests(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter(r =>
      (r.description ?? "").toLowerCase().includes(q) ||
      (r.clientCode ?? "").toLowerCase().includes(q) ||
      (r.clientRaisonSociale ?? "").toLowerCase().includes(q) ||
      String(r.idDemande).includes(q) ||
      r.services.some(s => s.nom.toLowerCase().includes(q))
    );
  }, [requests, search]);

  const filters = [
    { key: "ALL",         label: "All"         },
    { key: "PENDING",     label: "Pending"     },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED",   label: "Completed"   },
    { key: "CANCELLED",   label: "Cancelled"   },
  ];

  const totalValue = requests.reduce((sum, r) => sum + r.services.reduce((s2, s) => s2 + s.prix, 0), 0);
  const from = totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const to   = Math.min((currentPage + 1) * PAGE_SIZE, totalElements);

  return (
    <AdminLayout currentPage="requests">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes skeletonFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes skeletonShimmer {
          0%   { opacity: 0.5; }
          50%  { opacity: 1; }
          100% { opacity: 0.5; }
        }
        .sk-pulse { animation: skeletonShimmer 1.6s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap" as const, gap: 16 }}>
        <div>
          <div className="adm-page-eyebrow">// All Requests</div>
          <div className="adm-page-title">View Requests</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>
            {totalElements > 0 ? `${totalElements} total · ` : ""}Total value:{" "}
            <span style={{ color: "var(--accent)" }}>€{totalValue.toLocaleString("en", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Filter tabs + Search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap" as const, gap: 12 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, flexWrap: "wrap" as const }}>
          {filters.map(f => {
            const active = statusFilter === f.key;
            const sc = STATUS_CONFIG[f.key];
            return (
              <button key={f.key} onClick={() => setStatusFilter(f.key)} style={{ padding: "7px 14px", border: "none", borderRadius: 7, background: active ? (sc ? sc.bg : "rgba(0,255,210,0.1)") : "transparent", color: active ? (sc ? sc.color : "var(--accent)") : "var(--ts)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: active ? 600 : 400, cursor: "pointer", transition: "all 0.2s", outline: active ? `1px solid ${sc ? sc.color + "40" : "rgba(0,255,210,0.25)"}` : "none" }}>
                {f.label}
              </button>
            );
          })}
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tm)", fontSize: 13 }}>⌕</span>
          <input type="text" placeholder="Search by client, description..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "9px 14px 9px 34px", width: 280, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--tp)", fontFamily: "var(--mono)", fontSize: 12, outline: "none" }} onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.4)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
        </div>
      </div>

      {error && <div className="adm-error">✕ {error}</div>}

      {/* ── Skeleton while loading ── */}
      {loading && <SkeletonTable rows={8} />}

      {/* ── Real table once loaded ── */}
      {!loading && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 140px 90px 120px 130px 110px", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", gap: 8 }}>
            {["ID", "Client / Description", "Submitted", "Priority", "Value", "Status", ""].map(h => (
              <div key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center" as const, fontFamily: "var(--mono)", fontSize: 13, color: "var(--ts)" }}>
              {totalElements === 0 ? "No requests have been submitted yet." : `No requests found${search ? ` matching "${search}"` : ""}.`}
            </div>
          ) : (
            filtered.map((request, i) => (
              <RequestRow key={request.idDemande} request={request} index={i} onStatusUpdated={handleStatusUpdated} onToast={(msg, type) => toast[type](msg)} />
            ))
          )}

          {totalPages > 1 && !search.trim() && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>Showing {from}–{to} of {totalElements} requests</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} style={{ padding: "6px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: currentPage === 0 ? "var(--tm)" : "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, cursor: currentPage === 0 ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: currentPage === 0 ? 0.4 : 1 }} onMouseEnter={e => { if (currentPage !== 0) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,210,0.4)"; }} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"}>← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i).map(p => {
                  const show = p === 0 || p === totalPages - 1 || Math.abs(p - currentPage) <= 1;
                  const showDots = !show && (p === 1 || p === totalPages - 2);
                  if (showDots) return <span key={p} style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--tm)", padding: "0 4px" }}>…</span>;
                  if (!show) return null;
                  const isActive = p === currentPage;
                  return <button key={p} onClick={() => handlePageChange(p)} style={{ minWidth: 34, height: 34, padding: "0 10px", background: isActive ? "rgba(0,255,210,0.12)" : "transparent", border: isActive ? "1px solid rgba(0,255,210,0.35)" : "1px solid var(--border)", borderRadius: 8, color: isActive ? "var(--accent)" : "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, fontWeight: isActive ? 600 : 400, cursor: "pointer", transition: "all 0.2s" }}>{p + 1}</button>;
                })}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} style={{ padding: "6px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: currentPage === totalPages - 1 ? "var(--tm)" : "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: currentPage === totalPages - 1 ? 0.4 : 1 }} onMouseEnter={e => { if (currentPage !== totalPages - 1) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,210,0.4)"; }} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AdminLayout>
  );
}
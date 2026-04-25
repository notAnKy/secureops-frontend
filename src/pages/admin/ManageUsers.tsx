import { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import AdminLayout from "./AdminLayout";

const PAGE_SIZE = 15;

// ─── Types ────────────────────────────────────────────────────────────────────
type RoleFilter = "ALL" | "CLIENT" | "EMPLOYEE" | "ADMIN";

interface UserDTO {
  id: number;
  code: string;
  email: string;
  role: "CLIENT" | "EMPLOYEE" | "ADMIN";
  nom: string | null;
  prenom: string | null;
  telephone: string | null;
  specialite: string | null;
  raisonSociale: string | null;
  siret: string | null;
  createdAt: string | null;
}

interface CreateEmployeeForm {
  code: string;
  motDePasse: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  specialite: string;
}

interface EditEmployeeForm {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialite: string;
  motDePasse: string;
}

interface UserStatsDTO {
  userId: number;
  role: string;
  totalRequests: number;
  activeRequests: number;
  totalTasks: number;
  activeTasks: number;
}

interface PagedResponse {
  content: UserDTO[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
  first: boolean;
  last: boolean;
}

const EMPTY_FORM: CreateEmployeeForm = {
  code: "", motDePasse: "", email: "",
  nom: "", prenom: "", telephone: "", specialite: "",
};

// ─── Skeleton row — matches the 6-column grid of the users table ──────────────
function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.4fr 100px 1fr 120px 140px",
        padding: "14px 20px",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        gap: 8,
        animation: `skeletonFadeIn 0.3s ease ${index * 40}ms both`,
      }}
    >
      {/* Code */}
      <div style={{ height: 13, width: "60%", borderRadius: 6, background: "rgba(255,255,255,0.06)" }} className="sk-pulse" />
      {/* Email */}
      <div style={{ height: 12, width: "75%", borderRadius: 6, background: "rgba(255,255,255,0.06)" }} className="sk-pulse" />
      {/* Role badge */}
      <div style={{ height: 22, width: 64, borderRadius: 20, background: "rgba(255,255,255,0.06)" }} className="sk-pulse" />
      {/* Name */}
      <div>
        <div style={{ height: 12, width: "65%", borderRadius: 6, background: "rgba(255,255,255,0.06)", marginBottom: 6 }} className="sk-pulse" />
        <div style={{ height: 10, width: "40%", borderRadius: 6, background: "rgba(255,255,255,0.04)" }} className="sk-pulse" />
      </div>
      {/* Joined */}
      <div style={{ height: 11, width: "70%", borderRadius: 6, background: "rgba(255,255,255,0.06)" }} className="sk-pulse" />
      {/* Actions */}
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <div style={{ height: 28, width: 44, borderRadius: 6, background: "rgba(255,255,255,0.06)" }} className="sk-pulse" />
        <div style={{ height: 28, width: 52, borderRadius: 6, background: "rgba(255,255,255,0.06)" }} className="sk-pulse" />
      </div>
    </div>
  );
}

// ─── Skeleton table — shown while loading ─────────────────────────────────────
function SkeletonTable({ rows = PAGE_SIZE }: { rows?: number }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      {/* Header — same as real table */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 100px 1fr 120px 140px", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
        {["Code", "Email", "Role", "Name / Company", "Joined", ""].map(h => (
          <div key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
            {h}
          </div>
        ))}
      </div>
      {/* Skeleton rows */}
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} index={i} />
      ))}
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    ADMIN:    { bg: "rgba(0,255,210,0.12)",  color: "#00ffd2", label: "Admin"    },
    EMPLOYEE: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Employee" },
    CLIENT:   { bg: "rgba(99,102,241,0.12)", color: "#818cf8", label: "Client"   },
  };
  const s = styles[role] ?? { bg: "rgba(255,255,255,0.06)", color: "#6b7a8d", label: role };
  return (
    <span style={{
      fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
      padding: "3px 10px", borderRadius: 20,
      background: s.bg, color: s.color,
      letterSpacing: "0.06em", textTransform: "uppercase" as const,
    }}>
      {s.label}
    </span>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────
function Field({
  label, name, value, onChange, type = "text", placeholder, required = true,
}: {
  label: string; name: string; value: string;
  onChange: (v: string) => void; type?: string;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)",
        textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7,
      }}>
        {label}{required && <span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span>}
      </div>
      <input
        type={type} name={name} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px",
          background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 8, color: "var(--tp)",
          fontFamily: "var(--mono)", fontSize: 13, outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={e => {
          e.target.style.borderColor = "rgba(0,255,210,0.6)";
          e.target.style.boxShadow = "0 0 0 3px rgba(0,255,210,0.07)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "var(--border)";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────
function ConfirmModal({
  user, onConfirm, onCancel, loading,
}: {
  user: UserDTO; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  const [stats, setStats] = useState<UserStatsDTO | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    api.get<UserStatsDTO>(`/admin/users/${user.id}/stats`)
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [user.id]);

  const hasActiveData = stats
    ? (user.role === "CLIENT" && stats.activeRequests > 0) ||
      (user.role === "EMPLOYEE" && stats.activeTasks > 0)
    : false;

  const warningMessage = () => {
    if (!stats) return null;
    if (user.role === "CLIENT" && stats.activeRequests > 0)
      return `This client has ${stats.activeRequests} active request${stats.activeRequests > 1 ? "s" : ""} (${stats.totalRequests} total). Deleting will permanently remove all their requests and associated tasks.`;
    if (user.role === "CLIENT" && stats.totalRequests > 0)
      return `This client has ${stats.totalRequests} completed request${stats.totalRequests > 1 ? "s" : ""}. Deleting will permanently remove all their history.`;
    if (user.role === "EMPLOYEE" && stats.activeTasks > 0)
      return `This employee has ${stats.activeTasks} active task${stats.activeTasks > 1 ? "s" : ""} (${stats.totalTasks} total). Deleting will unassign them from all tasks.`;
    if (user.role === "EMPLOYEE" && stats.totalTasks > 0)
      return `This employee has ${stats.totalTasks} completed task${stats.totalTasks > 1 ? "s" : ""}. Deleting will remove them from all task records.`;
    return null;
  };

  const warning = warningMessage();

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "var(--card)",
        border: `1px solid ${hasActiveData ? "rgba(255,77,109,0.3)" : "var(--border)"}`,
        borderRadius: 16, padding: "32px", width: "100%", maxWidth: 440,
        animation: "fadeUp 0.2s ease",
      }}>
        <div style={{ fontSize: 28, marginBottom: 16 }}>{hasActiveData ? "⚠️" : "🗑️"}</div>
        <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: "var(--tp)", marginBottom: 8 }}>
          Delete {user.role === "CLIENT" ? "client" : "employee"}?
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", lineHeight: 1.6, marginBottom: warning ? 16 : 24 }}>
          You are about to delete <strong style={{ color: "var(--tp)" }}>{user.code}</strong>
          {user.raisonSociale ? ` (${user.raisonSociale})` : user.nom ? ` (${user.prenom} ${user.nom})` : ""}.
          This action cannot be undone.
        </div>
        {statsLoading && (
          <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 20, fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)" }}>
            Checking for associated data...
          </div>
        )}
        {!statsLoading && warning && (
          <div style={{ padding: "14px 16px", marginBottom: 20, background: hasActiveData ? "rgba(255,77,109,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${hasActiveData ? "rgba(255,77,109,0.3)" : "rgba(245,158,11,0.3)"}`, borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{hasActiveData ? "🚨" : "ℹ️"}</span>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: hasActiveData ? "#ff4d6d" : "#f59e0b", lineHeight: 1.6 }}>{warning}</div>
          </div>
        )}
        {!statsLoading && !warning && (
          <div style={{ padding: "12px 14px", marginBottom: 20, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13 }}>✓</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#10b981" }}>No active data associated with this user.</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading || statsLoading} style={{ flex: 1, padding: "10px", background: hasActiveData ? "rgba(255,77,109,0.18)" : "rgba(255,77,109,0.12)", border: `1px solid ${hasActiveData ? "rgba(255,77,109,0.5)" : "rgba(255,77,109,0.3)"}`, borderRadius: 8, color: "#ff4d6d", fontFamily: "var(--mono)", fontSize: 12, cursor: loading || statsLoading ? "not-allowed" : "pointer", fontWeight: 600, opacity: loading || statsLoading ? 0.6 : 1 }}>
            {loading ? "Deleting..." : hasActiveData ? "Delete anyway" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Employee panel ──────────────────────────────────────────────────────
function EditEmployeePanel({
  user, onClose, onUpdated,
}: {
  user: UserDTO;
  onClose: () => void;
  onUpdated: (updated: UserDTO) => void;
}) {
  const [form, setForm] = useState<EditEmployeeForm>({
    nom: user.nom ?? "", prenom: user.prenom ?? "",
    email: user.email ?? "", telephone: user.telephone ?? "",
    specialite: user.specialite ?? "", motDePasse: "",
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k: keyof EditEmployeeForm) => (v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        nom: form.nom.trim(), prenom: form.prenom.trim(),
        email: form.email.trim(), telephone: form.telephone.trim(),
        specialite: form.specialite.trim(),
      };
      if (form.motDePasse.trim()) payload.motDePasse = form.motDePasse;
      const { data } = await api.put<UserDTO>(`/admin/users/${user.id}/edit`, payload);
      onUpdated(data);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1600);
    } catch (err: any) {
      const msg = err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        "Failed to update employee.";
      setError(typeof msg === "string" ? msg : "Failed to update employee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 460, background: "var(--card)", borderLeft: "1px solid var(--border)", height: "100%", overflowY: "auto", padding: "32px 28px", animation: "slideInRight 0.25s cubic-bezier(0.22,1,0.36,1)" }}>
        <style>{`@keyframes slideInRight { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }`}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 4 }}>// Edit Employee</div>
            <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--tp)" }}>Edit Employee</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ts)", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>
        <div style={{ marginBottom: 24, padding: "10px 14px", background: "rgba(0,255,210,0.05)", border: "1px solid rgba(0,255,210,0.15)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Code</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{user.code}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", marginLeft: "auto" }}>read-only</span>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <Field label="Last name"  name="nom"    value={form.nom}    onChange={set("nom")}    placeholder="Dupont" />
            <Field label="First name" name="prenom" value={form.prenom} onChange={set("prenom")} placeholder="Marc" />
          </div>
          <Field label="Email"      name="email"      value={form.email}      onChange={set("email")}      placeholder="marc@secureops.com" type="email" />
          <Field label="Speciality" name="specialite" value={form.specialite} onChange={set("specialite")} placeholder="Network Security, Pentesting..." />
          <Field label="Phone"      name="telephone"  value={form.telephone}  onChange={set("telephone")}  placeholder="+33 6 12 34 56 78" required={false} />
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7 }}>
              New password <span style={{ color: "var(--tm)", fontWeight: 400, letterSpacing: 0, textTransform: "none" as const }}>(optional)</span>
            </div>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} value={form.motDePasse} onChange={e => set("motDePasse")(e.target.value)} placeholder="Leave blank to keep current password" style={{ width: "100%", padding: "10px 40px 10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--tp)", fontFamily: "var(--mono)", fontSize: 13, outline: "none" }} onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.6)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--tm)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 12 }}>
                {showPass ? "◉" : "◎"}
              </button>
            </div>
          </div>
          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.25)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)", marginBottom: 16, display: "flex", gap: 8 }}>
              <span>✕</span><span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12, color: "#10b981", marginBottom: 16, display: "flex", gap: 8 }}>
              <span>✓</span><span>Employee updated successfully!</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: "11px", background: "var(--accent)", color: "#0a0c0f", border: "none", borderRadius: 8, fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", opacity: loading ? 0.55 : 1 }}>
              {loading ? "Saving..." : "Save Changes →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main ManageUsers ─────────────────────────────────────────────────────────
export default function ManageUsers() {
  const [users, setUsers]     = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [search, setSearch]         = useState("");

  const [currentPage, setCurrentPage]     = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState<CreateEmployeeForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [showPass, setShowPass]       = useState(false);

  const [deleteTarget, setDeleteTarget]   = useState<UserDTO | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editTarget, setEditTarget]       = useState<UserDTO | null>(null);

  const fetchUsers = async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      params.set("page", String(page));
      params.set("size", String(PAGE_SIZE));
      const { data } = await api.get<PagedResponse>(`/admin/users?${params.toString()}`);
      setUsers(data.content);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(0);
    fetchUsers(0);
  }, [roleFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.code.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.nom ?? "").toLowerCase().includes(q) ||
      (u.prenom ?? "").toLowerCase().includes(q) ||
      (u.raisonSociale ?? "").toLowerCase().includes(q) ||
      (u.specialite ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const handlePageChange = (newPage: number) => {
    setSearch("");
    setCurrentPage(newPage);
    fetchUsers(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFormLoading(true);
    setFormError(null);
    try {
      await api.post("/admin/users/employee", form);
      setFormSuccess(true);
      setForm(EMPTY_FORM);
      fetchUsers(0);
      setTimeout(() => { setFormSuccess(false); setShowForm(false); }, 1800);
    } catch (err: any) {
      const msg = err.response?.data?.message ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        "Failed to create employee.";
      setFormError(typeof msg === "string" ? msg : "Failed to create employee.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchUsers(currentPage);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete user.";
      setError(typeof msg === "string" ? msg : "Failed to delete user.");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEmployeeUpdated = (updated: UserDTO) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const set = (k: keyof CreateEmployeeForm) => (v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const formValid = form.code && form.motDePasse && form.email &&
    form.nom && form.prenom && form.specialite;

  const from = totalElements === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const to   = Math.min((currentPage + 1) * PAGE_SIZE, totalElements);

  return (
    <AdminLayout currentPage="users">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes skeletonFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes skeletonShimmer {
          0%   { opacity: 0.5; }
          50%  { opacity: 1; }
          100% { opacity: 0.5; }
        }
        .sk-pulse { animation: skeletonShimmer 1.6s ease-in-out infinite; }
        .mu-table-row { transition: background 0.15s; }
        .mu-table-row:hover { background: rgba(255,255,255,0.02) !important; }
        .mu-filter-btn { transition: all 0.2s; cursor: pointer; }
        .mu-filter-btn:hover { border-color: rgba(0,255,210,0.3) !important; color: var(--tp) !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="adm-page-eyebrow">// User Management</div>
          <div className="adm-page-title">Manage Users</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>
            {totalElements > 0 ? `${totalElements} total · ` : ""}View clients, create and manage employee accounts
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError(null); setForm(EMPTY_FORM); }}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "var(--accent)", color: "#0a0c0f", border: "none", borderRadius: 10, fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.03em", transition: "background 0.2s, box-shadow 0.2s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#00ffe5"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(0,255,210,0.3)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
        >
          <span style={{ fontSize: 16 }}>+</span> Create Employee
        </button>
      </div>

      {/* Filter tabs + Search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: 4 }}>
          {(["ALL", "CLIENT", "EMPLOYEE", "ADMIN"] as RoleFilter[]).map(r => (
            <button key={r} className="mu-filter-btn" onClick={() => setRoleFilter(r)} style={{ padding: "7px 14px", border: "none", borderRadius: 7, cursor: "pointer", background: roleFilter === r ? "rgba(0,255,210,0.12)" : "transparent", color: roleFilter === r ? "var(--accent)" : "var(--ts)", fontFamily: "var(--mono)", fontSize: 11, fontWeight: roleFilter === r ? 600 : 400, letterSpacing: "0.04em", outline: roleFilter === r ? "1px solid rgba(0,255,210,0.25)" : "none", transition: "all 0.2s" }}>
              {r}
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--tm)", fontFamily: "var(--mono)", fontSize: 13 }}>⌕</span>
          <input type="text" placeholder="Search by code, name, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "9px 14px 9px 34px", width: 280, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--tp)", fontFamily: "var(--mono)", fontSize: 12, outline: "none" }} onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.4)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
        </div>
      </div>

      {error && <div className="adm-error" style={{ marginBottom: 16 }}>✕ {error}</div>}

      {/* ── Skeleton while loading ── */}
      {loading && <SkeletonTable rows={8} />}

      {/* ── Real table once loaded ── */}
      {!loading && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 100px 1fr 120px 140px", padding: "12px 20px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
            {["Code", "Email", "Role", "Name / Company", "Joined", ""].map(h => (
              <div key={h} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--tm)", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" as const, fontFamily: "var(--mono)", fontSize: 13, color: "var(--ts)" }}>
              No users found{search ? ` matching "${search}"` : ""}.
            </div>
          ) : (
            filtered.map((user, i) => (
              <div key={user.id} className="mu-table-row" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 100px 1fr 120px 140px", padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "center", animation: `fadeUp 0.3s ease ${i * 30}ms both` }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--tp)" }}>{user.code}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{user.email}</div>
                <div><RoleBadge role={user.role} /></div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>
                  {user.role === "CLIENT" ? (user.raisonSociale ?? "—") : user.nom ? `${user.prenom ?? ""} ${user.nom}`.trim() : "—"}
                  {user.specialite && <span style={{ display: "block", fontSize: 10, color: "var(--tm)", marginTop: 2 }}>{user.specialite}</span>}
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tm)" }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </div>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  {user.role === "EMPLOYEE" && (
                    <button onClick={() => setEditTarget(user)} style={{ padding: "5px 12px", background: "rgba(0,255,210,0.07)", border: "1px solid rgba(0,255,210,0.2)", borderRadius: 6, color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,210,0.14)"} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,255,210,0.07)"}>Edit</button>
                  )}
                  {user.role !== "ADMIN" && (
                    <button onClick={() => setDeleteTarget(user)} style={{ padding: "5px 12px", background: "rgba(255,77,109,0.07)", border: "1px solid rgba(255,77,109,0.2)", borderRadius: 6, color: "#ff4d6d", fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,109,0.15)"} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,77,109,0.07)"}>Delete</button>
                  )}
                </div>
              </div>
            ))
          )}

          {totalPages > 1 && !search.trim() && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ts)" }}>Showing {from}–{to} of {totalElements} users</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} style={{ padding: "6px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: currentPage === 0 ? "var(--tm)" : "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, cursor: currentPage === 0 ? "not-allowed" : "pointer", opacity: currentPage === 0 ? 0.4 : 1, transition: "all 0.2s" }} onMouseEnter={e => { if (currentPage !== 0) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,210,0.4)"; }} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"}>← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i).map(p => {
                  const show = p === 0 || p === totalPages - 1 || Math.abs(p - currentPage) <= 1;
                  const showDots = !show && (p === 1 || p === totalPages - 2);
                  if (showDots) return <span key={p} style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--tm)", padding: "0 4px" }}>…</span>;
                  if (!show) return null;
                  const isActive = p === currentPage;
                  return <button key={p} onClick={() => handlePageChange(p)} style={{ minWidth: 34, height: 34, padding: "0 10px", background: isActive ? "rgba(0,255,210,0.12)" : "transparent", border: isActive ? "1px solid rgba(0,255,210,0.35)" : "1px solid var(--border)", borderRadius: 8, color: isActive ? "var(--accent)" : "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, fontWeight: isActive ? 600 : 400, cursor: "pointer", transition: "all 0.2s" }}>{p + 1}</button>;
                })}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} style={{ padding: "6px 14px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: currentPage === totalPages - 1 ? "var(--tm)" : "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer", opacity: currentPage === totalPages - 1 ? 0.4 : 1, transition: "all 0.2s" }} onMouseEnter={e => { if (currentPage !== totalPages - 1) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,255,210,0.4)"; }} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Employee panel */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end" }} onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ width: "100%", maxWidth: 460, background: "var(--card)", borderLeft: "1px solid var(--border)", height: "100%", overflowY: "auto", padding: "32px 28px", animation: "slideInRight 0.25s cubic-bezier(0.22,1,0.36,1)" }}>
            <style>{`@keyframes slideInRight { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }`}</style>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: 4 }}>// New Employee</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--tp)" }}>Create Employee</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--ts)", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
            </div>
            <form onSubmit={handleCreate} noValidate>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                <Field label="Last name"  name="nom"    value={form.nom}    onChange={set("nom")}    placeholder="Dupont" />
                <Field label="First name" name="prenom" value={form.prenom} onChange={set("prenom")} placeholder="Marc" />
              </div>
              <Field label="User code"  name="code"       value={form.code}       onChange={set("code")}       placeholder="EMP001" />
              <Field label="Email"      name="email"      value={form.email}      onChange={set("email")}      placeholder="marc@secureops.com" type="email" />
              <Field label="Speciality" name="specialite" value={form.specialite} onChange={set("specialite")} placeholder="Network Security, Pentesting..." />
              <Field label="Phone"      name="telephone"  value={form.telephone}  onChange={set("telephone")}  placeholder="+33 6 12 34 56 78" required={false} />
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ts)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 7 }}>Password<span style={{ color: "var(--accent)", marginLeft: 2 }}>*</span></div>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} value={form.motDePasse} onChange={e => set("motDePasse")(e.target.value)} placeholder="Strong password" style={{ width: "100%", padding: "10px 40px 10px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--tp)", fontFamily: "var(--mono)", fontSize: 13, outline: "none" }} onFocus={e => e.target.style.borderColor = "rgba(0,255,210,0.6)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--tm)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 12 }}>{showPass ? "◉" : "◎"}</button>
                </div>
              </div>
              {formError && <div style={{ padding: "10px 14px", background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.25)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12, color: "var(--danger)", marginBottom: 16, display: "flex", gap: 8 }}><span>✕</span><span>{formError}</span></div>}
              {formSuccess && <div style={{ padding: "10px 14px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 12, color: "#10b981", marginBottom: 16, display: "flex", gap: 8 }}><span>✓</span><span>Employee created successfully!</span></div>}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ts)", fontFamily: "var(--mono)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={!formValid || formLoading} style={{ flex: 2, padding: "11px", background: "var(--accent)", color: "#0a0c0f", border: "none", borderRadius: 8, fontFamily: "var(--display)", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", opacity: (!formValid || formLoading) ? 0.55 : 1 }}>
                  {formLoading ? "Creating..." : "Create Employee →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && <ConfirmModal user={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />}
      {editTarget && <EditEmployeePanel user={editTarget} onClose={() => setEditTarget(null)} onUpdated={(updated) => { handleEmployeeUpdated(updated); setEditTarget(null); }} />}
    </AdminLayout>
  );
}
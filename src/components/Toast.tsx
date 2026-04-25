import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

// ─── Single toast item ────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Animate out before removal
    const hideTimer = setTimeout(() => setVisible(false), 2700);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  const config = {
    success: { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)",  icon: "✓" },
    error:   { color: "#ff4d6d", bg: "rgba(255,77,109,0.12)",  border: "rgba(255,77,109,0.3)",  icon: "✕" },
    info:    { color: "#00ffd2", bg: "rgba(0,255,210,0.10)",   border: "rgba(0,255,210,0.25)",  icon: "ℹ" },
  }[toast.type];

  return (
    <div
      onClick={onRemove}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px",
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 10,
        backdropFilter: "blur(12px)",
        boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${config.border}`,
        cursor: "pointer",
        minWidth: 260, maxWidth: 360,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(24px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      {/* Icon */}
      <div style={{
        width: 24, height: 24, borderRadius: "50%",
        background: `${config.color}20`,
        border: `1px solid ${config.color}50`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, color: config.color,
        flexShrink: 0,
      }}>
        {config.icon}
      </div>

      {/* Message */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12, color: "#e8edf5", flex: 1,
        letterSpacing: "0.01em", lineHeight: 1.4,
      }}>
        {toast.message}
      </span>

      {/* Close hint */}
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#3d4a5c", flexShrink: 0 }}>
        ✕
      </span>
    </div>
  );
}

// ─── Toast container ──────────────────────────────────────────────────────────
export function ToastContainer({ toasts, removeToast }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      display: "flex", flexDirection: "column", gap: 10,
      zIndex: 9999, pointerEvents: "none",
    }}>
      {toasts.map(toast => (
        <div key={toast.id} style={{ pointerEvents: "auto" }}>
          <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}

// ─── useToast hook ────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    // Auto remove after 3s
    setTimeout(() => removeToast(id), 3000);
  }, [removeToast]);

  const toast = {
    success: (msg: string) => addToast(msg, "success"),
    error:   (msg: string) => addToast(msg, "error"),
    info:    (msg: string) => addToast(msg, "info"),
  };

  return { toasts, removeToast, toast };
}
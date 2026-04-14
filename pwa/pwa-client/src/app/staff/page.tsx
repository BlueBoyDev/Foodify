"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFetchWithState } from "@/lib/useFetchWithState";
import { FoodSpinner } from "@/components/ui/FoodSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import { EmptyState } from "@/components/EmptyState";
import type { StaffMember, StaffRole, StaffStatus } from "@/types/staff";
import { ROLE_CFG, STATUS_CFG } from "@/types/staff";
import {
  IconUser,
  IconPackage,
  IconBell,
  IconChefHat,
  IconDollarSign,
  IconMail,
  IconSmartphone,
  IconBuilding,
  IconCalendar,
  IconLock,
  IconTrash,
  IconSearch,
  IconUsers,
  IconClock,
  IconCheck,
  IconPlus,
  IconEdit,
  IconArrowLeft,
} from "@/components/ui/Icons";

function RoleIcon({ icon, size = 18, color }: { icon: string; size?: number; color?: string }) {
  switch (icon) {
    case "user":    return <IconUser size={size} color={color} />;
    case "package": return <IconPackage size={size} color={color} />;
    case "bell":    return <IconBell size={size} color={color} />;
    case "chef":    return <IconChefHat size={size} color={color} />;
    case "dollar":  return <IconDollarSign size={size} color={color} />;
    default:        return <IconUser size={size} color={color} />;
  }
}

// ─── Guard ────────────────────────────────────────────────────────────────────
function useAdminGuard() {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin"))
      window.location.href = "/login";
  }, [isLoading, user]);
  return { user, isLoading };
}



// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLES: StaffRole[]    = ["restaurant_admin", "manager", "waiter", "chef", "cashier"];
const STATUSES: StaffStatus[] = ["active", "inactive", "suspended"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}
function fmtRelative(iso?: string) {
  if (!iso) return "Nunca";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)    return "Hace un momento";
  if (mins < 60)   return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `Hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days} día${days > 1 ? "s" : ""}`;
}

const EMPTY_FORM = {
  name: "", email: "", phone: "",
  role: "waiter" as StaffRole,
  status: "active" as StaffStatus,
  branch: "Centro Histórico",
};
type StaffForm = typeof EMPTY_FORM;

// ─── Modal Formulario ─────────────────────────────────────────────────────────
function StaffFormModal({
  member,
  onClose,
  onSave,
}: {
  member: StaffMember | null;
  onClose: () => void;
  onSave: (form: StaffForm, id?: string) => void;
}) {
  const [form, setForm]     = useState<StaffForm>(
    member
      ? { name: member.name, email: member.email, phone: member.phone, role: member.role, status: member.status, branch: member.branch }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<Partial<Record<keyof StaffForm, string>>>({});

  const set = (key: keyof StaffForm, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim())                              e.name  = "Nombre requerido";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Email inválido";
    if (!form.phone.trim())                             e.phone = "Teléfono requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const inputStyle = (err?: string): React.CSSProperties => ({
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: `1.5px solid ${err ? "#ef4444" : "#2e3238"}`,
    background: "#22262c", color: "#f0ede8",
    fontSize: "0.9rem", outline: "none", fontFamily: "inherit",
    boxSizing: "border-box",
  });

  const labelStyle: React.CSSProperties = {
    fontSize: "0.75rem", fontWeight: 600, color: "#8a8f98", marginBottom: 5, display: "block",
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#1a1d21", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", padding: "24px 20px 40px" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.125rem", color: "#f0ede8", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            {member ? <IconEdit size={20} color="#FF6B35" /> : <IconPlus size={20} color="#FF6B35" />}
            {member ? "Editar Empleado" : "Nuevo Empleado"}
          </h2>
          <button onClick={onClose} style={{ background: "#2e3238", border: "none", color: "#8a8f98", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Nombre */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Nombre completo *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej. Carlos Mendoza" style={inputStyle(errors.name)} />
          {errors.name && <p style={{ color: "#ef4444", fontSize: "0.7rem", marginTop: 3 }}>{errors.name}</p>}
        </div>

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Correo electrónico *</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="nombre@foodify.mx" style={inputStyle(errors.email)} />
          {errors.email && <p style={{ color: "#ef4444", fontSize: "0.7rem", marginTop: 3 }}>{errors.email}</p>}
        </div>

        {/* Teléfono */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Teléfono *</label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="33 1234 5678" style={inputStyle(errors.phone)} />
          {errors.phone && <p style={{ color: "#ef4444", fontSize: "0.7rem", marginTop: 3 }}>{errors.phone}</p>}
        </div>

        {/* Rol + Estado */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Rol *</label>
            <select value={form.role} onChange={(e) => set("role", e.target.value)} style={{ ...inputStyle(), appearance: "none" }}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_CFG[r].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estado *</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} style={{ ...inputStyle(), appearance: "none" }}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_CFG[s].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sucursal */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Sucursal</label>
          <input value={form.branch} onChange={(e) => set("branch", e.target.value)} placeholder="Centro Histórico" style={inputStyle()} />
        </div>

        {/* Preview rol seleccionado */}
        <div style={{
          background: ROLE_CFG[form.role].bg,
          border: `1px solid ${ROLE_CFG[form.role].color}40`,
          borderRadius: 12, padding: "12px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ color: ROLE_CFG[form.role].color }}>
            <RoleIcon icon={ROLE_CFG[form.role].icon} size={28} />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: ROLE_CFG[form.role].color, fontSize: "0.875rem", margin: 0 }}>
              {ROLE_CFG[form.role].label}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: "2px 0 0" }}>
              {form.role === "restaurant_admin" && "Acceso total al panel administrativo"}
              {form.role === "manager"          && "Gestión de operaciones y reportes"}
              {form.role === "waiter"           && "Toma de pedidos y atención a mesas"}
              {form.role === "chef"             && "Vista de cocina y gestión de comandas"}
              {form.role === "cashier"          && "Cobro y cierre de órdenes"}
            </p>
          </div>
        </div>

        <button
          onClick={() => { if (validate()) onSave(form, member?.id); }}
          style={{ width: "100%", background: "#FF6B35", color: "white", border: "none", padding: "14px", borderRadius: 12, fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}
        >
          {member ? "Guardar cambios" : "Agregar empleado"}
        </button>
        <button
          onClick={onClose}
          style={{ width: "100%", background: "#2e3238", color: "#8a8f98", border: "none", padding: "12px", borderRadius: 12, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Modal Detalle / Perfil ───────────────────────────────────────────────────
function StaffDetailModal({
  member,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  member: StaffMember;
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: (id: string, status: StaffStatus) => void;
  onDelete: (id: string) => void;
}) {
  const roleCfg   = ROLE_CFG[member.role];
  const statusCfg = STATUS_CFG[member.status];

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#1a1d21", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, padding: "24px 20px 40px" }}
      >
        {/* Avatar + nombre */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: roleCfg.bg,
              border: `2px solid ${roleCfg.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem", fontWeight: 800, color: roleCfg.color,
            }}>
              {member.avatarInitials ?? member.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 800, color: "#f0ede8", fontSize: "1rem", margin: 0 }}>{member.name}</p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: roleCfg.bg, color: roleCfg.color, fontSize: "0.7rem", fontWeight: 700, padding: "2px 10px", borderRadius: 999 }}>
                <RoleIcon icon={roleCfg.icon} size={14} /> {roleCfg.label}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#2e3238", border: "none", color: "#8a8f98", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
        </div>

        {/* Info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { icon: <IconMail size={14} />,         label: "Email",         value: member.email                },
            { icon: <IconSmartphone size={14} />,   label: "Teléfono",       value: member.phone                },
            { icon: <IconBuilding size={14} />,     label: "Sucursal",        value: member.branch               },
            { icon: <IconCalendar size={14} />,     label: "Alta",            value: fmtDate(member.createdAt)   },
            { icon: <IconClock size={14} />,        label: "Último acceso",   value: fmtRelative(member.lastLogin) },
            { icon: <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusCfg.color }} />, label: "Estado",
              value: statusCfg.label,
              color: statusCfg.color,
            },
          ].map(({ icon, label, value, color }) => (
            <div key={label} style={{ background: "#22262c", borderRadius: 10, padding: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.7rem", color: "#6b7280", margin: "0 0 3px" }}>
                {icon}
                <span>{label}</span>
              </div>
              <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: color ?? "#f0ede8", margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <button
          onClick={onEdit}
          style={{ width: "100%", background: "#FF6B35", color: "white", border: "none", padding: "13px", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <IconEdit size={18} /> Editar empleado
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          {member.status === "active" ? (
            <button
              onClick={() => { onToggleStatus(member.id, "suspended"); onClose(); }}
              style={{ padding: "12px", background: "#2e3238", color: "#f59e0b", border: "1px solid #3d2e0a", borderRadius: 12, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <IconClock size={16} /> Suspender
            </button>
          ) : (
            <button
              onClick={() => { onToggleStatus(member.id, "active"); onClose(); }}
              style={{ padding: "12px", background: "#2e3238", color: "#22c55e", border: "1px solid #0d3320", borderRadius: 12, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <IconCheck size={16} /> Activar
            </button>
          )}
          <button
            onClick={() => { onDelete(member.id); onClose(); }}
            style={{ padding: "12px", background: "#2e3238", color: "#ef4444", border: "1px solid #3d1010", borderRadius: 12, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <IconTrash size={16} /> Eliminar
          </button>
        </div>

        <button
          onClick={onClose}
          style={{ width: "100%", background: "#2e3238", color: "#8a8f98", border: "none", padding: "12px", borderRadius: 12, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit" }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ─── Card de empleado ─────────────────────────────────────────────────────────
function StaffCard({ member, onTap }: { member: StaffMember; onTap: () => void }) {
  const roleCfg   = ROLE_CFG[member.role];
  const statusCfg = STATUS_CFG[member.status];

  return (
    <div
      onClick={onTap}
      style={{
        background: "#1a1d21", borderRadius: 14, padding: "14px 16px",
        border: `1px solid ${member.status === "suspended" ? "#3d1010" : "#2e3238"}`,
        marginBottom: 10, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 14,
        opacity: member.status === "inactive" ? 0.65 : 1,
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
        background: roleCfg.bg, border: `2px solid ${roleCfg.color}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.875rem", fontWeight: 800, color: roleCfg.color,
      }}>
        {member.avatarInitials ?? member.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <p style={{ fontWeight: 700, color: "#f0ede8", fontSize: "0.9rem", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {member.name}
          </p>
          <span style={{ background: statusCfg.bg, color: statusCfg.color, fontSize: "0.6rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, flexShrink: 0, marginLeft: 6 }}>
            ● {statusCfg.label}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: roleCfg.bg, color: roleCfg.color, fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>
            <RoleIcon icon={roleCfg.icon} size={11} /> {roleCfg.label}
          </div>
          <p style={{ fontSize: "0.68rem", color: "#4b5563", margin: 0 }}>
            {fmtRelative(member.lastLogin)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function AdminStaffPage() {
  const { user, isLoading } = useAdminGuard();
  const { logout } = useAuth();

  // 1. Definir todos los estados primero (Regla de Hooks)
  const [search, setSearch]       = useState("");
  const [filterRole, setFilterRole] = useState<StaffRole | "todos">("todos");
  const [filterStatus, setFilterStatus] = useState<StaffStatus | "todos">("todos");
  const [selected, setSelected]   = useState<StaffMember | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [toast, setToast]         = useState("");

  const { data: staff, setData: setStaff, loading, error, empty, refetch } = useFetchWithState<StaffMember[]>("/staff");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // 2. Lógica de filtrado
  const filtered = useMemo(() => {
    let list = staff ?? [];
    if (filterRole   !== "todos") list = list.filter((s) => s.role   === filterRole);
    if (filterStatus !== "todos") list = list.filter((s) => s.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q)
      );
    }
    return list;
  }, [staff, filterRole, filterStatus, search]);

  // 3. Early returns DESPUÉS de definir todos los hooks
  if (isLoading || !user || loading) return <FoodSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={refetch} />;
  if (empty && !showForm) return <EmptyState title="No hay personal" description="Agrega empleados desde el botón superior." />;

  // 4. Handlers CRUD
  const handleSave = (form: StaffForm, id?: string) => {
    const newMember: StaffMember = {
      id: id ?? Math.random().toString(36).substr(2, 9),
      ...form,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    if (setStaff) {
      if (id) {
        setStaff((prev) => (prev ?? []).map((s) => (s.id === id ? newMember : s)));
        showToast("Empleado actualizado");
      } else {
        setStaff((prev) => [newMember, ...(prev ?? [])]);
        showToast("Empleado agregado");
      }
    }
    setShowForm(false);
  };

  const handleToggleStatus = (id: string, current: StaffStatus) => {
    const nextStatus: StaffStatus = 
      current === "active" ? "inactive" : 
      current === "inactive" ? "suspended" : "active";
    
    if (setStaff) {
      setStaff((prev) => (prev ?? []).map((s) => s.id === id ? { ...s, status: nextStatus } : s));
    }
    const labels: Record<StaffStatus, string> = { active: "Activado", inactive: "Desactivado", suspended: "Suspendido" };
    showToast(`Empleado ${labels[nextStatus]}`);
  };

  const handleDelete = (id: string) => {
    if (setStaff) {
      setStaff((prev) => (prev ?? []).filter((s) => s.id !== id));
    }
    showToast("Empleado eliminado");
    setSelected(null);
  };

  const kpis = ROLES.map((r) => ({
    role: r,
    count: (staff ?? []).filter((s) => s.role === r && s.status === "active").length,
  }));

  const totalActive = (staff ?? []).filter((s) => s.status === "active").length;


  return (
    <div style={{ minHeight: "100dvh", background: "#111214", fontFamily: "'Outfit', sans-serif", color: "#f0ede8" }}>

      {/* ── Header ── */}
      <div style={{ background: "#1a1d21", borderBottom: "1px solid #2e3238", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => window.location.href = "/dashboard"} style={{ background: "#2e3238", border: "none", color: "#8a8f98", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconArrowLeft size={18} />
          </button>
          <div>
            <p style={{ fontWeight: 800, fontSize: "0.9375rem", margin: 0 }}>Staff / Personal</p>
            <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <IconUsers size={12} /> {(staff ?? []).length} empleados · {totalActive} activos
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { setEditMember(null); setShowForm(true); }}
            style={{ background: "#FF6B35", color: "white", border: "none", padding: "8px 16px", borderRadius: 10, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", fontFamily: "inherit" }}
          >
            ＋ Agregar
          </button>
          <button onClick={logout} style={{ background: "#2e3238", color: "#8a8f98", border: "none", padding: "7px 14px", borderRadius: 8, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ padding: "16px" }}>

        {/* ── KPIs por rol ── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }} className="scrollbar-hide">
          {kpis.map(({ role, count }) => {
            const cfg = ROLE_CFG[role];
            return (
              <div key={role} style={{
                flexShrink: 0, background: "#1a1d21", borderRadius: 12, padding: "12px 16px",
                border: `1px solid ${cfg.color}30`, minWidth: 100, textAlign: "center",
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 4, color: cfg.color }}>
                  <RoleIcon icon={cfg.icon} size={22} />
                </div>
                <p style={{ fontSize: "1rem", fontWeight: 900, color: cfg.color, margin: "0 0 2px" }}>{count}</p>
                <p style={{ fontSize: "0.62rem", color: "#6b7280", margin: 0 }}>{cfg.label}</p>
              </div>
            );
          })}
        </div>

        {/* ── Búsqueda ── */}
        <div style={{ background: "#1a1d21", borderRadius: 10, border: "1px solid #2e3238", display: "flex", alignItems: "center", padding: "0 14px", marginBottom: 12 }}>
          <IconSearch size={18} color="#6b7280" style={{ marginRight: 8 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#f0ede8", padding: "12px 0", fontSize: "0.875rem", fontFamily: "inherit" }}
          />
        </div>

        {/* ── Filtro por rol ── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }} className="scrollbar-hide">
          {([{ key: "todos", label: "Todos", icon: <IconUsers size={14} /> }, ...ROLES.map((r) => ({ key: r, label: ROLE_CFG[r].label, icon: <RoleIcon icon={ROLE_CFG[r].icon} size={14} /> }))] as const).map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilterRole(key as StaffRole | "todos")}
              style={{
                flexShrink: 0, padding: "7px 14px", borderRadius: 999, cursor: "pointer",
                background: filterRole === key ? "#FF6B35" : "#1a1d21",
                color: filterRole === key ? "white" : "#6b7280",
                fontWeight: filterRole === key ? 700 : 500,
                fontSize: "0.8rem", fontFamily: "inherit",
                border: filterRole === key ? "none" : "1px solid #2e3238",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {icon}
                <span>{label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* ── Filtro por estado ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {([{ key: "todos", label: "Todos" }, ...STATUSES.map((s) => ({ key: s, label: STATUS_CFG[s].label }))] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key as StaffStatus | "todos")}
              style={{
                padding: "5px 14px", borderRadius: 999, cursor: "pointer",
                background: filterStatus === key ? "#2e3238" : "transparent",
                color: filterStatus === key ? "#f0ede8" : "#4b5563",
                fontWeight: filterStatus === key ? 700 : 500,
                fontSize: "0.75rem", fontFamily: "inherit",
                border: filterStatus === key ? "1px solid #FF6B35" : "1px solid #2e3238",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Lista ── */}
        <p style={{ fontSize: "0.72rem", color: "#4b5563", marginBottom: 10 }}>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </p>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <IconUsers size={48} />
            </div>
            <p>No se encontraron empleados</p>
          </div>
        ) : filtered.map((member) => (
          <StaffCard key={member.id} member={member} onTap={() => setSelected(member)} />
        ))}

        <div style={{ height: 24 }} />
      </div>

      {/* ── Modal detalle ── */}
      {selected && !showForm && (
        <StaffDetailModal
          member={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditMember(selected); setShowForm(true); setSelected(null); }}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />
      )}

      {/* ── Modal formulario ── */}
      {showForm && (
        <StaffFormModal
          member={editMember}
          onClose={() => { setShowForm(false); setEditMember(null); }}
          onSave={handleSave}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#1a1d21", border: "1px solid #2e3238",
          color: "#f0ede8", padding: "12px 24px", borderRadius: 999,
          fontWeight: 600, fontSize: "0.875rem", zIndex: 300,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)", whiteSpace: "nowrap",
          animation: "fadeUp 0.25s ease both",
          display: "flex", alignItems: "center", gap: 8
        }}>
          <IconCheck size={18} color="#22c55e" />
          {toast}
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform: translateX(-50%) translateY(10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
        .scrollbar-hide    { scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

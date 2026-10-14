import { Link } from "react-router-dom";
import { CalendarDays, ShoppingBag, BarChart3, ShieldCheck, LogOut, Clock } from "lucide-react";
import { clearAdminSession } from "../../lib/adminSession.js";

const TABS = [
  { key: "citas",    to: "/admin",          label: "Citas",    long: " y horarios", Icon: CalendarDays },
  { key: "catalogo", to: "/admin/catalogo", label: "Catálogo", long: "",            Icon: ShoppingBag },
  { key: "metricas", to: "/admin/metricas", label: "Métricas", long: "",            Icon: BarChart3 },
];

// 3_725_000 ms → "1:02:05"
export function formatRemaining(ms) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Barra única del panel admin: pestañas a la izquierda, sesión y acciones a la derecha.
// Queda fija debajo del navbar (mismo patrón que las categorías del catálogo).
export default function AdminBar({ active, remaining, onSecurity, securityOpen }) {
  const logout = () => {
    clearAdminSession();
    window.location.href = "/admin";
  };

  return (
    <div
      className="sticky top-16 sm:top-[72px] z-40 border-b border-slate-300 backdrop-blur"
      style={{ background: "rgba(246,247,249,0.94)" }}
    >
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
        <nav className="flex gap-5 sm:gap-7 min-w-0 overflow-x-auto scrollbar-hide">
          {TABS.map(({ key, to, label, long, Icon }) => {
            const on = key === active;
            return (
              <Link
                key={key}
                to={to}
                aria-current={on ? "page" : undefined}
                className={`shrink-0 inline-flex items-center gap-2 pb-3 pt-3.5 text-xs font-bold uppercase tracking-wide border-b-[3px] transition-colors ${
                  on ? "text-slate-900 border-brand-indigo" : "text-slate-600 border-transparent hover:text-slate-900"
                }`}
              >
                <Icon className={`hidden sm:block w-4 h-4 ${on ? "text-brand-indigo" : ""}`} />
                <span>{label}<span className="hidden sm:inline">{long}</span></span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 py-2">
          <span
            title="Tiempo restante de la sesión"
            className="hidden sm:inline-flex items-center gap-1.5 font-mono text-xs font-medium text-slate-700"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" /> {formatRemaining(remaining)}
          </span>

          {onSecurity && (
            <button
              onClick={onSecurity}
              aria-pressed={!!securityOpen}
              title="Seguridad: Windows Hello / huella / Face ID"
              className={`inline-flex items-center gap-1.5 px-3 py-2 border text-xs font-bold uppercase tracking-wide rounded-[3px] transition-colors ${
                securityOpen
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-800 border-slate-400 hover:border-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Seguridad</span>
            </button>
          )}

          <button
            onClick={logout}
            title="Cerrar sesión"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-400 bg-white text-slate-800 text-xs font-bold uppercase tracking-wide rounded-[3px] hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
}

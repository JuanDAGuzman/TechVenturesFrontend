import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminMetrics from "./AdminMetrics.jsx";
import {
  getAdminToken,
  getAdminRemaining,
  clearAdminSession,
} from "../lib/adminSession.js";

export default function AdminMetricsGate() {
  const [status, setStatus]       = useState("checking");
  const [remaining, setRemaining] = useState(getAdminRemaining());

  useEffect(() => {
    const t    = getAdminToken();
    const left = getAdminRemaining();
    setStatus(t && left > 0 ? "ready" : "need_login");
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const id = setInterval(() => {
      const left = getAdminRemaining();
      setRemaining(left);
      if (left <= 0) {
        clearAdminSession();
        setStatus("need_login");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  if (status === "checking")   return null;
  if (status === "need_login") return <Navigate to="/admin" replace />;

  const h  = Math.floor(remaining / 3_600_000);
  const m  = Math.floor((remaining % 3_600_000) / 60_000);
  const s  = Math.floor((remaining % 60_000) / 1_000);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  return (
    <div>
      {/* Banner de sesión */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
        <div className="container-page py-2 flex items-center justify-between">
          <span>Sesión admin expira en: <b>{h}:{mm}:{ss}</b></span>
          <button
            onClick={() => { clearAdminSession(); window.location.href = "/admin"; }}
            className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Navegación */}
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page py-0">
          <nav className="flex gap-1 -mb-px">
            <a href="/admin" className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Citas y horarios
            </a>
            <a href="/admin/catalogo" className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              Catálogo
            </a>
            <a href="/admin/metricas" className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-brand-indigo text-brand-indigo transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              Métricas
            </a>
          </nav>
        </div>
      </div>

      <AdminMetrics />
    </div>
  );
}

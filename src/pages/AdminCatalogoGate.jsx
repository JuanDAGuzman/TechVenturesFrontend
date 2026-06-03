import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminCatalogo from "./AdminCatalogo.jsx";
import {
  getAdminToken,
  getAdminRemaining,
  clearAdminSession,
} from "../lib/adminSession.js";

export default function AdminCatalogoGate() {
  const [status, setStatus]       = useState("checking"); // checking | ready | need_login
  const [remaining, setRemaining] = useState(getAdminRemaining());

  useEffect(() => {
    const t    = getAdminToken();
    const left = getAdminRemaining();
    setStatus(t && left > 0 ? "ready" : "need_login");
  }, []);

  // Contador de sesión + auto-logout
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
      {/* Banner de sesión — igual al de AdminGate */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
        <div className="container-page py-2 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Sesión admin expira en:{" "}
              <b>{h}:{mm}:{ss}</b>
            </span>
            <a
              href="/admin"
              className="text-amber-700 hover:text-amber-900 font-semibold underline underline-offset-2"
            >
              ← Panel de citas
            </a>
          </div>
          <button
            onClick={() => {
              clearAdminSession();
              window.location.href = "/admin";
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>

      <AdminCatalogo />
    </div>
  );
}

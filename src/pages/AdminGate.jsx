import { useEffect, useState } from "react";
import dayjs from "dayjs";
import Admin from "./Admin.jsx";
import {
  getAdminToken,
  setAdminSession,
  clearAdminSession,
  getAdminRemaining,
} from "../lib/adminSession.js";

const API = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
const HOURS = Number(import.meta.env.VITE_ADMIN_SESSION_HOURS || 8);

export default function AdminGate() {
  const [status, setStatus] = useState("checking"); // checking | need_login | ready
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(getAdminRemaining());

  // Al montar: si hay token válido y no vencido, valida contra API (sin renovar sesión)
  useEffect(() => {
    const t = getAdminToken();
    if (!t) return setStatus("need_login");
    validateToken(t, false); // NO renovar en F5
  }, []);

  // contador de tiempo restante (UI) y auto-logout
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

  // validateToken: si renew=true (login real) crea/renueva sesión; si no, conserva expiración
  async function validateToken(t, renew = false) {
    setError("");
    try {
      setStatus("checking");
      const date = dayjs().format("YYYY-MM-DD");
      const r = await fetch(`${API}/admin/appointments?date=${date}`, {
        headers: { "x-admin-token": t },
      });
      const j = await r.json();

      if (r.ok && j?.ok !== false) {
        const left = getAdminRemaining();
        const mustRenew = renew || left <= 0 || t !== getAdminToken();

        if (mustRenew) {
          // Login real o no hay sesión previa/expirada → fija nueva expiración
          setAdminSession(t, HOURS);
          setRemaining(getAdminRemaining());
        } else {
          // Mantener expiración actual (no resetea al refrescar)
          setRemaining(left);
        }

        setStatus("ready");
      } else {
        throw new Error(j?.error || "UNAUTHORIZED");
      }
    } catch {
      setError("Clave incorrecta.");
      setStatus("need_login");
    }
  }

  if (status === "ready") {
    // Banner de sesión en la parte superior
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");

    return (
      <div>
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
          <div className="container-page py-2 flex items-center justify-between">
            <span>
              Sesión admin expira en:{" "}
              <b>
                {h}:{mm}:{ss}
              </b>
            </span>
            <button
              onClick={() => {
                clearAdminSession();
                window.location.href = "/admin";
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200"
            >
              Salir
            </button>
          </div>
        </div>
        <Admin />
      </div>
    );
  }

  // Pantalla de login
  return (
    <div className="container-page">
      <div className="card max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold mb-1">
          Ingresar — <span className="text-[var(--brand)]">Admin</span>
        </h1>
        <p className="muted mb-4">
          Introduce la clave de administrador para continuar. La sesión dura{" "}
          <b>{HOURS} h</b>.
        </p>

        <label className="lbl">Clave secreta</label>
        <input
          type="password"
          placeholder="ADMIN_TOKEN"
          className="w-full px-3 py-2 rounded-xl border border-slate-300"
          onKeyDown={
            (e) =>
              e.key === "Enter" && validateToken(e.currentTarget.value, true) // renovar al autenticar
          }
        />

        {error && <p className="err mt-2">{error}</p>}

        <button
          onClick={() => {
            const input = document.querySelector("input[type='password']");
            validateToken(input?.value || "", true); // renovar al autenticar
          }}
          className="btn-primary mt-4"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}

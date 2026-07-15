import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import Admin from "./Admin.jsx";
import {
  getAdminToken,
  setAdminSession,
  clearAdminSession,
  getAdminRemaining,
} from "../lib/adminSession.js";

const API = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
const HOURS = Number(import.meta.env.VITE_ADMIN_SESSION_HOURS || 8);

const PASSKEY_SUPPORTED =
  typeof window !== "undefined" && !!window.PublicKeyCredential;

export default function AdminGate() {
  const [status, setStatus] = useState("checking"); // checking | need_login | ready
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(getAdminRemaining());

  // Passkeys (Windows Hello / huella / Face ID)
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [passkeys, setPasskeys] = useState([]);

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

  // Carga la lista de dispositivos (passkeys) registrados
  useEffect(() => {
    if (status !== "ready") return;
    loadPasskeys();
  }, [status]);

  async function loadPasskeys() {
    try {
      const r = await fetch(`${API}/admin/webauthn/credentials`, {
        headers: { "x-admin-token": getAdminToken() },
      });
      const j = await r.json();
      if (j?.ok) setPasskeys(j.credentials || []);
    } catch {
      // silencioso: la gestión de passkeys es opcional
    }
  }

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

  // Login con Windows Hello / huella / Face ID
  async function loginWithPasskey() {
    setPasskeyError("");
    setPasskeyBusy(true);
    try {
      const optsRes = await fetch(`${API}/webauthn/options`, { method: "POST" });
      const optsJson = await optsRes.json();
      if (!optsJson?.ok) throw new Error(optsJson?.error || "OPTIONS_FAILED");

      const authResponse = await startAuthentication({ optionsJSON: optsJson.options });

      const verifyRes = await fetch(`${API}/webauthn/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authResponse }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyJson?.ok || !verifyJson.token) {
        throw new Error(verifyJson?.error || "VERIFICATION_FAILED");
      }

      await validateToken(verifyJson.token, true);
    } catch (e) {
      if (e?.name !== "NotAllowedError") {
        setPasskeyError("No se pudo iniciar sesión con biometría. Usa tu clave.");
      }
    } finally {
      setPasskeyBusy(false);
    }
  }

  // Registra este dispositivo como passkey del admin
  async function registerPasskey() {
    setPasskeyError("");
    setPasskeyBusy(true);
    try {
      const optsRes = await fetch(`${API}/admin/webauthn/register-options`, {
        method: "POST",
        headers: { "x-admin-token": getAdminToken() },
      });
      const optsJson = await optsRes.json();
      if (!optsJson?.ok) throw new Error(optsJson?.error || "OPTIONS_FAILED");

      const regResponse = await startRegistration({ optionsJSON: optsJson.options });

      const deviceName = window.prompt(
        "Nombre para este dispositivo (ej. Windows Hello — escritorio):",
        "Este dispositivo"
      );
      if (deviceName === null) return; // cancelado

      const verifyRes = await fetch(`${API}/admin/webauthn/register-verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": getAdminToken(),
        },
        body: JSON.stringify({ response: regResponse, deviceName }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyJson?.ok) throw new Error(verifyJson?.error || "VERIFICATION_FAILED");

      await loadPasskeys();
    } catch (e) {
      if (e?.name !== "NotAllowedError") {
        setPasskeyError("No se pudo registrar el dispositivo.");
      }
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function deletePasskey(id) {
    if (!window.confirm("¿Eliminar este dispositivo?")) return;
    try {
      await fetch(`${API}/admin/webauthn/credentials/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": getAdminToken() },
      });
      await loadPasskeys();
    } catch {
      setPasskeyError("No se pudo eliminar el dispositivo.");
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
        {/* Banner de sesión — solo timer y salir */}
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
          <div className="container-page py-2 flex items-center justify-between">
            <span>
              Sesión admin expira en:{" "}
              <b>{h}:{mm}:{ss}</b>
            </span>
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

        {/* Navegación entre secciones del admin */}
        <div className="border-b border-slate-200 bg-white">
          <div className="container-page py-0">
            <nav className="flex gap-1 -mb-px">
              <a
                href="/admin"
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-brand-indigo text-brand-indigo transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Citas y horarios
              </a>
              <a
                href="/admin/catalogo"
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                Catálogo
              </a>
              <a
                href="/admin/metricas"
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                Métricas
              </a>
            </nav>
          </div>
        </div>

        {/* Seguridad: passkeys (Windows Hello / huella / Face ID) */}
        {PASSKEY_SUPPORTED && (
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="container-page py-3">
              <details>
                <summary className="cursor-pointer text-sm font-semibold text-slate-600">
                  Seguridad — Windows Hello / huella / Face ID
                </summary>
                <div className="mt-3 space-y-2">
                  {passkeyError && <p className="err text-sm">{passkeyError}</p>}
                  {passkeys.length > 0 ? (
                    <ul className="space-y-1">
                      {passkeys.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center justify-between text-sm bg-white border border-slate-200 rounded-lg px-3 py-2"
                        >
                          <span>
                            {p.device_name || "Dispositivo"}
                            {p.last_used_at && (
                              <span className="text-slate-400">
                                {" "}— último uso {dayjs(p.last_used_at).format("DD/MM/YYYY HH:mm")}
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => deletePasskey(p.id)}
                            className="text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No hay dispositivos registrados todavía.
                    </p>
                  )}
                  <button
                    onClick={registerPasskey}
                    disabled={passkeyBusy}
                    className="px-3 py-2 rounded-lg bg-brand-indigo text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Registrar este dispositivo
                  </button>
                </div>
              </details>
            </div>
          </div>
        )}

        <Admin />
      </div>
    );
  }

  // Pantalla de login
  return (
    <div className="container-page">
      <div className="card max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold mb-1">
          Ingresar — <span className="text-brand-indigo">Admin</span>
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
          className="w-full mt-4 py-3 rounded-xl bg-brand-indigo text-white font-bold shadow-lg shadow-indigo-200 hover:bg-brand-hover hover:shadow-xl transition-all"
        >
          Entrar
        </button>

        {PASSKEY_SUPPORTED && (
          <>
            <div className="flex items-center gap-3 my-4">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-xs text-slate-400 font-semibold uppercase">o</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <button
              onClick={loginWithPasskey}
              disabled={passkeyBusy}
              className="w-full py-3 rounded-xl border-2 border-brand-indigo text-brand-indigo font-bold hover:bg-indigo-50 transition-all disabled:opacity-50"
            >
              Iniciar sesión con Windows Hello / huella
            </button>

            {passkeyError && <p className="err mt-2">{passkeyError}</p>}
          </>
        )}
      </div>
    </div>
  );
}

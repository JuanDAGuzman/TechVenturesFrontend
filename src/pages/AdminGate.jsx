import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Fingerprint } from "lucide-react";
import Admin from "./Admin.jsx";
import AdminBar from "../components/admin/AdminBar.jsx";
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
  const [secOpen, setSecOpen] = useState(false);
  const [adminKey, setAdminKey] = useState("");

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
    return (
      <div>
        <AdminBar
          active="citas"
          remaining={remaining}
          onSecurity={PASSKEY_SUPPORTED ? () => setSecOpen((o) => !o) : undefined}
          securityOpen={secOpen}
        />

        {/* Seguridad: passkeys (Windows Hello / huella / Face ID) */}
        {PASSKEY_SUPPORTED && secOpen && (
          <div className="border-b border-slate-300 bg-white">
            <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-5 grid md:grid-cols-[1fr_auto] gap-5 items-start">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 mb-1">Seguridad</p>
                <p className="font-display font-bold text-lg text-slate-900">Windows Hello / huella / Face ID</p>
                <p className="text-sm text-slate-600 mt-1">Registra este dispositivo para entrar sin escribir la clave.</p>
                {passkeyError && <p className="err mt-2">{passkeyError}</p>}
                {passkeys.length > 0 ? (
                  <ul className="mt-4 divide-y divide-slate-200 border border-slate-300 rounded-[4px] bg-white">
                    {passkeys.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <span className="min-w-0">
                          <span className="font-semibold text-slate-900">{p.device_name || "Dispositivo"}</span>
                          {p.last_used_at && (
                            <span className="text-slate-500">
                              {" "}· último uso {dayjs(p.last_used_at).format("DD/MM/YYYY h:mm A")}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => deletePasskey(p.id)}
                          className="shrink-0 text-xs font-bold uppercase tracking-wide text-rose-700 hover:underline"
                        >
                          Eliminar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 mt-4">No hay dispositivos registrados todavía.</p>
                )}
              </div>
              <button
                onClick={registerPasskey}
                disabled={passkeyBusy}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[3px] bg-slate-900 text-white text-xs font-bold uppercase tracking-wide hover:bg-brand-indigo disabled:opacity-50 transition-colors"
              >
                <Fingerprint className="w-4 h-4" /> Registrar este dispositivo
              </button>
            </div>
          </div>
        )}

        <Admin />
      </div>
    );
  }

  // Pantalla de login
  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-10 sm:py-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center">
      <div>
        <img
          src="/logo-mark.png"
          alt=""
          aria-hidden="true"
          width={250}
          height={245}
          className="w-20 sm:w-24 h-auto select-none"
          style={{ mixBlendMode: "multiply" }}
        />
        <p className="font-mono text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] text-slate-600 mt-6">
          Acceso restringido
        </p>
        <h1 className="font-display font-bold text-slate-900 tracking-tight leading-[0.98] text-[44px] sm:text-6xl mt-3 max-w-[12ch]" style={{ textWrap: "balance" }}>
          Panel de <span className="brand-text italic font-normal">administración</span>.
        </h1>
        <p className="text-slate-700 text-base mt-5 max-w-[42ch] leading-relaxed">
          Gestiona las citas, el catálogo y las métricas de TechVenturesCO. La sesión dura <b>{HOURS} h</b>.
        </p>
      </div>

      <div className="card w-full max-w-md lg:max-w-none">
        <label className="lbl" htmlFor="admin-key">Clave de administrador</label>
        <input
          id="admin-key"
          type="password"
          autoComplete="current-password"
          placeholder="Escribe tu clave"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && validateToken(adminKey, true)}
          className="w-full px-3 py-3 rounded-[3px] border border-slate-400 bg-white outline-none placeholder:text-slate-500"
        />

        {error && <p className="err mt-2">{error}</p>}

        <button onClick={() => validateToken(adminKey, true)} className="btn-primary mt-4">
          Entrar
        </button>

        {PASSKEY_SUPPORTED && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="h-px bg-slate-300 flex-1" />
              <span className="font-mono text-[11px] text-slate-500 font-semibold uppercase tracking-widest">o</span>
              <div className="h-px bg-slate-300 flex-1" />
            </div>

            <button
              onClick={loginWithPasskey}
              disabled={passkeyBusy}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-[3px] border border-slate-900 text-slate-900 text-[13px] font-bold uppercase tracking-wide hover:bg-slate-900 hover:text-white transition-colors disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4" /> Entrar con Windows Hello / huella
            </button>

            {passkeyError && <p className="err mt-2">{passkeyError}</p>}
          </>
        )}
      </div>
    </div>
  );
}

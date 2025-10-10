const KEY = "adminToken";
const EXP = "adminTokenExp";

/** Horas de sesión (puedes cambiarlo con VITE_ADMIN_SESSION_HOURS) */
const DEFAULT_HOURS = Number(import.meta.env.VITE_ADMIN_SESSION_HOURS || 8);

/** Guarda token + expiración (ahora + hours) */
export function setAdminSession(token, hours = DEFAULT_HOURS) {
  const exp = Date.now() + hours * 60 * 60 * 1000;
  localStorage.setItem(KEY, token);
  localStorage.setItem(EXP, String(exp));
}

/** Devuelve token si NO está vencido; si vencido, limpia y devuelve "" */
export function getAdminToken() {
  const t = localStorage.getItem(KEY) || "";
  const exp = Number(localStorage.getItem(EXP) || 0);
  if (!t || !exp || Date.now() > exp) {
    clearAdminSession();
    return "";
  }
  return t;
}

/** Tiempo restante en ms (0 si no hay sesión o está vencida) */
export function getAdminRemaining() {
  const exp = Number(localStorage.getItem(EXP) || 0);
  const left = exp - Date.now();
  return left > 0 ? left : 0;
}

/** Limpia sesión */
export function clearAdminSession() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(EXP);
}

// frontend/src/api.js
const API = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

/* ================== Público ================== */
export async function getAvailability(date, type) {
  const res = await fetch(`${API}/availability?date=${date}&type=${type}`);
  return res.json();
}

export async function createAppointment(payload) {
  const res = await fetch(`${API}/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/* ====== Sábados (ya lo tenías, se mantiene) ====== */
export async function setSaturdayWindows(date, ranges, adminToken) {
  const res = await fetch(`${API}/admin/saturday-windows`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify({ date, ranges }),
  });
  return res.json();
}

/* ========= L–D: Ventanas manuales (appt_windows) ========= */
/* Usa SIEMPRE estos para abrir/editar/eliminar/listar
   ventanas de TRYOUT / PICKUP cualquier día (incluye domingos) */

function adminHeaders(token) {
  return {
    "Content-Type": "application/json",
    "x-admin-token": token || "",
  };
}

export async function adminListWindows(date, type, token) {
  const qs = new URLSearchParams({ date });
  if (type) qs.set("type", type);
  const res = await fetch(`${API}/admin/windows?${qs.toString()}`, {
    headers: { "x-admin-token": token || "" },
  });
  return res.json();
}

export async function adminCreateWindow(payload, token) {
  // payload: { date, type_code: 'TRYOUT'|'PICKUP', start_time:'HH:MM', end_time:'HH:MM', slot_minutes:15|20|30 }
  const res = await fetch(`${API}/admin/windows`, {
    method: "POST",
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminUpdateWindow(id, patch, token) {
  // patch puede tener: { start_time?, end_time?, slot_minutes? }
  const res = await fetch(`${API}/admin/windows/${id}`, {
    method: "PATCH",
    headers: adminHeaders(token),
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function adminDeleteWindow(id, token) {
  const res = await fetch(`${API}/admin/windows/${id}`, {
    method: "DELETE",
    headers: { "x-admin-token": token || "" },
  });
  return res.json();
}

import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { getAdminToken } from "../lib/adminSession.js";
import {
  adminListWindows,
  adminCreateWindow,
  adminUpdateWindow,
  adminDeleteWindow,
} from "../api.js";

/* =======================
   API base robusta
   ======================= */
const API = (
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API ??
  window.__API_BASE__ ??
  "http://localhost:4000/api"
).replace(/\/+$/, "");

/* =======================
   Helpers UI
   ======================= */
function mapTypeEs(code) {
  switch (code) {
    case "TRYOUT":
      return "Ensayar";
    case "PICKUP":
      return "Sin ensayar";
    case "SHIPPING":
      return "Envío";
    default:
      return code || "-";
  }
}
function mapMethodEs(code) {
  switch (code) {
    case "IN_PERSON":
      return "En persona";
    case "SHIPPING":
      return "Envío (no contraentrega)";
    default:
      return code || "-";
  }
}
function mapStatusEs(code) {
  switch (code) {
    case "CONFIRMED":
      return "Confirmada";
    case "CANCELLED":
      return "Cancelada";
    case "DONE":
      return "Atendida";
    case "SHIPPED":
      return "Enviada";
    default:
      return code || "-";
  }
}
function statusBadgeClass(code) {
  switch (code) {
    case "CONFIRMED":
      return "bg-amber-100 text-amber-800";
    case "DONE":
      return "bg-sky-100 text-sky-800";
    case "SHIPPED":
      return "bg-emerald-100 text-emerald-800";
    case "CANCELLED":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
const fmt = (hhmm) => (hhmm || "").slice(0, 5);

/* Intenta parsear JSON sin romper UI si el backend devolvió HTML */
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: `HTTP_${res.status}` };
  }
}

/* =======================
   Página Admin
   ======================= */
export default function AdminPage() {
  const [token, setToken] = useState(getAdminToken());
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState({});
  const [toast, setToast] = useState("");
  const [showToken, setShowToken] = useState(false);

  // Sábado
  const [satDate, setSatDate] = useState(() => {
    const d = dayjs();
    const nextSat = d.day() <= 6 ? d.day(6) : d.add(1, "week").day(6);
    return nextSat.format("YYYY-MM-DD");
  });
  const [ranges, setRanges] = useState([{ start: "08:00", end: "11:00" }]);
  const [savedRanges, setSavedRanges] = useState([]);
  // edición puntual de sábado
  const [satEditId, setSatEditId] = useState(null);
  const [satEdit, setSatEdit] = useState({ start: "", end: "" });

  // Weekday manual (L–V)
  const [wDate, setWDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [wType, setWType] = useState("TRYOUT");
  const [wStart, setWStart] = useState("20:00");
  const [wEnd, setWEnd] = useState("20:15");
  const [wSaved, setWSaved] = useState([]);
  // edición puntual de L–V
  const [wEditId, setWEditId] = useState(null);
  const [wEdit, setWEdit] = useState({ start: "", end: "" });

  // Modal cita
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(null);
  const [slotSizeSat, setSlotSizeSat] = useState(15);
  const [slotSizeW, setSlotSizeW] = useState(15);

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", "x-admin-token": token }),
    [token]
  );

  /* ===== Cargar citas ===== */
  useEffect(() => {
    setToast("");
    if (token) fetchAppts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, date]);

  async function fetchAppts() {
    if (!token) return setToast("Ingresa el token admin.");
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/appointments?date=${date}`, {
        headers,
      });
      const j = await safeJson(r);
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "HTTP_ERROR");
      setRows(j.items || []);
      setSelected({});
      setToast(j.items?.length ? "" : "No hay citas para la fecha.");
    } catch (e) {
      console.error("[fetchAppts]", e);
      setRows([]);
      setToast("No se pudieron cargar las citas.");
    } finally {
      setLoading(false);
    }
  }

  /* ===== Ship (envío) ===== */
  async function markAsShipped() {
    try {
      if (!editingId) throw new Error("NO_EDITING_ID");

      const isPicap =
        String(form.shipping_carrier || "").toUpperCase() === "PICAP";

      // normaliza costo: null si vacío
      const costStr = (form._shipping_cost_tmp ?? "").toString().trim();
      const costVal =
        costStr === "" ? null : Number(costStr.replace(/[^\d.-]/g, ""));

      const payload = isPicap
        ? {
            shipping_trip_link: (form._shipping_trip_link_tmp || "").trim(),
            ...(costVal === null ? {} : { shipping_cost: costVal }),
          }
        : {
            tracking_number: (form._tracking_number_tmp || "").trim(),
            ...(costVal === null ? {} : { shipping_cost: costVal }),
          };

      if (isPicap && !payload.shipping_trip_link) {
        alert("Falta el link del viaje PICAP.");
        return;
      }
      if (!isPicap && !payload.tracking_number) {
        alert("Falta el número de guía.");
        return;
      }

      const r = await fetch(`${API}/admin/appointments/${editingId}/ship`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
      const j = await safeJson(r);
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "HTTP_ERROR");

      setForm((prev) => ({
        ...prev,
        status: "SHIPPED",
        tracking_number:
          j.item?.tracking_number ??
          (isPicap ? null : payload.tracking_number) ??
          prev.tracking_number ??
          null,
        shipping_cost:
          j.item?.shipping_cost ?? costVal ?? prev.shipping_cost ?? null,
        shipping_trip_link:
          j.item?.shipping_trip_link ??
          (isPicap ? payload.shipping_trip_link : prev.shipping_trip_link) ??
          null,
        _tracking_number_tmp: "",
        _shipping_cost_tmp: "",
        _shipping_trip_link_tmp: "",
      }));
      setToast("Envío marcado como enviado y correos enviados.");
    } catch (e) {
      console.error("markAsShipped error:", e);
      setToast(String(e?.message || "No se pudo marcar como enviado."));
    }
  }

  /* ===== Crud tabla ===== */
  function toggle(id) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function delSelected() {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (!ids.length) return setToast("No hay elementos seleccionados.");
    if (!confirm(`Eliminar ${ids.length} cita(s)?`)) return;

    try {
      setLoading(true);
      const r = await fetch(`${API}/admin/appointments`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({ ids }),
      });
      const j = await safeJson(r);
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "HTTP_ERROR");
      setToast(`Eliminadas: ${ids.length}`);
      await fetchAppts();
    } catch (e) {
      console.error("[delSelected]", e);
      setToast("No se pudieron eliminar.");
    } finally {
      setLoading(false);
    }
  }

  /* ===== SÁBADO ===== */
  useEffect(() => {
    if (!token || !satDate) return;
    fetchSaturdayRanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, satDate]);

  async function fetchSaturdayRanges() {
    try {
      const r = await fetch(`${API}/admin/saturday-windows?date=${satDate}`, {
        headers,
      });
      const j = await safeJson(r);
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "HTTP_ERROR");
      const items = Array.isArray(j.items) ? j.items : [];
      setSavedRanges(
        items.map((it) => ({
          id: it.id,
          start: it.start_time,
          end: it.end_time,
        }))
      );
      if (items.length) {
        setRanges(
          items.map((it) => ({ start: it.start_time, end: it.end_time }))
        );
        setToast("Disponibilidad cargada.");
      } else {
        setRanges([{ start: "08:00", end: "11:00" }]);
        setToast("No hay disponibilidad guardada para ese sábado.");
      }
      setSatEditId(null);
    } catch (e) {
      console.error("[fetchSaturdayRanges]", e);
      setToast("No se pudo cargar la disponibilidad de sábado.");
    }
  }

  function addRange() {
    setRanges((rs) => [...rs, { start: "08:00", end: "11:00" }]);
  }
  function setRange(i, k, v) {
    setRanges((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  }
  function removeRange(i) {
    setRanges((rs) => rs.filter((_, idx) => idx !== i));
  }

  // Guarda TODOS los rangos editables del editor de abajo (POST replace-all)
  function toMin(hhmm) {
    const [h, m] = String(hhmm || "")
      .split(":")
      .map(Number);
    return h * 60 + m;
  }

  async function saveSaturday() {
    try {
      setLoading(true);

      const clean = (ranges || [])
        .map((r) => ({
          start: String(r.start || "").slice(0, 5),
          end: String(r.end || "").slice(0, 5),
        }))
        .filter(
          (r) =>
            /^\d{2}:\d{2}$/.test(r.start) &&
            /^\d{2}:\d{2}$/.test(r.end) &&
            toMin(r.start) < toMin(r.end) // <— comparación por minutos
        );

      if (!clean.length) {
        setLoading(false);
        setToast("Rango inválido. Revisa horas (HH:MM) y que inicio < fin.");
        return;
      }

      const r = await fetch(`${API}/admin/saturday-windows`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          date: satDate,
          ranges: clean.map((rr) => ({ ...rr, slot_minutes: slotSizeSat })),
        }),
      });

      const j = await safeJson(r);
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "ERROR");
      setToast("Disponibilidad de sábado guardada.");
      await fetchSaturdayRanges();
    } catch (e) {
      console.error("[saveSaturday]", e);
      setToast("No se pudo guardar la disponibilidad.");
    } finally {
      setLoading(false);
    }
  }

  // Edición puntual de un rango guardado (POST replace-all con el rango modificado)
  async function satSaveEdit() {
    try {
      if (
        !/^\d{2}:\d{2}$/.test(satEdit.start) ||
        !/^\d{2}:\d{2}$/.test(satEdit.end) ||
        satEdit.start >= satEdit.end
      ) {
        setToast("Hora inválida (usa HH:MM y que inicio < fin).");
        return;
      }
      const newRanges = savedRanges.map((r) =>
        r.id === satEditId
          ? { start: satEdit.start, end: satEdit.end }
          : { start: r.start, end: r.end }
      );
      const r = await fetch(`${API}/admin/saturday-windows`, {
        method: "POST",
        headers,
        body: JSON.stringify({ date: satDate, ranges: newRanges }),
      });
      const j = await safeJson(r);
      if (!r.ok || j?.ok === false) throw new Error("ERROR");
      setToast("Rango actualizado.");
      setSatEditId(null);
      await fetchSaturdayRanges();
    } catch (e) {
      console.error("[satSaveEdit]", e);
      setToast("No se pudo actualizar el rango.");
    }
  }

  async function deleteSaturday() {
    if (!confirm("¿Eliminar TODAS las ventanas de este sábado?")) return;
    try {
      setLoading(true);
      const r = await fetch(`${API}/admin/saturday-windows?date=${satDate}`, {
        method: "DELETE",
        headers,
      });
      const j = await safeJson(r);
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "ERROR");
      setSavedRanges([]);
      setRanges([{ start: "08:00", end: "11:00" }]);
      setToast("Disponibilidad eliminada para ese sábado.");
    } catch (e) {
      console.error("[deleteSaturday]", e);
      setToast("No se pudo eliminar la disponibilidad.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSavedRange(id) {
    if (!confirm("¿Eliminar este rango?")) return;
    try {
      const r = await fetch(`${API}/admin/saturday-windows/${id}`, {
        method: "DELETE",
        headers,
      });
      const j = await safeJson(r);
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "ERROR");
      setToast("Rango eliminado.");
      await fetchSaturdayRanges();
    } catch (e) {
      console.error("[deleteSavedRange]", e);
      setToast("No se pudo eliminar el rango.");
    }
  }

  /* ===== WEEKDAY (L–V) ===== */
  useEffect(() => {
    if (!token || !wDate || !wType) return;
    fetchWeekdayWindows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, wDate, wType]);

  async function fetchWeekdayWindows() {
    try {
      const j = await adminListWindows(wDate, wType, token);
      // backend devuelve: { ok: true, rows: [...] }
      const items = Array.isArray(j.rows) ? j.rows : [];
      // Normaliza para la UI
      setWSaved(
        items.map((r) => ({
          id: r.id,
          start: String(r.start_time).slice(0, 5),
          end: String(r.end_time).slice(0, 5),
          slot: Number(r.slot_minutes) || 15,
        }))
      );
      setWEditId(null);
    } catch (e) {
      console.error("[windows][GET]", e);
      setWSaved([]);
    }
  }

  async function addWeekdayWindow() {
    try {
      // Validación robusta (formato y que inicio < fin en minutos)
      const ok =
        /^\d{2}:\d{2}$/.test(wStart) &&
        /^\d{2}:\d{2}$/.test(wEnd) &&
        toMin(wStart) < toMin(wEnd);

      if (!ok) {
        setToast("Rango inválido. Revisa horas (HH:MM) y que inicio < fin.");
        return;
      }

      const payload = {
        date: wDate,
        type_code: wType, // << OJO: type_code (TRYOUT | PICKUP)
        start_time: wStart,
        end_time: wEnd,
        slot_minutes: Number(slotSizeW) || 15, // 15 | 20 | 30
      };

      const j = await adminCreateWindow(payload, token);
      if (j?.ok === false) throw new Error(j?.error || "CREATE_ERROR");

      setToast("Horario abierto.");
      await fetchWeekdayWindows();
    } catch (e) {
      console.error("[windows][POST]", e);
      setToast("No se pudo abrir el horario.");
    }
  }

  // Editar una ventana L–V guardada: POST nuevo + DELETE viejo
  async function wSaveEdit() {
    try {
      if (
        !/^\d{2}:\d{2}$/.test(wEdit.start) ||
        !/^\d{2}:\d{2}$/.test(wEdit.end) ||
        wEdit.start >= wEdit.end
      ) {
        setToast("Hora inválida (usa HH:MM y que inicio < fin).");
        return;
      }

      const patch = {
        start_time: wEdit.start,
        end_time: wEdit.end,
        // Si quieres, puedes permitir cambiar el tamaño del bloque aquí:
        // slot_minutes: Number(slotSizeW) || 15,
      };

      const j = await adminUpdateWindow(wEditId, patch, token);
      if (j?.ok === false) throw new Error(j?.error || "PATCH_ERROR");

      setToast("Ventana actualizada.");
      setWEditId(null);
      await fetchWeekdayWindows();
    } catch (e) {
      console.error("[windows][PATCH]", e);
      setToast("No se pudo actualizar la ventana.");
    }
  }

  async function delWeekdayWindow(id) {
    if (!confirm("¿Eliminar esta ventana manual?")) return;
    try {
      const j = await adminDeleteWindow(id, token);
      if (j?.ok === false) throw new Error(j?.error || "DELETE_ERROR");

      setToast("Ventana eliminada.");
      await fetchWeekdayWindows();
    } catch (e) {
      console.error("[windows][DELETE]", e);
      setToast("No se pudo eliminar la ventana.");
    }
  }

  /* ===== Modal Cita ===== */
  async function openEditor(id) {
    try {
      const r = await fetch(`${API}/admin/appointments/${id}`, { headers });
      const j = await safeJson(r);
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "HTTP_ERROR");
      const item = j.item || j.data || j.appointment || j;
      if (!item || !item.id) throw new Error("NO_ITEM_IN_RESPONSE");

      setForm({
        ...item,
        customer_name: item.customer_name || "",
        customer_id_number: item.customer_id_number || "",
        customer_email: item.customer_email || "",
        customer_phone: item.customer_phone || "",
        product: item.product || "",
        notes: item.notes || "",

        // shipping guardados
        shipping_address: item.shipping_address || "",
        shipping_neighborhood: item.shipping_neighborhood || "",
        shipping_city: item.shipping_city || "",
        shipping_carrier: item.shipping_carrier || "",
        tracking_number: item.tracking_number || "",
        shipping_cost: item.shipping_cost ?? null,
        shipping_trip_link: item.shipping_trip_link || "",

        shipped_at: item.shipped_at || null,

        // temporales (inputs)
        _tracking_number_tmp: "",
        _shipping_cost_tmp:
          item.shipping_cost == null ? "" : String(item.shipping_cost),
        _shipping_trip_link_tmp: item.shipping_trip_link || "",
      });

      setEditingId(id);
      setOpen(true);
      setToast("");
    } catch (e) {
      console.error("openEditor error:", e);
      setToast("No se pudo abrir la cita.");
    }
  }

  async function saveEditor() {
    try {
      const payload = {
        customer_name: form.customer_name,
        customer_id_number: form.customer_id_number,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        product: form.product,
        notes: form.notes,
        status: form.status,
        delivery_method: form.delivery_method,
      };
      if (form.delivery_method === "SHIPPING") {
        payload.shipping_address = form.shipping_address;
        payload.shipping_neighborhood = form.shipping_neighborhood;
        payload.shipping_city = form.shipping_city;
        payload.shipping_carrier = form.shipping_carrier;
      }
      const r = await fetch(`${API}/admin/appointments/${editingId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
      const j = await safeJson(r);
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "ERROR");
      setOpen(false);
      setEditingId("");
      await fetchAppts();
      setToast("Cita actualizada.");
    } catch (e) {
      console.error("saveEditor", e);
      setToast("No se pudo actualizar la cita.");
    }
  }

  /* ===== Render ===== */
  return (
    <div className="container-page">
      <div className="card relative overflow-hidden">
        <div className="absolute left-0 right-0 top-0 h-1 bg-[var(--brand)]" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Admin — <span className="text-[var(--brand)]">TechVenturesCO</span>
        </h1>
        <p className="text-slate-500 mt-1">
          Gestión de citas y disponibilidad de sábados / huecos manuales.
        </p>
      </div>

      {/* Token + Fecha */}
      <section className="card grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="lbl">Token admin</label>
          <div className="flex gap-2">
            <input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="x-admin-token"
              autoComplete="new-password"
              spellCheck={false}
              className="w-full flex-1 px-3 py-3 rounded-xl border border-slate-300"
            />
            <button
              type="button"
              onClick={() => setShowToken((s) => !s)}
              className="px-3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 whitespace-nowrap"
              title={showToken ? "Ocultar token" : "Mostrar token"}
            >
              {showToken ? "Ocultar" : "Mostrar"}
            </button>
          </div>
          <p className="muted mt-1">
            Se guarda en tu navegador. Debe coincidir con{" "}
            <code>ADMIN_TOKEN</code> del backend.
          </p>
        </div>
        <div>
          <label className="lbl">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-3 rounded-xl border border-slate-300"
          />
        </div>
      </section>

      {/* Tabla Citas */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Citas del día</h2>
          <div className="flex gap-3">
            <button
              onClick={fetchAppts}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200"
            >
              Actualizar
            </button>
            <button
              onClick={delSelected}
              className="px-4 py-2 rounded-xl text-white bg-rose-600 hover:bg-rose-700"
            >
              Eliminar seleccionadas
            </button>
          </div>
        </div>

        {loading ? (
          <p className="muted">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="muted">No hay citas para la fecha.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-600">
                <tr>
                  <th className="py-3 px-2">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const m = {};
                        rows.forEach((r) => (m[r.id] = checked));
                        setSelected(m);
                      }}
                    />
                  </th>
                  <th className="py-3 px-2">Tipo</th>
                  <th className="py-3 px-2">Hora</th>
                  <th className="py-3 px-2">Cliente</th>
                  <th className="py-3 px-2">Contacto</th>
                  <th className="py-3 px-2">Producto</th>
                  <th className="py-3 px-2">Método</th>
                  <th className="py-3 px-2">Estado</th>
                  <th className="py-3 px-2"></th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={!!selected[r.id]}
                        onChange={() => toggle(r.id)}
                      />
                    </td>

                    <td className="py-3 px-2">
                      <span className="inline-flex px-2 py-1 rounded-full bg-slate-100">
                        {mapTypeEs(r.type_code)}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      {r.start_time
                        ? `${fmt(r.start_time)}–${fmt(r.end_time)}`
                        : "—"}
                    </td>

                    <td className="py-3 px-2">{r.customer_name}</td>

                    <td className="py-3 px-2">
                      <a
                        className="text-blue-600 hover:underline"
                        href={`mailto:${r.customer_email}`}
                      >
                        {r.customer_email}
                      </a>
                      {" / "}
                      <a
                        className="text-blue-600 hover:underline"
                        href={`tel:${r.customer_phone}`}
                      >
                        {r.customer_phone}
                      </a>
                    </td>

                    <td className="py-3 px-2">{r.product || "-"}</td>

                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full ${
                          r.delivery_method === "SHIPPING"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {mapMethodEs(r.delivery_method)}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full ${statusBadgeClass(
                          r.status
                        )}`}
                      >
                        {mapStatusEs(r.status)}
                      </span>
                    </td>

                    <td className="py-3 px-2">
                      <button
                        onClick={() => openEditor(r.id)}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                      >
                        Ver / Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {toast && <p className="mt-3">{toast}</p>}
      </section>

      {/* Sábado */}
      <section className="card" id="sat-editor">
        <h2 className="font-bold text-lg mb-3">
          Configurar disponibilidad de sábado
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div>
            <label className="lbl">Fecha de sábado</label>
            <input
              type="date"
              value={satDate}
              onChange={(e) => setSatDate(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-slate-300"
            />
            <p className="muted mt-1">Selecciona el sábado a editar.</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-slate-600 mb-1">
            Disponibilidad guardada para{" "}
            <b>{dayjs(satDate).format("DD/MM/YYYY")}</b>
          </div>
          {savedRanges.length === 0 ? (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm">
              Sin disponibilidad
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {savedRanges.map((r) => (
                <div
                  key={r.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm w-fit"
                >
                  {satEditId === r.id ? (
                    <>
                      <input
                        type="time"
                        step={60}
                        title="Usa formato 24h. 12:00 es mediodía; 00:00 es medianoche."
                        value={satEdit.start}
                        onChange={(e) =>
                          setSatEdit((s) => ({ ...s, start: e.target.value }))
                        }
                        className="px-2 py-1 rounded border border-emerald-300"
                      />
                      <span>—</span>
                      <input
                        type="time"
                        step={60}
                        title="Usa formato 24h. 12:00 es mediodía; 00:00 es medianoche."
                        value={satEdit.end}
                        onChange={(e) =>
                          setSatEdit((s) => ({ ...s, end: e.target.value }))
                        }
                        className="px-2 py-1 rounded border border-emerald-300"
                      />
                      <button
                        className="px-2 py-0.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={satSaveEdit}
                      >
                        Guardar
                      </button>
                      <button
                        className="px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200"
                        onClick={() => setSatEditId(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">
                        {fmt(r.start)}–{fmt(r.end)}
                      </span>
                      <button
                        className="px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200"
                        onClick={() => {
                          setSatEditId(r.id);
                          setSatEdit({ start: r.start, end: r.end });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="px-2 py-0.5 rounded-md text-white bg-rose-600 hover:bg-rose-700"
                        onClick={() => deleteSavedRange(r.id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de rangos (Sábado) */}
        <div className="flex flex-col gap-3">
          {ranges.map((r, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-2 md:gap-3 p-2 rounded-xl border border-slate-200 bg-slate-50"
            >
              <input
                type="time"
                step={60}
                title="Usa formato 24h. 12:00 es mediodía; 00:00 es medianoche."
                value={r.start}
                onChange={(e) => setRange(i, "start", e.target.value)}
                className="min-w-[9.5rem] px-3 py-2 rounded-xl border border-slate-300"
              />
              <span className="text-slate-400">—</span>
              <input
                type="time"
                step={60}
                title="Usa formato 24h. 12:00 es mediodía; 00:00 es medianoche."
                value={r.end}
                onChange={(e) => setRange(i, "end", e.target.value)}
                className="min-w-[9.5rem] px-3 py-2 rounded-xl border border-slate-300"
              />

              <button
                onClick={() => removeRange(i)}
                className="ml-auto px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200"
                title="Eliminar este rango"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            onClick={addRange}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            Agregar rango
          </button>

          {/* NUEVO: tamaño de bloque para los rangos que vas a guardar */}
          <select
            value={slotSizeSat}
            onChange={(e) => setSlotSizeSat(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-300"
            title="Tamaño de cada bloque (solo afecta a cómo se partirán los turnos presenciales)"
          >
            <option value={15}>Bloques de 15 min</option>
            <option value={20}>Bloques de 20 min</option>
            <option value={30}>Bloques de 30 min</option>
          </select>

          <button
            onClick={saveSaturday}
            className="px-4 py-2 rounded-xl text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)]"
          >
            Guardar
          </button>

          <button
            onClick={deleteSaturday}
            className="px-4 py-2 rounded-xl text-white bg-rose-600 hover:bg-rose-700"
            title="Eliminar todas las ventanas de este sábado"
          >
            Eliminar todo
          </button>
        </div>
      </section>

      {/* Weekday manual (L–V) */}
      <section className="card">
        <h2 className="font-bold text-lg mb-3">Abrir horario manual (L–V)</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="lbl">Fecha</label>
            <input
              type="date"
              value={wDate}
              onChange={(e) => setWDate(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="lbl">Tipo</label>
            <select
              value={wType}
              onChange={(e) => setWType(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-slate-300"
            >
              <option value="TRYOUT">Ensayar (TRYOUT)</option>
              <option value="PICKUP">Sin ensayar (PICKUP)</option>
            </select>
          </div>

          <div>
            <label className="lbl">Desde</label>
            <input
              type="time"
              step={60}
              title="Usa formato 24h. 12:00 es mediodía; 00:00 es medianoche."
              value={wStart}
              onChange={(e) => setWStart(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="lbl">Hasta</label>
            <input
              type="time"
              step={60}
              title="Usa formato 24h. 12:00 es mediodía; 00:00 es medianoche."
              value={wEnd}
              onChange={(e) => setWEnd(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-slate-300"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            onClick={addWeekdayWindow}
            className="px-4 py-2 rounded-xl text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)]"
          >
            Abrir horario
          </button>

          {/* tamaño de bloque L–V */}
          <select
            value={slotSizeW}
            onChange={(e) => setSlotSizeW(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-300"
            title="Tamaño de cada bloque"
          >
            <option value={15}>Bloques de 15 min</option>
            <option value={20}>Bloques de 20 min</option>
            <option value={30}>Bloques de 30 min</option>
          </select>

          <button
            onClick={fetchWeekdayWindows}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            Actualizar
          </button>
        </div>

        <div className="mt-4">
          <div className="text-sm text-slate-600 mb-1">
            Abiertos para <b>{dayjs(wDate).format("DD/MM/YYYY")}</b> — {wType}
          </div>

          {wSaved.length === 0 ? (
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm">
              Sin ventanas manuales
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {wSaved.map((r) => (
                <div
                  key={r.id}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm w-fit"
                >
                  {wEditId === r.id ? (
                    <>
                      <input
                        type="time"
                        step={60}
                        title="Usa formato 24h. 12:00 es mediodía; 00:00 es medianoche."
                        value={wEdit.start}
                        onChange={(e) =>
                          setWEdit((s) => ({ ...s, start: e.target.value }))
                        }
                        className="px-2 py-1 rounded border border-indigo-300"
                      />
                      <span>—</span>
                      <input
                        type="time"
                        step={60}
                        title="Usa formato 24h. 12:00 es mediodía; 00:00 es medianoche."
                        value={wEdit.end}
                        onChange={(e) =>
                          setWEdit((s) => ({ ...s, end: e.target.value }))
                        }
                        className="px-2 py-1 rounded border border-indigo-300"
                      />
                      <button
                        className="px-2 py-0.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                        onClick={wSaveEdit}
                      >
                        Guardar
                      </button>
                      <button
                        className="px-2 py-0.5 rounded-md bg-indigo-100 hover:bg-indigo-200"
                        onClick={() => setWEditId(null)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">
                        {r.start}–{r.end}
                      </span>
                      {typeof r.slot === "number" ? (
                        <span className="text-xs text-slate-500 ml-2">
                          · {r.slot} min
                        </span>
                      ) : null}
                      <button
                        className="px-2 py-0.5 rounded-md bg-indigo-100 hover:bg-indigo-200"
                        onClick={() => {
                          setWEditId(r.id);
                          setWEdit({ start: r.start, end: r.end });
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="px-2 py-0.5 rounded-md text-white bg-rose-600 hover:bg-rose-700"
                        onClick={() => delWeekdayWindow(r.id)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal Ver/Editar Cita */}
      {open && form && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Header fijo */}
              <div className="px-6 py-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
                <h3 className="font-bold text-lg">
                  Cita —{" "}
                  <span className="text-[var(--brand)]">
                    {mapTypeEs(form.type_code)}
                  </span>
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  ×
                </button>
              </div>

              {/* Contenido */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto">
                <div>
                  <label className="lbl">Nombre</label>
                  <input
                    className="w-full px-3 py-3 rounded-xl border border-slate-300"
                    value={form.customer_name}
                    onChange={(e) =>
                      setForm({ ...form, customer_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="lbl">Cédula</label>
                  <input
                    className="w-full px-3 py-3 rounded-xl border border-slate-300"
                    value={form.customer_id_number}
                    onChange={(e) =>
                      setForm({ ...form, customer_id_number: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="lbl">Correo</label>
                  <input
                    className="w-full px-3 py-3 rounded-xl border border-slate-300"
                    value={form.customer_email}
                    onChange={(e) =>
                      setForm({ ...form, customer_email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="lbl">Celular</label>
                  <input
                    className="w-full px-3 py-3 rounded-xl border border-slate-300"
                    value={form.customer_phone}
                    onChange={(e) =>
                      setForm({ ...form, customer_phone: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="lbl">Producto</label>
                  <input
                    className="w-full px-3 py-3 rounded-xl border border-slate-300"
                    value={form.product}
                    onChange={(e) =>
                      setForm({ ...form, product: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="lbl">Notas</label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-3 rounded-xl border border-slate-300"
                    placeholder="Observaciones que dejó el cliente o notas internas…"
                    value={form.notes || ""}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                  <p className="muted mt-1">
                    Se guarda en la cita y aparece en los correos internos si
                    existe.
                  </p>
                </div>

                <div>
                  <label className="lbl">Estado</label>
                  <select
                    className="w-full px-3 py-3 rounded-xl border border-slate-300"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="CONFIRMED">CONFIRMADA</option>
                    <option value="CANCELLED">CANCELADA</option>
                    <option value="DONE">ATENDIDA</option>
                    <option value="SHIPPED">ENVIADA</option>
                  </select>
                </div>

                <div>
                  <label className="lbl">Método</label>
                  <select
                    className="w-full px-3 py-3 rounded-xl border border-slate-300"
                    value={form.delivery_method}
                    onChange={(e) =>
                      setForm({ ...form, delivery_method: e.target.value })
                    }
                  >
                    <option value="IN_PERSON">En persona</option>
                    <option value="SHIPPING">Envío (no contraentrega)</option>
                  </select>
                </div>

                {/* Si YA fue enviada: mostrar registro */}
                {form.status === "SHIPPED" ? (
                  <>
                    <div className="md:col-span-2">
                      <div className="py-2 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm mb-2">
                        Envío registrado
                      </div>
                    </div>

                    {String(form.shipping_carrier || "").toUpperCase() ===
                    "PICAP" ? (
                      <>
                        <div className="md:col-span-2 text-sm text-slate-700">
                          <b>Transportadora:</b> PICAP
                        </div>
                        {form.shipping_cost != null && (
                          <div className="md:col-span-2 text-sm text-slate-700">
                            <b>Valor del envío:</b>{" "}
                            {Number(form.shipping_cost).toLocaleString(
                              "es-CO",
                              {
                                style: "currency",
                                currency: "COP",
                                maximumFractionDigits: 0,
                              }
                            )}
                          </div>
                        )}
                        {form.shipping_trip_link && (
                          <div className="md:col-span-2 text-sm text-slate-700 break-all">
                            <b>Link del viaje:</b>{" "}
                            <a
                              className="text-blue-600 hover:underline"
                              href={form.shipping_trip_link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {form.shipping_trip_link}
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="md:col-span-2 text-sm text-slate-700">
                          <b>Número de guía:</b> {form.tracking_number || "—"}
                        </div>
                        {form.shipping_cost != null && (
                          <div className="md:col-span-2 text-sm text-slate-700">
                            <b>Valor del envío:</b>{" "}
                            {Number(form.shipping_cost).toLocaleString(
                              "es-CO",
                              {
                                style: "currency",
                                currency: "COP",
                                maximumFractionDigits: 0,
                              }
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* ÚNICO bloque de Despachar envío */}
                    <div className="md:col-span-2">
                      <div className="py-2 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm mb-2">
                        Despachar envío
                      </div>
                    </div>

                    {String(form.shipping_carrier || "").toUpperCase() ===
                    "PICAP" ? (
                      <>
                        <div className="md:col-span-2">
                          <label className="lbl">Link del viaje (PICAP)</label>
                          <input
                            className="w-full px-3 py-3 rounded-xl border border-slate-300"
                            placeholder="https://www.pibox.app/bookings/abcd..."
                            value={form._shipping_trip_link_tmp || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                _shipping_trip_link_tmp: e.target.value,
                              })
                            }
                          />
                          <p className="muted mt-1">
                            Pega el link que comparte PICAP para el seguimiento
                            del viaje.
                          </p>
                        </div>

                        <div>
                          <label className="lbl">
                            Valor del envío (opcional)
                          </label>
                          <input
                            className="w-full px-3 py-3 rounded-xl border border-slate-300"
                            placeholder="Ej: 12000"
                            inputMode="numeric"
                            value={form._shipping_cost_tmp ?? ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                _shipping_cost_tmp: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="md:col-span-2">
                          <button
                            onClick={markAsShipped}
                            className="mt-2 px-4 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
                          >
                            Marcar como enviado
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="lbl">Número de guía</label>
                          <input
                            className="w-full px-3 py-3 rounded-xl border border-slate-300"
                            value={form._tracking_number_tmp || ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                _tracking_number_tmp: e.target.value,
                              })
                            }
                            placeholder="Ej: 1234567890"
                          />
                        </div>
                        <div>
                          <label className="lbl">
                            Valor del envío (opcional)
                          </label>
                          <input
                            className="w-full px-3 py-3 rounded-xl border border-slate-300"
                            placeholder="Ej: 22000"
                            inputMode="numeric"
                            value={form._shipping_cost_tmp ?? ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                _shipping_cost_tmp: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="md:col-span-2">
                          <button
                            onClick={markAsShipped}
                            className="mt-2 px-4 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
                          >
                            Marcar como enviado
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Datos de envío */}
                {form.delivery_method === "SHIPPING" && (
                  <>
                    <div className="md:col-span-2">
                      <div className="py-2 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm mb-2">
                        Datos de envío
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="lbl">Dirección</label>
                      <input
                        className="w-full px-3 py-3 rounded-xl border border-slate-300"
                        value={form.shipping_address}
                        onChange={(e) =>
                          setForm({ ...form, shipping_address: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="lbl">Barrio</label>
                      <input
                        className="w-full px-3 py-3 rounded-xl border border-slate-300"
                        value={form.shipping_neighborhood}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            shipping_neighborhood: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="lbl">Ciudad</label>
                      <input
                        className="w-full px-3 py-3 rounded-xl border border-slate-300"
                        value={form.shipping_city}
                        onChange={(e) =>
                          setForm({ ...form, shipping_city: e.target.value })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="lbl">Transportadora</label>
                      <select
                        className="w-full px-3 py-3 rounded-xl border border-slate-300"
                        value={form.shipping_carrier}
                        onChange={(e) =>
                          setForm({ ...form, shipping_carrier: e.target.value })
                        }
                      >
                        <option value="">Selecciona…</option>
                        <option value="PICAP">PICAP</option>
                        <option value="INTERRAPIDISIMO">INTERRAPIDISIMO</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Footer fijo */}
              <div className="px-6 py-4 border-t sticky bottom-0 bg-white z-10 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200"
                >
                  Cerrar
                </button>
                <button
                  onClick={saveEditor}
                  className="px-4 py-2 rounded-xl text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)]"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

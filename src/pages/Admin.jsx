import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { getAdminToken } from "../lib/adminSession.js";
import {
  adminListWindows,
  adminCreateWindow,
  adminUpdateWindow,
  adminDeleteWindow,
} from "../api.js";

const API = (
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API ??
  window.__API_BASE__ ??
  "http://localhost:4000/api"
).replace(/\/+$/, "");

{/*PRUEBA PARA COMMIT*/}

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

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: `HTTP_${res.status}` };
  }
}

export default function AdminPage() {
  const [token, setToken] = useState(getAdminToken());
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState({});
  const [toast, setToast] = useState("");
  const [showToken, setShowToken] = useState(false);

  const [wDate, setWDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [wType, setWType] = useState("TRYOUT");
  const [wStart, setWStart] = useState("20:00");
  const [wEnd, setWEnd] = useState("20:15");
  const [wSaved, setWSaved] = useState([]);
  const [wEditId, setWEditId] = useState(null);
  const [wEdit, setWEdit] = useState({ start: "", end: "" });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(null);
  const [slotSizeW, setSlotSizeW] = useState(15);

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", "x-admin-token": token }),
    [token]
  );

  useEffect(() => {
    setToast("");
    if (token) fetchAppts();
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

  async function markAsShipped() {
    try {
      if (!editingId) throw new Error("NO_EDITING_ID");

      const isPicap =
        String(form.shipping_carrier || "").toUpperCase() === "PICAP";

      if (form._guide_file && !isPicap) {
        console.log("[markAsShipped] Convirtiendo archivo a base64...");

        try {
          const fileData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(",")[1];
              resolve(base64);
            };
            reader.onerror = () => reject(new Error("Error al leer archivo"));
            reader.readAsDataURL(form._guide_file);
          });

          console.log(
            "[markAsShipped] Archivo convertido, tamaño:",
            fileData.length,
            "caracteres"
          );
          console.log("[markAsShipped] Subiendo archivo...");

          const uploadRes = await fetch(
            `${API}/admin/appointments/${editingId}/upload-guide`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-admin-token": token,
              },
              body: JSON.stringify({
                filename: form._guide_file.name,
                fileData: fileData,
              }),
            }
          );

          console.log("[markAsShipped] Upload status:", uploadRes.status);

          const uploadJson = await safeJson(uploadRes);
          console.log("[markAsShipped] Upload response:", uploadJson);

          if (!uploadRes.ok || uploadJson?.ok === false) {
            throw new Error(uploadJson?.error || "UPLOAD_ERROR");
          }

          console.log(
            "[markAsShipped] Archivo subido exitosamente:",
            uploadJson.url
          );
        } catch (uploadErr) {
          console.error("[markAsShipped] Error al subir archivo:", uploadErr);
          setToast(`Error al subir archivo: ${uploadErr.message}`);
          return;
        }
      }

      console.log("[markAsShipped] Marcando como enviado...");

      const costStr = (form._shipping_cost_tmp ?? "").toString().trim();
      const costVal =
        costStr === "" ? null : Number(costStr.replace(/[^\d.-]/g, ""));

      const payload = {};

      if (isPicap) {
        const tripLink = (form._shipping_trip_link_tmp || "").trim();
        if (!tripLink) {
          alert("Falta el link del viaje PICAP.");
          return;
        }
        payload.shipping_trip_link = tripLink;
        if (costVal !== null) {
          payload.shipping_cost = costVal;
        }
      } else {
        const trackingNum = (form._tracking_number_tmp || "").trim();
        if (!trackingNum) {
          alert("Falta el número de guía.");
          return;
        }
        payload.tracking_number = trackingNum;
        if (costVal !== null) {
          payload.shipping_cost = costVal;
        }
      }

      const r = await fetch(`${API}/admin/appointments/${editingId}/ship`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify(payload),
      });

      const j = await safeJson(r);
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "HTTP_ERROR");

      setForm((prev) => ({
        ...prev,
        status: "SHIPPED",
        tracking_number:
          j.item?.tracking_number ?? prev.tracking_number ?? null,
        shipping_cost:
          j.item?.shipping_cost ?? costVal ?? prev.shipping_cost ?? null,
        shipping_trip_link:
          j.item?.shipping_trip_link ?? prev.shipping_trip_link ?? null,
        tracking_file_url:
          j.item?.tracking_file_url ?? prev.tracking_file_url ?? null,
        _tracking_number_tmp: "",
        _shipping_cost_tmp: "",
        _shipping_trip_link_tmp: "",
        _guide_file: null,
      }));

      setToast("✅ Envío marcado como enviado con guía adjunta.");
      console.log("[markAsShipped] Proceso completado exitosamente");
    } catch (e) {
      console.error("[markAsShipped] ERROR GENERAL:", e);
      setToast(`❌ Error: ${e?.message || "No se pudo marcar como enviado"}`);
    }
  }

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

  function toMin(hhmm) {
    const [h, m] = String(hhmm || "")
      .split(":")
      .map(Number);
    return h * 60 + m;
  }

  useEffect(() => {
    if (!token || !wDate || !wType) return;
    fetchWeekdayWindows();
  }, [token, wDate, wType]);

  async function fetchWeekdayWindows() {
    try {
      const j = await adminListWindows(wDate, wType, token);
      const items = Array.isArray(j.rows) ? j.rows : [];
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
        type_code: wType,
        start_time: wStart,
        end_time: wEnd,
        slot_minutes: Number(slotSizeW) || 15,
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

        shipping_address: item.shipping_address || "",
        shipping_neighborhood: item.shipping_neighborhood || "",
        shipping_city: item.shipping_city || "",
        shipping_carrier: item.shipping_carrier || "",
        tracking_number: item.tracking_number || "",
        shipping_cost: item.shipping_cost ?? null,
        shipping_trip_link: item.shipping_trip_link || "",

        shipped_at: item.shipped_at || null,

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

      <section className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-2xl mb-1">📅 Gestión de Horarios</h2>
            <p className="text-sm text-slate-500">
              Administra la disponibilidad para cualquier día de la semana
            </p>
          </div>
        </div>

        {/* Formulario de Apertura */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-100">
          <h3 className="font-semibold text-lg mb-4 text-slate-800">➕ Abrir Nuevo Horario</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                📆 Fecha
              </label>
              <input
                type="date"
                value={wDate}
                onChange={(e) => setWDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🎯 Tipo de Cita
              </label>
              <select
                value={wType}
                onChange={(e) => setWType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"
              >
                <option value="TRYOUT">🔍 Ensayar</option>
                <option value="PICKUP">📦 Sin ensayar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🕐 Hora Inicio
              </label>
              <input
                type="time"
                step={60}
                value={wStart}
                onChange={(e) => setWStart(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                🕐 Hora Fin
              </label>
              <input
                type="time"
                step={60}
                value={wEnd}
                onChange={(e) => setWEnd(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ⏱️ Duración Bloques
              </label>
              <select
                value={slotSizeW}
                onChange={(e) => setSlotSizeW(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"
              >
                <option value={15}>15 minutos</option>
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={addWeekdayWindow}
              className="px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all transform hover:scale-105"
            >
              ✅ Abrir Horario
            </button>
            <button
              onClick={fetchWeekdayWindows}
              className="px-5 py-3 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all font-medium text-slate-700"
            >
              🔄 Actualizar Lista
            </button>
          </div>
        </div>

        {/* Lista de Horarios Abiertos */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-lg text-slate-800">
              📋 Horarios para {dayjs(wDate).format("DD/MM/YYYY")}
              <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
                wType === 'TRYOUT'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {wType === 'TRYOUT' ? '🔍 Ensayar' : '📦 Sin ensayar'}
              </span>
            </h3>
          </div>

          <div className="p-6">
            {wSaved.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-slate-500 text-lg font-medium mb-2">
                  No hay horarios abiertos
                </p>
                <p className="text-slate-400 text-sm">
                  Abre tu primer horario usando el formulario de arriba
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wSaved.map((r) => (
                  <div
                    key={r.id}
                    className={`group relative rounded-xl border-2 transition-all ${
                      wEditId === r.id
                        ? 'border-blue-400 bg-blue-50 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {wEditId === r.id ? (
                      <div className="p-4">
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Hora de inicio
                          </label>
                          <input
                            type="time"
                            step={60}
                            value={wEdit.start}
                            onChange={(e) =>
                              setWEdit((s) => ({ ...s, start: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-lg border-2 border-blue-300 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Hora de fin
                          </label>
                          <input
                            type="time"
                            step={60}
                            value={wEdit.end}
                            onChange={(e) =>
                              setWEdit((s) => ({ ...s, end: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-lg border-2 border-blue-300 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                            onClick={wSaveEdit}
                          >
                            💾 Guardar
                          </button>
                          <button
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition-colors"
                            onClick={() => setWEditId(null)}
                          >
                            ✖️ Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🕐</span>
                            <div>
                              <div className="font-bold text-lg text-slate-800">
                                {r.start} — {r.end}
                              </div>
                              {typeof r.slot === "number" && (
                                <div className="text-xs text-slate-500 font-medium">
                                  ⏱️ Bloques de {r.slot} min
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                          <button
                            className="flex-1 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                            onClick={() => {
                              setWEditId(r.id);
                              setWEdit({ start: r.start, end: r.end });
                            }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="flex-1 px-3 py-2 rounded-lg bg-rose-100 text-rose-700 text-sm font-medium hover:bg-rose-200 transition-colors"
                            onClick={() => delWeekdayWindow(r.id)}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {open && form && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-6">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
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
                            <b>Valor del servicio:</b>{" "}
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
                          <label className="lbl">
                            Imagen de la guía (opcional)
                          </label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              setForm({
                                ...form,
                                _guide_file: file || null,
                              });
                            }}
                            className="w-full px-3 py-3 rounded-xl border border-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                          />
                          <p className="muted mt-1">
                            Sube la imagen de la guía en formato PNG, JPG o PDF.
                            Se enviará al cliente por correo.
                          </p>
                          {form._guide_file && (
                            <p className="text-sm text-emerald-600 mt-2">
                              ✓ Archivo seleccionado: {form._guide_file.name}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <button
                            onClick={markAsShipped}
                            className="mt-2 px-4 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700"
                          >
                            Marcar como enviado{" "}
                            {form._guide_file && "(con guía adjunta)"}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

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

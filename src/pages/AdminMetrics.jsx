import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { getAdminToken } from "../lib/adminSession.js";

const API = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

// ── Paleta de colores ──────────────────────────────────────────────────────────
const COLORS = {
  done:      "#6366f1",
  shipped:   "#8b5cf6",
  confirmed: "#f59e0b",
  cancelled: "#ef4444",
  no_show:   "#94a3b8",
  tryout:    "#6366f1",
  pickup:    "#8b5cf6",
  shipping:  "#06b6d4",
};

// ── Selector de período ────────────────────────────────────────────────────────
const PERIODS = [
  { label: "Esta semana",    key: "week" },
  { label: "Este mes",       key: "month" },
  { label: "Último mes",     key: "last_month" },
  { label: "3 meses",        key: "3months" },
  { label: "Este año",       key: "year" },
  { label: "Todo",           key: "all" },
  { label: "Personalizado",  key: "custom" },
];

function getRange(key) {
  const today = dayjs();
  switch (key) {
    case "week":       return { from: today.startOf("week").format("YYYY-MM-DD"), to: today.format("YYYY-MM-DD") };
    case "month":      return { from: today.startOf("month").format("YYYY-MM-DD"), to: today.format("YYYY-MM-DD") };
    case "last_month": {
      const lm = today.subtract(1, "month");
      return { from: lm.startOf("month").format("YYYY-MM-DD"), to: lm.endOf("month").format("YYYY-MM-DD") };
    }
    case "3months":    return { from: today.subtract(3, "month").format("YYYY-MM-DD"), to: today.format("YYYY-MM-DD") };
    case "year":       return { from: today.startOf("year").format("YYYY-MM-DD"), to: today.format("YYYY-MM-DD") };
    case "all":        return { from: "2000-01-01", to: "2099-12-31" };
    default:           return null;
  }
}

// ── Tarjeta de KPI ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = "#6366f1" }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-extrabold font-mono" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Tooltip personalizado ──────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <b>{p.value}</b>
        </p>
      ))}
    </div>
  );
}

// ── Barra horizontal simple (lista de productos / clientes) ───────────────────
function HBar({ label, value, max, color = "#6366f1", sub }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="font-semibold text-slate-700 truncate max-w-[65%]" title={label}>{label}</span>
        <span className="font-mono font-bold text-slate-500 shrink-0 ml-2">{value} {sub && <span className="text-slate-400 font-normal">{sub}</span>}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function AdminMetrics() {
  const [period, setPeriod]       = useState("month");
  const [customFrom, setCustomFrom] = useState(dayjs().subtract(30, "day").format("YYYY-MM-DD"));
  const [customTo, setCustomTo]   = useState(dayjs().format("YYYY-MM-DD"));
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const range = period === "custom"
        ? { from: customFrom, to: customTo }
        : getRange(period);
      const params = new URLSearchParams(range);
      const r = await fetch(`${API}/admin/metrics?${params}`, {
        headers: { "x-admin-token": getAdminToken() },
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "ERROR");
      setData(j);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [period, customFrom, customTo]);

  useEffect(() => { load(); }, [load]);

  // ── Decide si mostrar timeline diario o mensual ───────────────────────────
  const showMonthly = period === "year" || period === "all" ||
    (period === "custom" && dayjs(customTo).diff(dayjs(customFrom), "day") > 90);

  // ── Datos para el gráfico de estado ──────────────────────────────────────
  const statusPie = data ? [
    { name: "Completadas",  value: data.overview.byStatus.done + data.overview.byStatus.shipped, color: COLORS.done },
    { name: "Confirmadas",  value: data.overview.byStatus.confirmed,  color: COLORS.confirmed },
    { name: "Canceladas",   value: data.overview.byStatus.cancelled,  color: COLORS.cancelled },
    { name: "No shows",     value: data.overview.byStatus.no_show,    color: COLORS.no_show },
  ].filter(d => d.value > 0) : [];

  const typePie = data ? [
    { name: "Prueba (Tryout)",  value: data.overview.byType.tryout,   color: COLORS.tryout },
    { name: "Recogida (Pickup)", value: data.overview.byType.pickup,  color: COLORS.pickup },
    { name: "Envío",             value: data.overview.byType.shipping, color: COLORS.shipping },
  ].filter(d => d.value > 0) : [];

  const ov = data?.overview;
  const completed = ov ? ov.byStatus.done + ov.byStatus.shipped : 0;
  const convRate  = ov?.total > 0 ? Math.round((completed / ov.total) * 100) : 0;

  const timelineData = showMonthly
    ? (data?.monthly ?? []).map(r => ({ label: r.month.slice(5) + "/" + r.month.slice(0,4), total: r.total, completadas: r.completed }))
    : (data?.timeline ?? []).map(r => ({ label: dayjs(r.date).format("DD/MM"), total: r.total, completadas: r.completed, canceladas: r.cancelled }));

  const topProduct = data?.products?.[0]?.count ?? 1;
  const topCustomer = data?.customers?.[0]?.total ?? 1;

  return (
    <div className="container-page py-6">

      {/* ── Encabezado ────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-brand-indigo">Métricas</h1>
        <p className="text-sm text-slate-500 mt-0.5">Análisis de citas, ventas y clientes frecuentes</p>
      </div>

      {/* ── Selector de período ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-3">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${
              period === p.key
                ? "bg-brand-indigo text-white border-transparent shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Fechas personalizadas */}
      {period === "custom" && (
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Desde</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-indigo" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase">Hasta</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-brand-indigo" />
          </div>
        </div>
      )}

      {/* ── Estados ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : data && (
        <>
          {/* ── KPIs ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <KpiCard label="Total citas"    value={ov.total}          color="#6366f1" />
            <KpiCard label="Completadas"    value={completed}         color="#10b981" sub={`${convRate}% conversión`} />
            <KpiCard label="Canceladas"     value={ov.byStatus.cancelled} color="#ef4444" />
            <KpiCard label="No shows"       value={ov.byStatus.no_show}   color="#94a3b8" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <KpiCard label="En proceso"     value={ov.byStatus.confirmed} color="#f59e0b" />
            <KpiCard label="Envíos"         value={ov.byType.shipping}    color="#06b6d4" />
            <KpiCard label="Ingresos envío" value={`$${Number(ov.shippingRevenue).toLocaleString("es-CO")}`} color="#8b5cf6" sub="solo costo de envío" />
            <KpiCard label="Clientes freq." value={data.customers.length} color="#6366f1" sub="con más de 1 cita" />
          </div>

          {/* ── Timeline ─────────────────────────────────────────────────── */}
          {timelineData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
                Citas por {showMonthly ? "mes" : "día"}
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={timelineData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }} barSize={showMonthly ? 24 : 10}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={showMonthly ? 0 : "preserveStartEnd"} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total"      name="Total"      fill="#e0e7ff" radius={[4,4,0,0]} />
                  <Bar dataKey="completadas" name="Completadas" fill="#6366f1" radius={[4,4,0,0]} />
                  {!showMonthly && <Bar dataKey="canceladas" name="Canceladas" fill="#fca5a5" radius={[4,4,0,0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

            {/* ── Día de la semana ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Días más activos</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.weekdays} margin={{ top: 0, right: 4, left: -24, bottom: 0 }} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Citas" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Estado de citas ──────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Estado de citas</h2>
              {statusPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      {statusPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

            {/* ── Tipo de cita ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Tipo de cita</h2>
              {typePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      {typePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>}
            </div>

            {/* ── Ciudades de envío ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
                Ciudades de envío
              </h2>
              {data.cities.length > 0 ? (
                data.cities.slice(0, 8).map(c => (
                  <HBar key={c.city} label={c.city} value={c.total} max={data.cities[0].total} color="#06b6d4" sub="envíos" />
                ))
              ) : <p className="text-sm text-slate-400 text-center py-8">Sin envíos en el período</p>}
            </div>
          </div>

          {/* ── Productos más solicitados ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-1">
              Artículos más solicitados
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Agrupados automáticamente por modelo (se ignoran marca y serie exacta)
            </p>
            {data.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                {data.products.slice(0, 20).map((p, i) => (
                  <div key={p.name}>
                    <HBar
                      label={`${i + 1}. ${p.name}`}
                      value={p.count}
                      max={topProduct}
                      color={i === 0 ? "#6366f1" : i === 1 ? "#8b5cf6" : i === 2 ? "#a78bfa" : "#c4b5fd"}
                      sub={p.count === 1 ? "cita" : "citas"}
                    />
                    {p.variants?.length > 1 && (
                      <p className="text-[10px] text-slate-400 -mt-1.5 mb-2 ml-2 truncate" title={p.variants.join(", ")}>
                        ↳ {p.variants.slice(0, 3).join(", ")}{p.variants.length > 3 ? ` +${p.variants.length - 3}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400 text-center py-8">Sin productos registrados en el período</p>}
          </div>

          {/* ── Clientes frecuentes ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-1">
              Clientes frecuentes
            </h2>
            <p className="text-xs text-slate-400 mb-4">Clientes con más de 1 cita en el período</p>
            {data.customers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                {data.customers.slice(0, 16).map((c, i) => (
                  <div key={`${c.id_number}-${i}`} className="mb-3">
                    <HBar
                      label={`${i + 1}. ${c.name}`}
                      value={c.total}
                      max={topCustomer}
                      color="#6366f1"
                      sub={`citas · última ${dayjs(c.last_date).format("DD/MM/YY")}`}
                    />
                    {c.id_number && (
                      <p className="text-[10px] text-slate-400 -mt-1.5 mb-0.5 ml-2">
                        CC {c.id_number}{c.phone ? ` · ${c.phone}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400 text-center py-8">Sin clientes frecuentes en el período</p>}
          </div>
        </>
      )}
    </div>
  );
}

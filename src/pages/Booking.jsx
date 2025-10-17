import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import TimeSlotPicker from "../components/TimeSlotPicker.jsx";
import { getAvailability, createAppointment } from "../api.js";

const emailRe = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const initialForm = {
  name: "",
  idNumber: "",
  email: "",
  phone: "",
  product: "",
  notes: "",
  shipping_address: "",
  shipping_neighborhood: "",
  shipping_city: "",
  shipping_carrier: "",
};
function onlyDigits(s = "") {
  return (s || "").replace(/\D/g, "");
}

function minutesBetween(hhmmStart, hhmmEnd) {
  if (!hhmmStart || !hhmmEnd) return null;
  const [sh, sm] = hhmmStart.split(":").map(Number);
  const [eh, em] = hhmmEnd.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}
function allowNumericKeys(e) {
  const ok =
    /\d/.test(e.key) ||
    [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Home",
      "End",
    ].includes(e.key) ||
    (e.ctrlKey && ["a", "c", "v", "x"].includes(e.key.toLowerCase()));
  if (!ok) e.preventDefault();
}

function ModalToast({
  open,
  title,
  items = [],
  variant = "error",
  onClose,
  waitSeconds = 0,
}) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!open) return;
    setRemaining(waitSeconds || 0);
    if (!waitSeconds) return;

    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [open, waitSeconds]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && remaining === 0 && onClose?.();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, remaining]);

  if (!open) return null;

  const styles = {
    error: {
      bar: "bg-rose-600",
      border: "border-slate-300",
      icon: "text-rose-600",
    },
    warning: {
      bar: "bg-amber-600",
      border: "border-slate-300",
      icon: "text-amber-600",
    },
    success: {
      bar: "bg-emerald-600",
      border: "border-slate-300",
      icon: "text-emerald-600",
    },
  }[variant];

  const Icon = () => (
    <span
      className={`inline-flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 ${styles.icon}`}
    >
      {variant === "success" ? "✓" : "!"}
    </span>
  );

  const tryClose = () => {
    if (remaining === 0) onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={tryClose}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div
        className={`relative w-full max-w-xl bg-white border ${styles.border} rounded-2xl shadow-2xl`}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={`h-2 ${styles.bar} rounded-t-2xl`} />
        <div className="p-6">
          <div className="flex items-start gap-3">
            <Icon />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                <button
                  onClick={tryClose}
                  className="ml-3 rounded-full px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Cerrar"
                  disabled={remaining > 0}
                >
                  ✕
                </button>
              </div>

              {Array.isArray(items) && items.length > 1 ? (
                <ul className="mt-3 list-disc pl-5 space-y-1 text-slate-800">
                  {items.map((it, idx) => (
                    <li key={idx} className="text-sm leading-relaxed">
                      {it}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-slate-800 text-sm leading-relaxed">
                  {items[0]}
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={tryClose}
                  className="px-4 py-2 rounded-xl font-semibold text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-ring)] disabled:opacity-60"
                  disabled={remaining > 0}
                >
                  {remaining > 0 ? `Entendido (${remaining})` : "Entendido"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodCallout({ type }) {
  if (type === "TRYOUT") {
    return (
      <div className="callout mt-4">
        <div className="callout-title">Ensayo presencial</div>
        <ul>
          <li>
            Los horarios se habilitan manualmente en bloques de{" "}
            <b>15, 20 o 30 min</b> según disponibilidad.
          </li>
          <li>
            Instalamos y probamos; si quieres trae tu equipo o usamos nuestro{" "}
            <b>equipo de test</b>.
          </li>
          <li>
            Si no alcanzas a venir, puedes <b>reprogramar</b> respondiendo al
            correo de confirmación.
          </li>
        </ul>
      </div>
    );
  }
  if (type === "PICKUP") {
    return (
      <div className="callout mt-4">
        <div className="callout-title">Sin ensayar</div>
        <ul>
          <li>
            Verificamos con <b>videos de prueba</b> antes de la entrega (no
            presencial).
          </li>
          <li>
            Los horarios se habilitan manualmente en bloques de{" "}
            <b>15, 20 o 30 min</b> según disponibilidad.
          </li>
        </ul>
      </div>
    );
  }
  return (
    <div className="callout mt-4">
      <div className="callout-title">Envío (no contraentrega)</div>
      <ul>
        <li>
          <b>No es contraentrega</b>; el valor del artículo se paga <b>antes</b>{" "}
          del despacho.
        </li>
        <li>
          Al recibir, solo cancelas el <b>costo de envío</b> (si aplica).
        </li>
        <li>
          En <b>Bogotá</b>: PICAP o INTERRAPIDISIMO. Otras ciudades:
          INTERRAPIDISIMO.
        </li>
      </ul>
    </div>
  );
}

export default function Booking() {
  const [type, setType] = useState("TRYOUT");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [timeSel, setTimeSel] = useState("");

  const [form, setForm] = useState(initialForm);
  const [carriers, setCarriers] = useState(["INTERRAPIDISIMO"]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({
    open: false,
    title: "",
    items: [],
    variant: "error",
  });
  const firstErrorRef = useRef(null);

  const themeClass =
    type === "PICKUP"
      ? "theme-pickup"
      : type === "SHIPPING"
      ? "theme-shipping"
      : "";

  const minsSelected = useMemo(() => {
    if (type === "SHIPPING") return null;
    const [s, e] = (timeSel || "").split("-");
    return minutesBetween(s, e) ?? 15;
  }, [type, timeSel]);

  useEffect(() => {
    setToast({
      open: true,
      title: "Información importante",
      items: [
        "Usa tus datos reales (nombre, cédula, correo y celular). Esto permite validar y hacer trazabilidad correcta.",
        "Si ingresas datos incorrectos no podremos atenderte ni validar tu cita.",
        "¿Te equivocaste? Responde al correo de confirmación para solicitar reprogramación/anulación y luego agenda nuevamente.",
        "Los intentos con datos falsos o repetidos pueden bloquear futuras reservas.",
        "Si das parte de pago con una gráfica, especifica en 'Notas': gráfica entregada, gráfica deseada y monto a encimar.",
      ],
      variant: "warning",
      waitSeconds: 6,
    });
  }, []);

  useEffect(() => {
    (async () => {
      setMsg("");
      setTimeSel("");
      await refreshAvailability();
    })();
  }, [date, type]);

  async function refreshAvailability() {
    if (type === "SHIPPING") {
      setSlots([]);
      return;
    }
    try {
      setLoadingSlots(true);
      const res = await getAvailability(date, type);
      setSlots(res?.ok ? res.data.slots || [] : []);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function onCityChange(city) {
    setForm((f) => ({ ...f, shipping_city: city, shipping_carrier: "" }));
    try {
      if (!city) return setCarriers(["INTERRAPIDISIMO"]);
      const API = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
      const r = await fetch(
        `${API}/shipping-options?city=${encodeURIComponent(city)}`
      );
      const data = await r.json();
      setCarriers(
        data?.ok && Array.isArray(data.options)
          ? data.options
          : ["INTERRAPIDISIMO"]
      );
    } catch {
      setCarriers(["INTERRAPIDISIMO"]);
    }
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Ingresa tu nombre completo.";
    if (!form.idNumber.trim()) e.idNumber = "Ingresa tu cédula.";
    if (!form.phone.trim()) e.phone = "Ingresa tu número de celular.";
    if (!form.email.trim()) e.email = "Ingresa tu correo.";
    else if (!emailRe.test(form.email))
      e.email = "Correo inválido (ej: nombre@dominio.com).";

    if (type !== "SHIPPING" && !timeSel) e.time = "Selecciona un horario.";

    if (type === "SHIPPING") {
      if (!form.product.trim())
        e.product =
          "Indica el producto completo (ej.: RTX 3070 EVGA XC3 ULTRA).";
    }

    if (type === "SHIPPING") {
      if (!form.shipping_address.trim())
        e.shipping_address = "Dirección requerida.";
      if (!form.shipping_neighborhood.trim())
        e.shipping_neighborhood = "Barrio requerido.";
      if (!form.shipping_city.trim()) e.shipping_city = "Ciudad requerida.";
      if (!form.shipping_carrier.trim())
        e.shipping_carrier = "Selecciona transportadora.";
    }

    setErrors(e);
    const items = Object.values(e);
    if (items.length)
      setToast({
        open: true,
        title: "Corrige los campos marcados.",
        items,
        variant: "error",
      });

    setTimeout(() => {
      const el =
        firstErrorRef.current ||
        document.querySelector("[data-error='true']") ||
        document.querySelector("[aria-invalid='true']");
      if (el?.focus) el.focus();
      firstErrorRef.current = null;
    }, 0);

    return e;
  }

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const onChange = (field) => (e) =>
    setForm({ ...form, [field]: e.target.value });
  const onChangeDigits = (field, maxLen) => (e) =>
    setForm({
      ...form,
      [field]: onlyDigits(e.target.value).slice(0, maxLen || 30),
    });

  const displaySlots = useMemo(() => {
    if (type === "SHIPPING") return [];

    const isToday = dayjs(date).isSame(dayjs(), "day");
    const now = dayjs();

    const fmt12 = (hhmm) => {
      const d = dayjs(`${date} ${hhmm}`);
      const suf = d.format("A") === "AM" ? "a. m." : "p. m.";
      return { time: d.format("hh:mm"), suf };
    };

    let list = Array.isArray(slots) ? slots : [];
    if (isToday)
      list = list.filter((s) => dayjs(`${date} ${s.start}`).isAfter(now));

    return list.map((s) => {
      const S = fmt12(s.start);
      const E = fmt12(s.end);
      const same = S.suf === E.suf;
      const label = same
        ? `${S.time} – ${E.time} ${E.suf}`
        : `${S.time} ${S.suf} – ${E.time} ${E.suf}`;
      return { value: `${s.start}-${s.end}`, label };
    });
  }, [slots, date, type]);

  async function submit() {
    setMsg("");
    const e = validate();
    if (Object.keys(e).length) return;

    let start, end;
    if (type === "SHIPPING") {
      start = "00:00";
      end = "00:00";
    } else {
      [start, end] = (timeSel || "").split("-");
    }

    const payload = {
      type_code: type,
      date,
      start_time: start,
      end_time: end,
      product: form.product,
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      customer_id_number: form.idNumber,
      delivery_method: type === "SHIPPING" ? "SHIPPING" : "IN_PERSON",
      notes: form.notes,
      shipping_address: form.shipping_address,
      shipping_neighborhood: form.shipping_neighborhood,
      shipping_city: form.shipping_city,
      shipping_carrier: form.shipping_carrier,
    };

    setLoading(true);
    try {
      const res = await createAppointment(payload);
      if (res?.ok) {
        setToast({
          open: true,
          title: "¡Datos guardados!",
          items: [
            type === "SHIPPING"
              ? "Procesaremos tu envío y te confirmaremos por correo."
              : "Te enviamos confirmación al correo.",
          ],
          variant: "success",
        });
        setMsg(
          type === "SHIPPING"
            ? "✅ Datos de envío confirmados."
            : "✅ Cita creada."
        );
        setForm(initialForm);
        if (type !== "SHIPPING") setTimeSel("");
        await refreshAvailability();
      } else if (res?.error === "SLOT_TAKEN") {
        setToast({
          open: true,
          title: "Ese horario ya fue tomado",
          items: ["Elige otro bloque disponible."],
          variant: "warning",
        });
        setMsg("⚠️ Ese horario ya fue tomado. Elige otro.");
        setTimeSel("");
        await refreshAvailability();
      } else if (res?.error === "USER_LIMIT_REACHED") {
        const scope = res?.meta?.scope === "WEEK" ? "esta semana" : "este día";
        setToast({
          open: true,
          title: "Límite de reservas alcanzado",
          items: [
            `Ya alcanzaste el máximo de reservas permitidas ${scope} con tus datos.`,
          ],
          variant: "warning",
        });
        setMsg("⚠️ Límite de reservas.");
      } else if (res?.error === "RATE_LIMIT") {
        setToast({
          open: true,
          title: "Demasiados intentos",
          items: ["Por favor, inténtalo en unos minutos."],
          variant: "warning",
        });
        setMsg("⚠️ Demasiados intentos. Intenta más tarde.");
      } else if (res?.error === "INVALID_CARRIER_FOR_CITY") {
        setToast({
          open: true,
          title: "Transportadora inválida",
          items: ["La transportadora no está permitida para esa ciudad."],
          variant: "error",
        });
      } else if (res?.error === "MISSING_SHIPPING_FIELDS") {
        setToast({
          open: true,
          title: "Faltan datos de envío",
          items: ["Completa dirección, barrio, ciudad y transportadora."],
          variant: "error",
        });
      } else {
        setToast({
          open: true,
          title: "No se pudo procesar",
          items: ["Intenta de nuevo en unos minutos."],
          variant: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        title: "Error de red/servidor",
        items: ["Revisa tu conexión o inténtalo más tarde."],
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`container-page ${themeClass}`}>
      <ModalToast
        open={toast.open}
        title={toast.title}
        items={toast.items}
        variant={toast.variant}
        waitSeconds={toast.waitSeconds || 0}
        onClose={() =>
          setToast({ open: false, title: "", items: [], variant: "error" })
        }
      />

      <div className="card relative overflow-hidden">
        <div className="absolute left-0 right-0 top-0 h-1 bg-[var(--brand)]" />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Agendar cita —{" "}
          <span className="text-[var(--brand)]">TechVenturesCO</span>
        </h1>
        <p className="text-slate-500 mt-1">
          Elige el método y agenda tu visita o envío. ¡Todo en 30 segundos!
        </p>
      </div>

      <section className="card">
        <label className="block font-semibold mb-2">Método</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className={`pill ${type === "TRYOUT" ? "pill-on-i" : ""}`}
            onClick={() => setType("TRYOUT")}
          >
            🎧 Ensayar personalmente
          </button>
          <button
            className={`pill ${type === "PICKUP" ? "pill-on-b" : ""}`}
            onClick={() => setType("PICKUP")}
          >
            🕒 Sin ensayar
          </button>
          <button
            className={`pill ${type === "SHIPPING" ? "pill-on-g" : ""}`}
            onClick={() => setType("SHIPPING")}
          >
            📦 Envío (no contraentrega)
          </button>
        </div>
        <MethodCallout type={type} mins={minsSelected} />
      </section>

      <section className="card grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="lbl">
            Fecha <span className="text-rose-600">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setMsg("");
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
          />
        </div>
        {type !== "SHIPPING" && (
          <div>
            <label className="lbl">
              Horario <span className="text-rose-600">*</span>
            </label>
            {loadingSlots ? (
              <p className="text-slate-500 text-sm">Cargando horarios…</p>
            ) : (
              <>
                <TimeSlotPicker
                  slots={displaySlots}
                  value={timeSel}
                  onChange={setTimeSel}
                />
                {displaySlots.length === 0 &&
                dayjs(date).isSame(dayjs(), "day") ? (
                  <p className="text-slate-500 text-xs mt-2">
                    No quedan horarios para hoy. Prueba con otra fecha.
                  </p>
                ) : (
                  <p className="text-slate-500 text-xs mt-2">
                    Selecciona un horario (obligatorio)
                  </p>
                )}
              </>
            )}
            {errors.time ? (
              <p
                className="text-rose-600 text-sm mt-2"
                data-error="true"
                ref={!firstErrorRef.current ? firstErrorRef : null}
              >
                {errors.time}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="card grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="lbl">
            Nombre completo <span className="text-rose-600">*</span>
          </label>
          <input
            placeholder="Nombre completo"
            value={form.name}
            onChange={onChange("name")}
            className={`w-full px-3 py-2 rounded-xl border ${
              errors.name ? "border-rose-400" : "border-slate-300"
            } focus:outline-none`}
            aria-invalid={!!errors.name}
            ref={!firstErrorRef.current && errors.name ? firstErrorRef : null}
          />
          {errors.name ? (
            <p className="err mt-1">{errors.name}</p>
          ) : (
            <p className="muted mt-1">Obligatorio</p>
          )}
        </div>
        <div>
          <label className="lbl">
            Cédula <span className="text-rose-600">*</span>
          </label>
          <input
            placeholder="Cédula"
            value={form.idNumber}
            onKeyDown={allowNumericKeys}
            onChange={onChangeDigits("idNumber", 20)}
            inputMode="numeric"
            className={`w-full px-3 py-2 rounded-xl border ${
              errors.idNumber ? "border-rose-400" : "border-slate-300"
            } focus:outline-none`}
            aria-invalid={!!errors.idNumber}
            ref={
              !firstErrorRef.current && errors.idNumber ? firstErrorRef : null
            }
          />
          {errors.idNumber ? (
            <p className="err mt-1">{errors.idNumber}</p>
          ) : (
            <p className="muted mt-1">Obligatorio</p>
          )}
        </div>
        <div>
          <label className="lbl">
            Celular <span className="text-rose-600">*</span>
          </label>
          <input
            placeholder="Celular"
            value={form.phone}
            onKeyDown={allowNumericKeys}
            onChange={onChangeDigits("phone", 15)}
            inputMode="numeric"
            className={`w-full px-3 py-2 rounded-xl border ${
              errors.phone ? "border-rose-400" : "border-slate-300"
            } focus:outline-none`}
            aria-invalid={!!errors.phone}
            ref={!firstErrorRef.current && errors.phone ? firstErrorRef : null}
          />
          {errors.phone ? (
            <p className="err mt-1">{errors.phone}</p>
          ) : (
            <p className="muted mt-1">Obligatorio</p>
          )}
        </div>
      </section>

      <section className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="lbl">
            Correo <span className="text-rose-600">*</span>
          </label>
          <input
            placeholder="Correo (obligatorio)"
            value={form.email}
            onChange={(e) => {
              const v = e.target.value;
              setForm({ ...form, email: v });
              if (v && !emailRe.test(v))
                setErrors((p) => ({ ...p, email: "Correo inválido." }));
              else
                setErrors((p) => {
                  const cp = { ...p };
                  delete cp.email;
                  return cp;
                });
            }}
            onBlur={() => {
              if (!form.email || !emailRe.test(form.email))
                setErrors((p) => ({ ...p, email: "Correo inválido." }));
            }}
            className={`w-full px-3 py-2 rounded-xl border ${
              errors.email ? "border-rose-400" : "border-slate-300"
            } focus:outline-none`}
            aria-invalid={!!errors.email}
            ref={!firstErrorRef.current && errors.email ? firstErrorRef : null}
          />
          {errors.email ? (
            <p className="err mt-1">{errors.email}</p>
          ) : (
            <p className="muted mt-1">Obligatorio</p>
          )}
        </div>
        <div>
          <label className="lbl">
            Producto{" "}
            {type === "SHIPPING" ? (
              <span className="text-rose-600">*</span>
            ) : (
              <span className="text-slate-400">(opcional)</span>
            )}
          </label>
          <input
            placeholder="Producto (ej. RTX 3070 EVGA XC3 ULTRA)"
            value={form.product}
            onChange={onChange("product")}
            className={`w-full px-3 py-2 rounded-xl border ${
              errors.product ? "border-rose-400" : "border-slate-300"
            } focus:outline-none`}
            aria-invalid={!!errors.product}
            ref={
              !firstErrorRef.current && errors.product ? firstErrorRef : null
            }
          />
          {type === "SHIPPING" ? (
            errors.product ? (
              <p className="err mt-1">{errors.product}</p>
            ) : (
              <p className="muted mt-1">Obligatorio en envíos</p>
            )
          ) : (
            <p className="muted mt-1">Opcional</p>
          )}
        </div>
      </section>

      <section className="card">
        <label className="lbl">Notas (opcional)</label>
        <textarea
          placeholder="Notas (opcional)"
          value={form.notes}
          onChange={onChange("notes")}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
        />
      </section>

      {type === "SHIPPING" && (
        <>
          <h2 className="font-bold text-lg">Datos de envío</h2>
          <section className="card grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="lbl">
                Dirección <span className="text-rose-600">*</span>
              </label>
              <input
                placeholder="Dirección"
                value={form.shipping_address}
                onChange={onChange("shipping_address")}
                className={`w-full px-3 py-2 rounded-xl border ${
                  errors.shipping_address
                    ? "border-rose-400"
                    : "border-slate-300"
                } focus:outline-none`}
                aria-invalid={!!errors.shipping_address}
                ref={
                  !firstErrorRef.current && errors.shipping_address
                    ? firstErrorRef
                    : null
                }
              />
              {errors.shipping_address ? (
                <p className="err mt-1">{errors.shipping_address}</p>
              ) : (
                <p className="muted mt-1">Obligatorio</p>
              )}
            </div>
            <div>
              <label className="lbl">
                Barrio <span className="text-rose-600">*</span>
              </label>
              <input
                placeholder="Barrio"
                value={form.shipping_neighborhood}
                onChange={onChange("shipping_neighborhood")}
                className={`w-full px-3 py-2 rounded-xl border ${
                  errors.shipping_neighborhood
                    ? "border-rose-400"
                    : "border-slate-300"
                } focus:outline-none`}
                aria-invalid={!!errors.shipping_neighborhood}
                ref={
                  !firstErrorRef.current && errors.shipping_neighborhood
                    ? firstErrorRef
                    : null
                }
              />
              {errors.shipping_neighborhood ? (
                <p className="err mt-1">{errors.shipping_neighborhood}</p>
              ) : (
                <p className="muted mt-1">Obligatorio</p>
              )}
            </div>
            <div>
              <label className="lbl">
                Ciudad <span className="text-rose-600">*</span>
              </label>
              <input
                placeholder="Ciudad"
                value={form.shipping_city}
                onChange={(e) => onCityChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border ${
                  errors.shipping_city ? "border-rose-400" : "border-slate-300"
                } focus:outline-none`}
                aria-invalid={!!errors.shipping_city}
                ref={
                  !firstErrorRef.current && errors.shipping_city
                    ? firstErrorRef
                    : null
                }
              />
              {errors.shipping_city ? (
                <p className="err mt-1">{errors.shipping_city}</p>
              ) : (
                <p className="muted mt-1">Obligatorio</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="lbl">
                Transportadora <span className="text-rose-600">*</span>
              </label>
              <select
                value={form.shipping_carrier}
                onChange={onChange("shipping_carrier")}
                className={`w-full px-3 py-2 rounded-xl border ${
                  errors.shipping_carrier
                    ? "border-rose-400"
                    : "border-slate-300"
                } bg-white focus:outline-none`}
                aria-invalid={!!errors.shipping_carrier}
                ref={
                  !firstErrorRef.current && errors.shipping_carrier
                    ? firstErrorRef
                    : null
                }
              >
                <option value="">Selecciona transportadora</option>
                {carriers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-slate-500 text-xs mt-1">
                En Bogotá: PICAP o INTERRAPIDISIMO. Otras ciudades:
                INTERRAPIDISIMO.
              </p>
            </div>
          </section>
        </>
      )}

      <div className="mt-3">
        <button className="btn-primary" disabled={loading} onClick={submit}>
          {loading
            ? "Guardando…"
            : type === "SHIPPING"
            ? "Confirmar datos de envío"
            : "Confirmar cita"}
        </button>
        {msg && <p className="mt-3">{msg}</p>}
      </div>
    </div>
  );
}

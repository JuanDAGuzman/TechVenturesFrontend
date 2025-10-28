import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Package,
  MapPin,
  Truck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  FileText,
  Home,
  Map,
} from "lucide-react";
import { toast, Toaster } from "sonner";

const API_BASE = "https://techventuresbackend-production.up.railway.app";

const METHODS = [
  {
    key: "TRYOUT",
    label: "Ensayar personalmente",
    icon: Sparkles,
    desc: "Visítanos y prueba antes de comprar",
    theme: "", // default theme
  },
  {
    key: "PICKUP",
    label: "Sin ensayar",
    icon: MapPin,
    desc: "Recoge tu pedido sin cita previa",
    theme: "theme-pickup",
  },
  {
    key: "SHIPPING",
    label: "Envío (no contraentrega)",
    icon: Truck,
    desc: "Te lo enviamos a tu dirección",
    theme: "theme-shipping",
  },
];

export default function Booking() {
  /* ---------------- state ---------------- */
  const [method, setMethod] = useState("TRYOUT");

  // fecha seleccionada
  const [date, setDate] = useState("");

  // slots crudos del backend [{start:"06:30",end:"06:45"}, ...]
  const [slots, setSlots] = useState([]);

  // slot elegido por el usuario (guardamos el start exacto)
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [loadingSlots, setLoadingSlots] = useState(false);

  // formulario
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState("");
  const [notes, setNotes] = useState("");

  // envío
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingNeighborhood, setShippingNeighborhood] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [carriers, setCarriers] = useState(["INTERRAPIDISIMO"]);

  // errores de validación UI
  const [errors, setErrors] = useState({});

  const themeClass = METHODS.find((m) => m.key === method)?.theme || "";

  /* ---------------- efectos ---------------- */

  // transportadoras dinámicas según ciudad
  useEffect(() => {
    if (!shippingCity) {
      setCarriers(["INTERRAPIDISIMO"]);
      return;
    }

    // simple regla local: Bogota -> PICAP + INTERRAPIDISIMO
    const norm = shippingCity
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();

    if (norm.includes("bogota")) {
      setCarriers(["PICAP", "INTERRAPIDISIMO"]);
      // si antes tenía carrier distinto, lo dejamos igual
    } else {
      setCarriers(["INTERRAPIDISIMO"]);
      if (shippingCarrier === "PICAP") {
        setShippingCarrier("");
      }
    }
  }, [shippingCity, shippingCarrier]);

  // cuando cambian fecha o método (TRYOUT / PICKUP), pedimos disponibilidad
  useEffect(() => {
    // SHIPPING no necesita slots
    if (!date || method === "SHIPPING") {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, method]);

  /* ---------------- helpers ---------------- */

  async function fetchSlots() {
    setLoadingSlots(true);
    setSelectedSlot(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/availability?date=${encodeURIComponent(
          date
        )}&type=${encodeURIComponent(method)}`
      );

      let payload;
      try {
        payload = await res.json();
      } catch (err) {
        console.warn("Respuesta no JSON en /availability", err);
        toast.error("Error al cargar horarios", {
          description: "Respuesta inesperada del servidor",
          icon: <AlertCircle className="w-5 h-5" />,
        });
        setSlots([]);
        return;
      }

      if (!res.ok || !payload?.ok) {
        toast.error("No se pudieron cargar los horarios", {
          description: payload?.error || "Intenta de nuevo",
          icon: <AlertCircle className="w-5 h-5" />,
        });
        setSlots([]);
        return;
      }

      const apiSlots =
        payload?.data?.slots && Array.isArray(payload.data.slots)
          ? payload.data.slots
          : [];

      setSlots(apiSlots);

      // si el backend devolvió vacío
      if (!apiSlots.length) {
        toast.error("No hay horarios disponibles", {
          description: "Intenta con otra fecha o método",
          icon: <AlertCircle className="w-5 h-5" />,
        });
      }
    } catch (err) {
      console.error("fetchSlots error:", err);
      toast.error("Error al cargar horarios", {
        description: "Por favor intenta de nuevo",
        icon: <AlertCircle className="w-5 h-5" />,
      });
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  // filtra slots pasados si la fecha seleccionada es HOY
  const visibleSlots = useMemo(() => {
    if (!date || !Array.isArray(slots)) return [];

    const selectedDay = new Date(date + "T00:00:00");
    const now = new Date();

    const isToday =
      now.getFullYear() === selectedDay.getFullYear() &&
      now.getMonth() === selectedDay.getMonth() &&
      now.getDate() === selectedDay.getDate();

    if (!isToday) {
      return slots;
    }

    // si es hoy, solo mostramos bloques futuros
    return slots.filter((slot) => {
      const [hh, mm] = slot.start.split(":").map(Number);
      const slotDateObj = new Date(
        selectedDay.getFullYear(),
        selectedDay.getMonth(),
        selectedDay.getDate(),
        hh,
        mm,
        0,
        0
      );
      return slotDateObj.getTime() > now.getTime();
    });
  }, [slots, date]);

  function clearError(field) {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  }

  function validateForm() {
    const newErrors = {};

    // campos básicos
    if (!fullName.trim()) newErrors.fullName = "Ingresa tu nombre completo.";
    if (!idNumber.trim()) newErrors.idNumber = "Ingresa tu cédula.";

    if (!phone.trim()) {
      newErrors.phone = "Ingresa tu número de celular.";
    } else if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "Ingresa un número válido de 10 dígitos.";
    }

    if (!email.trim()) {
      newErrors.email = "Ingresa tu correo.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Correo inválido (ej: nombre@dominio.com).";
    }

    if (!product.trim()) {
      newErrors.product =
        "Indica el producto completo (ej.: RTX 3070 EVGA XC3 ULTRA).";
    }

    // fecha obligatoria siempre
    if (!date) newErrors.date = "Selecciona una fecha.";

    // horario obligatorio SOLO si no es envío
    if (method !== "SHIPPING") {
      if (!selectedSlot) {
        newErrors.slot = "Selecciona un horario.";
      }
    }

    // datos de envío obligatorios en SHIPPING
    if (method === "SHIPPING") {
      if (!shippingAddress.trim())
        newErrors.shippingAddress = "Dirección requerida.";
      if (!shippingNeighborhood.trim())
        newErrors.shippingNeighborhood = "Barrio requerido.";
      if (!shippingCity.trim()) newErrors.shippingCity = "Ciudad requerida.";
      if (!shippingCarrier)
        newErrors.shippingCarrier = "Selecciona transportadora.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrige los campos marcados", {
        icon: <AlertCircle className="w-5 h-5" />,
      });
      return;
    }

    // armamos start_time / end_time
    // PARA TRYOUT o PICKUP => usamos el slot elegido
    // PARA SHIPPING => "00:00"
    let start_time = "00:00";
    let end_time = "00:00";

    if (method !== "SHIPPING" && selectedSlot) {
      // selectedSlot guardamos el "HH:MM" de inicio
      start_time = selectedSlot;
      // buscamos su 'end'
      const match = slots.find((s) => s.start === selectedSlot);
      if (match && match.end) {
        end_time = match.end;
      }
    }

    const payload = {
      type_code: method, // TRYOUT | PICKUP | SHIPPING
      date,
      start_time,
      end_time,
      product,
      customer_name: fullName,
      customer_email: email,
      customer_phone: phone,
      customer_id_number: idNumber,
      delivery_method: method === "SHIPPING" ? "SHIPPING" : "IN_PERSON",
      notes: notes || "",
      shipping_address: method === "SHIPPING" ? shippingAddress : "",
      shipping_neighborhood: method === "SHIPPING" ? shippingNeighborhood : "",
      shipping_city: method === "SHIPPING" ? shippingCity : "",
      shipping_carrier: method === "SHIPPING" ? shippingCarrier : "",
    };

    try {
      const loadingToast = toast.loading("Procesando tu reserva...");

      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast.dismiss(loadingToast);

      let body = null;
      try {
        body = await res.json();
      } catch {
        // si backend no devolvió JSON válido igual mostramos genérico
      }

      if (res.ok && body?.ok) {
        toast.success("¡Reserva confirmada!", {
          description:
            method === "SHIPPING"
              ? "Procesaremos tu envío y te confirmaremos por correo."
              : "Te enviamos confirmación al correo.",
          icon: <CheckCircle2 className="w-5 h-5" />,
          duration: 5000,
        });

        // limpiar form
        setFullName("");
        setIdNumber("");
        setPhone("");
        setEmail("");
        setProduct("");
        setNotes("");
        setShippingAddress("");
        setShippingNeighborhood("");
        setShippingCity("");
        setShippingCarrier("");
        setDate("");
        setSelectedSlot(null);
        setSlots([]);
        setErrors({});
      } else {
        // errores específicos backend
        const code = body?.error || "ERROR";
        let humanMsg = "No pudimos crear la reserva. Intenta nuevamente.";

        if (code === "SLOT_TAKEN") {
          humanMsg =
            "Ese horario acaba de ser tomado. Por favor elige otro bloque disponible.";
          // refrescar disponibilidad
          fetchSlots();
          setSelectedSlot(null);
        } else if (code === "USER_LIMIT_REACHED") {
          const scope =
            body?.meta?.scope === "WEEK" ? "esta semana" : "este día";
          humanMsg = `Ya alcanzaste el máximo de reservas permitidas ${scope} con tus datos.`;
        } else if (code === "OUTSIDE_WINDOW") {
          humanMsg =
            "Ese horario ya no es válido. Actualiza y elige uno de la lista.";
          fetchSlots();
          setSelectedSlot(null);
        } else if (code === "INVALID_SLOT_SIZE") {
          humanMsg =
            "Ese bloque ya no es válido (cambio de duración). Elige otro horario.";
          fetchSlots();
          setSelectedSlot(null);
        } else if (code === "SHIPPING_DATA_REQUIRED") {
          humanMsg =
            "Faltan datos de envío (dirección, ciudad o transportadora).";
        } else if (code === "PRODUCT_REQUIRED") {
          humanMsg = "Debes indicar el producto.";
        } else if (code === "RATE_LIMIT") {
          humanMsg = "Demasiados intentos. Intenta más tarde.";
        }

        toast.error(humanMsg, {
          icon: <AlertCircle className="w-5 h-5" />,
        });
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
      toast.error("Error de red/servidor", {
        description: "Revisa tu conexión o inténtalo más tarde.",
        icon: <AlertCircle className="w-5 h-5" />,
      });
    }
  }

  /* ---------------- render ---------------- */

  return (
    <div className={`min-h-screen ${themeClass}`}>
      <Toaster position="top-center" richColors />

      <div className="container-page">
        {/* Header principal */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
            Agendar cita — <span className="brand-text">TechVenturesCO</span>
          </h1>
          <p className="text-slate-600 text-lg">
            Elige el método y agenda tu visita o envío. ¡Todo en 30 segundos!
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ===== Método ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card"
          >
            <label className="lbl flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 brand-text" />
              Método
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const isActive = method === m.key;
                return (
                  <motion.button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setMethod(m.key);
                      setSelectedSlot(null);
                      clearError("slot");
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`pill relative overflow-hidden ${
                      isActive
                        ? m.key === "TRYOUT"
                          ? "pill-on-i"
                          : m.key === "PICKUP"
                          ? "pill-on-b"
                          : "pill-on-g"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Icon className="w-6 h-6" />
                      <div>
                        <div className="font-bold">{m.label}</div>
                        <div
                          className={`text-xs mt-1 ${
                            isActive ? "opacity-90" : "text-slate-500"
                          }`}
                        >
                          {m.desc}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* callout debajo según método */}
            <AnimatePresence mode="wait">
              {method === "TRYOUT" && (
                <motion.div
                  key="tryout-info"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4"
                >
                  <div className="callout">
                    <div className="callout-title">Ensayo presencial</div>
                    <ul>
                      <li>
                        Los horarios se habilitan manualmente en bloques de{" "}
                        <strong>15, 20 o 30 min</strong> según disponibilidad.
                      </li>
                      <li>
                        Instalamos y probamos; si quieres{" "}
                        <strong>tu equipo</strong> o usamos nuestro{" "}
                        <strong>equipo de test</strong>.
                      </li>
                      <li>
                        Si no alcanzas a venir, puedes{" "}
                        <strong>reprogramar</strong> respondiendo al correo de
                        confirmación.
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {method === "PICKUP" && (
                <motion.div
                  key="pickup-info"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4"
                >
                  <div className="callout">
                    <div className="callout-title">Sin ensayar</div>
                    <ul>
                      <li>
                        Verificamos con <strong>videos de prueba</strong> antes
                        de la entrega (no presencial).
                      </li>
                      <li>
                        Los horarios se habilitan manualmente en bloques de{" "}
                        <strong>15, 20 o 30 min</strong> según disponibilidad.
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {method === "SHIPPING" && (
                <motion.div
                  key="ship-info"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4"
                >
                  <div className="callout">
                    <div className="callout-title">
                      Envío (no contraentrega)
                    </div>
                    <ul>
                      <li>
                        <strong>No es contraentrega</strong>; el valor del
                        artículo se paga <strong>antes</strong> del despacho.
                      </li>
                      <li>
                        Al recibir, solo cancelas el{" "}
                        <strong>costo de envío</strong> (si aplica).
                      </li>
                      <li>
                        En <strong>Bogotá</strong>: PICAP o INTERRAPIDISIMO.
                        Otras ciudades: INTERRAPIDISIMO.
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ===== Fecha / Horario ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fecha */}
              <div>
                <label className="lbl flex items-center gap-2">
                  <Calendar className="w-5 h-5 brand-text" />
                  Fecha <span className="text-rose-500">*</span>
                </label>

                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setDate(e.target.value);
                    clearError("date");
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                    errors.date
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                  }`}
                />

                {errors.date && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="err mt-1 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {errors.date}
                  </motion.p>
                )}
              </div>

              {/* Horario (solo si no es envío) */}
              {method !== "SHIPPING" && (
                <div>
                  <label className="lbl flex items-center gap-2">
                    <Clock className="w-5 h-5 brand-text" />
                    Horario <span className="text-rose-500">*</span>
                  </label>

                  <AnimatePresence mode="wait">
                    {!date ? (
                      // no hay fecha todavía
                      <motion.div
                        key="no-date"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 rounded-xl p-4 border-2 border-dashed border-slate-200"
                      >
                        <Info className="w-5 h-5" />
                        Selecciona una fecha primero
                      </motion.div>
                    ) : loadingSlots ? (
                      // cargando disponibilidad
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2 text-slate-500 text-sm bg-slate-50 rounded-xl p-4 border-2 border-slate-200"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <Clock className="w-5 h-5" />
                        </motion.div>
                        Cargando horarios...
                      </motion.div>
                    ) : visibleSlots.length === 0 ? (
                      // sin horarios (o todos ya pasaron hoy)
                      <motion.div
                        key="no-slots"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-amber-900 mb-1">
                              No hay horarios disponibles
                            </p>
                            <p className="text-sm text-amber-700">
                              Intenta con otra fecha o prueba el método "Sin
                              ensayar"
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      // lista de horarios disponibles
                      <motion.div
                        key="slots"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar"
                      >
                        {visibleSlots.map((s) => (
                          <motion.button
                            key={`${s.start}-${s.end}`}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(s.start);
                              clearError("slot");
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`slot ${
                              selectedSlot === s.start ? "slot-active" : ""
                            }`}
                          >
                            {`${s.start} – ${s.end}`}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {errors.slot && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="err mt-2 flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.slot}
                    </motion.p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* ===== Datos personales ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
          >
            <h3 className="lbl flex items-center gap-2 mb-4">
              <User className="w-5 h-5 brand-text" />
              Datos personales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">
                  Nombre completo <span className="text-rose-500">*</span>
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    clearError("fullName");
                  }}
                  placeholder="Nombre completo"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                    errors.fullName
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                  }`}
                />
                {errors.fullName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="err mt-1 text-xs flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.fullName}
                  </motion.p>
                )}
              </div>

              {/* Cédula */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">
                  Cédula <span className="text-rose-500">*</span>
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  inputMode="numeric"
                  value={idNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setIdNumber(value);
                    clearError("idNumber");
                  }}
                  onKeyDown={(e) => {
                    // permitir solo números + teclas de navegación
                    if (
                      !/\d/.test(e.key) &&
                      ![
                        "Backspace",
                        "Delete",
                        "ArrowLeft",
                        "ArrowRight",
                        "Tab",
                        "Home",
                        "End",
                      ].includes(e.key) &&
                      !(
                        e.ctrlKey &&
                        ["a", "c", "v", "x"].includes(e.key.toLowerCase())
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="123456789"
                  maxLength={20}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                    errors.idNumber
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                  }`}
                />
                {errors.idNumber && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="err mt-1 text-xs flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.idNumber}
                  </motion.p>
                )}
              </div>

              {/* Celular */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">
                  Celular <span className="text-rose-500">*</span>
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setPhone(value);
                    clearError("phone");
                  }}
                  onKeyDown={(e) => {
                    if (
                      !/\d/.test(e.key) &&
                      ![
                        "Backspace",
                        "Delete",
                        "ArrowLeft",
                        "ArrowRight",
                        "Tab",
                        "Home",
                        "End",
                      ].includes(e.key) &&
                      !(
                        e.ctrlKey &&
                        ["a", "c", "v", "x"].includes(e.key.toLowerCase())
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="3001234567"
                  maxLength={15}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                    errors.phone
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                  }`}
                />
                {errors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="err mt-1 text-xs flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </motion.p>
                )}
              </div>
            </div>

            {/* email / producto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Correo */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">
                  Correo <span className="text-rose-500">*</span>
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                  placeholder="correo@ejemplo.com"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                    errors.email
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                  }`}
                />
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="err mt-1 text-xs flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Producto */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2">
                  <Package className="w-4 h-4 brand-text" />
                  Producto <span className="text-rose-500">*</span>
                </label>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  value={product}
                  onChange={(e) => {
                    setProduct(e.target.value);
                    clearError("product");
                  }}
                  placeholder="Ej: RTX 3070 EVGA XC3 ULTRA"
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                    errors.product
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                      : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                  }`}
                />
                {errors.product && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="err mt-1 text-xs flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.product}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 brand-text" />
                Notas{" "}
                <span className="text-slate-400 text-xs font-normal">
                  (opcional)
                </span>
              </label>
              <motion.textarea
                whileFocus={{ scale: 1.01 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Gráfica entregada RTX 2060, gráfica deseada RTX 3070, monto a encimar $500.000"
                rows={3}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-ring)] transition resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Si das parte de pago con una gráfica, especifica: gráfica
                entregada, gráfica deseada y monto a encimar.
              </p>
            </div>
          </motion.div>

          {/* ===== Datos de envío ===== */}
          {method === "SHIPPING" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h3 className="lbl flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 brand-text" />
                Datos de envío
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Dirección */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2">
                    <Home className="w-4 h-4 brand-text" />
                    Dirección <span className="text-rose-500">*</span>
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => {
                      setShippingAddress(e.target.value);
                      clearError("shippingAddress");
                    }}
                    placeholder="Calle 123 #45-67"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                      errors.shippingAddress
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                        : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                    }`}
                  />
                  {errors.shippingAddress && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="err mt-1 text-xs flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.shippingAddress}
                    </motion.p>
                  )}
                </div>

                {/* Barrio */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">
                    Barrio <span className="text-rose-500">*</span>
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    value={shippingNeighborhood}
                    onChange={(e) => {
                      setShippingNeighborhood(e.target.value);
                      clearError("shippingNeighborhood");
                    }}
                    placeholder="Chapinero"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                      errors.shippingNeighborhood
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                        : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                    }`}
                  />
                  {errors.shippingNeighborhood && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="err mt-1 text-xs flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.shippingNeighborhood}
                    </motion.p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ciudad */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2">
                    <Map className="w-4 h-4 brand-text" />
                    Ciudad <span className="text-rose-500">*</span>
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    value={shippingCity}
                    onChange={(e) => {
                      setShippingCity(e.target.value);
                      clearError("shippingCity");
                    }}
                    placeholder="Bogotá"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                      errors.shippingCity
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                        : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                    }`}
                  />
                  {errors.shippingCity && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="err mt-1 text-xs flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.shippingCity}
                    </motion.p>
                  )}
                </div>

                {/* Carrier */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-slate-700">
                    Transportadora <span className="text-rose-500">*</span>
                  </label>
                  <motion.select
                    whileFocus={{ scale: 1.01 }}
                    value={shippingCarrier}
                    onChange={(e) => {
                      setShippingCarrier(e.target.value);
                      clearError("shippingCarrier");
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition bg-white ${
                      errors.shippingCarrier
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                        : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                    }`}
                  >
                    <option value="">Selecciona transportadora</option>
                    {carriers.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </motion.select>
                  <p className="text-xs text-slate-500 mt-1">
                    En Bogotá: PICAP o INTERRAPIDISIMO. Otras ciudades:
                    INTERRAPIDISIMO.
                  </p>
                  {errors.shippingCarrier && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="err mt-1 text-xs flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.shippingCarrier}
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== CTA ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              {method === "SHIPPING"
                ? "Confirmar datos de envío"
                : "Confirmar reserva"}
            </motion.button>
          </motion.div>
        </form>

        {/* ===== contacto ===== */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-slate-500"
        >
          <p className="text-center text-sm text-slate-500">
            ¿Tienes dudas? Escríbenos a{" "}
            <span className="brand-text font-semibold">
              <a
                href="mailto:techventuresco@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                techventuresco@gmail.com
              </a>
            </span>{" "}
            ó{" "}
            <span className="brand-text font-semibold">
              <a
                href="https://api.whatsapp.com/send/?phone=573108216274&text&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
              >
                Whatsapp
              </a>
            </span>
          </p>
        </motion.div>
      </div>

      {/* scrollbar styling */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--brand);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--brand-hover);
        }
      `}</style>
    </div>
  );
}

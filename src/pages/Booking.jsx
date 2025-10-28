import { useState, useEffect } from "react";
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
  X,
  Home,
  Map,
} from "lucide-react";
import { toast, Toaster } from "sonner";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API ||
  window.__API_BASE__ ||
  "http://localhost:4000";

const METHODS = [
  {
    key: "TRYOUT",
    label: "Ensayar personalmente",
    icon: Sparkles,
    desc: "Visítanos y prueba antes de comprar",
    theme: "", 
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

function InfoModal({ open, onClose }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!open) return;
    setCountdown(5);

    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape" && countdown === 0) {
        onClose();
      }
    }
    if (open) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [open, countdown, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-1" />

        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                Información importante
              </h2>
            </div>

            {countdown === 0 && (
              <button
                onClick={onClose}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2">
            {[
              "Usa tus datos reales (nombre, cédula, correo y celular). Esto permite validar y hacer trazabilidad correcta.",
              "Si ingresas datos incorrectos no podremos atenderte ni validar tu cita.",
              "¿Te equivocaste? Responde al correo de confirmación para solicitar reprogramación/anulación y luego agenda nuevamente.",
              "Los intentos con datos falsos o repetidos pueden bloquear futuras reservas.",
              "Si das parte de pago con una gráfica, especifica en 'Notas': gráfica entregada, gráfica deseada y monto a encimar.",
            ].map((text, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (idx + 1) }}
                className="flex items-start gap-3"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                  {idx + 1}
                </span>
                <p className="text-slate-700 text-sm leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: countdown === 0 ? 1.02 : 1 }}
              whileTap={{ scale: countdown === 0 ? 0.98 : 1 }}
              onClick={onClose}
              disabled={countdown > 0}
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg"
            >
              {countdown > 0 ? `Entendido (${countdown})` : "Entendido"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Booking() {
  const [method, setMethod] = useState("TRYOUT");

  const [showInfoModal, setShowInfoModal] = useState(true);

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0] 
  );

  const [slots, setSlots] = useState([]);

  const [selectedSlotKey, setSelectedSlotKey] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);

  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState("");
  const [notes, setNotes] = useState("");

  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingNeighborhood, setShippingNeighborhood] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [carriers, setCarriers] = useState(["INTERRAPIDISIMO"]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (shippingCity.toLowerCase().includes("bogot")) {
      setCarriers(["PICAP", "INTERRAPIDISIMO"]);
    } else {
      setCarriers(["INTERRAPIDISIMO"]);
      if (shippingCarrier === "PICAP") {
        setShippingCarrier("");
      }
    }
  }, [shippingCity, shippingCarrier]);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      setSelectedSlotKey("");
      return;
    }
    if (method === "SHIPPING") {
      setSlots([]);
      setSelectedSlotKey("");
      return;
    }
    fetchSlots();
  }, [date, method]);

  async function fetchSlots() {
    setLoadingSlots(true);
    setSelectedSlotKey("");

    try {
      const res = await fetch(
        `${API_BASE}/api/availability?date=${date}&type=${method}`
      );

      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.warn("Respuesta no JSON en /availability", err);
        toast.error("Error al cargar horarios", {
          description: "Respuesta inesperada del servidor",
          icon: <AlertCircle className="w-5 h-5" />,
        });
        setSlots([]);
        return;
      }

      if (!res.ok || !data?.ok) {
        toast.error("No se pudieron cargar los horarios", {
          description: data?.error || "Intenta de nuevo",
          icon: <AlertCircle className="w-5 h-5" />,
        });
        setSlots([]);
        return;
      }

      const arr = Array.isArray(data?.data?.slots) ? data.data.slots : [];

      arr.sort((a, b) => (a.start > b.start ? 1 : -1));

      setSlots(arr);

      if (!arr.length) {
        toast.error("No hay horarios disponibles", {
          description: "Intenta con otra fecha o método",
          icon: <AlertCircle className="w-5 h-5" />,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar horarios", {
        description: "Por favor intenta de nuevo",
      });
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  function validateForm() {
    const newErrors = {};

    if (!fullName.trim()) newErrors.fullName = "El nombre es obligatorio";

    if (!idNumber.trim()) newErrors.idNumber = "La cédula es obligatoria";

    if (!phone.trim()) {
      newErrors.phone = "El celular es obligatorio";
    } else if (!/^\d{10}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "Ingresa un número válido de 10 dígitos";
    }

    if (!email.trim()) {
      newErrors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Ingresa un correo válido";
    }

    if (!product.trim()) {
      newErrors.product = "El producto es obligatorio";
    }

    if (!date) newErrors.date = "Selecciona una fecha";

    if (method !== "SHIPPING") {
      if (!selectedSlotKey) {
        newErrors.slot = "Selecciona un horario";
      }
    }

    if (method === "SHIPPING") {
      if (!shippingAddress.trim())
        newErrors.shippingAddress = "La dirección es obligatoria";
      if (!shippingNeighborhood.trim())
        newErrors.shippingNeighborhood = "El barrio es obligatorio";
      if (!shippingCity.trim())
        newErrors.shippingCity = "La ciudad es obligatoria";
      if (!shippingCarrier)
        newErrors.shippingCarrier = "Selecciona una transportadora";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    let start_time = "00:00";
    let end_time = "00:00";

    if (method !== "SHIPPING" && selectedSlotKey) {
      const [s, e] = selectedSlotKey.split("-");
      start_time = s;
      end_time = e || "00:00";
    }

    const payload = {
      type_code: method, 
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
      }

      if (res.ok && body?.ok) {
        toast.success("¡Reserva confirmada!", {
          description: "Revisa tu correo para más detalles",
          icon: <CheckCircle2 className="w-5 h-5" />,
          duration: 5000,
        });

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
        setSelectedSlotKey("");
      } else {
        const errCode = body?.error;
        if (errCode === "SLOT_TAKEN") {
          toast.error("Ese horario ya fue tomado", {
            description: "Elige otro bloque disponible.",
            icon: <AlertCircle className="w-5 h-5" />,
          });
          fetchSlots();
          setSelectedSlotKey("");
        } else if (errCode === "USER_LIMIT_REACHED") {
          const scope =
            body?.meta?.scope === "WEEK" ? "esta semana" : "este día";
          toast.error("Límite de reservas alcanzado", {
            description: `Ya alcanzaste el máximo permitido ${scope} con tus datos.`,
            icon: <AlertCircle className="w-5 h-5" />,
          });
        } else if (errCode === "OUTSIDE_WINDOW") {
          toast.error("Horario inválido", {
            description:
              "El horario elegido ya no está dentro de la ventana disponible.",
            icon: <AlertCircle className="w-5 h-5" />,
          });
          fetchSlots();
          setSelectedSlotKey("");
        } else if (errCode === "INVALID_SLOT_SIZE") {
          toast.error("Bloque inválido", {
            description:
              "El tamaño del bloque no coincide con la disponibilidad.",
            icon: <AlertCircle className="w-5 h-5" />,
          });
          fetchSlots();
          setSelectedSlotKey("");
        } else {
          toast.error(
            body?.error || "No pudimos crear la reserva. Intenta nuevamente.",
            {
              icon: <AlertCircle className="w-5 h-5" />,
            }
          );
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión", {
        description: "Por favor intenta de nuevo",
      });
    }
  }

  const currentMethod = METHODS.find((m) => m.key === method);
  const themeClass = currentMethod?.theme || "";

  const slotButtons = slots.map((s) => {
    const key = `${s.start}-${s.end}`;
    const label = `${s.start} – ${s.end}`;
    return { key, label };
  });

  return (
    <>
      <InfoModal open={showInfoModal} onClose={() => setShowInfoModal(false)} />

      <div className={`min-h-screen ${themeClass}`}>
        <Toaster position="top-center" richColors />

        <div className="container-page">
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
                      onClick={() => setMethod(m.key)}
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

              <AnimatePresence>
                {method === "TRYOUT" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                    }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                    }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4"
                  >
                    <div className="callout">
                      <div className="callout-title">Sin ensayar</div>
                      <ul>
                        <li>
                          Verificamos con <strong>videos de prueba</strong>{" "}
                          antes de la entrega (no presencial).
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
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                    }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="lbl flex items-center gap-2">
                    <Calendar className="w-5 h-5 brand-text" />
                    Fecha <span className="text-rose-500">*</span>
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      clearError("date");
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                      errors.date
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                        : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                    }`}
                  />
                  {errors.date && (
                    <motion.p
                      initial={{
                        opacity: 0,
                        y: -10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="err mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.date}
                    </motion.p>
                  )}
                </div>

                {method !== "SHIPPING" && (
                  <div>
                    <label className="lbl flex items-center gap-2">
                      <Clock className="w-5 h-5 brand-text" />
                      Horario <span className="text-rose-500">*</span>
                    </label>

                    <AnimatePresence mode="wait">
                      {!date ? (
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
                      ) : slotButtons.length === 0 ? (
                        <motion.div
                          key="no-slots"
                          initial={{
                            opacity: 0,
                            scale: 0.95,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.95,
                          }}
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
                        <motion.div
                          key="slots"
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar"
                        >
                          {slotButtons.map((slot) => (
                            <motion.button
                              key={slot.key}
                              type="button"
                              onClick={() => {
                                setSelectedSlotKey(slot.key);
                                clearError("slot");
                              }}
                              whileHover={{
                                scale: 1.03,
                              }}
                              whileTap={{
                                scale: 0.97,
                              }}
                              className={`slot ${
                                selectedSlotKey === slot.key
                                  ? "slot-active"
                                  : ""
                              }`}
                            >
                              {slot.label}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {errors.slot && (
                      <motion.p
                        initial={{
                          opacity: 0,
                          y: -10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h3 className="lbl flex items-center gap-2 mb-4">
                <User className="w-5 h-5 brand-text" />
                Datos personales
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
                    placeholder="Juan Pérez"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                      errors.fullName
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                        : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                    }`}
                  />
                  {errors.fullName && (
                    <motion.p
                      initial={{
                        opacity: 0,
                        y: -10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="err mt-1 text-xs flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.fullName}
                    </motion.p>
                  )}
                </div>

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
                      initial={{
                        opacity: 0,
                        y: -10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="err mt-1 text-xs flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.idNumber}
                    </motion.p>
                  )}
                </div>

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
                      initial={{
                        opacity: 0,
                        y: -10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="err mt-1 text-xs flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </motion.p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                      initial={{
                        opacity: 0,
                        y: -10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="err mt-1 text-xs flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </motion.p>
                  )}
                </div>

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
                    placeholder="ej. RTX 3070 EVGA XC3 ULTRA"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${
                      errors.product
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                        : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--brand-ring)]"
                    }`}
                  />
                  {errors.product && (
                    <motion.p
                      initial={{
                        opacity: 0,
                        y: -10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="err mt-1 text-xs flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {errors.product}
                    </motion.p>
                  )}
                </div>
              </div>

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
                  entregada, gráfica deseada y monto a encimar
                </p>
              </div>
            </motion.div>

            {method === "SHIPPING" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card"
              >
                <h3 className="lbl flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 brand-text" />
                  Datos de envío
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                        initial={{
                          opacity: 0,
                          y: -10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="err mt-1 text-xs flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.shippingAddress}
                      </motion.p>
                    )}
                  </div>

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
                        initial={{
                          opacity: 0,
                          y: -10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="err mt-1 text-xs flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.shippingNeighborhood}
                      </motion.p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        initial={{
                          opacity: 0,
                          y: -10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        className="err mt-1 text-xs flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.shippingCity}
                      </motion.p>
                    )}
                  </div>

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
                        initial={{
                          opacity: 0,
                          y: -10,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
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
    </>
  );
}

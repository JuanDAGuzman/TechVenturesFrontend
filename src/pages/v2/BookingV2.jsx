import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
    Snowflake,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import HeroV2 from "../../components/v2/HeroV2";

const API_BASE = "https://techventuresbackend-production.up.railway.app";

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
        desc: "Agenda tu cita sin prueba del producto; te enviaremos videos de funcionamiento.",
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
        const onKey = (e) => {
            if (e.key === "Escape" && countdown === 0) onClose();
        };
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, countdown, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden mt-10 border-4 border-christmas-gold"
            >
                <div className="bg-christmas-red p-1" />

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
                            className="px-6 py-3 rounded-xl font-bold text-white bg-christmas-red hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg"
                        >
                            {countdown > 0 ? `Entendido (${countdown})` : "Entendido"}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

function CustomerDataModal({ open, onClose, customerData, onConfirm }) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border-2 border-christmas-green"
            >
                <div className="bg-christmas-green p-1" />

                <div className="p-6 sm:p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Info className="w-6 h-6 text-blue-600" />
                        </div>

                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-slate-900 mb-2">
                                Datos encontrados
                            </h2>
                            <p className="text-slate-600">
                                Ya tenemos información de esta cédula. ¿Deseas cargar estos
                                datos?
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">
                                    NOMBRE COMPLETO
                                </p>
                                <p className="text-slate-900 font-medium">
                                    {customerData.customer_name}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">
                                    CÉDULA
                                </p>
                                <p className="text-slate-900 font-medium">
                                    {customerData.customer_id_number}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1">
                                        CELULAR
                                    </p>
                                    <p className="text-slate-900 font-medium">
                                        {customerData.customer_phone}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-slate-500 mb-1">
                                        CORREO
                                    </p>
                                    <p className="text-slate-900 font-medium text-sm break-all">
                                        {customerData.customer_email}
                                    </p>
                                </div>
                            </div>

                            {customerData.shipping_address && (
                                <>
                                    <div className="border-t border-slate-200 my-3 pt-3">
                                        <p className="text-xs font-bold text-slate-700 mb-2">
                                            DIRECCIÓN DE ENVÍO
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 mb-1">
                                            DIRECCIÓN
                                        </p>
                                        <p className="text-slate-900 font-medium">
                                            {customerData.shipping_address}
                                        </p>
                                    </div>

                                    {customerData.shipping_neighborhood && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 mb-1">
                                                    BARRIO
                                                </p>
                                                <p className="text-slate-900 font-medium">
                                                    {customerData.shipping_neighborhood}
                                                </p>
                                            </div>

                                            {customerData.shipping_city && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 mb-1">
                                                        CIUDAD
                                                    </p>
                                                    <p className="text-slate-900 font-medium">
                                                        {customerData.shipping_city}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                        >
                            No, gracias
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onConfirm}
                            className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-christmas-green hover:bg-green-700 transition shadow-lg"
                        >
                            Sí, cargar datos
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

export default function BookingV2() {
    const [method, setMethod] = useState("TRYOUT");

    const [date, setDate] = useState("");

    const [slots, setSlots] = useState([]);

    const [selectedSlot, setSelectedSlot] = useState(null);

    const [loading, setLoading] = useState(false);

    const [slotsError, setSlotsError] = useState(null);



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

    const currentMethod = METHODS.find((m) => m.key === method);
    const themeClass = currentMethod?.theme || "";

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [foundCustomerData, setFoundCustomerData] = useState(null);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

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
        setSelectedSlot(null);
        setSlots([]);
        setSlotsError(null);

        if (!date) return;

        if (method === "SHIPPING") return;

        fetchSlots();
    }, [date, method]);

    async function fetchSlots() {
        setLoading(true);
        setSelectedSlot(null);
        setSlots([]);
        setSlotsError(null);

        try {
            const res = await fetch(
                `${API_BASE}/api/availability?date=${date}&type=${method}`
            );

            let payload = null;
            try {
                payload = await res.json();
            } catch (err) {
                console.warn("Respuesta NO JSON en /availability", err);
                setSlotsError("SERVIDOR");
                setSlots([]);
                setLoading(false);
                toast.error("No se pudieron cargar los horarios", {
                    description: "Respuesta inesperada del servidor",
                });
                return;
            }

            if (!res.ok || !payload?.ok) {
                console.warn("availability devolvió error:", payload);
                setSlots([]);
                setSlotsError(payload?.error || "NOT_FOUND");

                if (
                    payload?.error === "NOT_FOUND" ||
                    (Array.isArray(payload?.data?.slots) &&
                        payload.data.slots.length === 0)
                ) {
                    toast.error("No hay horarios disponibles", {
                        description:
                            'Intenta con otra fecha o prueba el método "Sin ensayar"',
                    });
                }
                setLoading(false);
                return;
            }

            const slotsFromApi = Array.isArray(payload?.data?.slots)
                ? payload.data.slots
                : [];

            setSlots(slotsFromApi);

            if (slotsFromApi.length === 0) {
                setSlotsError("VACIO");
                toast.error("No hay horarios disponibles", {
                    description:
                        'Intenta con otra fecha o prueba el método "Sin ensayar"',
                });
            } else {
                setSlotsError(null);
            }
        } catch (err) {
            console.error("fetchSlots error:", err);
            setSlots([]);
            setSlotsError("NETWORK");
            toast.error("Error al cargar horarios", {
                description: "Por favor intenta de nuevo",
            });
        } finally {
            setLoading(false);
        }
    }

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

        if (method !== "SHIPPING" && !selectedSlot) {
            newErrors.slot = "Selecciona un horario";
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

        let start_time = null;
        let end_time = null;

        if (method === "TRYOUT" || method === "PICKUP") {
            if (!selectedSlot) {
                toast.error("Selecciona un horario disponible");
                setErrors((prev) => ({
                    ...prev,
                    slot: "Selecciona un horario",
                }));
                return;
            }
            start_time = selectedSlot.start;
            end_time = selectedSlot.end;
        } else {
            start_time = null;
            end_time = null;
        }

        const payload = {
            type_code: method,
            date: date,
            start_time: start_time,
            end_time: end_time,
            product: product,
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

            let responseBody = null;
            try {
                responseBody = await res.json();
            } catch (parseErr) {
                console.warn("Respuesta no JSON en /appointments", parseErr);
            }

            if (res.ok && responseBody?.ok) {
                toast.success("¡Reserva confirmada!", {
                    description:
                        method === "SHIPPING"
                            ? "Procesaremos tu envío y te confirmaremos por correo"
                            : "Revisa tu correo para más detalles",
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

                setDate("");
                setSelectedSlot(null);
                setSlots([]);
                setErrors({});
            } else {
                // ⚠️ Manejo especial para usuarios en blacklist
                if (responseBody?.error === "CUSTOMER_BLACKLISTED") {
                    toast.error("⛔ No puedes agendar citas", {
                        description: responseBody?.message || "Has incumplido previamente. Contacta al administrador.",
                        duration: 10000,
                        icon: <AlertCircle className="w-5 h-5" />,
                    });
                } else {
                    const msg =
                        responseBody?.error ||
                        "No pudimos crear la reserva. Intenta nuevamente.";
                    toast.error(msg, {
                        icon: <AlertCircle className="w-5 h-5" />,
                    });
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Error de conexión", {
                description: "Por favor intenta de nuevo",
            });
        }
    }

    const clearError = (field) => {
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };
    async function searchCustomerByIdNumber(idNum) {
        if (!idNum || idNum.length < 6) return;

        setIsSearchingCustomer(true);

        try {
            const res = await fetch(
                `${API_BASE}/api/customer-by-id?id_number=${idNum}`
            );

            if (!res.ok) {
                console.warn("Error buscando cliente");
                return;
            }

            const data = await res.json();

            if (data.ok && data.found) {
                setFoundCustomerData(data.data);
                setShowCustomerModal(true);
            }
        } catch (err) {
            console.error("Error al buscar cliente:", err);
        } finally {
            setIsSearchingCustomer(false);
        }
    }

    function loadCustomerData() {
        if (!foundCustomerData) return;

        setFullName(foundCustomerData.customer_name || "");
        setPhone(foundCustomerData.customer_phone || "");
        setEmail(foundCustomerData.customer_email || "");
        setShippingAddress(foundCustomerData.shipping_address || "");
        setShippingNeighborhood(foundCustomerData.shipping_neighborhood || "");
        setShippingCity(foundCustomerData.shipping_city || "");

        setShowCustomerModal(false);
        setFoundCustomerData(null);

        toast.success("Datos cargados correctamente", {
            description: "Verifica que la información sea correcta",
            icon: <CheckCircle2 className="w-5 h-5" />,
        });
    }

    const [showInfoModal, setShowInfoModal] = useState(true);
    const [isReady, setIsReady] = useState(false);

    return (
        <div className={`min-h-screen ${themeClass}`}>
            <Toaster position="top-center" richColors />
            <InfoModal
                open={showInfoModal}
                onClose={() => {
                    setShowInfoModal(false);
                    setIsReady(true);
                }}
            />

            <CustomerDataModal
                open={showCustomerModal}
                onClose={() => {
                    setShowCustomerModal(false);
                    setFoundCustomerData(null);
                }}
                customerData={foundCustomerData}
                onConfirm={loadCustomerData}
            />

            <AnimatePresence>
                {isReady && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="container-page"
                    >
                        {/* HERO V2 */}
                        <HeroV2 />

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="card border-2 border-christmas-green/10 shadow-lg"
                            >
                                <label className="lbl flex items-center gap-2 mb-4 text-christmas-red">
                                    <Sparkles className="w-5 h-5" />
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
                                                    if (m.key === "SHIPPING") {
                                                        setSlots([]);
                                                    } else if (date) {
                                                        fetchSlots();
                                                    }
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`pill relative overflow-hidden ${isActive
                                                    ? "bg-christmas-red text-white shadow-md"
                                                    : "bg-white text-slate-600 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center gap-2 text-center">
                                                    <Icon className="w-6 h-6" />
                                                    <div>
                                                        <div className="font-bold">{m.label}</div>
                                                        <div
                                                            className={`text-xs mt-1 ${isActive ? "opacity-90" : "text-slate-500"
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

                                <AnimatePresence mode="wait">
                                    {method === "TRYOUT" && (
                                        <motion.div
                                            key="callout-tryout"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="mt-4"
                                        >
                                            <div className="p-4 rounded-xl bg-christmas-red/5 border border-christmas-red/20 border-l-4 border-l-christmas-red text-slate-700">
                                                <div className="font-extrabold text-lg mb-2 text-christmas-red">Ensayo presencial</div>
                                                <ul className="list-disc pl-5 space-y-1">
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
                                            key="callout-pickup"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="mt-4"
                                        >
                                            <div className="p-4 rounded-xl bg-christmas-green/5 border border-christmas-green/20 border-l-4 border-l-christmas-green text-slate-700">
                                                <div className="font-extrabold text-lg mb-2 text-christmas-green">Sin ensayar</div>
                                                <ul className="list-disc pl-5 space-y-1">
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
                                            key="callout-ship"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="mt-4"
                                        >
                                            <div className="p-4 rounded-xl bg-christmas-red/5 border border-christmas-red/20 border-l-4 border-l-christmas-red text-slate-700">
                                                <div className="font-extrabold text-lg mb-2 text-christmas-red">
                                                    Envío (no contraentrega)
                                                </div>
                                                <ul className="list-disc pl-5 space-y-1">
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
                                className="card border-2 border-christmas-green/10 shadow-lg"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <label className="lbl flex items-center gap-2 text-christmas-red">
                                            <Calendar className="w-5 h-5" />
                                            Fecha <span className="text-rose-500">*</span>
                                        </label>

                                        <motion.input
                                            whileFocus={{ scale: 1.01 }}
                                            type="date"
                                            value={date}
                                            onChange={(e) => {
                                                setDate(e.target.value);
                                                clearError("date");
                                                setSelectedSlot(null);
                                            }}
                                            min={new Date().toISOString().split("T")[0]}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${errors.date
                                                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                                                : "border-slate-200 focus:border-christmas-green focus:ring-green-100"
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

                                    {method !== "SHIPPING" && (
                                        <div>
                                            <label className="lbl flex items-center gap-2 text-christmas-red">
                                                <Clock className="w-5 h-5" />
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
                                                ) : loading ? (
                                                    <motion.div
                                                        key="loading"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="flex items-center justify-center gap-2 text-christmas-green text-sm bg-slate-50 rounded-xl p-4 border-2 border-christmas-green/20"
                                                    >
                                                        <motion.div
                                                            animate={{ rotate: 360 }}
                                                            transition={{
                                                                duration: 2,
                                                                repeat: Infinity,
                                                                ease: "linear",
                                                            }}
                                                        >
                                                            <Snowflake className="w-6 h-6 text-christmas-red" />
                                                        </motion.div>
                                                        <span className="font-medium">Buscando horarios navideños...</span>
                                                    </motion.div>
                                                ) : slotsError && slots.length === 0 ? (
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
                                                                    ensayo presencial".
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="slots"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="grid grid-cols-2 gap-2"
                                                    >
                                                        {slots.map((s) => {
                                                            const isActive =
                                                                selectedSlot &&
                                                                selectedSlot.start === s.start &&
                                                                selectedSlot.end === s.end;
                                                            const label = `${s.start} – ${s.end}`;

                                                            return (
                                                                <motion.button
                                                                    key={`${s.start}-${s.end}`}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedSlot({ start: s.start, end: s.end });
                                                                        clearError("slot");
                                                                    }}
                                                                    whileHover={{ scale: 1.03 }}
                                                                    whileTap={{ scale: 0.97 }}
                                                                    className={`slot ${isActive ? "bg-christmas-green text-white border-christmas-green" : "bg-white text-slate-700 border-slate-200 hover:border-christmas-green"
                                                                        } py-2 px-3 rounded-lg border-2 font-medium transition-all`}
                                                                >
                                                                    {label}
                                                                </motion.button>
                                                            );
                                                        })}
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

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="card border-2 border-christmas-green/10 shadow-lg"
                            >
                                <h3 className="lbl flex items-center gap-2 mb-4 text-christmas-red">
                                    <User className="w-5 h-5" />
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
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${errors.fullName
                                                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                                                : "border-slate-200 focus:border-christmas-green focus:ring-green-100"
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

                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-slate-700">
                                            Cédula <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
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
                                                onBlur={(e) => {
                                                    const value = e.target.value.trim();
                                                    if (value && value.length >= 6) {
                                                        searchCustomerByIdNumber(value);
                                                    }
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
                                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${errors.idNumber
                                                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                                                    : "border-slate-200 focus:border-christmas-green focus:ring-green-100"
                                                    }`}
                                            />
                                            {isSearchingCustomer && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{
                                                            duration: 1,
                                                            repeat: Infinity,
                                                            ease: "linear",
                                                        }}
                                                    >
                                                        <Clock className="w-5 h-5 text-blue-500" />
                                                    </motion.div>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                            <Info className="w-3 h-3" />
                                            Si ya agendaste antes, tus datos se cargarán automáticamente
                                        </p>

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
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${errors.phone
                                                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                                                : "border-slate-200 focus:border-christmas-green focus:ring-green-100"
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
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${errors.email
                                                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                                                : "border-slate-200 focus:border-christmas-green focus:ring-green-100"
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

                                    <div>
                                        <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2">
                                            <Package className="w-4 h-4 text-christmas-red" />
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
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${errors.product
                                                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                                                : "border-slate-200 focus:border-christmas-green focus:ring-green-100"
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

                                <div>
                                    <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-christmas-red" />
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
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-christmas-green focus:ring-4 focus:ring-green-100 transition resize-none"
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
                                    className="card border-2 border-christmas-green/10 shadow-lg"
                                >
                                    <h3 className="lbl flex items-center gap-2 mb-4 text-christmas-red">
                                        <Truck className="w-5 h-5" />
                                        Datos de envío
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2">
                                                <Home className="w-4 h-4 text-christmas-red" />
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
                                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${errors.shippingAddress
                                                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                                                    : "border-slate-200 focus:border-christmas-green focus:ring-green-100"
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
                                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${errors.shippingNeighborhood
                                                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                                                    : "border-slate-200 focus:border-christmas-green focus:ring-green-100"
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
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-slate-700 flex items-center gap-2">
                                                <Map className="w-4 h-4 text-christmas-red" />
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
                                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition ${errors.shippingCity
                                                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                                                    : "border-slate-200 focus:border-christmas-green focus:ring-green-100"
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
                                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition bg-white ${errors.shippingCarrier
                                                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-100"
                                                    : "border-slate-200 focus:border-christmas-green focus:ring-green-100"
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

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <motion.button
                                    type="submit"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 bg-christmas-red hover:bg-red-700 transition-all"
                                    disabled={loading}
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
                                <span className="text-christmas-red font-semibold">
                                    <a
                                        href="mailto:techventuresco@gmail.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        techventuresco@gmail.com
                                    </a>
                                </span>{" "}
                                ó{" "}
                                <span className="text-christmas-green font-semibold">
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
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #165B33;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D42426;
        }
      `}</style>
        </div>
    );
}

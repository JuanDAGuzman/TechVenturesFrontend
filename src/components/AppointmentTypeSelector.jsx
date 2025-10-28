import { motion } from "framer-motion";
import { Sparkles, MapPin, Truck } from "lucide-react";

const APPOINTMENT_TYPES = [
  {
    value: "TRYOUT",
    label: "Cita con ensayo",
    icon: Sparkles,
    description: "Prueba el producto antes de comprar",
    color: "purple",
  },
  {
    value: "PICKUP",
    label: "Recogida sin ensayo",
    icon: MapPin,
    description: "Recoge directamente sin probar",
    color: "blue",
  },
  {
    value: "SHIPPING",
    label: "Envío (no contraentrega)",
    icon: Truck,
    description: "Te lo enviamos a domicilio",
    color: "green",
  },
];

export default function AppointmentTypeSelector({ value, onChange }) {
  return (
    <div className="space-y-3">
      {APPOINTMENT_TYPES.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.value;

        const colorClasses = {
          purple: {
            border: "border-purple-200 hover:border-purple-400",
            bg: "bg-purple-50",
            selectedBorder: "border-purple-600",
            selectedBg: "bg-purple-600",
            icon: "text-purple-600",
            selectedIcon: "text-white",
            ring: "ring-purple-200",
          },
          blue: {
            border: "border-blue-200 hover:border-blue-400",
            bg: "bg-blue-50",
            selectedBorder: "border-blue-600",
            selectedBg: "bg-blue-600",
            icon: "text-blue-600",
            selectedIcon: "text-white",
            ring: "ring-blue-200",
          },
          green: {
            border: "border-emerald-200 hover:border-emerald-400",
            bg: "bg-emerald-50",
            selectedBorder: "border-emerald-600",
            selectedBg: "bg-emerald-600",
            icon: "text-emerald-600",
            selectedIcon: "text-white",
            ring: "ring-emerald-200",
          },
        }[type.color];

        return (
          <motion.label
            key={type.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="block cursor-pointer"
          >
            <input
              type="radio"
              name="appointmentType"
              value={type.value}
              checked={isSelected}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
            />

            <div
              className={`
                relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                ${
                  isSelected
                    ? `${colorClasses.selectedBorder} ${colorClasses.bg} shadow-md ring-4 ${colorClasses.ring}`
                    : `${colorClasses.border} bg-white hover:shadow-md`
                }
              `}
            >
              <div
                className={`
                  flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all
                  ${
                    isSelected
                      ? `${colorClasses.selectedBg} ${colorClasses.selectedIcon}`
                      : `${colorClasses.bg} ${colorClasses.icon}`
                  }
                `}
              >
                <Icon className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <div
                  className={`font-bold text-slate-900 mb-1 ${
                    isSelected ? "text-slate-900" : ""
                  }`}
                >
                  {type.label}
                </div>
                <div className="text-sm text-slate-600">{type.description}</div>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`flex-shrink-0 w-6 h-6 rounded-full ${colorClasses.selectedBg} flex items-center justify-center`}
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.label>
        );
      })}
    </div>
  );
}

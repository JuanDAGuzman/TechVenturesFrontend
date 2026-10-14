import { motion } from "framer-motion";

export default function HeroV2() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 pb-7 border-b border-slate-300"
        >
            <p className="font-mono text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                Visitas y envíos
            </p>
            <h1 className="font-display font-bold text-slate-900 tracking-tight leading-[0.98] mt-2 text-[40px] sm:text-6xl">
                Agenda tu cita<span className="brand-text">.</span>
            </h1>
            <p className="text-slate-700 text-base sm:text-lg mt-3 max-w-[52ch] leading-relaxed">
                Elige el método y agenda tu visita o envío.{" "}
                <span className="font-semibold text-slate-900">Todo en 30 segundos.</span>
            </p>
        </motion.div>
    );
}

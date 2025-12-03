import { motion } from "framer-motion";

export default function HeroV2() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 relative py-10 px-4 rounded-3xl overflow-hidden bg-christmas-surface border border-slate-100 shadow-sm"
        >
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-christmas-red/5 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
                <motion.div
                    className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-christmas-green/5 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 7, repeat: Infinity }}
                />
            </div>

            <div className="relative z-10">

                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                    Agendar cita — <span className="text-christmas-red">TechVenturesCO</span>
                </h1>

                <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
                    Elige el método y agenda tu visita o envío. <br className="hidden sm:block" />
                    <span className="font-semibold text-christmas-green">¡Todo en 30 segundos!</span>
                </p>
            </div>
        </motion.div>
    );
}

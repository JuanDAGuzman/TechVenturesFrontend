import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, MessageCircle } from "lucide-react";

export default function NavbarV2() {
    const location = useLocation();
    const isHome     = location.pathname === "/";
    const isCatalogo = isHome;
    const isContact  = location.pathname === "/contact";
    const hideNav    = isContact;

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="sticky top-0 z-50 bg-white shadow-lg border-b-4 border-brand-indigo w-full"
        >
            <div className="container-page">
                <div className="flex items-center justify-between py-3">
                    {/* Logo Section */}
                    <Link
                        to="/"
                        className={`flex items-center gap-3 transition-all ${isHome ? 'cursor-default pointer-events-none' : 'hover:scale-105'}`}
                    >
                        <motion.div
                            className="relative"
                            whileHover={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.5 }}
                        >
                            <img
                                src="/TECHVENT.png"
                                alt="TechVenturesCO"
                                className="w-12 h-12 object-contain"
                            />
                        </motion.div>

                        <div className="hidden sm:flex flex-col">
                            <span className="font-extrabold text-xl text-brand-indigo tracking-tight leading-tight drop-shadow-sm">
                                TechVenturesCO
                            </span>
                            <span className="text-xs text-slate-500 font-bold tracking-wide uppercase">
                                {isCatalogo ? "Tu tienda de tech · GPUs, componentes y más" : "Agenda tu cita"}
                            </span>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <div className="flex items-center gap-3">
                        {!hideNav && (
                            <nav className="flex gap-2 sm:gap-3">
                                <Link
                                    to="/"
                                    className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${isCatalogo
                                        ? "bg-brand-indigo text-white shadow-indigo-200 ring-2 ring-indigo-100"
                                        : "bg-slate-50 text-slate-700 hover:bg-white hover:shadow-md border border-slate-200"
                                        }`}
                                >
                                    <ShoppingBag className="w-4 h-4" />
                                    <span className="hidden sm:inline">Catálogo</span>
                                </Link>
                            </nav>
                        )}

                        {/* Contacto — siempre visible, incluso cuando el resto del nav está oculto */}
                        <Link
                            to="/contact"
                            title="Contáctanos"
                            aria-label="Contáctanos"
                            className={`flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm shrink-0 ${isContact
                                ? "bg-brand-indigo text-white shadow-indigo-200 ring-2 ring-indigo-100"
                                : "bg-slate-50 text-slate-700 hover:bg-white hover:shadow-md border border-slate-200"
                                }`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Contacto</span>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}

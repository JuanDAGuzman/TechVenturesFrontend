import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Settings } from "lucide-react";

export default function NavbarV2() {
    const location = useLocation();
    const isBooking = location.pathname === "/";
    const isAdmin = location.pathname === "/admin";
    const isContact = location.pathname === "/contact";

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="sticky top-0 z-50 bg-white shadow-lg border-b-4 border-brand-indigo"
        >
            <div className="container-page">
                <div className="flex items-center justify-between py-3">
                    {/* Logo Section */}
                    <Link
                        to="/"
                        className={`flex items-center gap-3 transition-all ${isContact ? 'cursor-default pointer-events-none' : 'hover:scale-105'}`}
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

                        <div className="flex flex-col">
                            <span className="font-extrabold text-xl text-brand-indigo tracking-tight leading-tight drop-shadow-sm">
                                TechVenturesCO
                            </span>
                            <span className="text-xs text-slate-500 font-bold tracking-wide uppercase">
                                Agenda tu cita
                            </span>
                        </div>
                    </Link>

                    {/* Navigation */}
                    {!isContact && (
                        <nav className="flex gap-3">
                            <Link
                                to="/"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${isBooking
                                    ? "bg-brand-indigo text-white shadow-indigo-200 ring-2 ring-indigo-100"
                                    : "bg-slate-50 text-slate-700 hover:bg-white hover:shadow-md border border-slate-200"
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                <span>Agendar</span>
                            </Link>

                            <Link
                                to="/admin"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${isAdmin
                                    ? "bg-brand-indigo text-white shadow-indigo-200 ring-2 ring-indigo-100"
                                    : "bg-slate-50 text-slate-700 hover:bg-white hover:shadow-md border border-slate-200"
                                    }`}
                            >
                                <Settings className="w-4 h-4" />
                                <span>Admin</span>
                            </Link>
                        </nav>
                    )}
                </div>
            </div>
        </motion.header>
    );
}

import { motion } from "framer-motion";
import {
    Heart,
    Github,
    Linkedin,
    Mail,
    ExternalLink,
    Code,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function FooterV2() {
    const currentYear = new Date().getFullYear();
    const location = useLocation();
    const isContact = location.pathname === "/contact";

    const links = {
        company: [
            { label: "Agendar cita", href: "/" },
            { label: "Contacto", href: "/contact" },
        ],
        social: [
            { icon: Github, label: "GitHub", href: "https://github.com/JuanDAGuzman" },
            {
                icon: Linkedin,
                label: "LinkedIn",
                href: "https://www.linkedin.com/in/juan-diego-ar%C3%A9valo-guzm%C3%A1n-030b36305/", target: "_blank",
            },
            {
                icon: Mail,
                label: "Email",
                href: "mailto:techventuresco@gmail.com",
            },
        ],
    };

    return (
        <footer className="relative bg-slate-50 mt-auto overflow-hidden border-t border-slate-200">

            <div className="container-page relative py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <motion.img
                                    src="/TECHVENT.png"
                                    alt="TechVenturesCO"
                                    className="w-12 h-12 object-contain"
                                    whileHover={{ rotate: [0, -10, 10, 0] }}
                                    transition={{ duration: 0.5 }}
                                />
                                <div>
                                    <h3 className="font-black text-2xl text-brand-indigo tracking-tight">
                                        TechVenturesCO
                                    </h3>
                                    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Tu aliado en tecnología</p>
                                </div>
                            </div>

                            <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                                Hardware que no necesita explicaciones.
                            </p>

                            <div className="flex gap-3">
                                {links.social.map((social) => {
                                    const Icon = social.icon;
                                    return (
                                        <motion.a
                                            key={social.label}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            whileHover={{ scale: 1.15, y: -3 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="relative group"
                                            aria-label={social.label}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-white text-slate-500 hover:bg-brand-indigo hover:text-white flex items-center justify-center transition-all shadow-sm hover:shadow-md border border-slate-200">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                        </motion.a>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>

                    {/* Quick Links */}
                    {!isContact && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                        >
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                                Enlaces rápidos
                            </h4>
                            <ul className="space-y-3">
                                {links.company.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.href}
                                            className="text-slate-600 hover:text-brand-indigo transition text-sm flex items-center gap-2 group font-medium"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-brand-indigo transition-colors"></span>
                                            <span>{link.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg">
                            Contacto
                        </h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-indigo">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <a
                                    href="mailto:techventuresco@gmail.com"
                                    className="text-slate-600 hover:text-brand-indigo transition font-medium"
                                >
                                    techventuresco@gmail.com
                                </a>
                            </li>
                            <li className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-indigo">
                                    <span className="text-sm">📍</span>
                                </div>
                                <span className="text-slate-600 font-medium">
                                    Bogotá, Colombia
                                </span>
                            </li>
                        </ul>
                    </motion.div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-200 pt-8 mt-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="flex flex-col md:flex-row justify-between items-center gap-4"
                    >
                        <p className="text-slate-500 text-sm flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            © {currentYear} TechVenturesCO.
                        </p>

                        <motion.p
                            className="text-slate-600 text-sm flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                        >
                            Hecho con <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" /> por Juan Arévalo
                        </motion.p>
                    </motion.div>
                </div>
            </div>
        </footer>
    );
}

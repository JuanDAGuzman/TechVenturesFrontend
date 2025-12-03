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
        <footer className="relative bg-christmas-surface mt-auto overflow-hidden border-t-4 border-christmas-green">
            {/* Decorative festive background */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#165B33 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

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
                                    src="/LOGO_TECHVENTURES.png"
                                    alt="TechVenturesCO"
                                    className="w-12 h-12 object-contain"
                                    whileHover={{ rotate: [0, -10, 10, 0] }}
                                    transition={{ duration: 0.5 }}
                                />
                                <div>
                                    <h3 className="font-black text-2xl text-christmas-red tracking-tight">
                                        TechVenturesCO
                                    </h3>
                                    <p className="text-christmas-green font-bold text-xs uppercase tracking-wider">Tu aliado en tecnología</p>
                                </div>
                            </div>

                            <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                                Componentes tecnológicos de alta calidad con servicio único de
                                ensayo presencial. <span className="text-christmas-red font-bold">¡Feliz Navidad! 🎄</span>
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
                                            <div className="w-10 h-10 rounded-full bg-white text-christmas-green hover:bg-christmas-red hover:text-white flex items-center justify-center transition-all shadow-sm hover:shadow-md border border-christmas-green/20">
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
                                <span className="text-christmas-red">❄️</span>
                                Enlaces rápidos
                            </h4>
                            <ul className="space-y-3">
                                {links.company.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.href}
                                            className="text-slate-600 hover:text-christmas-red transition text-sm flex items-center gap-2 group font-medium"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-christmas-green group-hover:bg-christmas-red transition-colors"></span>
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
                            <span className="text-christmas-red">🎁</span>
                            Contacto
                        </h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-christmas-green">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <a
                                    href="mailto:techventuresco@gmail.com"
                                    className="text-slate-600 hover:text-christmas-red transition font-medium"
                                >
                                    techventuresco@gmail.com
                                </a>
                            </li>
                            <li className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-christmas-green">
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
                            Hecho con <Heart className="w-4 h-4 text-christmas-red fill-christmas-red animate-pulse" /> por Juan Arévalo
                        </motion.p>
                    </motion.div>
                </div>
            </div>
        </footer>
    );
}

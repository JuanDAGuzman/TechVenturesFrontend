import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Github, Linkedin, Mail, Code } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useSiteTheme } from "../../lib/SiteThemeContext.jsx";

function SocialIcon({ icon: Icon, href, label, dot }) {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.15, y: -3 }}
            whileTap={{ scale: 0.95 }}
            aria-label={label}
        >
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm hover:shadow-md border border-slate-200"
                style={{
                    background: hovered ? dot : "white",
                    color: hovered ? "white" : "#64748b",
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <Icon className="w-5 h-5" />
            </div>
        </motion.a>
    );
}

function NavLink({ href, label, dot }) {
    const [hovered, setHovered] = useState(false);
    return (
        <li>
            <Link
                to={href}
                className="text-slate-600 transition text-sm flex items-center gap-2 group font-medium"
                style={{ color: hovered ? dot : undefined }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <span
                    className="w-1.5 h-1.5 rounded-full transition-colors"
                    style={{ background: hovered ? dot : "#cbd5e1" }}
                />
                <span>{label}</span>
            </Link>
        </li>
    );
}

export default function FooterV2() {
    const currentYear = new Date().getFullYear();
    const location = useLocation();
    const { brand } = useSiteTheme();
    const isContact = location.pathname === "/contact";

    const socials = [
        { icon: Github, label: "GitHub", href: "https://github.com/JuanDAGuzman" },
        { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/juan-diego-ar%C3%A9valo-guzm%C3%A1n-030b36305/" },
        { icon: Mail, label: "Email", href: "mailto:techventuresco@gmail.com" },
    ];

    const companyLinks = [
        { label: "Catálogo", href: "/" },
        { label: "Contacto", href: "/contact" },
    ];

    return (
        <footer className="relative bg-slate-50 mt-auto overflow-hidden border-t border-slate-200">
            <div className="container-page relative py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

                    {/* Brand */}
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
                                    <h3 className="font-black text-2xl tracking-tight" style={{ color: brand.dot }}>
                                        TechVenturesCO
                                    </h3>
                                    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Tu aliado en tecnología</p>
                                </div>
                            </div>

                            <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                                Tú ya sabes lo que quieres. Nosotros solo nos aseguramos de que lo consigas — rápido, sin rodeos y sin sorpresas.
                            </p>

                            <div className="flex gap-3">
                                {socials.map((s) => (
                                    <SocialIcon key={s.label} icon={s.icon} href={s.href} label={s.label} dot={brand.dot} />
                                ))}
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
                                {companyLinks.map((l) => (
                                    <NavLink key={l.label} href={l.href} label={l.label} dot={brand.dot} />
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
                        <h4 className="font-bold text-slate-900 mb-4 text-lg">Contacto</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"
                                    style={{ color: brand.dot }}>
                                    <Mail className="w-4 h-4" />
                                </div>
                                <a href="mailto:techventuresco@gmail.com"
                                    className="text-slate-600 font-medium transition"
                                    style={{ "--hover-color": brand.dot }}
                                    onMouseEnter={e => e.currentTarget.style.color = brand.dot}
                                    onMouseLeave={e => e.currentTarget.style.color = ""}
                                >
                                    techventuresco@gmail.com
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"
                                    style={{ color: brand.dot }}>
                                    <span className="text-sm font-bold">CO</span>
                                </div>
                                <span className="text-slate-600 font-medium">Bogotá, Colombia</span>
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

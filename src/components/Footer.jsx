import { motion } from "framer-motion";
import {
  Heart,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Code,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    company: [
      { label: "Agendar cita", href: "/" },
      { label: "Contacto", href: "https://api.whatsapp.com/send/?phone=573108216274&text&type=phone_number&app_absent=0",target: "_blank", },
    ],
    social: [
      { icon: Github, label: "GitHub", href: "https://github.com/JuanDAGuzman" },
      {
        icon: Linkedin,
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/juan-diego-ar%C3%A9valo-guzm%C3%A1n-030b36305/",target: "_blank",
      },
      {
        icon: Mail,
        label: "Email",
        href: "mailto:techventuresco@gmail.com",
      },
    ],
  };

  return (
    <footer className="relative bg-white mt-auto overflow-hidden border-t-2 border-slate-100">
      {/* Decorative gradient blobs - más sutiles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl"></div>

      {/* Top gradient border decorativo */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

      <div className="container-page relative py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6, type: "spring" }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <img
                    src="/TECHVENT.png"
                    alt="TechVenturesCO"
                    className="relative w-14 h-14 rounded-xl shadow-md"
                  />
                </motion.div>
                <div>
                  <h3 className="font-extrabold text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                    TechVenturesCO
                  </h3>
                  <p className="text-slate-500 text-sm">Tu tienda tecnológica</p>
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                Componentes tecnológicos de alta calidad con servicio único de
                ensayo presencial. <span className="text-purple-600 font-semibold">Prueba antes de comprar.</span>
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
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity"></div>
                      <div className="relative w-11 h-11 rounded-xl bg-slate-50 hover:bg-gradient-to-br hover:from-indigo-500 hover:to-purple-500 text-slate-600 hover:text-white flex items-center justify-center transition-all border-2 border-slate-200 hover:border-transparent shadow-sm hover:shadow-lg">
                        <Icon className="w-5 h-5" />
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
              Enlaces rápidos
            </h4>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.target}
                    className="text-slate-600 hover:text-purple-600 transition text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-4 transition-all"></span>
                    <span>{link.label}</span>
                    {link.href.startsWith("http") && (
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></span>
              Contacto
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-500 transition-all border-2 border-slate-200 group-hover:border-transparent">
                  <Mail className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                </div>
                <a
                  href="mailto:techventuresco@gmail.com"
                  className="text-slate-600 hover:text-purple-600 transition"
                >
                  techventuresco@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center mt-0.5 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-purple-500 transition-all border-2 border-slate-200 group-hover:border-transparent">
                  <span className="text-sm">📍</span>
                </div>
                <span className="text-slate-600 group-hover:text-purple-600 transition">
                  Bogotá, Colombia
                </span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 pt-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <Code className="w-4 h-4" />
              © {currentYear} TechVenturesCO. Todos los derechos reservados.
            </p>

            <motion.p
              className="text-slate-600 text-sm flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              Desarrollado con{" "}
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />{" "}
              por{" "}
              <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Juan Arévalo
              </span>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

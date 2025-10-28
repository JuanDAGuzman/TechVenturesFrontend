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
      { label: "Contacto", href: "https://api.whatsapp.com/send/?phone=573108216274&text&type=phone_number&app_absent=0" },
    ],
    social: [
      { icon: Github, label: "GitHub", href: "https://github.com/JuanDAGuzman" },
      {
        icon: Linkedin,
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/juan-diego-ar%C3%A9valo-guzm%C3%A1n-030b36305/",
      },
      {
        icon: Mail,
        label: "Email",
        href: "mailto:techventuresco@gmail.com",
      },
    ],
  };

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="font-extrabold text-xl text-[var(--brand)] mb-3 flex items-center gap-2">
                <img
                  src="/TECHVENT.png"
                  alt="TechVenturesCO"
                  className="w-18 h-12"
                />
                TechVenturesCO
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4 max-w-md">
                Somos tu tienda de confianza para componentes tecnológicos de
                alta calidad. Ofrecemos un servicio único de ensayo presencial
                para que pruebes antes de comprar.
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
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-[var(--brand)] hover:text-white text-slate-600 flex items-center justify-center transition-all"
                      aria-label={social.label}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-bold text-slate-900 mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2">
              {links.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-600 hover:text-[var(--brand)] transition text-sm flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                    {link.href.startsWith("http") && (
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-bold text-slate-900 mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--brand)]" />
                <a
                  href="mailto:techventuresco@gmail.com"
                  className="hover:text-[var(--brand)] transition"
                >
                  techventuresco@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--brand)] mt-0.5">📍</span>
                <span>Bogotá, Colombia</span>
              </li>
            </ul>
          </motion.div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <p className="text-slate-500 text-sm">
              © {currentYear} TechVenturesCO. Todos los derechos reservados.
            </p>

            <p className="text-slate-600 text-sm flex items-center gap-1">
              Desarrollado con{" "}
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> por{" "}
              <span className="font-semibold text-[var(--brand)]">
                Juan Arévalo
              </span>
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

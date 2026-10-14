import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUp, ArrowUpRight, Github, Linkedin, Mail, MapPin, MessageCircle, Instagram } from "lucide-react";

const API = (
    import.meta.env.VITE_API_BASE ??
    import.meta.env.VITE_API ??
    window.__API_BASE__ ??
    "http://localhost:4000/api"
).replace(/\/+$/, "");

const DEFAULT_WHATSAPP = "573108216274";

// Quita tildes y arma el slug que usa el catálogo en ?categoria=
function slugify(name) {
    return name
        .normalize("NFD")
        .split("")
        .filter((ch) => {
            const code = ch.codePointAt(0);
            return code < 0x0300 || code > 0x036f;
        })
        .join("")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");
}

function scrollToTop() {
    // La página hace scroll en el body (html y body tienen overflow-x: hidden)
    document.body.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });
}

const colTitle = "font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4";
const linkCls = "group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-brand-indigo transition-colors";

export default function FooterV2() {
    const year = new Date().getFullYear();
    const { pathname } = useLocation();
    const [categories, setCategories] = useState([]);
    const [settings, setSettings] = useState({});
    const [products, setProducts] = useState([]);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            fetch(`${API}/catalog/categories`).then((r) => r.json()),
            fetch(`${API}/catalog/settings`).then((r) => r.json()),
            fetch(`${API}/catalog/products`).then((r) => r.json()),
        ])
            .then(([c, s, p]) => {
                if (cancelled) return;
                if (c.ok) setCategories(c.categories);
                if (s.ok) setSettings(s.settings);
                if (p.ok) setProducts(p.products);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, []);

    // Solo secciones de primer nivel que tengan productos disponibles (sumando sus subsecciones)
    const shortcuts = categories
        .filter((cat) => !cat.parent_id)
        .filter((cat) => {
            const ids = new Set([cat.name, ...categories.filter((k) => k.parent_id === cat.id).map((k) => k.name)]);
            return products.some((pr) => pr.available && ids.has(pr.category));
        });

    const wa = (settings.whatsapp_number || DEFAULT_WHATSAPP).replace(/\D/g, "");
    const waHref = `https://wa.me/${wa}?text=${encodeURIComponent("Hola, quisiera más información del catálogo.")}`;
    const ig = settings.instagram_handle?.trim();
    const igUser = ig ? ig.replace(/^@/, "") : null;

    return (
        <footer className="relative mt-auto border-t border-slate-300" style={{ background: "#f6f7f9" }}>
            <div className="max-w-[1180px] mx-auto px-4 sm:px-6">

                <div className="grid gap-10 md:gap-8 md:grid-cols-[1.5fr_1fr_1fr] py-12 sm:py-16">

                    {/* Marca */}
                    <div>
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo-mark.png"
                                alt=""
                                aria-hidden="true"
                                className="h-14 w-14 object-contain"
                                style={{ mixBlendMode: "multiply" }}
                            />
                            <div className="leading-none">
                                <p className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900">
                                    TechVentures<span className="text-brand-indigo">CO</span>
                                </p>
                                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">
                                    Tu aliado en tecnología
                                </p>
                            </div>
                        </div>
                        <p className="mt-5 text-sm text-slate-600 leading-relaxed max-w-[42ch]">
                            Tú ya sabes lo que quieres. Nosotros solo nos aseguramos de que lo consigas, rápido, sin rodeos y sin sorpresas.
                        </p>
                    </div>

                    {/* Explorar */}
                    <div>
                        <p className={colTitle}>Explorar</p>
                        <ul className="space-y-2.5">
                            <li>
                                <Link to="/" className={linkCls} onClick={() => pathname === "/" && scrollToTop()}>
                                    <span className="uppercase tracking-wide text-[13px]">Todos</span>
                                </Link>
                            </li>
                            {shortcuts.slice(0, 6).map((cat) => (
                                <li key={cat.id}>
                                    <Link to={`/?categoria=${slugify(cat.name)}`} className={linkCls}>
                                        <span className="uppercase tracking-wide text-[13px]">{cat.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div>
                        <p className={colTitle}>Escríbenos</p>
                        <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3 text-sm font-bold rounded-[3px] transition-colors hover:bg-brand-indigo"
                        >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                            <ArrowUpRight className="w-4 h-4 opacity-70" />
                        </a>
                        <ul className="mt-5 space-y-3 text-sm text-slate-700">
                            <li>
                                <a href="mailto:techventuresco@gmail.com" className="inline-flex items-center gap-2.5 font-semibold hover:text-brand-indigo transition-colors">
                                    <Mail className="w-4 h-4 text-slate-500 shrink-0" /> techventuresco@gmail.com
                                </a>
                            </li>
                            {igUser && (
                                <li>
                                    <a href={`https://instagram.com/${igUser}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 font-semibold hover:text-brand-indigo transition-colors">
                                        <Instagram className="w-4 h-4 text-slate-500 shrink-0" /> @{igUser}
                                    </a>
                                </li>
                            )}
                            <li className="inline-flex items-center gap-2.5 font-semibold">
                                <MapPin className="w-4 h-4 text-slate-500 shrink-0" /> Bogotá, Colombia
                            </li>
                        </ul>
                        <Link to="/contact" className={`${linkCls} mt-5`}>
                            Más formas de contacto <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-indigo" />
                        </Link>
                    </div>
                </div>

                {/* Barra inferior */}
                <div className="border-t border-slate-300 py-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                    <p className="font-mono text-xs text-slate-600">© {year} TechVenturesCO</p>

                    <p className="flex items-center gap-3 text-xs text-slate-600">
                        <span>Desarrollado por Juan Arévalo</span>
                        <a href="https://github.com/JuanDAGuzman" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-slate-500 hover:text-brand-indigo transition-colors">
                            <Github className="w-4 h-4" />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/juan-diego-ar%C3%A9valo-guzm%C3%A1n-030b36305/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                            className="text-slate-500 hover:text-brand-indigo transition-colors"
                        >
                            <Linkedin className="w-4 h-4" />
                        </a>
                    </p>

                    <button
                        onClick={scrollToTop}
                        className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-400 text-xs font-bold uppercase tracking-wide text-slate-800 bg-white rounded-[3px] hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
                    >
                        Volver arriba <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </footer>
    );
}

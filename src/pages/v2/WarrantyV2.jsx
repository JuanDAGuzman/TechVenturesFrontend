// Página pública "Garantía": qué cubre, qué no y cómo se tramita.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, CheckCircle2, XCircle, MessageCircle, ClipboardCheck, Search, Stethoscope, Wrench,
  AlertTriangle, ArrowLeft, Clock, PackageCheck,
} from "lucide-react";

const API = (
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API ??
  window.__API_BASE__ ??
  "http://localhost:4000/api"
).replace(/\/+$/, "");

const DEFAULT_WHATSAPP = "573108216274";

const COVERS = [
  "Fallas de funcionamiento causadas por un defecto de fábrica o de los componentes internos del artículo, que aparezcan dentro del plazo de garantía.",
  "Que el artículo sea el mismo que te vendimos y funcione con las características y condiciones con las que lo publicamos.",
  "Cuando se confirma un defecto de fábrica: reparación o reposición del artículo, y nosotros asumimos el costo total de esa reparación.",
  "Si no es posible repararlo ni reponerlo, buscamos contigo una solución equivalente, como un cambio por otro artículo de igual valor o la devolución del dinero.",
];

const NOT_COVERS = [
  "Golpes, caídas, roturas, aplastamiento o cualquier daño físico.",
  "Líquidos, humedad, corrosión, polvo excesivo o exposición a calor extremo.",
  "Daños causados por una fuente de poder defectuosa o de mala calidad, picos de voltaje, cortos o conexiones incorrectas.",
  "Abrir, desarmar o modificar el artículo (incluye retirar sellos o etiquetas) y reparaciones hechas por terceros.",
  "Overclock extremo, BIOS o firmware no oficiales, o uso fuera de las especificaciones del fabricante.",
  "Desgaste normal, rayones, marcas o daños estéticos que no afectan el funcionamiento.",
  "Incompatibilidades con otros componentes de tu equipo, o instalación incorrecta (ranuras, cables, drivers, software).",
  "Rendimiento diferente al que esperabas. El rendimiento depende de todo el equipo (procesador, fuente, memoria, ventilación, software y juegos), no solo del artículo.",
];

const STEPS = [
  {
    Icon: MessageCircle,
    title: "Escríbenos",
    text: "Contáctanos por WhatsApp e indica qué artículo compraste, la fecha de compra y qué falla presenta. Si puedes, envía fotos o un video de la falla.",
  },
  {
    Icon: ClipboardCheck,
    title: "Validamos tu garantía",
    text: "Confirmamos que el artículo sea el mismo que te vendimos (referencia, serial y estado) y que esté dentro del plazo de garantía.",
  },
  {
    Icon: Search,
    title: "Revisión inicial",
    text: "Cuando recibimos el artículo hacemos una primera revisión visual para detectar golpes, humedad, sellos rotos u otras señales de manipulación.",
  },
  {
    Icon: Stethoscope,
    title: "Diagnóstico técnico",
    text: "Un técnico revisa el artículo y determina la causa del problema. Este proceso toma entre 7 y 15 días hábiles según el caso, y te mantenemos informado.",
  },
  {
    Icon: Wrench,
    title: "Solución",
    text: "Si es un defecto de fábrica, nosotros asumimos el costo total de la reparación o la reposición. Si la causa es otra (mala fuente, manipulación, golpe, humedad…), te mostramos el diagnóstico y acordamos contigo cómo proceder.",
  },
];

function SectionTitle({ eyebrow, children }) {
  return (
    <div className="mb-5">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-2">{eyebrow}</p>
      <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 leading-tight">{children}</h2>
    </div>
  );
}

function Fact({ value, label }) {
  return (
    <div className="bg-white border border-slate-300 rounded-[6px] p-4 sm:p-5">
      <p className="font-display font-bold text-2xl sm:text-3xl text-slate-900 leading-none brand-text">{value}</p>
      <p className="text-sm text-slate-600 mt-2 leading-snug">{label}</p>
    </div>
  );
}

export default function WarrantyV2() {
  const [wa, setWa] = useState(DEFAULT_WHATSAPP);

  useEffect(() => {
    document.title = "Garantía | TechVenturesCO";
    let cancelled = false;
    fetch(`${API}/catalog/settings`)
      .then((r) => r.json())
      .then((d) => {
        const n = d?.settings?.whatsapp_number?.replace(/\D/g, "");
        if (!cancelled && n) setWa(n);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const waHref = `https://wa.me/${wa}?text=${encodeURIComponent("Hola, quisiera consultar por la garantía de un artículo que compré.")}`;

  return (
    <div className="relative w-full min-w-0" style={{ "--brand": "#6d28d9", "--brand-hover": "#5b21b6", "--brand-ring": "#ede9fe" }}>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 w-full min-w-0 pt-8 sm:pt-12 pb-24">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-indigo transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </Link>

        {/* Encabezado */}
        <header className="pb-8 sm:pb-10 border-b border-slate-300">
          <p className="inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-3">
            <ShieldCheck className="w-4 h-4 brand-text" /> Garantía TechVenturesCO
          </p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-tight text-slate-900 leading-[1.05]">
            Garantía en todos nuestros artículos<span className="brand-text">.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed max-w-2xl">
            Cada artículo incluye garantía de funcionamiento. El tiempo (de 1 a 6 meses) aparece en cada producto y empieza a contar desde la fecha de entrega. Aquí te explicamos con claridad qué cubre, qué no y cómo se tramita, para que ambos sepamos a qué atenernos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7">
            <Fact value="1 a 6 meses" label="de garantía, según el artículo. Lo ves en cada producto." />
            <Fact value="7 a 15 días" label="hábiles para el diagnóstico técnico, según el caso." />
            <Fact value="Costo total" label="de la reparación a nuestro cargo si es defecto de fábrica." />
          </div>
        </header>

        {/* Qué cubre */}
        <section className="py-8 sm:py-10 border-b border-slate-300">
          <SectionTitle eyebrow="Lo que sí">Qué cubre la garantía</SectionTitle>
          <ul className="space-y-3">
            {COVERS.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 brand-text" />
                <span className="text-slate-700 leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Qué no cubre */}
        <section className="py-8 sm:py-10 border-b border-slate-300">
          <SectionTitle eyebrow="Lo que no">Qué no cubre la garantía</SectionTitle>
          <ul className="space-y-3">
            {NOT_COVERS.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-slate-500" />
                <span className="text-slate-700 leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 border border-slate-400 bg-white rounded-[6px] p-4 sm:p-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-slate-700" />
            <div>
              <p className="font-display font-semibold text-slate-900">La garantía no es una devolución por gusto</p>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                Si el artículo funciona correctamente, no hay cambio ni devolución del dinero porque rindió menos de lo esperado o porque ya no lo necesitas. Antes de comprar, escríbenos: te ayudamos a elegir según lo que vas a usar.
              </p>
            </div>
          </div>
        </section>

        {/* Cómo se tramita */}
        <section className="py-8 sm:py-10 border-b border-slate-300">
          <SectionTitle eyebrow="Paso a paso">Cómo se tramita una garantía</SectionTitle>
          <ol className="relative">
            {STEPS.map(({ Icon, title, text }, i) => (
              <li key={title} className="relative flex gap-4 pb-7 last:pb-0">
                {i < STEPS.length - 1 && <span className="absolute left-[19px] top-10 bottom-0 w-px bg-slate-300" aria-hidden />}
                <span className="relative z-10 w-10 h-10 shrink-0 flex items-center justify-center bg-white border border-slate-400 rounded-[3px]">
                  <Icon className="w-5 h-5 text-slate-800" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="font-display font-semibold text-lg text-slate-900 leading-tight">{title}</p>
                  <p className="text-slate-600 mt-1.5 leading-relaxed">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Qué necesitas */}
        <section className="py-8 sm:py-10 border-b border-slate-300">
          <SectionTitle eyebrow="Para agilizar">Ten a la mano</SectionTitle>
          <ul className="space-y-3">
            {[
              { Icon: PackageCheck, t: "El artículo completo y tal como lo recibiste (con sus accesorios y sin modificaciones)." },
              { Icon: ClipboardCheck, t: "Tu comprobante de compra: la conversación de WhatsApp donde se acordó la venta o la factura." },
              { Icon: Clock, t: "La fecha de entrega, para confirmar que sigues dentro del plazo." },
            ].map(({ Icon, t }) => (
              <li key={t} className="flex items-start gap-3">
                <Icon className="w-5 h-5 shrink-0 mt-0.5 text-slate-700" />
                <span className="text-slate-700 leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Contacto */}
        <section className="pt-8 sm:pt-10">
          <div className="bg-slate-900 text-white rounded-[6px] p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-xl sm:text-2xl leading-tight">¿Tienes una garantía por tramitar?</p>
              <p className="text-slate-300 mt-1.5 text-sm sm:text-base">Escríbenos por WhatsApp con los datos de tu compra y te guiamos.</p>
            </div>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-900 text-sm font-bold uppercase tracking-wide rounded-[3px] hover:bg-brand-indigo hover:text-white transition-colors shrink-0"
            >
              <MessageCircle className="w-4 h-4" /> Escribir por WhatsApp
            </a>
          </div>

          <p className="text-xs text-slate-500 mt-5 leading-relaxed">
            Esta política complementa, y no limita, los derechos que la Ley 1480 de 2011 (Estatuto del Consumidor) reconoce a los consumidores en Colombia.
          </p>
        </section>
      </div>
    </div>
  );
}

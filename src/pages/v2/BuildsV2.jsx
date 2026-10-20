// Sección pública "PCs armados": tarjetas de equipos completos y su modal de detalle.
// Solo se monta cuando existe al menos un equipo disponible en la categoría PCS ARMADOS.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Cpu, Monitor, Keyboard, Mouse, Headphones, Package, Plus, X, Check, MessageCircle,
  ArrowRight, ChevronDown, Tag,
} from "lucide-react";
import { parseBuild, summaryRows, SHORT_LABEL } from "../../lib/prebuilt.js";
import useVisibleHeight from "../../lib/useVisibleHeight.js";

const GRADIENT = "linear-gradient(180deg, #f8f9fc 0%, #eceff5 100%)";
const PHOTO_BG = "#f1f3f6";
const copFmt = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const cop = (p) => `$ ${copFmt.format(p)}`;

const INCLUDE_ICON = { MONITOR: Monitor, TECLADO: Keyboard, MOUSE: Mouse, AUDIFONOS: Headphones };
const INCLUDE_LABEL = { MONITOR: "Monitor", TECLADO: "Teclado", MOUSE: "Mouse", AUDIFONOS: "Audífonos" };

const hasDiscountOf = (p) => p.original_price && Number(p.original_price) > Number(p.price);
const discountPct = (p) => Math.round((1 - p.price / p.original_price) * 100);
const condTagsOf = (p) => (p.condition ? p.condition.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean) : []);

// Etiqueta cuadrada con el acento de marca
function IncludeChip({ item }) {
  const Icon = INCLUDE_ICON[item.type] ?? Package;
  const label = item.type === "OTRO" ? item.name : (INCLUDE_LABEL[item.type] ?? item.type);
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-[3px] leading-none"
      style={{ background: "var(--brand-ring)", color: "var(--brand)", boxShadow: "inset 0 0 0 1px var(--brand)" }}
    >
      <Icon className="w-3 h-3 shrink-0" /> {label}
    </span>
  );
}

function BuildPhoto({ product, className = "" }) {
  const [err, setErr] = useState(false);
  if (product.image_url && !err) {
    return (
      <img
        src={product.image_url}
        alt={product.name}
        className={`w-full h-full object-contain ${className}`}
        style={{ mixBlendMode: "multiply" }}
        onError={() => setErr(true)}
      />
    );
  }
  return <Cpu className="w-1/3 h-1/3 text-slate-400" strokeWidth={1.25} />;
}

function BuildCard({ product, selected, onToggle, onOpen }) {
  const rows = summaryRows(product.build);
  const { includes } = parseBuild(product.build);
  const discount = hasDiscountOf(product);

  return (
    <div
      onClick={() => onOpen(product)}
      className="group relative bg-white rounded-[6px] border border-slate-200 flex flex-col min-w-0 cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.05),0_10px_26px_-14px_rgba(15,23,42,0.22)] transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-[rgba(109,40,217,0.4)] hover:shadow-[0_2px_4px_rgba(15,23,42,0.05),0_22px_40px_-18px_rgba(15,23,42,0.32)]"
      style={selected ? { boxShadow: "0 0 0 2px var(--brand), 0 18px 36px -18px rgba(109,40,217,0.5)" } : undefined}
    >
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="relative h-44 sm:h-52 mb-4 rounded-[4px] overflow-hidden" style={{ background: GRADIENT }}>
          <div className="w-full h-full p-3 flex items-center justify-center">
            <BuildPhoto product={product} />
          </div>
          <span className="absolute top-2 left-2 text-[9px] font-mono font-bold uppercase tracking-wider sm:tracking-widest px-1.5 py-1 rounded-[3px] text-slate-700 border border-slate-300 bg-white/90 leading-none">
            PC armado
          </span>
          {discount && !selected && (
            <span
              className="absolute top-2 right-2 flex items-center gap-1.5 font-mono text-[12px] sm:text-[14px] font-bold tracking-tight px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-[3px] text-white leading-none shadow-sm"
              style={{ background: "var(--brand)" }}
            >
              <Tag className="hidden sm:block w-3.5 h-3.5 shrink-0" />
              -{discountPct(product)}%
            </span>
          )}
          {selected && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-[3px] flex items-center justify-center" style={{ background: "var(--brand)" }}>
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          )}
        </div>

        <p className="font-display font-semibold text-slate-900 text-lg sm:text-xl leading-tight line-clamp-2">{product.name}</p>

        {rows.length > 0 && (
          <div className="mt-3 border-t border-slate-200">
            {rows.map((c) => (
              <div key={`${c.type}-${c.name}`} className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-200">
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 shrink-0">{SHORT_LABEL[c.type] ?? c.type}</span>
                <span className="font-mono text-xs text-slate-800 text-right uppercase truncate min-w-0">{c.name}</span>
              </div>
            ))}
          </div>
        )}

        {includes.length > 0 && (
          <div className="mt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 mb-1.5">Incluye</p>
            <div className="flex flex-wrap gap-1.5">
              {includes.map((i) => <IncludeChip key={`${i.type}-${i.name}`} item={i} />)}
            </div>
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-2 mb-3">
            <div className="min-w-0">
              {discount && (
                <p className="text-[13px] sm:text-sm font-semibold text-slate-600 line-through decoration-[1px] decoration-slate-500 font-mono leading-none mb-1.5">{cop(product.original_price)}</p>
              )}
              <p className={`font-mono font-bold text-xl sm:text-2xl tracking-tight leading-none ${discount ? "text-[var(--brand)]" : "text-slate-900"}`}>{cop(product.price)}</p>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-slate-500 shrink-0 mb-0.5 group-hover:text-[var(--brand)] transition-colors">
              Ver detalle <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(product); }}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[3px] text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors ${
              selected ? "text-white" : "bg-slate-900 text-white hover:bg-[var(--brand)]"
            }`}
            style={selected ? { background: "var(--brand)" } : undefined}
          >
            {selected ? <><X className="w-3.5 h-3.5" /> Quitar de la consulta</> : <><Plus className="w-3.5 h-3.5" /> Agregar a la consulta</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// Encabezado + cuadrícula. No ocupa espacio si no hay equipos.
export function BuildsSection({ builds, selectedIds, onToggle, onOpen }) {
  const [showAll, setShowAll] = useState(false);
  if (!builds.length) return null;
  const LIMIT = 3;
  const shown = showAll ? builds : builds.slice(0, LIMIT);

  return (
    <section id="pcs-armados" className="py-8 sm:py-10 border-b border-slate-300 scroll-mt-28">
      <div className="flex items-baseline gap-3 mb-1.5">
        <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-slate-900 leading-none">PCs armados</h2>
        <span className="ml-auto font-mono text-[11px] sm:text-xs font-medium text-slate-600 uppercase tracking-wider">
          {builds.length} equipo{builds.length !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-5 max-w-2xl">
        Equipos completos listos para usar. Abre uno para ver todos sus componentes y lo que incluye.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {shown.map((p) => (
          <BuildCard key={p.id} product={p} selected={selectedIds.has(p.id)} onToggle={onToggle} onOpen={onOpen} />
        ))}
      </div>
      {builds.length > LIMIT && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-400 bg-white text-xs font-bold uppercase tracking-wide text-slate-800 rounded-[3px] hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
          >
            {showAll ? "Ver menos" : `Ver todos los equipos (${builds.length})`}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}
    </section>
  );
}

function SpecList({ title, items, showType = true }) {
  if (!items.length) return null;
  return (
    <div className="mt-5">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-2">{title}</p>
      <div className="border-t border-slate-300">
        {items.map((c) => {
          const typeLabel = c.type === "OTRO" ? "OTRO" : c.type;
          return (
            <div key={`${c.type}-${c.name}`} className="flex justify-between gap-4 py-2.5 border-b border-slate-200">
              {showType && <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500 shrink-0">{typeLabel}</span>}
              <span className="font-mono text-xs text-slate-800 text-right uppercase min-w-0 break-words">{c.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BuildModal({ product, isSelected, onToggle, onClose, waLink }) {
  const vh = useVisibleHeight();
  const scrollRef = useRef(null);
  const [showHint, setShowHint] = useState(false);
  const { components, includes } = parseBuild(product.build);
  const discount = hasDiscountOf(product);
  const tags = condTagsOf(product);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Indicador de "hay más información abajo" mientras quede contenido por ver
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const overflow = el.scrollHeight - el.clientHeight > 8;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      setShowHint(overflow && !nearBottom);
    };
    check();
    el.addEventListener("scroll", check);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, [product, vh]);

  return createPortal(
    <div
      className="fixed inset-x-0 top-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ height: vh, "--vvh": `${vh}px` }}
      onClick={onClose}
    >
      <div
        className="modal-pop bg-white rounded-t-lg sm:rounded-lg shadow-2xl w-full max-w-3xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-20 w-10 h-10 bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div ref={scrollRef} className="max-h-[calc(var(--vvh)*0.88)] sm:max-h-[90vh] overflow-y-auto overscroll-contain grid grid-cols-1 md:grid-cols-2">
          <div
            className="relative overflow-hidden h-[calc(var(--vvh)*0.27)] min-h-[140px] md:h-auto md:min-h-[360px] border-b md:border-b-0 md:border-r border-slate-300 flex items-center justify-center"
            style={{ background: PHOTO_BG }}
          >
            <div className="absolute inset-0 p-5 md:p-8 flex items-center justify-center">
              <BuildPhoto product={product} />
            </div>
          </div>

          <div className="p-5 sm:p-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex flex-col">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-2">PC armado</div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 leading-tight">{product.name}</h2>
            {product.description?.trim() && (
              <p className="text-sm text-slate-600 mt-3 leading-relaxed uppercase">{product.description}</p>
            )}

            {discount && (
              <div className="flex items-center gap-2 mt-4">
                <span className="flex items-center gap-1.5 font-mono text-base font-bold px-3 py-1.5 rounded-[3px] text-white" style={{ background: "var(--brand)" }}>
                  <Tag className="w-3.5 h-3.5 shrink-0" /> -{discountPct(product)}% descuento
                </span>
                <span className="text-lg font-semibold text-slate-600 line-through decoration-[1px] decoration-slate-500 font-mono">{cop(product.original_price)}</span>
              </div>
            )}
            <p className={`font-mono text-2xl sm:text-3xl font-bold ${discount ? "mt-1 text-[var(--brand)]" : "mt-4 text-slate-900"}`}>{cop(product.price)}</p>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center font-mono text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-[3px] leading-none bg-slate-100 text-slate-600 border border-slate-200">{t}</span>
                ))}
              </div>
            )}

            <SpecList title="Componentes" items={components} />
            <SpecList title="Incluye" items={includes} showType={false} />

            <div className="mt-auto pt-3 md:pt-5 flex flex-col gap-2.5 sticky bottom-0 bg-white -mx-5 px-5 pb-1 border-t border-slate-200 md:static md:mx-0 md:px-0 md:pb-0 md:border-t-0">
              {showHint && (
                <div className="md:hidden pointer-events-none absolute inset-x-0 -top-8 flex justify-center">
                  <button
                    type="button"
                    aria-label="Ver más información"
                    onClick={() => scrollRef.current?.scrollBy({ top: 200, behavior: "smooth" })}
                    className="pointer-events-auto w-11 h-7 bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-700 animate-bounce"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              )}
              <button
                onClick={() => onToggle(product)}
                className="flex items-center justify-center gap-1.5 w-full py-3 text-sm font-bold uppercase tracking-wide transition-all whitespace-nowrap text-white"
                style={{ background: "var(--brand)", ...(isSelected ? { filter: "brightness(0.78)" } : {}) }}
              >
                {isSelected ? <><X className="w-4 h-4 shrink-0" /> Quitar de la consulta</> : <><Plus className="w-4 h-4 shrink-0" /> Agregar a la consulta</>}
              </button>
              <a
                href={waLink(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-3 text-sm font-bold uppercase tracking-wide border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" /> Preguntar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

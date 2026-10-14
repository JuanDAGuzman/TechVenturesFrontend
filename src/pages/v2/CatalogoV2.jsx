import { useEffect, useState, useMemo, useRef, createContext, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MessageCircle, Package, CreditCard, Tag, Repeat2, Plus, Check, X, ChevronDown, ChevronLeft, ChevronRight, ArrowRight, ArrowDown, AlertTriangle, Layers, ShoppingBag } from "lucide-react";
import Silhouette, { CATEGORY_FORM } from "../../components/v2/Silhouette.jsx";
import { brandFromColor, DEFAULT_BRAND } from "../../lib/categoryBrand.js";

const API = (
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API ??
  window.__API_BASE__ ??
  "http://localhost:4000/api"
).replace(/\/+$/, "");

// Un solo acento de marca (morado del logo) para todo el catálogo
const ACCENT = "#6d28d9";
const TODOS_BRAND = brandFromColor(ACCENT);
const BrandContext = createContext({ brandMap: {}, activeBrand: TODOS_BRAND });

const PAGE_BG = "#f6f7f9";   // fondo de la página (debe coincidir con LayoutV2)
const PHOTO_BG = "#f1f3f6";  // fondo donde se funden las fotos en modales
const PAGE_SIZE = 12;

// Ancho de lectura de toda la página
const WRAP = "max-w-[1180px] mx-auto px-4 sm:px-6 w-full min-w-0";

// Quita tildes sin escribir el rango Unicode como literal de regex
function stripAccents(s) {
  return s
    .normalize("NFD")
    .split("")
    .filter((ch) => {
      const code = ch.codePointAt(0);
      return code < 0x0300 || code > 0x036f;
    })
    .join("");
}

// Convierte el nombre de una categoría en un slug apto para la URL (ej. "Componentes" → "componentes")
function slugify(name) {
  return stripAccents(name).toLowerCase().trim().replace(/\s+/g, "-");
}

function formatPrice(p) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(p);
}

const copFmt = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
function formatCop(p) {
  return `$ ${copFmt.format(p)}`;
}

// Cifras de una oferta por cantidad (precio normal vs. precio por volumen)
function dealStats(deal) {
  const dealProducts = deal.products ?? [];
  const prices = dealProducts.map((p) => Number(p.price));
  const minP = prices.length ? Math.min(...prices) : 0;
  const maxP = prices.length ? Math.max(...prices) : 0;
  const savingUnit = minP > 0 ? minP - Number(deal.bundle_price) : 0;
  return {
    dealProducts,
    minP,
    maxP,
    savingPct: minP > 0 ? Math.round((savingUnit / minP) * 100) : 0,
    savingTotal: savingUnit * Number(deal.min_quantity),
  };
}

// Foto del producto (se funde con el fondo) o ilustración técnica si no hay foto
function ProductThumb({ imageUrl, category, name }) {
  const [imgErr, setImgErr] = useState(false);
  const { brandMap } = useContext(BrandContext);
  const dot = brandMap[category]?.dot ?? DEFAULT_BRAND.dot;
  const form = CATEGORY_FORM[category] ?? "component";

  if (imageUrl && !imgErr) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <img
          src={imageUrl}
          alt={name}
          className="max-w-full max-h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          style={{ mixBlendMode: "multiply" }}
          onError={() => setImgErr(true)}
        />
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <Silhouette
        form={form}
        className="w-[62%] max-h-full transition-all duration-500 ease-out opacity-[var(--sil-op)] group-hover:scale-105 group-hover:opacity-100"
        style={{ color: dot, "--sil-op": 0.5 }}
      />
    </div>
  );
}

// Tarjeta de producto — celda de la cuadrícula unida por líneas finas
function ProductCard({ product, tier, isSelected, onToggle, onOpenDetail, waLink, index = 0 }) {
  const { brandMap } = useContext(BrandContext);
  const b = brandMap[product.category] ?? DEFAULT_BRAND;
  const condTags = product.condition ? product.condition.split(",").map(t => t.trim().toUpperCase()).filter(Boolean) : [];
  const isNew = condTags.some(t => t === "NUEVO" || t === "SELLADO" || t === "OPEN BOX");
  const hasBox = condTags.includes("CON CAJA");
  const hasDiscount = product.available && product.original_price && Number(product.original_price) > Number(product.price);
  const estado = [...condTags, !isNew ? "USADO" : null, !hasBox ? "SIN CAJA" : null].filter(Boolean).join(" · ");

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className={`catalog-card-in group relative bg-white p-3 sm:p-5 flex flex-col min-w-0 cursor-pointer border-r border-b border-slate-300 transition-colors duration-200 hover:bg-[#fbfbfd] ${
        !product.available ? "opacity-60" : ""
      }`}
      style={{
        animationDelay: `${Math.min(index % PAGE_SIZE, 11) * 35}ms`,
        ...(product.available && isSelected ? { boxShadow: "inset 0 0 0 2px var(--brand)" } : {}),
      }}
    >
      {/* Foto */}
      <div className="relative h-32 sm:h-40 mb-3 sm:mb-4">
        <ProductThumb imageUrl={product.image_url} category={product.category} name={product.name} />

        {(tier || product.is_flagship) && (
          <div className="absolute top-0 left-0 flex flex-col items-start gap-1">
            {tier && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 text-slate-700 border border-slate-400 bg-white">
                Gama {tier}
              </span>
            )}
            {product.is_flagship && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 text-white" style={{ background: "var(--brand)" }}>
                Insignia
              </span>
            )}
          </div>
        )}
        {!product.available && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 border border-slate-300">Agotado</span>
          </div>
        )}
        {hasDiscount && !isSelected && (
          <span
            className="absolute top-0 right-0 flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 border bg-white"
            style={{ color: b.dot, borderColor: b.dot }}
          >
            <Tag className="w-2.5 h-2.5 shrink-0" />
            -{Math.round((1 - product.price / product.original_price) * 100)}%
          </span>
        )}
        {isSelected && (
          <div className="absolute top-0 right-0 w-6 h-6 flex items-center justify-center" style={{ background: "var(--brand)" }}>
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Información */}
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">{product.category}</span>
      <p className="font-display font-semibold text-slate-900 text-[15px] sm:text-[17px] leading-tight mt-1 line-clamp-2">{product.name}</p>

      <div className="mt-3 flex flex-col gap-1">
        {product.memory_capacity && (
          <p className="flex gap-2 text-[11px] sm:text-xs text-slate-600 uppercase">
            <span className="font-mono text-slate-400 w-4 shrink-0">01</span>
            <span>Memoria — <span className="text-slate-900 font-semibold">{product.memory_capacity}</span></span>
          </p>
        )}
        <p className="flex gap-2 text-[11px] sm:text-xs text-slate-600 uppercase">
          <span className="font-mono text-slate-400 w-4 shrink-0">{product.memory_capacity ? "02" : "01"}</span>
          <span>Estado — <span className={`font-semibold ${isNew ? "brand-text" : "text-slate-900"}`}>{estado}</span></span>
        </p>
      </div>

      {product.description?.trim() && (
        <p className="text-[11px] sm:text-xs text-slate-500 mt-2 leading-relaxed uppercase line-clamp-2 sm:group-hover:line-clamp-none">
          {product.description}
        </p>
      )}

      {/* Precio */}
      <div className="mt-auto pt-4">
        <div className="pt-3 border-t border-slate-300 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {hasDiscount && (
              <p className="text-[11px] text-slate-500 line-through font-mono leading-none mb-1">{formatPrice(product.original_price)}</p>
            )}
            <p className="font-mono font-bold text-slate-900 text-lg sm:text-xl tracking-tight leading-none">{formatPrice(product.price)}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 shrink-0 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[var(--brand)]" />
        </div>

        {product.available ? (
          <div className="mt-3 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(product); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wide border transition-colors ${
                isSelected
                  ? "text-white border-transparent"
                  : "text-slate-900 border-slate-900 hover:bg-slate-900 hover:text-white"
              }`}
              style={isSelected ? { background: "var(--brand)" } : undefined}
            >
              {isSelected ? <><X className="w-3.5 h-3.5" /> Quitar</> : <><Plus className="w-3.5 h-3.5" /> Agregar</>}
            </button>
            <a
              href={waLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Contactar por WhatsApp"
              className="shrink-0 w-10 flex items-center justify-center border border-slate-400 text-slate-600 hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="mt-3 py-2 bg-slate-100 text-center text-xs text-slate-500 font-medium uppercase tracking-wide">
            No disponible
          </div>
        )}
      </div>
    </div>
  );
}

// Modal de detalle — se abre al hacer clic en una tarjeta
function ProductDetailModal({ product, tier, isSelected, onToggle, onClose, waLink }) {
  const { brandMap } = useContext(BrandContext);
  const b = brandMap[product.category] ?? DEFAULT_BRAND;
  const form = CATEGORY_FORM[product.category] ?? "component";
  const scrollRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Muestra un indicador de "más contenido abajo" mientras el modal tenga
  // scroll pendiente (útil en mobile, donde los botones quedan fuera de vista)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const hasOverflow = el.scrollHeight - el.clientHeight > 8;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      setShowScrollHint(hasOverflow && !nearBottom);
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
  }, [product]);

  const condTagsModal = product.condition ? product.condition.split(",").map(t => t.trim().toUpperCase()).filter(Boolean) : [];
  const isNewModal = condTagsModal.some(t => t === "NUEVO" || t === "SELLADO" || t === "OPEN BOX");
  const hasBoxModal = condTagsModal.includes("CON CAJA");
  const conditionDisplay = [
    product.condition || null,
    !isNewModal ? "Usado" : null,
    !hasBoxModal ? "Sin caja" : null,
  ].filter(Boolean).join(", ") || "Usado, Sin caja";

  const specs = [
    ["Categoría", product.category],
    product.memory_capacity && ["Memoria / Capacidad", product.memory_capacity],
    ["Estado", conditionDisplay],
    tier && ["Gama", tier],
    product.is_flagship && ["Insignia", "Sí, tope de línea de su marca"],
    ["Disponibilidad", product.available ? "Disponible" : "Agotado"],
  ].filter(Boolean);

  const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="modal-pop bg-white rounded-lg shadow-2xl w-full max-w-3xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 bg-white/90 border border-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div ref={scrollRef} className="max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2">

        {/* Visual */}
        <div
          className="relative min-h-[240px] md:min-h-[360px] border-b md:border-b-0 md:border-r border-slate-300 flex items-center justify-center p-8"
          style={{ background: PHOTO_BG }}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
              style={{ mixBlendMode: "multiply" }}
            />
          ) : (
            <Silhouette form={form} className="w-[70%] max-h-full" style={{ color: b.dot }} />
          )}
          {!product.available && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-600 bg-white px-3 py-1 border border-slate-300">Agotado</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6 sm:p-8 flex flex-col">
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-2">
            {product.category}{tier ? ` · Gama ${tier}` : ""}{product.is_flagship ? " · Marca Insignia" : ""}
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 leading-tight">
            {product.name}
          </h2>
          {product.description?.trim() && (
            <p className="text-sm text-slate-600 mt-3 leading-relaxed uppercase">{product.description}</p>
          )}
          {hasDiscount && (
            <div className="flex items-center gap-2 mt-4">
              <span
                className="flex items-center gap-1 text-sm font-black px-2.5 py-1 border bg-white"
                style={{ color: b.dot, borderColor: b.dot }}
              >
                <Tag className="w-3.5 h-3.5 shrink-0" />
                -{Math.round((1 - product.price / product.original_price) * 100)}% descuento
              </span>
              <span className="text-base text-slate-500 line-through font-mono">{formatPrice(product.original_price)}</span>
            </div>
          )}
          <p className={`font-mono text-2xl sm:text-3xl font-bold text-slate-900 ${hasDiscount ? "mt-1" : "mt-4"}`}>{formatPrice(product.price)}</p>

          <div className="mt-5 border-t border-slate-300">
            {specs.map(([k, v], i) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 border-b border-slate-200">
                <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500 shrink-0">
                  <span className="text-slate-400 mr-2">{String(i + 1).padStart(2, "0")}</span>{k}
                </span>
                <span className="font-mono text-xs text-slate-800 text-right uppercase">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-5 flex flex-col gap-2.5">
            {product.available && (
              <button
                onClick={() => onToggle(product)}
                className="flex items-center justify-center gap-1.5 w-full py-3 text-sm font-bold uppercase tracking-wide transition-all whitespace-nowrap text-white"
                style={{ background: "var(--brand)", ...(isSelected ? { filter: "brightness(0.78)" } : {}) }}
              >
                {isSelected ? (
                  <><X className="w-4 h-4 shrink-0" /> Quitar de la consulta</>
                ) : (
                  <><Plus className="w-4 h-4 shrink-0" /> Agregar a la consulta</>
                )}
              </button>
            )}
            <a
              href={waLink(product)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-3 text-sm font-bold uppercase tracking-wide border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 shrink-0" /> Preguntar por WhatsApp
            </a>
          </div>
        </div>
        </div>

        {/* Indicador de scroll: avisa que hay más contenido debajo (mobile) */}
        {showScrollHint && (
          <div className="md:hidden pointer-events-none absolute bottom-0 inset-x-0 h-14 bg-gradient-to-t from-white via-white/90 to-transparent flex items-end justify-center pb-1.5">
            <ChevronDown className="w-5 h-5 text-slate-500 animate-bounce" />
          </div>
        )}
      </div>
    </div>
  );
}

// Detalle de una oferta por cantidad — la tarjeta de la franja solo resume lo esencial
function BundleModal({ deal, onClose, onOpenProduct, waHref }) {
  const { dealProducts, minP, maxP, savingPct, savingTotal } = dealStats(deal);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="modal-pop bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">
          <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] brand-text">
            <Layers className="w-3.5 h-3.5" /> Oferta por cantidad
          </p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 leading-tight mt-2 pr-10">
            {deal.match_name}
          </h2>

          <div className="mt-5 flex items-end justify-between gap-4 flex-wrap">
            <div>
              {minP > 0 && (
                <p className="font-mono text-sm text-slate-500 line-through">
                  {minP === maxP ? formatCop(minP) : `${formatCop(minP)} – ${formatCop(maxP)}`}
                </p>
              )}
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-600 mt-1">
                Llevando {deal.min_quantity}+ unidades
              </p>
              <p className="font-mono font-bold text-slate-900 text-4xl leading-none mt-1">
                {formatCop(deal.bundle_price)}
                <span className="text-sm font-semibold text-slate-500 ml-1.5">c/u</span>
              </p>
            </div>
            {savingPct > 0 && (
              <span className="font-mono text-sm font-black px-2.5 py-1 border" style={{ color: ACCENT, borderColor: ACCENT }}>
                -{savingPct}%
              </span>
            )}
          </div>

          <div className="mt-5 flex items-start gap-2 px-4 py-3 border border-[var(--brand)] bg-[#faf9fd]">
            <AlertTriangle className="w-4 h-4 brand-text shrink-0 mt-0.5" />
            <p className="text-sm text-slate-800 leading-snug">
              Precio válido <strong>únicamente al comprar mínimo {deal.min_quantity} unidades</strong>.
              {savingTotal > 0 && <span className="font-semibold brand-text"> Ahorro total: {formatCop(savingTotal)}.</span>}
            </p>
          </div>

          {dealProducts.length > 0 && (
            <div className="mt-6">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 mb-2">
                Aplica a {dealProducts.length} referencia{dealProducts.length !== 1 ? "s" : ""}
              </p>
              <div className="border-t border-slate-300">
                {dealProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpenProduct(p)}
                    className="w-full flex items-center gap-3 py-2.5 border-b border-slate-200 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-11 h-11 shrink-0 flex items-center justify-center" style={{ background: PHOTO_BG }}>
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-1" style={{ mixBlendMode: "multiply" }} />
                        : <Package className="w-4 h-4 text-slate-400" />}
                    </div>
                    <span className="flex-1 min-w-0 text-sm font-semibold text-slate-900 leading-tight">
                      {p.name}{p.memory_capacity ? ` ${p.memory_capacity}` : ""}
                    </span>
                    <span className="font-mono text-xs text-slate-600 shrink-0">{formatCop(p.price)}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-1.5 w-full py-3 text-sm font-bold uppercase tracking-wide text-white"
            style={{ background: "var(--brand)" }}
          >
            <MessageCircle className="w-4 h-4 shrink-0" /> Consultar esta oferta
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CatalogoV2() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState("Todos");
  const [search, setSearch]     = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [detailProduct, setDetailProduct] = useState(null);
  const [bundleDeals, setBundleDeals] = useState([]);
  const [bundleModal, setBundleModal] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const catScrollRef = useRef(null);
  const [showCatHint, setShowCatHint] = useState(false);
  const offersScrollRef = useRef(null);
  const [offersHint, setOffersHint] = useState({ left: false, right: false });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/catalog/products`).then((r) => r.json()),
      fetch(`${API}/catalog/settings`).then((r) => r.json()),
      fetch(`${API}/catalog/categories`).then((r) => r.json()),
      fetch(`${API}/catalog/bundle-deals`).then((r) => r.json()),
    ])
      .then(([pData, sData, cData, bdData]) => {
        if (pData.ok) setProducts(pData.products);
        if (sData.ok) setSettings(sData.settings);
        if (cData.ok) setCategories(cData.categories);
        if (bdData.ok) setBundleDeals(bdData.deals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Orden de secciones del catálogo (todas comparten el mismo acento de marca)
  const CATEGORY_ORDER = useMemo(() => categories.map((c) => c.name), [categories]);
  const brandMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => { map[c.name] = TODOS_BRAND; });
    return map;
  }, [categories]);

  // Al cargar las categorías, selecciona la indicada en la URL (?categoria=celulares)
  useEffect(() => {
    if (!CATEGORY_ORDER.length) return;
    const slug = searchParams.get("categoria");
    if (!slug) return;
    const match = CATEGORY_ORDER.find((name) => slugify(name) === slug);
    if (match) setCategory(match);
  }, [CATEGORY_ORDER]);

  // Cambia la categoría activa y refleja la selección en la URL para poder compartirla
  function selectCategory(cat) {
    setCategory(cat);
    setSearchParams(cat === "Todos" ? {} : { categoria: slugify(cat) }, { replace: true });
  }

  // Asigna una "gama" (Alta / Media / Baja) a cada producto que no tenga una
  // gama definida manualmente, según su posición de precio dentro de su
  // propia categoría
  const tierByProductId = useMemo(() => {
    const map = new Map();
    CATEGORY_ORDER.forEach((cat) => {
      const items = products.filter((p) => p.category === cat);
      if (!items.length) return;
      const sorted = [...items].sort((a, b) => b.price - a.price);
      const n = sorted.length;
      sorted.forEach((p, i) => {
        const pct = i / n;
        let tier;
        if (n === 1 || pct < 0.333) tier = "Alta";
        else if (pct < 0.667) tier = "Media";
        else tier = "Baja";
        map.set(p.id, p.tier || tier);
      });
    });
    return map;
  }, [products]);

  const priceBounds = useMemo(() => {
    if (!products.length) return { min: 0, max: 0 };
    const prices = products.map((p) => p.price);
    return {
      min: Math.floor(Math.min(...prices) / 50000) * 50000,
      max: Math.ceil(Math.max(...prices) / 50000) * 50000,
    };
  }, [products]);

  // Cantidad de productos disponibles por categoría — se muestra en las pestañas
  const categoryCounts = useMemo(() => {
    const counts = { Todos: products.filter((p) => p.available).length };
    CATEGORY_ORDER.forEach((cat) => {
      counts[cat] = products.filter((p) => p.category === cat && p.available).length;
    });
    return counts;
  }, [products]);

  // Pestañas: solo categorías con productos disponibles (la activa siempre se muestra)
  const CATEGORIES = useMemo(
    () => ["Todos", ...CATEGORY_ORDER.filter((c) => (categoryCounts[c] ?? 0) > 0 || c === category)],
    [CATEGORY_ORDER, categoryCounts, category]
  );

  // Detecta si el scroll de categorías tiene overflow → muestra hint visual
  useEffect(() => {
    const el = catScrollRef.current;
    if (!el) return;
    const check = () => setShowCatHint(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [CATEGORIES]);

  // Detecta overflow a cada lado de la franja de ofertas
  useEffect(() => {
    const el = offersScrollRef.current;
    if (!el) return;
    const check = () => setOffersHint({
      left: el.scrollLeft > 8,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [products, bundleDeals]);

  function scrollOffers(dir) {
    offersScrollRef.current?.scrollBy({ left: dir * 520, behavior: "smooth" });
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!p.available) return false;                                                    // ocultar agotados
      if (category !== "Todos" && p.category !== category) return false;
      if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (minPrice !== "" && p.price < Number(minPrice)) return false;
      if (maxPrice !== "" && p.price > Number(maxPrice)) return false;
      return true;
    });
  }, [products, category, search, minPrice, maxPrice]);

  // Orden de la cuadrícula: por sección del catálogo y luego por precio
  const ordered = useMemo(() => {
    const rank = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
    return [...filtered].sort(
      (a, b) => (rank.get(a.category) ?? 99) - (rank.get(b.category) ?? 99) || a.price - b.price
    );
  }, [filtered, CATEGORY_ORDER]);

  // Al cambiar cualquier filtro se vuelve a la primera página
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [category, search, minPrice, maxPrice]);

  const visible = ordered.slice(0, visibleCount);
  const remaining = ordered.length - visible.length;

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedIds.has(p.id)),
    [products, selectedIds]
  );

  function toggleSelect(product) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) next.delete(product.id);
      else next.add(product.id);
      return next;
    });
  }

  function productWaNumber(product) {
    return (product.whatsapp_number || settings.whatsapp_number || "573108216274").replace(/\D/g, "");
  }

  function waLink(product) {
    const num = productWaNumber(product);
    const parts = [product.name];
    if (product.memory_capacity) parts.push(product.memory_capacity);
    if (product.condition) {
      product.condition.split(",").map(t => t.trim()).filter(Boolean).forEach(t => parts.push(t));
    }
    const msg = `Hola, me interesa: ${parts.join(" · ")} (${formatCop(product.price)}), ¿sigue disponible?`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  function waLinkMulti(items) {
    if (items.length === 1) return waLink(items[0]);
    const num = productWaNumber(items[0]);
    const list = items.map((p) => {
      const detail = [p.memory_capacity, p.condition].filter(Boolean).join(", ");
      return `• ${p.name}${detail ? ` (${detail})` : ""} — ${formatCop(p.price)}`;
    }).join("\n");
    const msg = `Hola, me interesan los siguientes artículos, ¿siguen disponibles?\n\n${list}\n\n¡Gracias!`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  function waLinkDeal(deal) {
    const first = (deal.products ?? [])[0];
    const num = productWaNumber(first ?? {});
    const msg = `Hola, me interesa la oferta por cantidad: ${deal.match_name} — ${formatCop(deal.bundle_price)} c/u llevando ${deal.min_quantity} o más unidades. ¿Está disponible?`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  // Agrupa los productos seleccionados por su número de contacto (algunos
  // artículos pueden tener un WhatsApp distinto al general de la tienda)
  const selectedGroups = useMemo(() => {
    const groups = new Map();
    selectedProducts.forEach((p) => {
      const num = productWaNumber(p);
      if (!groups.has(num)) groups.set(num, []);
      groups.get(num).push(p);
    });
    return [...groups.values()];
  }, [selectedProducts, settings]);

  const hasActiveFilters = category !== "Todos" || search.trim() || minPrice || maxPrice;

  function clearFilters() {
    selectCategory("Todos");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
  }

  // Acento único: las variables --brand quedan fijas en el morado de marca
  const activeBrand = TODOS_BRAND;
  const themeVars = {
    "--brand": TODOS_BRAND.dot,
    "--brand-hover": TODOS_BRAND.hover,
    "--brand-ring": TODOS_BRAND.ring,
  };

  const trade   = settings.trade_in_note;
  const payment = settings.payment_methods;
  const price   = settings.prices_note;

  const monthLabel = (() => {
    const s = new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  const discounted = products.filter((p) => p.available && p.original_price && Number(p.original_price) > Number(p.price));
  const totalOffers = discounted.length + bundleDeals.length;

  return (
    <BrandContext.Provider value={{ brandMap, activeBrand }}>
    <div className="relative w-full min-w-0" style={themeVars}>

      {/* ── Hero: eyebrow + titular + fila (texto a la izquierda, acción a la derecha) ── */}
      <section className="border-b border-slate-300 relative">
        <div className={`${WRAP} pt-10 sm:pt-16 pb-9 sm:pb-12 relative`}>
          <img
            src="/logo-mark.png"
            alt=""
            aria-hidden="true"
            className="hidden lg:block absolute right-6 top-1/2 -translate-y-[58%] w-60 h-auto object-contain select-none pointer-events-none"
            style={{ mixBlendMode: "multiply" }}
          />
          <p className="font-mono text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
            Catálogo · {monthLabel}
          </p>
          <h1 className="font-display font-bold text-slate-900 tracking-tight leading-[0.95] mt-3 text-[44px] sm:text-7xl lg:text-[88px] max-w-[14ch]" style={{ textWrap: "balance" }}>
            Hardware con <span className="brand-text italic font-normal">historia</span> propia.
          </h1>
          <div className="mt-8 sm:mt-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
            <p className="text-slate-700 text-base sm:text-lg leading-relaxed max-w-[44ch]">
              GPUs, componentes y más, cada pieza revisada y con su estado real. Compra, canjea tu gráfica o pide probarla antes.
            </p>
            <a
              href="#catalogo"
              className="inline-flex items-center gap-2.5 bg-slate-900 text-white px-6 py-3.5 text-sm font-bold transition-colors hover:bg-[var(--brand)]"
            >
              Explorar catálogo <ArrowDown className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <div className={`${WRAP} pb-24`}>

      {/* ── Antes de comprar ── */}
      {(trade || payment || price) && (
        <section className="py-7 sm:py-8 border-b border-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
            {[
              trade && { Icon: Repeat2, title: "¿Tienes una gráfica usada?", text: trade },
              payment && { Icon: CreditCard, title: "Formas de pago", text: payment },
              price && { Icon: Tag, title: "Precios fijos", text: price },
            ].filter(Boolean).map(({ Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3 min-w-0">
                <Icon className="w-5 h-5 brand-text shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-display font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed break-words">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Ofertas: una sola franja compacta con scroll horizontal ── */}
      {totalOffers > 0 && (
        <section className="py-7 sm:py-8 border-b border-slate-300">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display font-bold text-2xl tracking-tight text-slate-900 leading-none">Ofertas</h2>
            <span className="font-mono text-[11px] font-medium text-slate-600 uppercase tracking-wider">
              {totalOffers} activa{totalOffers !== 1 ? "s" : ""}
            </span>
            <div className="ml-auto hidden sm:flex gap-1.5">
              <button
                onClick={() => scrollOffers(-1)}
                disabled={!offersHint.left}
                aria-label="Ofertas anteriores"
                className="w-9 h-9 flex items-center justify-center border border-slate-400 text-slate-800 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollOffers(1)}
                disabled={!offersHint.right}
                aria-label="Más ofertas"
                className="w-9 h-9 flex items-center justify-center border border-slate-400 text-slate-800 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div ref={offersScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide snap-x pb-1">

              {/* Ofertas por cantidad: primero, con acento propio */}
              {bundleDeals.map((deal) => {
                const { dealProducts, minP, savingPct } = dealStats(deal);
                return (
                  <button
                    key={`deal-${deal.id}`}
                    onClick={() => setBundleModal(deal)}
                    className="snap-start shrink-0 w-[250px] h-[184px] bg-white border border-slate-300 border-t-[3px] border-t-[var(--brand)] p-4 flex flex-col text-left hover:border-slate-900 hover:border-t-[var(--brand)] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider brand-text">
                        <Layers className="w-3 h-3 shrink-0" /> Por cantidad
                      </span>
                      {savingPct > 0 && (
                        <span className="font-mono text-[10px] font-black px-1.5 py-0.5 border" style={{ color: ACCENT, borderColor: ACCENT }}>
                          -{savingPct}%
                        </span>
                      )}
                    </div>
                    <p className="font-display font-bold text-slate-900 text-lg leading-tight mt-2 line-clamp-2">{deal.match_name}</p>
                    <div className="mt-auto flex items-baseline justify-between gap-2">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Desde {deal.min_quantity} unidades
                      </p>
                      {minP > 0 && <p className="font-mono text-[11px] text-slate-500 line-through leading-none whitespace-nowrap">{formatCop(minP)}</p>}
                    </div>
                    <p className="font-mono font-bold text-slate-900 text-[26px] leading-none mt-1.5 whitespace-nowrap">
                      {formatCop(deal.bundle_price)}<span className="text-[11px] font-semibold text-slate-500 ml-1">c/u</span>
                    </p>
                    <p className="text-[11px] font-semibold text-slate-600 mt-2 flex items-center gap-1">
                      Ver detalle <ArrowRight className="w-3 h-3" />
                      {dealProducts.length > 1 && <span className="ml-auto font-mono font-normal text-slate-500">{dealProducts.length} variantes</span>}
                    </p>
                  </button>
                );
              })}

              {/* Artículos con descuento */}
              {discounted.map((p) => {
                const pct = Math.round((1 - Number(p.price) / Number(p.original_price)) * 100);
                return (
                  <div
                    key={p.id}
                    onClick={() => setDetailProduct(p)}
                    className="group snap-start shrink-0 w-[168px] h-[184px] bg-white border border-slate-300 flex flex-col cursor-pointer hover:border-slate-900 transition-colors"
                  >
                    <div className="relative h-[84px] flex items-center justify-center p-2">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105" style={{ mixBlendMode: "multiply" }} />
                        : <Package className="w-7 h-7 text-slate-400" />}
                      <span
                        className="absolute top-1.5 right-1.5 text-[10px] font-black px-1.5 py-0.5 border bg-white leading-none"
                        style={{ color: ACCENT, borderColor: ACCENT }}
                      >
                        -{pct}%
                      </span>
                    </div>
                    <div className="px-3 pb-3 flex flex-col flex-1 min-h-0">
                      <p className="text-xs font-semibold text-slate-900 leading-tight line-clamp-2">
                        {p.name}{p.memory_capacity ? ` ${p.memory_capacity}` : ""}
                      </p>
                      <div className="mt-auto">
                        <p className="text-[10px] text-slate-500 line-through font-mono leading-none">{formatCop(p.original_price)}</p>
                        <p className="text-sm font-bold font-mono leading-tight text-slate-900 mt-0.5">{formatCop(p.price)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {offersHint.right && (
              <div
                className="pointer-events-none absolute right-0 top-0 bottom-1 w-14 flex items-center justify-end"
                style={{ background: `linear-gradient(to left, ${PAGE_BG} 35%, transparent)` }}
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Catálogo ── */}
      <section className="pt-8 sm:pt-10">
        <div id="catalogo" className="flex items-baseline gap-3 mb-4 scroll-mt-28">
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-slate-900 leading-none">Catálogo</h2>
          <span className="ml-auto font-mono text-[11px] sm:text-xs font-medium text-slate-600 uppercase tracking-wider">
            {loading ? "Cargando..." : `${ordered.length} referencia${ordered.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Pestañas de categoría — quedan fijas bajo el navbar al hacer scroll */}
        <div
          className="sticky top-16 sm:top-[72px] z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 backdrop-blur border-b border-slate-300"
          style={{ background: "rgba(246,247,249,0.94)" }}
        >
          <div className="relative min-w-0 w-full">
            <div ref={catScrollRef} className="flex gap-6 overflow-x-auto min-w-0 w-full scrollbar-hide">
              {CATEGORIES.map((cat) => {
                const active = category === cat;
                const count = categoryCounts[cat] ?? 0;
                return (
                  <button
                    key={cat}
                    onClick={() => selectCategory(cat)}
                    style={active ? { borderBottomColor: "var(--brand)" } : {}}
                    className={`shrink-0 inline-flex items-baseline gap-1.5 pb-3 pt-3.5 text-xs font-bold uppercase tracking-wide border-b-[3px] transition-colors ${
                      active ? "text-slate-900" : "text-slate-600 border-transparent hover:text-slate-900"
                    }`}
                  >
                    {cat}
                    <span className={`font-mono font-medium normal-case ${active ? "brand-text" : "text-slate-500"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            {showCatHint && (
              <div
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-14 flex items-center justify-end"
                style={{ background: `linear-gradient(to left, ${PAGE_BG} 35%, transparent)` }}
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            )}
          </div>
        </div>

        {/* Búsqueda + rango de precio en una sola fila */}
        <div className="flex flex-wrap gap-2 mt-5 mb-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-400 input-themed outline-none text-sm bg-white placeholder:text-slate-500"
            />
          </div>
          <input type="number" min="0" placeholder="Precio mín" value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-[46%] sm:w-36 px-3 py-2.5 border border-slate-400 input-themed outline-none text-sm bg-white placeholder:text-slate-500"
          />
          <input type="number" min="0" placeholder="Precio máx" value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-[46%] sm:w-36 px-3 py-2.5 border border-slate-400 input-themed outline-none text-sm bg-white placeholder:text-slate-500"
          />
        </div>

        {/* Slider de precio máximo */}
        {priceBounds.max > 0 && (
          <div className="bg-white border border-slate-300 px-4 py-3 mb-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[11px] font-mono text-slate-600">{formatCop(priceBounds.min)}</span>
              <span className="text-xs font-mono font-bold brand-text">
                {formatCop(maxPrice === "" ? priceBounds.max : Number(maxPrice))}
              </span>
            </div>
            <div className="relative h-4 flex items-center">
              <div className="absolute inset-x-0 h-[3px] bg-slate-300" />
              <div
                className="absolute h-[3px]"
                style={{
                  background: "var(--brand)",
                  width: `${(((maxPrice === "" ? priceBounds.max : Number(maxPrice)) - priceBounds.min) / (priceBounds.max - priceBounds.min || 1)) * 100}%`,
                }}
              />
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step="50000"
                value={maxPrice === "" ? priceBounds.max : Number(maxPrice)}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="range-themed absolute inset-x-0 w-full"
              />
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex justify-end mb-3">
            <button onClick={clearFilters} className="text-xs brand-text font-bold hover:underline">
              Limpiar filtros
            </button>
          </div>
        )}

        {/* ── Productos: una sola cuadrícula, 12 por página ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t border-l border-slate-300 bg-white">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 border-r border-b border-slate-300 bg-white animate-pulse" />
            ))}
          </div>
        ) : ordered.length === 0 ? (
          <div className="bg-white border border-slate-300 text-center py-14">
            <Package className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-800 font-semibold">Sin resultados</p>
            <p className="text-slate-600 text-sm mt-1">
              {hasActiveFilters ? "Prueba con otros filtros" : "No hay productos por el momento"}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm brand-text font-bold hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t border-l border-slate-300 bg-white w-full min-w-0">
              {visible.map((p, i) => (
                <ProductCard key={p.id} product={p} tier={tierByProductId.get(p.id)} isSelected={selectedIds.has(p.id)} onToggle={toggleSelect} onOpenDetail={setDetailProduct} waLink={waLink} index={i} />
              ))}
            </div>
            <div className="flex flex-col items-center gap-3 mt-8">
              <p className="font-mono text-xs text-slate-600">
                Mostrando <span className="font-bold text-slate-900">{visible.length}</span> de {ordered.length}
              </p>
              {remaining > 0 && (
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="px-8 py-3 text-sm font-bold uppercase tracking-wide border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
                >
                  Mostrar {Math.min(PAGE_SIZE, remaining)} más
                </button>
              )}
            </div>
          </>
        )}
      </section>

      </div>

      {/* ── Panel flotante de consulta múltiple ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-300 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="max-w-2xl mx-auto px-4 pt-3 pb-5 space-y-2.5">

            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShoppingBag className="w-4 h-4 brand-text" />
                {selectedIds.size} artículo{selectedIds.size !== 1 ? "s" : ""} en consulta
              </p>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors"
              >
                Limpiar todo
              </button>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {selectedProducts.map((p) => (
                <div
                  key={p.id}
                  className="shrink-0 flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-semibold border"
                  style={{ borderColor: ACCENT, color: ACCENT, background: `${ACCENT}12` }}
                >
                  <span className="max-w-[130px] truncate">{p.name}</span>
                  <button
                    onClick={() => toggleSelect(p)}
                    className="shrink-0 w-4 h-4 flex items-center justify-center hover:bg-black/10 transition-colors"
                    title={`Quitar ${p.name}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>

            {selectedGroups.length === 1 ? (
              <a
                href={waLinkMulti(selectedProducts)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold uppercase tracking-wide text-white"
                style={{ background: "var(--brand)" }}
              >
                <MessageCircle className="w-4 h-4" />
                Consultar {selectedIds.size > 1 ? `los ${selectedIds.size} artículos` : "artículo"} por WhatsApp
              </a>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-slate-600 text-center">
                  Estos artículos los maneja más de una persona — se abrirá un chat por cada uno:
                </p>
                {selectedGroups.map((group, gi) => (
                  <a
                    key={gi}
                    href={waLinkMulti(group)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold uppercase tracking-wide text-white"
                    style={{ background: "var(--brand)" }}
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      Consultar {group.length > 1 ? `${group.length} artículos` : group[0].name}
                    </span>
                  </a>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Modal de oferta por cantidad ── */}
      {bundleModal && (
        <BundleModal
          deal={bundleModal}
          onClose={() => setBundleModal(null)}
          onOpenProduct={(p) => {
            setBundleModal(null);
            setDetailProduct(products.find((x) => x.id === p.id) ?? p);
          }}
          waHref={waLinkDeal(bundleModal)}
        />
      )}

      {/* ── Modal de detalle de producto ── */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          tier={tierByProductId.get(detailProduct.id)}
          isSelected={selectedIds.has(detailProduct.id)}
          onToggle={toggleSelect}
          onClose={() => setDetailProduct(null)}
          waLink={waLink}
        />
      )}
    </div>
    </BrandContext.Provider>
  );
}

import { useEffect, useState, useMemo, useRef, createContext, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MessageCircle, Package, CreditCard, Tag, Repeat2, Plus, Check, X, ChevronDown, ChevronRight, ArrowRight, ArrowDown, AlertTriangle, Percent, Layers, ShoppingBag } from "lucide-react";
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

// Gris frío donde se funden las fotos de producto (fondo blanco → multiply)
const PHOTO_BG = "#f4f5f8";

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
      className={`catalog-card-in group relative bg-white p-3 sm:p-5 flex flex-col min-w-0 cursor-pointer border-r border-b border-slate-200 transition-colors duration-200 hover:bg-[#fbfbfd] ${
        !product.available ? "opacity-60" : ""
      }`}
      style={{
        animationDelay: `${Math.min(index, 11) * 35}ms`,
        ...(product.available && isSelected ? { boxShadow: "inset 0 0 0 2px var(--brand)" } : {}),
      }}
    >
      {/* Foto */}
      <div className="relative h-32 sm:h-40 mb-3 sm:mb-4">
        <ProductThumb imageUrl={product.image_url} category={product.category} name={product.name} />

        {(tier || product.is_flagship) && (
          <div className="absolute top-0 left-0 flex flex-col items-start gap-1">
            {tier && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 text-slate-600 border border-slate-300 bg-white">
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
            <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 border border-slate-200">Agotado</span>
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
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{product.category}</span>
      <p className="font-display font-semibold text-slate-900 text-[15px] sm:text-[17px] leading-tight mt-1 line-clamp-2">{product.name}</p>

      <div className="mt-3 flex flex-col gap-1">
        {product.memory_capacity && (
          <p className="flex gap-2 text-[11px] sm:text-xs text-slate-500 uppercase">
            <span className="font-mono text-slate-300 w-4 shrink-0">01</span>
            <span>Memoria — <span className="text-slate-700 font-medium">{product.memory_capacity}</span></span>
          </p>
        )}
        <p className="flex gap-2 text-[11px] sm:text-xs text-slate-500 uppercase">
          <span className="font-mono text-slate-300 w-4 shrink-0">{product.memory_capacity ? "02" : "01"}</span>
          <span>Estado — <span className={`font-medium ${isNew ? "brand-text" : "text-slate-700"}`}>{estado}</span></span>
        </p>
      </div>

      {product.description?.trim() && (
        <p className="text-[11px] sm:text-xs text-slate-400 mt-2 leading-relaxed uppercase line-clamp-2 sm:group-hover:line-clamp-none">
          {product.description}
        </p>
      )}

      {/* Precio */}
      <div className="mt-auto pt-4">
        <div className="pt-3 border-t border-slate-200 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {hasDiscount && (
              <p className="text-[11px] text-slate-400 line-through font-mono leading-none mb-1">{formatPrice(product.original_price)}</p>
            )}
            <p className="font-mono font-bold text-slate-900 text-lg sm:text-xl tracking-tight leading-none">{formatPrice(product.price)}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 shrink-0 transition-all duration-200 group-hover:translate-x-1 group-hover:text-[var(--brand)]" />
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
              className="shrink-0 w-10 flex items-center justify-center border border-slate-300 text-slate-500 hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="mt-3 py-2 bg-slate-100 text-center text-xs text-slate-400 font-medium uppercase tracking-wide">
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
          className="absolute top-3 right-3 z-20 w-9 h-9 bg-white/90 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div ref={scrollRef} className="max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2">

        {/* Visual */}
        <div
          className="relative min-h-[240px] md:min-h-[360px] border-b md:border-b-0 md:border-r border-slate-200 flex items-center justify-center p-8"
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
              <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 border border-slate-200">Agotado</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6 sm:p-8 flex flex-col">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">
            {product.category}{tier ? ` · Gama ${tier}` : ""}{product.is_flagship ? " · Marca Insignia" : ""}
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 leading-tight">
            {product.name}
          </h2>
          {product.description?.trim() && (
            <p className="text-sm text-slate-500 mt-3 leading-relaxed uppercase">{product.description}</p>
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
              <span className="text-base text-slate-400 line-through font-mono">{formatPrice(product.original_price)}</span>
            </div>
          )}
          <p className={`font-mono text-2xl sm:text-3xl font-bold text-slate-900 ${hasDiscount ? "mt-1" : "mt-4"}`}>{formatPrice(product.price)}</p>

          <div className="mt-5 border-t border-slate-200">
            {specs.map(([k, v], i) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 border-b border-slate-200">
                <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400 shrink-0">
                  <span className="text-slate-300 mr-2">{String(i + 1).padStart(2, "0")}</span>{k}
                </span>
                <span className="font-mono text-xs text-slate-700 text-right uppercase">{v}</span>
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
            <ChevronDown className="w-5 h-5 text-slate-400 animate-bounce" />
          </div>
        )}
      </div>
    </div>
  );
}

// Encabezado de sección editorial: título grande + línea fina + dato a la derecha
function SectionHead({ title, meta, id }) {
  return (
    <div id={id} className="flex items-baseline gap-3 pb-3 mb-5 border-b border-slate-300 scroll-mt-24">
      <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-slate-900 leading-none">{title}</h2>
      {meta && <span className="ml-auto font-mono text-[11px] sm:text-xs text-slate-400 uppercase tracking-wider">{meta}</span>}
    </div>
  );
}

const GRID_CLS = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t border-l border-slate-200 bg-white w-full min-w-0";

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
  const catScrollRef = useRef(null);
  const [showCatHint, setShowCatHint] = useState(false);
  const discountScrollRef = useRef(null);
  const [showDiscountHint, setShowDiscountHint] = useState(false);

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
  const CATEGORIES = useMemo(() => ["Todos", ...CATEGORY_ORDER], [CATEGORY_ORDER]);
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

  // Detecta si el scroll de categorías tiene overflow → muestra hint visual
  useEffect(() => {
    const el = catScrollRef.current;
    if (!el) return;
    const check = () => setShowCatHint(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [categories]);

  // Detecta overflow en el shelf de artículos con descuento
  useEffect(() => {
    const el = discountScrollRef.current;
    if (!el) return;
    const check = () => setShowDiscountHint(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [products]);

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

  // Vista agrupada por categoría siempre que se muestre "Todos" sin búsqueda de texto
  // (los filtros de precio se aplican dentro de cada grupo, no rompen el agrupamiento)
  const showGrouped = category === "Todos" && !search.trim();

  const groups = useMemo(() => {
    if (!showGrouped) return [];
    return CATEGORY_ORDER
      .map((cat) => ({ cat, items: filtered.filter((p) => p.category === cat) }))
      .filter((g) => g.items.length > 0);
  }, [filtered, showGrouped]);

  const availableCount = filtered.filter((p) => p.available).length;

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

      {/* ── Hero editorial ── */}
      <section className="border-b border-slate-300">
        <div className={`${WRAP} pt-10 sm:pt-16 pb-10 sm:pb-14 grid md:grid-cols-[1fr_auto] gap-8 md:gap-14 items-center`}>
          <div className="min-w-0">
            <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.22em] text-slate-400">
              Catálogo · {monthLabel}
            </p>
            <h1 className="font-display font-bold text-slate-900 tracking-tight leading-[0.95] mt-3 text-[44px] sm:text-7xl lg:text-[88px] text-balance max-w-[14ch]">
              Hardware con <span className="brand-text italic font-normal">historia</span> propia.
            </h1>
            <div className="mt-7 sm:mt-9 flex flex-wrap items-end gap-x-10 gap-y-5">
              <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-md">
                GPUs, componentes y más, cada pieza revisada y con su estado real. Compra, canjea tu gráfica o pide probarla antes.
              </p>
              <a
                href="#catalogo"
                className="inline-flex items-center gap-2.5 bg-slate-900 text-white px-6 py-3.5 text-sm font-bold transition-colors hover:bg-[var(--brand)]"
              >
                Explorar catálogo <ArrowDown className="w-4 h-4" />
              </a>
            </div>
            {!loading && (
              <p className="mt-6 font-mono text-xs text-slate-400">
                <span className="font-bold text-slate-900 text-sm">{categoryCounts.Todos}</span> referencias disponibles
              </p>
            )}
          </div>
          <img
            src="/logo-mark.png"
            alt=""
            aria-hidden="true"
            className="hidden md:block w-56 lg:w-72 h-auto object-contain select-none"
            style={{ mixBlendMode: "multiply" }}
          />
        </div>
      </section>

      <div className={`${WRAP} pb-24`}>

      {/* ── Antes de comprar ── */}
      {(trade || payment || price) && (
        <section className="py-8 sm:py-10 border-b border-slate-300">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-400 mb-4">Antes de comprar</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              trade && { Icon: Repeat2, title: "¿Tienes una gráfica usada?", text: trade },
              payment && { Icon: CreditCard, title: "Formas de pago", text: payment },
              price && { Icon: Tag, title: "Precios fijos", text: price },
            ].filter(Boolean).map(({ Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3 min-w-0">
                <Icon className="w-5 h-5 brand-text shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-display font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed break-words">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Ofertas ── */}
      {totalOffers > 0 && (
        <section className="pt-10 sm:pt-12 pb-4">
          <SectionHead title="Ofertas" meta={`${totalOffers} activa${totalOffers !== 1 ? "s" : ""}`} />

          <div className="space-y-4">
            {bundleDeals.map((deal) => {
              const dealProducts = deal.products ?? [];
              const prices = dealProducts.map(p => Number(p.price));
              const minP = prices.length ? Math.min(...prices) : 0;
              const maxP = prices.length ? Math.max(...prices) : 0;
              const savingUnit = minP > 0 ? minP - Number(deal.bundle_price) : 0;
              const savingPct = minP > 0 ? Math.round((savingUnit / minP) * 100) : 0;
              const savingTotal = savingUnit * Number(deal.min_quantity);
              return (
                <article key={deal.id} className="bg-white border border-slate-200">
                  <div className="p-5 sm:p-6 grid sm:grid-cols-[auto_1fr_auto] gap-5 sm:gap-8 items-center">
                    {dealProducts.length > 0 && (
                      <div className="flex -space-x-3 shrink-0">
                        {dealProducts.slice(0, 4).map((p, i) => (
                          <div
                            key={p.id}
                            className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-white flex items-center justify-center overflow-hidden"
                            style={{ zIndex: 4 - i, background: PHOTO_BG }}
                          >
                            {p.image_url
                              ? <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-1" style={{ mixBlendMode: "multiply" }} />
                              : <Package className="w-5 h-5 text-slate-300" />}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider brand-text">
                          <Layers className="w-3 h-3 shrink-0" /> Oferta por cantidad
                        </span>
                        {savingPct > 0 && (
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 border" style={{ color: ACCENT, borderColor: ACCENT }}>
                            -{savingPct}%
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight leading-tight">{deal.match_name}</h3>
                      {dealProducts.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          Aplica a: {dealProducts.map(p => p.name + (p.memory_capacity ? ` ${p.memory_capacity}` : "")).join(" · ")}
                        </p>
                      )}
                    </div>

                    <div className="sm:text-right shrink-0">
                      {minP > 0 && (
                        <p className="font-mono text-sm text-slate-400 line-through">
                          {minP === maxP ? formatCop(minP) : `${formatCop(minP)} – ${formatCop(maxP)}`}
                        </p>
                      )}
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                        Llevando {deal.min_quantity}+ unidades
                      </p>
                      <p className="font-mono font-bold text-slate-900 text-3xl leading-none mt-1">
                        {formatCop(deal.bundle_price)}
                        <span className="text-xs font-semibold text-slate-400 ml-1">c/u</span>
                      </p>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 py-3 border-t border-slate-200 flex items-start gap-2 bg-[#faf9fd]">
                    <AlertTriangle className="w-3.5 h-3.5 brand-text shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 leading-snug">
                      Precio válido <strong>únicamente al comprar mínimo {deal.min_quantity} unidades</strong>.
                      {savingTotal > 0 && <span className="font-semibold brand-text"> Ahorro total: {formatCop(savingTotal)}.</span>}
                    </p>
                  </div>
                </article>
              );
            })}

            {discounted.length > 0 && (
              <div className="bg-white border border-slate-200">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-200">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <p className="font-mono text-[11px] font-bold text-slate-600 uppercase tracking-[0.18em]">Artículos con descuento</p>
                  <span className="ml-auto font-mono text-[11px] text-slate-400">{discounted.length} artículo{discounted.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="relative">
                  <div ref={discountScrollRef} className="flex overflow-x-auto scrollbar-hide">
                    {discounted.map((p) => {
                      const pct = Math.round((1 - Number(p.price) / Number(p.original_price)) * 100);
                      return (
                        <div
                          key={p.id}
                          onClick={() => setDetailProduct(p)}
                          className="group shrink-0 w-44 flex flex-col border-r border-slate-200 cursor-pointer hover:bg-[#fbfbfd] transition-colors"
                        >
                          <div className="relative h-28 flex items-center justify-center p-2">
                            {p.image_url
                              ? <img src={p.image_url} alt={p.name} className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105" style={{ mixBlendMode: "multiply" }} />
                              : <Package className="w-8 h-8 text-slate-300" />}
                            <span
                              className="absolute top-2 right-2 flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 border bg-white leading-none"
                              style={{ color: ACCENT, borderColor: ACCENT }}
                            >
                              -{pct}%
                            </span>
                          </div>
                          <div className="px-3 pb-3 flex flex-col flex-1">
                            <p className="text-xs font-semibold text-slate-900 leading-tight line-clamp-2">
                              {p.name}{p.memory_capacity ? ` ${p.memory_capacity}` : ""}
                            </p>
                            <div className="mt-auto pt-2">
                              <p className="text-[10px] text-slate-400 line-through font-mono leading-none">{formatCop(p.original_price)}</p>
                              <p className="text-sm font-bold font-mono leading-tight text-slate-900 mt-0.5">{formatCop(p.price)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {showDiscountHint && (
                    <div
                      className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end pr-2"
                      style={{ background: "linear-gradient(to left, white 40%, transparent)" }}
                    >
                      <ChevronRight className="w-4 h-4 text-slate-400 opacity-70" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Catálogo ── */}
      <section className="pt-10 sm:pt-12">
        <SectionHead
          id="catalogo"
          title="Catálogo"
          meta={loading ? "Cargando..." : `${availableCount} disponible${availableCount !== 1 ? "s" : ""}`}
        />

        {/* Pestañas de categoría */}
        <div className="relative min-w-0 w-full mb-5">
          <div ref={catScrollRef} className="flex gap-6 overflow-x-auto min-w-0 w-full scrollbar-hide border-b border-slate-200">
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  onClick={() => selectCategory(cat)}
                  style={active ? { borderBottomColor: "var(--brand)" } : {}}
                  className={`shrink-0 inline-flex items-baseline gap-1.5 pb-3 pt-1 text-xs font-bold uppercase tracking-wide border-b-2 -mb-px transition-colors ${
                    active ? "text-slate-900" : "text-slate-400 border-transparent hover:text-slate-700"
                  }`}
                >
                  {cat}
                  <span className={`font-mono font-medium normal-case ${active ? "brand-text" : "text-slate-300"}`}>{count}</span>
                </button>
              );
            })}
          </div>
          {showCatHint && (
            <div
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end pr-1"
              style={{ background: "linear-gradient(to left, #f2f3f5 40%, transparent)" }}
            >
              <ChevronRight className="w-4 h-4 text-slate-400 opacity-70" />
            </div>
          )}
        </div>

        {/* Búsqueda + rango de precio en una sola fila */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 input-themed outline-none text-sm bg-white"
            />
          </div>
          <input type="number" min="0" placeholder="Precio mín" value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-[46%] sm:w-36 px-3 py-2.5 border border-slate-300 input-themed outline-none text-sm bg-white"
          />
          <input type="number" min="0" placeholder="Precio máx" value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-[46%] sm:w-36 px-3 py-2.5 border border-slate-300 input-themed outline-none text-sm bg-white"
          />
        </div>

        {/* Slider de precio máximo */}
        {priceBounds.max > 0 && (
          <div className="bg-white border border-slate-200 px-4 py-3 mb-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[11px] font-mono text-slate-400">{formatCop(priceBounds.min)}</span>
              <span className="text-xs font-mono font-bold brand-text">
                {formatCop(maxPrice === "" ? priceBounds.max : Number(maxPrice))}
              </span>
            </div>
            <div className="relative h-4 flex items-center">
              <div className="absolute inset-x-0 h-[3px] bg-slate-200" />
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
            <button onClick={clearFilters} className="text-xs brand-text font-semibold hover:underline">
              Limpiar filtros
            </button>
          </div>
        )}

        {/* ── Productos ── */}
        {loading ? (
          <div className={GRID_CLS}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 border-r border-b border-slate-200 bg-white animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 text-center py-14">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-semibold">Sin resultados</p>
            <p className="text-slate-400 text-sm mt-1">
              {hasActiveFilters ? "Prueba con otros filtros" : "No hay productos por el momento"}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm brand-text font-semibold hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : showGrouped ? (
          <div className="space-y-12">
            {groups.map(({ cat, items }) => (
              <div key={cat}>
                <div className="flex items-baseline gap-3 mb-4">
                  <h3 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight text-slate-900 leading-none">{cat}</h3>
                  <span className="font-mono text-[11px] text-slate-400 ml-auto uppercase tracking-wider">
                    {items.length} referencia{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className={GRID_CLS}>
                  {items.map((p, i) => (
                    <ProductCard key={p.id} product={p} tier={tierByProductId.get(p.id)} isSelected={selectedIds.has(p.id)} onToggle={toggleSelect} onOpenDetail={setDetailProduct} waLink={waLink} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={GRID_CLS}>
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} tier={tierByProductId.get(p.id)} isSelected={selectedIds.has(p.id)} onToggle={toggleSelect} onOpenDetail={setDetailProduct} waLink={waLink} index={i} />
            ))}
          </div>
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
                className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
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
                <p className="text-xs text-slate-400 text-center">
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

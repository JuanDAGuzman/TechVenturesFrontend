import { useEffect, useState, useMemo, useRef, createContext, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MessageCircle, Package, CreditCard, Tag, Repeat2, Plus, Check, X, ChevronDown } from "lucide-react";
import Silhouette, { CATEGORY_FORM } from "../../components/v2/Silhouette.jsx";
import { brandFromColor, DEFAULT_BRAND } from "../../lib/categoryBrand.js";

const API = (
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API ??
  window.__API_BASE__ ??
  "http://localhost:4000/api"
).replace(/\/+$/, "");

// Provee el mapa de colores de marca por categoría a las tarjetas/modales,
// que se construye dinámicamente a partir de las secciones del catálogo
const BrandContext = createContext({ brandMap: {} });

// Convierte el nombre de una categoría en un slug apto para la URL (ej. "Componentes" → "componentes")
function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
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

// Placeholder con ilustración técnica "blueprint" en el color de marca de la categoría
function ProductThumb({ imageUrl, category, name }) {
  const [imgErr, setImgErr] = useState(false);
  const { brandMap } = useContext(BrandContext);
  const dot = brandMap[category]?.dot ?? DEFAULT_BRAND.dot;
  const form = CATEGORY_FORM[category] ?? "component";

  if (imageUrl && !imgErr) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center p-2">
        <img src={imageUrl} alt={name} className="w-full h-full object-contain" onError={() => setImgErr(true)} />
      </div>
    );
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{
        background: `
          radial-gradient(90% 80% at 50% 28%, color-mix(in srgb, ${dot} 16%, transparent), transparent 70%),
          repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(15,23,42,0.045) 15px, rgba(15,23,42,0.045) 16px),
          repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(15,23,42,0.045) 15px, rgba(15,23,42,0.045) 16px),
          #ffffff
        `,
      }}
    >
      <Silhouette
        form={form}
        className="w-[68%] sm:w-[62%] max-h-full transition-all duration-500 ease-out opacity-[var(--sil-op)] group-hover:scale-105 group-hover:opacity-100"
        style={{ color: dot, "--sil-op": 0.55 }}
      />
    </div>
  );
}

// Única tarjeta — se usa tanto en vista agrupada como en vista filtrada
function ProductCard({ product, tier, isSelected, onToggle, onOpenDetail, waLink, index = 0 }) {
  const { brandMap } = useContext(BrandContext);
  const b = brandMap[product.category] ?? DEFAULT_BRAND;

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className={`catalog-card-in group bg-white rounded-2xl overflow-hidden shadow-sm flex flex-col min-w-0 w-full transition-all duration-300 ease-out border-2 cursor-pointer ${
        !product.available
          ? "border-slate-100 opacity-60"
          : isSelected
          ? "shadow-md"
          : "border-slate-200 hover:-translate-y-1.5 hover:border-[var(--brand)] hover:shadow-[0_12px_32px_-12px_var(--brand-ring)]"
      }`}
      style={{
        "--ca": b.dot,
        animationDelay: `${Math.min(index, 11) * 35}ms`,
        ...(product.available && isSelected ? { borderColor: "var(--brand)" } : {}),
      }}
    >
      {/* Parte superior: fondo blanco + ícono centrado */}
      <div className="h-36 sm:h-44 relative border-b border-slate-100">
        <ProductThumb imageUrl={product.image_url} category={product.category} name={product.name} />

        {/* Marco técnico tipo "viewfinder" — aparece al hover */}
        <div className="pointer-events-none absolute inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 rounded-tl" style={{ borderColor: "var(--brand)" }} />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 rounded-tr" style={{ borderColor: "var(--brand)" }} />
          <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 rounded-bl" style={{ borderColor: "var(--brand)" }} />
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 rounded-br" style={{ borderColor: "var(--brand)" }} />
        </div>

        {(tier || product.is_flagship) && (
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {tier && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-full border shadow-sm text-slate-800 bg-white border-slate-400">
                Gama {tier}
              </span>
            )}
            {product.is_flagship && (
              <span
                className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-full border border-transparent text-white shadow-sm"
                style={{ background: "var(--brand)" }}
              >
                Marca Insignia
              </span>
            )}
          </div>
        )}
        {!product.available && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-200">
              Agotado
            </span>
          </div>
        )}
        {isSelected && (
          <div
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
            style={{ background: "var(--brand)" }}
          >
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Parte inferior: información */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Marca/categoría + punto de color */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[10px] font-mono font-medium uppercase tracking-[0.2em] text-slate-400">{product.category}</span>
          <span className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: b.dot }} />
        </div>

        <p className="font-display font-semibold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 uppercase tracking-tight">{product.name}</p>

        {/* Badges: memoria + condición */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {product.memory_capacity && (
            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full uppercase">
              {product.memory_capacity}
            </span>
          )}
          {product.condition &&
            product.condition.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag, i) => {
              const t = tag.toUpperCase();
              const highlighted = t === "NUEVO" || t === "CON CAJA" || t === "SELLADO";
              return (
                <span key={i} className={`text-xs px-1.5 py-0.5 rounded-full uppercase font-medium ${highlighted ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300" : "text-slate-500 bg-slate-100"}`}>
                  {tag}
                </span>
              );
            })}
        </div>

        {/* Descripción (si existe) — se expande por completo al hacer hover */}
        {product.description && (
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed uppercase line-clamp-2 sm:group-hover:line-clamp-none transition-all">
            {product.description}
          </p>
        )}

        {/* Precio + botón siempre pegados al fondo del card */}
        <div className="mt-auto pt-3">
          <p className="text-xl sm:text-2xl font-mono font-semibold brand-text tracking-tight">{formatPrice(product.price)}</p>
          {product.available ? (
            <div className="mt-2 flex gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(product); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all btn-primary`}
                style={isSelected ? { filter: "brightness(0.78)" } : {}}
              >
                {isSelected ? (
                  <><X className="w-4 h-4" /> Quitar</>
                ) : (
                  <><Plus className="w-4 h-4" /> Agregar</>
                )}
              </button>
              <a
                href={waLink(product)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="Contactar por WhatsApp"
                className="shrink-0 w-11 flex items-center justify-center rounded-xl border-2 border-slate-200 text-slate-500 hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="mt-2 py-2.5 rounded-xl bg-slate-100 text-center text-sm text-slate-400 font-medium">
              No disponible
            </div>
          )}
        </div>
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

  const specs = [
    ["Categoría", product.category],
    product.memory_capacity && ["Memoria / Capacidad", product.memory_capacity],
    product.condition && ["Estado", product.condition],
    tier && ["Gama", tier],
    product.is_flagship && ["Insignia", "Sí, tope de línea de su marca"],
    ["Disponibilidad", product.available ? "Disponible" : "Agotado"],
  ].filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="modal-pop bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative overflow-hidden"
        style={{ "--ca": b.dot }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div ref={scrollRef} className="max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2">

        {/* Visual */}
        <div
          className="relative min-h-[240px] md:min-h-[360px] border-b md:border-b-0 md:border-r border-slate-100 flex items-center justify-center p-8"
          style={{
            background: `
              radial-gradient(80% 70% at 50% 35%, color-mix(in srgb, ${b.dot} 14%, transparent), transparent 70%),
              repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(15,23,42,0.04) 27px, rgba(15,23,42,0.04) 28px),
              repeating-linear-gradient(90deg, transparent, transparent 27px, rgba(15,23,42,0.04) 27px, rgba(15,23,42,0.04) 28px),
              #ffffff
            `,
          }}
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain" />
          ) : (
            <Silhouette form={form} className="w-[70%] max-h-full" style={{ color: b.dot }} />
          )}
          {!product.available && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: b.dot }} />
            {product.category}{tier ? ` · Gama ${tier}` : ""}{product.is_flagship ? " · Marca Insignia" : ""}
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight text-slate-900 leading-tight">
            {product.name}
          </h2>
          {product.description && (
            <p className="text-sm text-slate-500 mt-3 leading-relaxed uppercase">{product.description}</p>
          )}
          <p className="font-mono text-2xl sm:text-3xl font-semibold brand-text mt-4">{formatPrice(product.price)}</p>

          <div className="mt-5 border-t border-slate-100">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 border-b border-slate-100">
                <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400 shrink-0">{k}</span>
                <span className="font-mono text-xs text-slate-700 text-right uppercase">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-5 flex flex-col gap-2.5">
            {product.available && (
              <button
                onClick={() => onToggle(product)}
                className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap btn-primary"
                style={isSelected ? { filter: "brightness(0.78)" } : {}}
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
              className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-sm font-semibold border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4 shrink-0" /> Preguntar por WhatsApp
            </a>
          </div>
        </div>
        </div>

        {/* Indicador de scroll: avisa que hay más contenido debajo (mobile) */}
        {showScrollHint && (
          <div className="md:hidden pointer-events-none absolute bottom-0 inset-x-0 h-14 rounded-b-3xl bg-gradient-to-t from-white via-white/90 to-transparent flex items-end justify-center pb-1.5">
            <ChevronDown className="w-5 h-5 text-slate-400 animate-bounce" />
          </div>
        )}
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

  useEffect(() => {
    Promise.all([
      fetch(`${API}/catalog/products`).then((r) => r.json()),
      fetch(`${API}/catalog/settings`).then((r) => r.json()),
      fetch(`${API}/catalog/categories`).then((r) => r.json()),
    ])
      .then(([pData, sData, cData]) => {
        if (pData.ok) setProducts(pData.products);
        if (sData.ok) setSettings(sData.settings);
        if (cData.ok) setCategories(cData.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Orden de secciones del catálogo + paleta de colores derivada por categoría
  const CATEGORY_ORDER = useMemo(() => categories.map((c) => c.name), [categories]);
  const CATEGORIES = useMemo(() => ["Todos", ...CATEGORY_ORDER], [CATEGORY_ORDER]);
  const brandMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => { map[c.name] = brandFromColor(c.color); });
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

  // Cantidad de productos disponibles por categoría — se muestra en los chips de filtro
  const categoryCounts = useMemo(() => {
    const counts = { Todos: products.filter((p) => p.available).length };
    CATEGORY_ORDER.forEach((cat) => {
      counts[cat] = products.filter((p) => p.category === cat && p.available).length;
    });
    return counts;
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

  // CSS variables que se aplican dinámicamente según la categoría activa
  const themeVars = useMemo(() => {
    const b = brandMap[category];
    if (!b) return {};                      // "Todos" → usa el indigo del root
    return { "--brand": b.dot, "--brand-hover": b.hover, "--brand-ring": b.ring };
  }, [category, brandMap]);

  const trade   = settings.trade_in_note;
  const payment = settings.payment_methods;
  const price   = settings.prices_note;

  return (
    <BrandContext.Provider value={{ brandMap }}>
    <div className="relative w-full min-w-0" style={themeVars}>
      {/* Fondo técnico: cuadrícula sutil + resplandor de marca */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: `
            radial-gradient(60% 32rem at 50% 0%, var(--brand-ring), transparent 70%),
            repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(15,23,42,0.035) 39px, rgba(15,23,42,0.035) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(15,23,42,0.035) 39px, rgba(15,23,42,0.035) 40px)
          `,
        }}
      />

      <div className="container-page pb-8 w-full min-w-0">

      {/* Cabecera */}
      <div className="mb-4 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400 mb-1">
            TechVenturesCO
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold brand-text tracking-tight">Catálogo</h1>
          <p className="text-sm text-slate-500 mt-1">Hardware usado · GPUs y más</p>
        </div>
        {!loading && (
          <div className="font-mono text-xs text-slate-400 border border-slate-200 rounded-full px-3 py-1.5 bg-white shrink-0">
            <span className="font-semibold brand-text">{categoryCounts.Todos}</span> productos disponibles
          </div>
        )}
      </div>

      {/* ── Banner de información ── */}
      {(trade || payment || price) && (
        <div className="mb-5 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1" style={{ background: "var(--brand)" }} />
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              📋 Antes de comprar — léelo
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {trade && (
              <div className="flex items-start gap-3 px-3 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--brand-ring)" }}>
                  <Repeat2 className="w-4 h-4 brand-text" />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-sm font-bold text-slate-800">¿Tienes una gráfica usada?</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">{trade}</p>
                </div>
              </div>
            )}
            {payment && (
              <div className="flex items-start gap-3 px-3 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--brand-ring)" }}>
                  <CreditCard className="w-4 h-4 brand-text" />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-sm font-bold text-slate-800">Formas de pago</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">{payment}</p>
                </div>
              </div>
            )}
            {price && (
              <div className="flex items-start gap-3 px-3 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--brand-ring)" }}>
                  <Tag className="w-4 h-4 brand-text" />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-sm font-bold text-slate-800">Precios fijos</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">{price}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="mb-4 space-y-2.5">
        {/* Chips de categoría */}
        <div className="flex gap-2 overflow-x-auto pb-1 min-w-0 w-full">
          {CATEGORIES.map((cat) => {
            const b = brandMap[cat];
            const active = category === cat;
            const count = categoryCounts[cat] ?? 0;
            return (
              <button
                key={cat}
                onClick={() => selectCategory(cat)}
                style={active ? { background: "var(--brand)", color: "#fff", borderColor: "transparent" } : {}}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${
                  active ? "shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {b && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: active ? "#fff" : b.dot }}
                  />
                )}
                {cat}
                <span className={`font-mono font-medium normal-case ${active ? "text-white/70" : "text-slate-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-200 input-themed outline-none text-sm bg-white"
          />
        </div>

        {/* Rango de precio */}
        <div className="flex gap-2">
          <input type="number" min="0" placeholder="Precio mín" value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 input-themed outline-none text-sm bg-white"
          />
          <input type="number" min="0" placeholder="Precio máx" value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 input-themed outline-none text-sm bg-white"
          />
        </div>

        {/* Slider de precio máximo */}
        {priceBounds.max > 0 && (
          <div className="bg-white rounded-xl border-2 border-slate-200 px-3.5 py-3">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-[11px] font-mono text-slate-400">{formatCop(priceBounds.min)}</span>
              <span className="text-xs font-mono font-semibold brand-text">
                {formatCop(maxPrice === "" ? priceBounds.max : Number(maxPrice))}
              </span>
            </div>
            <div className="relative h-4 flex items-center">
              <div className="absolute inset-x-0 h-[3px] bg-slate-200 rounded-full" />
              <div
                className="absolute h-[3px] rounded-full"
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
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-xs uppercase tracking-wider text-slate-400">
          {loading ? "Cargando..." : `${availableCount} disponible${availableCount !== 1 ? "s" : ""} · ${filtered.length} en total`}
        </p>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs brand-text font-semibold hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Productos ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium">Sin resultados</p>
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
        /* Vista agrupada por categoría con encabezados */
        <div className="space-y-7">
          {groups.map(({ cat, items }) => {
            const b = brandMap[cat] ?? DEFAULT_BRAND;
            const avail = items.filter((p) => p.available).length;
            return (
              <section key={cat}>
                {/* Encabezado de categoría — estilo uniforme para todas */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-1.5 h-6 rounded-full shrink-0" style={{ background: b.dot }} />
                  <h2
                    className="font-display font-bold text-base sm:text-lg uppercase tracking-[0.2em]"
                    style={{ color: b.dot }}
                  >
                    {cat}
                  </h2>
                  <span className="font-mono text-[11px] text-slate-400 ml-auto sm:ml-0">
                    {avail} disponible{avail !== 1 ? "s" : ""} · {items.length} total
                  </span>
                  <div className="hidden sm:block flex-1 h-px ml-2" style={{ background: `${b.dot}22` }} />
                </div>
                {/* Cuadrícula — igual para todas las categorías */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
                  {items.map((p, i) => (
                    <ProductCard key={p.id} product={p} tier={tierByProductId.get(p.id)} isSelected={selectedIds.has(p.id)} onToggle={toggleSelect} onOpenDetail={setDetailProduct} waLink={waLink} index={i} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Vista filtrada — siempre cuadrícula, nunca lista de 1 columna */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} tier={tierByProductId.get(p.id)} isSelected={selectedIds.has(p.id)} onToggle={toggleSelect} onOpenDetail={setDetailProduct} waLink={waLink} index={i} />
          ))}
        </div>
      )}

      </div>

      {/* ── Panel flotante de consulta múltiple ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
          <div className="max-w-2xl mx-auto px-4 pt-3 pb-5 space-y-2.5">

            {/* Fila superior: título + limpiar todo */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-800">
                🛒 {selectedIds.size} artículo{selectedIds.size !== 1 ? "s" : ""} en consulta
              </p>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors"
              >
                Limpiar todo
              </button>
            </div>

            {/* Chips removibles por artículo */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {selectedProducts.map((p) => {
                const b = brandMap[p.category] ?? DEFAULT_BRAND;
                return (
                  <div
                    key={p.id}
                    className="shrink-0 flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold border"
                    style={{ borderColor: b.dot, color: b.dot, background: `${b.dot}18` }}
                  >
                    <span className="max-w-[130px] truncate">{p.name}</span>
                    <button
                      onClick={() => toggleSelect(p)}
                      className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
                      title={`Quitar ${p.name}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Botón(es) de acción — uno por cada número de contacto involucrado */}
            {selectedGroups.length === 1 ? (
              <a
                href={waLinkMulti(selectedProducts)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl btn-primary text-sm font-bold"
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
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl btn-primary text-sm font-bold"
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

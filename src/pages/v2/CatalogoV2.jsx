import { useEffect, useState, useMemo } from "react";
import { Search, MessageCircle, Cpu, Smartphone, Package, ArrowLeftRight, CreditCard, Tag } from "lucide-react";

const API = (
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API ??
  window.__API_BASE__ ??
  "http://localhost:4000/api"
).replace(/\/+$/, "");

const CATEGORIES     = ["Todos", "NVIDIA", "AMD", "Intel", "Componentes", "Celulares"];
const CATEGORY_ORDER = ["NVIDIA", "AMD", "Intel", "Componentes", "Celulares"];

const BRAND = {
  NVIDIA:      { dot: "#76B900", badge: { background: "rgba(118,185,0,0.15)",   color: "#4a7a00" } },
  AMD:         { dot: "#ED1C24", badge: { background: "rgba(237,28,36,0.12)",   color: "#c0111a" } },
  Intel:       { dot: "#0068B5", badge: { background: "rgba(0,104,181,0.12)",   color: "#005da0" } },
  Componentes: { dot: "#64748b", badge: { background: "rgba(100,116,139,0.12)", color: "#475569" } },
  Celulares:   { dot: "#8B5CF6", badge: { background: "rgba(139,92,246,0.12)",  color: "#6d28d9" } },
};

function formatPrice(p) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(p);
}

// Placeholder blanco con ícono pequeño de color de marca — sin ningún recuadro de color
function ProductThumb({ imageUrl, category, name }) {
  const [imgErr, setImgErr] = useState(false);
  const dot = BRAND[category]?.dot ?? "#64748b";
  const isPhone = category === "Celulares";

  if (imageUrl && !imgErr) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center p-2">
        <img src={imageUrl} alt={name} className="w-full h-full object-contain" onError={() => setImgErr(true)} />
      </div>
    );
  }
  return (
    <div className="w-full h-full bg-white flex items-center justify-center">
      {isPhone
        ? <Smartphone className="w-7 h-7" style={{ color: dot }} />
        : <Cpu        className="w-7 h-7" style={{ color: dot }} />}
    </div>
  );
}

// Única tarjeta — se usa tanto en vista agrupada como en vista filtrada
function ProductCard({ product, waLink }) {
  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col ${
      product.available ? "border-slate-200" : "border-slate-100 opacity-60"
    }`}>
      {/* Parte superior: fondo blanco + ícono centrado */}
      <div className="h-28 relative border-b border-slate-100">
        <ProductThumb imageUrl={product.image_url} category={product.category} name={product.name} />
        {!product.available && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-200">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Parte inferior: información */}
      <div className="p-2.5 flex flex-col flex-1">
        <p className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">{product.name}</p>

        <div className="flex flex-wrap gap-1 mt-1.5">
          {product.memory_capacity && (
            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
              {product.memory_capacity}
            </span>
          )}
          {product.condition && (
            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
              {product.condition}
            </span>
          )}
        </div>

        <p className="text-sm font-extrabold text-brand-indigo mt-2">{formatPrice(product.price)}</p>

        {product.available ? (
          <a
            href={waLink(product.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-1 w-full py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            Consultar
          </a>
        ) : (
          <div className="mt-2 py-1.5 rounded-xl bg-slate-100 text-center text-xs text-slate-400 font-medium">
            No disponible
          </div>
        )}
      </div>
    </div>
  );
}

export default function CatalogoV2() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState("Todos");
  const [search, setSearch]     = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/catalog/products`).then((r) => r.json()),
      fetch(`${API}/catalog/settings`).then((r) => r.json()),
    ])
      .then(([pData, sData]) => {
        if (pData.ok) setProducts(pData.products);
        if (sData.ok) setSettings(sData.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category !== "Todos" && p.category !== category) return false;
      if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (minPrice !== "" && p.price < Number(minPrice)) return false;
      if (maxPrice !== "" && p.price > Number(maxPrice)) return false;
      return true;
    });
  }, [products, category, search, minPrice, maxPrice]);

  // Vista agrupada SOLO cuando se muestra "Todos" sin filtros de texto/precio
  const showGrouped = category === "Todos" && !search.trim() && minPrice === "" && maxPrice === "";

  const groups = useMemo(() => {
    if (!showGrouped) return [];
    return CATEGORY_ORDER
      .map((cat) => ({ cat, items: filtered.filter((p) => p.category === cat) }))
      .filter((g) => g.items.length > 0);
  }, [filtered, showGrouped]);

  const availableCount = filtered.filter((p) => p.available).length;

  function waLink(productName) {
    const num = (settings.whatsapp_number || "573108216274").replace(/\D/g, "");
    const msg = `Hola, me interesa ${productName}, ¿sigue disponible?`;
    return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  }

  const hasActiveFilters = category !== "Todos" || search.trim() || minPrice || maxPrice;

  function clearFilters() {
    setCategory("Todos");
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
  }

  const trade   = settings.trade_in_note;
  const payment = settings.payment_methods;
  const price   = settings.prices_note;

  return (
    <div className="container-page pb-8">

      {/* Cabecera */}
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-brand-indigo">Catálogo</h1>
        <p className="text-sm text-slate-500 mt-0.5">Hardware usado · GPUs y más</p>
      </div>

      {/* ── Banner de información de compra — prominente, siempre visible ── */}
      {(trade || payment || price) && (
        <div className="mb-5 rounded-2xl bg-slate-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest">
              Antes de comprar — léelo
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {trade && (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowLeftRight className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Permuta</p>
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{trade}</p>
                </div>
              </div>
            )}
            {payment && (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Medios de pago</p>
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{payment}</p>
                </div>
              </div>
            )}
            {price && (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Precios</p>
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{price}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="mb-4 space-y-2.5">
        {/* Chips de categoría */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const b = BRAND[cat];
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={active && b ? { background: b.dot, color: "#fff", borderColor: "transparent" } : {}}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  active ? "shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {cat}
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
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none text-sm bg-white"
          />
        </div>

        {/* Rango de precio */}
        <div className="flex gap-2">
          <input type="number" min="0" placeholder="Precio mín" value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none text-sm bg-white"
          />
          <input type="number" min="0" placeholder="Precio máx" value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none text-sm bg-white"
          />
        </div>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">
          {loading ? "Cargando..." : `${availableCount} disponible${availableCount !== 1 ? "s" : ""} · ${filtered.length} en total`}
        </p>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-indigo-600 font-semibold hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Productos ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
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
            <button onClick={clearFilters} className="mt-3 text-sm text-indigo-600 font-semibold hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      ) : showGrouped ? (
        /* Vista agrupada por categoría con encabezados */
        <div className="space-y-7">
          {groups.map(({ cat, items }) => {
            const b = BRAND[cat] ?? BRAND.Componentes;
            const avail = items.filter((p) => p.available).length;
            return (
              <section key={cat}>
                {/* Encabezado de categoría — estilo uniforme para todas */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-1 h-5 rounded-full shrink-0" style={{ background: b.dot }} />
                  <h2
                    className="font-bold text-sm uppercase tracking-widest"
                    style={{ color: b.dot }}
                  >
                    {cat}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {avail} disponible{avail !== 1 ? "s" : ""} · {items.length} total
                  </span>
                </div>
                {/* Cuadrícula — igual para todas las categorías */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {items.map((p) => (
                    <ProductCard key={p.id} product={p} waLink={waLink} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Vista filtrada — siempre cuadrícula, nunca lista de 1 columna */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} waLink={waLink} />
          ))}
        </div>
      )}
    </div>
  );
}

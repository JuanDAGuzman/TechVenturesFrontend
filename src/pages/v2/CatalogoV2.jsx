import { useEffect, useState, useMemo } from "react";
import { Search, MessageCircle, Cpu, Package, X, Smartphone } from "lucide-react";

const API = (
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API ??
  window.__API_BASE__ ??
  "http://localhost:4000/api"
).replace(/\/+$/, "");

// Orden de categorías en la vista agrupada
const CATEGORIES     = ["Todos", "NVIDIA", "AMD", "Intel", "Componentes", "Celulares"];
const CATEGORY_ORDER = ["NVIDIA", "AMD", "Intel", "Componentes", "Celulares"];

// Colores exactos de cada marca
const BRAND = {
  NVIDIA: {
    badge:    { background: "rgba(118,185,0,0.15)", color: "#4a7a00" },
    dot:      "#76B900",
    grad:     ["#76B900", "#4d7a00"],
    icon:     "cpu",
  },
  AMD: {
    badge:    { background: "rgba(237,28,36,0.12)", color: "#c0111a" },
    dot:      "#ED1C24",
    grad:     ["#ED1C24", "#a30e16"],
    icon:     "cpu",
  },
  Intel: {
    badge:    { background: "rgba(0,104,181,0.12)", color: "#005da0" },
    dot:      "#0068B5",
    grad:     ["#0068B5", "#004d87"],
    icon:     "cpu",
  },
  Componentes: {
    badge:    { background: "rgba(100,116,139,0.12)", color: "#475569" },
    dot:      "#64748b",
    grad:     ["#64748b", "#475569"],
    icon:     "cpu",
  },
  Celulares: {
    badge:    { background: "rgba(139,92,246,0.12)", color: "#6d28d9" },
    dot:      "#8B5CF6",
    grad:     ["#8B5CF6", "#6d28d9"],
    icon:     "phone",
  },
};

function formatPrice(p) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(p);
}

function CategoryBadge({ category, small = false }) {
  const b = BRAND[category] ?? BRAND.Componentes;
  return (
    <span
      style={b.badge}
      className={`font-semibold rounded-full ${small ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1"}`}
    >
      {category}
    </span>
  );
}

function ProductThumb({ imageUrl, category, name }) {
  const [imgErr, setImgErr] = useState(false);
  const b = BRAND[category] ?? BRAND.Componentes;
  const isPhone = category === "Celulares";

  if (imageUrl && !imgErr) {
    return (
      <div className="w-full h-full bg-white flex items-center justify-center p-2">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setImgErr(true)}
        />
      </div>
    );
  }
  // Sin foto: fondo blanco + ícono pequeño con color de marca
  return (
    <div className="w-full h-full bg-white flex items-center justify-center">
      {isPhone
        ? <Smartphone className="w-8 h-8" style={{ color: b.dot }} />
        : <Cpu        className="w-8 h-8" style={{ color: b.dot }} />}
    </div>
  );
}

// Tarjeta compacta para la cuadrícula (vista "Todos" agrupada)
function ProductGridCard({ product, waLink }) {
  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col ${
        product.available ? "border-slate-200" : "border-slate-100 opacity-60"
      }`}
    >
      {/* Parte superior: imagen sobre fondo blanco */}
      <div className="h-28 relative overflow-hidden border-b border-slate-100">
        <ProductThumb imageUrl={product.image_url} category={product.category} name={product.name} />
        {!product.available && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-600 bg-white/90 px-2 py-0.5 rounded-full shadow-sm">
              Agotado
            </span>
          </div>
        )}
      </div>

      {/* Info */}
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

// Tarjeta horizontal para la vista filtrada (una sola categoría)
function ProductListCard({ product, waLink }) {
  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${
        product.available ? "border-slate-200" : "border-slate-100"
      }`}
    >
      <div className={`flex gap-3 p-3 ${!product.available ? "opacity-50" : ""}`}>
        <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 border border-slate-100">
          <ProductThumb imageUrl={product.image_url} category={product.category} name={product.name} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <p className="font-bold text-slate-900 text-sm leading-snug">{product.name}</p>
            {product.available ? (
              <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Disponible
              </span>
            ) : (
              <span className="shrink-0 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                Agotado
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-1">
            {product.memory_capacity && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {product.memory_capacity}
              </span>
            )}
            {product.condition && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {product.condition}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{product.description}</p>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-base font-extrabold text-brand-indigo">{formatPrice(product.price)}</p>
            {product.available ? (
              <a
                href={waLink(product.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-sm transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Consultar
              </a>
            ) : (
              <span className="text-xs text-slate-400 font-medium">No disponible</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogoV2() {
  const [products, setProducts]         = useState([]);
  const [settings, setSettings]         = useState({});
  const [loading, setLoading]           = useState(true);
  const [category, setCategory]         = useState("Todos");
  const [search, setSearch]             = useState("");
  const [minPrice, setMinPrice]         = useState("");
  const [maxPrice, setMaxPrice]         = useState("");
  const [infoDismissed, setInfoDismissed] = useState(false);

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

  // Mostrar cuadrícula agrupada cuando no hay filtros activos
  const isGroupedView = category === "Todos" && !search.trim() && minPrice === "" && maxPrice === "";

  const groups = useMemo(() => {
    if (!isGroupedView) return [];
    return CATEGORY_ORDER
      .map((cat) => ({ cat, items: filtered.filter((p) => p.category === cat) }))
      .filter((g) => g.items.length > 0);
  }, [filtered, isGroupedView]);

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

  const infoItems = [settings.trade_in_note, settings.payment_methods, settings.prices_note].filter(Boolean);

  return (
    <div className="container-page pb-8">
      {/* Cabecera */}
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-brand-indigo">Catálogo</h1>
        <p className="text-sm text-slate-500 mt-0.5">Hardware usado · GPUs y más</p>
      </div>

      {/* Banner info del negocio */}
      {!infoDismissed && infoItems.length > 0 && (
        <div className="mb-4 rounded-2xl bg-indigo-50 border border-indigo-100 overflow-hidden">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
              Información de compra
            </span>
            <button onClick={() => setInfoDismissed(true)} className="p-1 text-indigo-300 hover:text-indigo-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="px-4 pb-3 space-y-1.5">
            {infoItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-indigo-700">
                <span className="mt-0.5 text-indigo-400 font-bold shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filtros */}
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
                  active
                    ? "shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
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
          <input
            type="number" min="0" placeholder="Precio mín" value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none text-sm bg-white"
          />
          <input
            type="number" min="0" placeholder="Precio máx" value={maxPrice}
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

      {/* Contenido */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[...Array(6)].map((_, i) => (
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
      ) : isGroupedView ? (
        /* Vista agrupada por categoría — cuadrícula */
        <div className="space-y-6">
          {groups.map(({ cat, items }) => {
            const b = BRAND[cat] ?? BRAND.Componentes;
            const avail = items.filter((p) => p.available).length;
            return (
              <section key={cat}>
                {/* Encabezado de categoría */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-1 h-6 rounded-full shrink-0"
                    style={{ background: b.dot }}
                  />
                  <h2 className="font-extrabold text-slate-800 text-base">{cat}</h2>
                  <span className="text-xs text-slate-400 font-medium">
                    {avail} disponible{avail !== 1 ? "s" : ""} · {items.length} total
                  </span>
                </div>

                {/* Cuadrícula 2→3 columnas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {items.map((product) => (
                    <ProductGridCard key={product.id} product={product} waLink={waLink} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Vista lista filtrada */
        <div className="space-y-2.5">
          {filtered.map((product) => (
            <ProductListCard key={product.id} product={product} waLink={waLink} />
          ))}
        </div>
      )}

      {/* Info compacta al final si se cerró el banner */}
      {infoDismissed && infoItems.length > 0 && (
        <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Información</p>
          <ul className="space-y-1">
            {infoItems.map((item, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-slate-400 font-bold shrink-0">·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

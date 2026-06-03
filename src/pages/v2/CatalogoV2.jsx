import { useEffect, useState, useMemo } from "react";
import { Search, MessageCircle, Cpu, Package, X } from "lucide-react";

const API = (
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API ??
  window.__API_BASE__ ??
  "http://localhost:4000/api"
).replace(/\/+$/, "");

const CATEGORIES = ["Todos", "NVIDIA", "AMD", "Intel", "Componentes", "Electrónica"];

const CAT_BADGE = {
  NVIDIA:      "bg-green-100 text-green-700",
  AMD:         "bg-red-100 text-red-700",
  Intel:       "bg-blue-100 text-blue-700",
  Componentes: "bg-slate-100 text-slate-600",
  Electrónica: "bg-purple-100 text-purple-700",
};

const CAT_GRADIENT = {
  NVIDIA:      "from-green-400 to-green-600",
  AMD:         "from-red-400 to-red-600",
  Intel:       "from-blue-400 to-blue-600",
  Componentes: "from-slate-400 to-slate-500",
  Electrónica: "from-purple-400 to-purple-600",
};

function formatPrice(p) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(p);
}

function ProductThumb({ imageUrl, category, name }) {
  const [imgErr, setImgErr] = useState(false);
  const gradient = CAT_GRADIENT[category] || "from-indigo-400 to-indigo-600";

  if (imageUrl && !imgErr) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <Cpu className="w-7 h-7 text-white opacity-60" />
    </div>
  );
}

function ProductCard({ product, waLink }) {
  const badge = CAT_BADGE[product.category] || "bg-indigo-100 text-indigo-700";

  return (
    <div
      className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${
        product.available ? "border-slate-200" : "border-slate-100"
      }`}
    >
      <div className={`flex gap-3 p-3 ${!product.available ? "opacity-50" : ""}`}>
        {/* Imagen */}
        <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0">
          <ProductThumb imageUrl={product.image_url} category={product.category} name={product.name} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Nombre + disponibilidad */}
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

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
              {product.category}
            </span>
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

          {/* Precio + botón */}
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
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Filtros
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
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

  const infoItems = [
    settings.trade_in_note,
    settings.payment_methods,
    settings.prices_note,
  ].filter(Boolean);

  return (
    <div className="container-page pb-8">
      {/* Cabecera */}
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-brand-indigo">Catálogo</h1>
        <p className="text-sm text-slate-500 mt-0.5">Hardware usado · GPUs y más</p>
      </div>

      {/* Banner de información del negocio */}
      {!infoDismissed && infoItems.length > 0 && (
        <div className="mb-4 rounded-2xl bg-indigo-50 border border-indigo-100 overflow-hidden">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">
              Información de compra
            </span>
            <button
              onClick={() => setInfoDismissed(true)}
              className="p-1 text-indigo-300 hover:text-indigo-500 transition-colors"
              aria-label="Cerrar"
            >
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
        {/* Chips de categoría — scroll horizontal en mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                category === cat
                  ? "bg-brand-indigo text-white border-transparent shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
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
            type="number"
            min="0"
            placeholder="Precio mín"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none text-sm bg-white"
          />
          <input
            type="number"
            min="0"
            placeholder="Precio máx"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none text-sm bg-white"
          />
        </div>
      </div>

      {/* Contador + limpiar filtros */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">
          {loading
            ? "Cargando..."
            : `${availableCount} disponible${availableCount !== 1 ? "s" : ""} · ${filtered.length} en total`}
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-indigo-600 font-semibold hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div className="space-y-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
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
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-indigo-600 font-semibold hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} waLink={waLink} />
          ))}
        </div>
      )}

      {/* Banner de info al final (si lo cerraron arriba, se muestra aquí compacto) */}
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

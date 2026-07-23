import { createPortal } from "react-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { getAdminToken } from "../lib/adminSession.js";
import {
  Plus, Pencil, Trash2, Upload, Package, Save, ChevronDown, Search, X, Copy, Check, Star, FileText, Loader2, Tag,
} from "lucide-react";
import { brandFromColor, DEFAULT_BRAND } from "../lib/categoryBrand.js";

const API = (
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API ??
  window.__API_BASE__ ??
  "http://localhost:4000/api"
).replace(/\/+$/, "");

const CATEGORY_EMOJI = {
  NVIDIA: "⬛", AMD: "⬜", Intel: "🟦", Componentes: "⚙️", Celulares: "📱",
};

function productDisplayName(p) {
  let display = p.name;
  if (p.memory_capacity && !p.name.toUpperCase().includes(p.memory_capacity.toUpperCase()))
    display += ` ${p.memory_capacity}`;
  if (p.condition) display += ` (${p.condition})`;
  return display;
}

const EMPTY_FORM = {
  name: "",
  category: "NVIDIA",
  memory_capacity: "",
  price: "",
  original_price: "",
  condition: "",
  description: "",
  available: true,
  tier: "",
  is_flagship: false,
  whatsapp_number: "",
};

const TIER_OPTIONS = ["Baja", "Media", "Alta"];


function formatPrice(p) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(p);
}

// Convierte "573108216274" en "310 821 6274" (sin el código de país, en grupos de 3-3-4)
function formatWhatsappDisplay(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("57") ? digits.slice(2) : digits;
  if (local.length !== 10) return local;
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

// Líneas de contacto (WhatsApp/IG) para el pie de los mensajes copiados
function contactFooterLines(settings) {
  const wa = formatWhatsappDisplay(settings.whatsapp_number);
  const ig = settings.instagram_handle?.trim();
  const lines = [];
  if (wa) lines.push(`📲 WhatsApp: ${wa}`);
  if (ig) lines.push(`📸 IG: ${ig.startsWith("@") ? ig : `@${ig}`}`);
  return lines;
}

function AdminProductCard({ p, dot, onToggle, onEdit, onDelete, onCopy, copied }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col ${!p.available ? "opacity-60" : ""}`}>
      {/* Imagen */}
      <div className="h-20 border-b border-slate-100 bg-white flex items-center justify-center">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="h-full w-full object-contain p-1" />
        ) : (
          <Package className="w-6 h-6" style={{ color: dot }} />
        )}
      </div>

      {/* Info */}
      <div className="p-2 flex-1 flex flex-col">
        <p className="font-bold text-slate-800 text-xs leading-snug line-clamp-2">{p.name}</p>
        {(p.tier || p.is_flagship) && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {p.tier && (
              <span className="inline-block w-fit text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                Gama {p.tier}
              </span>
            )}
            {p.is_flagship && (
              <span className="inline-flex items-center gap-0.5 w-fit text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                <Star className="w-2.5 h-2.5 fill-current" />
                Marca Insignia
              </span>
            )}
          </div>
        )}
        {p.condition && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {p.condition.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag, i) => {
              const t = tag.toUpperCase();
              const highlighted = t === "NUEVO" || t === "CON CAJA" || t === "SELLADO";
              return (
                <span key={i} className={`text-xs px-1.5 py-0.5 rounded-full ${highlighted ? "bg-emerald-100 text-emerald-700 font-medium" : "text-slate-400 bg-slate-100"}`}>
                  {tag}
                </span>
              );
            })}
          </div>
        )}
        <div className="mt-auto pt-1.5">
          {p.original_price && Number(p.original_price) > Number(p.price) && (
            <div className="flex items-center gap-1 mb-0.5">
              <span
                className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 bg-white"
                style={{ color: dot, borderColor: dot }}
              >
                <Tag className="w-2.5 h-2.5 shrink-0" />
                -{Math.round((1 - p.price / p.original_price) * 100)}% descuento
              </span>
              <span className="text-xs text-slate-400 line-through">{formatPrice(p.original_price)}</span>
            </div>
          )}
          <p className="text-xs font-extrabold text-brand-indigo">{formatPrice(p.price)}</p>
        </div>
      </div>

      {/* Acciones */}
      <div className="border-t border-slate-100 px-2 py-1.5 flex items-center justify-between gap-1">
        <button
          onClick={() => onToggle(p)}
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${
            p.available ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${p.available ? "bg-emerald-500" : "bg-slate-400"}`} />
          {p.available ? "Disp." : "Agot."}
        </button>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onCopy(p)}
            title="Copiar mensaje del artículo"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onEdit(p)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(p)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCatalogo() {
  const token = getAdminToken();
  const headers = useMemo(
    () => ({ "Content-Type": "application/json", "x-admin-token": token }),
    [token]
  );

  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [categoryFilter, setCategoryFilter]       = useState("Todos");
  const [availabilityFilter, setAvailabilityFilter] = useState("Todos");

  // Categorías/secciones del catálogo
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", color: "#64748b" });
  const [categoryError, setCategoryError] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const CATEGORIES  = useMemo(() => categories.map((c) => c.name), [categories]);
  const FILTER_CATS = useMemo(() => ["Todos", ...CATEGORIES], [CATEGORIES]);
  const BRAND = useMemo(() => {
    const map = {};
    categories.forEach((c) => { map[c.name] = brandFromColor(c.color); });
    return map;
  }, [categories]);

  // Modal agregar / editar
  const [modal, setModal] = useState({ open: false, product: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Imagen pendiente de subir (archivo local)
  const [pendingImage, setPendingImage] = useState(null);
  // Imagen pendiente de URL externa (búsqueda Google)
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const [imageSearchResults, setImageSearchResults] = useState([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);

  // Confirmar eliminación
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Configuración de tienda
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const visibleProducts = useMemo(() => {
    let list = categoryFilter === "Todos"
      ? products
      : products.filter((p) => p.category === categoryFilter);
    if (availabilityFilter === "Disponible")    list = list.filter((p) => p.available);
    if (availabilityFilter === "No disponible") list = list.filter((p) => !p.available);
    return list;
  }, [products, categoryFilter, availabilityFilter]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [pRes, sRes, cRes] = await Promise.all([
        fetch(`${API}/admin/products`, { headers }),
        fetch(`${API}/admin/store-settings`, { headers }),
        fetch(`${API}/admin/categories`, { headers }),
      ]);
      const pData = await pRes.json();
      const sData = await sRes.json();
      const cData = await cRes.json();
      if (pData.ok) setProducts(pData.products);
      if (sData.ok) setSettingsForm(sData.settings);
      if (cData.ok) setCategories(cData.categories);
    } catch {}
    setLoading(false);
  }

  // ── Categorías / secciones ─────────────────────────────────────────────────

  async function addCategory() {
    setCategoryError("");
    if (!newCategory.name.trim()) return setCategoryError("Ingresa un nombre.");
    setSavingCategory(true);
    try {
      const r = await fetch(`${API}/admin/categories`, {
        method: "POST", headers,
        body: JSON.stringify({ name: newCategory.name.trim(), color: newCategory.color }),
      });
      const d = await r.json();
      if (!d.ok) {
        if (d.error === "DUPLICATE_NAME") throw new Error("Ya existe una sección con ese nombre.");
        throw new Error("No se pudo crear la sección.");
      }
      setCategories((prev) => [...prev, d.category]);
      setNewCategory({ name: "", color: "#64748b" });
    } catch (err) {
      setCategoryError(err.message);
    }
    setSavingCategory(false);
  }

  async function updateCategoryColor(cat, color) {
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, color } : c));
    try {
      await fetch(`${API}/admin/categories/${cat.id}`, {
        method: "PATCH", headers, body: JSON.stringify({ color }),
      });
    } catch {}
  }

  async function deleteCategory(cat) {
    setCategoryError("");
    try {
      const r = await fetch(`${API}/admin/categories/${cat.id}`, { method: "DELETE", headers });
      const d = await r.json();
      if (!d.ok) {
        if (d.error === "CATEGORY_IN_USE") {
          throw new Error(`No se puede eliminar: hay ${d.count} producto${d.count === 1 ? "" : "s"} en "${cat.name}".`);
        }
        throw new Error("No se pudo eliminar la sección.");
      }
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      setCategoryError(err.message);
    }
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openAdd() {
    setForm({ ...EMPTY_FORM, category: CATEGORIES[0] || "" });
    setPendingImage(null);
    setPendingImageUrl(null);
    setImageSearchResults([]);
    setRemoveImage(false);
    setFormError("");
    setModal({ open: true, product: null });
  }

  function openEdit(product) {
    setForm({
      name:            product.name,
      category:        product.category,
      memory_capacity: product.memory_capacity || "",
      price:           String(product.price),
      original_price:  product.original_price ? String(product.original_price) : "",
      condition:       product.condition || "",
      description:     product.description || "",
      available:       product.available,
      tier:            product.tier || "",
      is_flagship:     product.is_flagship || false,
      whatsapp_number: formatWhatsappDisplay(product.whatsapp_number || ""),
    });
    setPendingImage(null);
    setPendingImageUrl(null);
    setImageSearchResults([]);
    setRemoveImage(false);
    setFormError("");
    setModal({ open: true, product });
  }

  function closeModal() {
    setModal({ open: false, product: null });
    setPendingImage(null);
    setPendingImageUrl(null);
    setImageSearchResults([]);
    setRemoveImage(false);
    setFormError("");
  }

  // ── Imagen ─────────────────────────────────────────────────────────────────

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const base64  = dataUrl.split(",")[1];
      setPendingImage({ base64, ext, preview: dataUrl });
    };
    reader.readAsDataURL(file);
    // reset so re-selecting same file triggers onChange
    e.target.value = "";
  }

  // ── Búsqueda de imagen con Google ─────────────────────────────────────────

  async function searchImages() {
    if (!form.name.trim()) return;
    setImageSearchLoading(true);
    setImageSearchResults([]);
    try {
      const r = await fetch(
        `${API}/admin/image-search?q=${encodeURIComponent(form.name)}`,
        { headers }
      );
      const d = await r.json();
      if (d.ok) setImageSearchResults(d.images || []);
    } catch {}
    setImageSearchLoading(false);
  }

  function selectSearchImage(img) {
    // Usamos el thumbnail (más fiable) en lugar del original
    setPendingImageUrl(img.thumb || img.url);
    setPendingImage(null);
    setImageSearchResults([]);
  }

  // ── Guardar producto ───────────────────────────────────────────────────────

  async function save() {
    setFormError("");
    if (!form.name.trim()) return setFormError("El nombre es requerido.");
    if (!form.category)    return setFormError("Selecciona una categoría.");
    if (form.price === "" || isNaN(Number(form.price))) return setFormError("Ingresa un precio válido.");

    setSaving(true);
    try {
      // removeImage=true → image_url:null (borrar)
      // pendingImage/pendingImageUrl → nueva imagen
      // ninguno → no tocar image_url existente
      const imageValue = removeImage
        ? null
        : (pendingImage?.preview ?? pendingImageUrl ?? undefined);

      const payload = {
        name:            form.name.trim(),
        category:        form.category,
        memory_capacity: form.memory_capacity.trim() || null,
        price:           Number(form.price),
        original_price:  form.original_price !== "" && !isNaN(Number(form.original_price))
                           ? Number(form.original_price) : null,
        condition:       form.condition.trim(),
        description:     form.description.trim() || null,
        available:       form.available,
        tier:            form.tier || null,
        is_flagship:     !!form.is_flagship,
        whatsapp_number: form.whatsapp_number.trim() || null,
        ...(imageValue !== undefined && { image_url: imageValue }),
      };

      if (modal.product) {
        const r = await fetch(`${API}/admin/products/${modal.product.id}`, {
          method: "PATCH", headers, body: JSON.stringify(payload),
        });
        const d = await r.json();
        if (!d.ok) throw new Error(d.error || "ERROR");
      } else {
        const r = await fetch(`${API}/admin/products`, {
          method: "POST", headers, body: JSON.stringify(payload),
        });
        const d = await r.json();
        if (!d.ok) throw new Error(d.error || "ERROR");
      }

      await loadAll();
      closeModal();
    } catch (err) {
      setFormError(err.message || "Error al guardar el producto.");
    }
    setSaving(false);
  }

  // ── Disponibilidad rápida ──────────────────────────────────────────────────

  async function toggleAvailable(product) {
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => p.id === product.id ? { ...p, available: !p.available } : p)
    );
    try {
      await fetch(`${API}/admin/products/${product.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          name:            product.name,
          category:        product.category,
          memory_capacity: product.memory_capacity,
          price:           product.price,
          condition:       product.condition,
          description:     product.description,
          available:       !product.available,
          tier:            product.tier || null,
          is_flagship:     !!product.is_flagship,
        }),
      });
    } catch {
      // revert on failure
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, available: product.available } : p)
      );
    }
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`${API}/admin/products/${deleteTarget.id}`, {
        method: "DELETE", headers,
      });
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } catch {}
    setDeleteTarget(null);
  }

  // ── Configuración tienda ───────────────────────────────────────────────────

  async function saveSettings() {
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      const r = await fetch(`${API}/admin/store-settings`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ settings: settingsForm }),
      });
      const d = await r.json();
      if (d.ok) setSettingsSaved(true);
    } catch {}
    setSavingSettings(false);
  }

  // ── Copiar inventario ─────────────────────────────────────────────────────

  const [copied, setCopied] = useState(false);

  function copyInventory() {
    const available = products.filter((p) => p.available);
    if (!available.length) return;

    const fmt = (price) =>
      new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(price) + ".";

    const lines = [
      "⬇️ LEER ATENTAMENTE ⬇️",
      "",
      "🎉 ¡BIENVENIDO/A TechVenturesCO! 🎉",
      "",
      "🖥️ GRÁFICAS DISPONIBLES:",
      "",
    ];

    CATEGORIES.forEach((cat) => {
      const items = available
        .filter((p) => p.category === cat)
        .sort((a, b) => a.price - b.price);
      if (!items.length) return;
      const emoji = CATEGORY_EMOJI[cat] ?? "▪️";
      items.forEach((p) => {
        lines.push(`${emoji} ${productDisplayName(p)}: ${fmt(p.price)}`);
        lines.push("");
      });
    });

    lines.push(
      "💡 ¿TIENES UNA GRÁFICA USADA?",
      "¡Aceptamos gráficas como parte de pago! 🤑",
      "",
      "💎 PRECIOS FIJOS:",
      "Precios claros y sin negociación. 😊",
      "¿Compras varias unidades? Escríbenos, podemos revisar opciones. 📩",
      "",
      "💳 NUEVA OPCIÓN DE PAGO DISPONIBLE",
      "ahora también puedes pagar con tarjetas crédito y débito.",
      "📌 pagos con datáfono tienen un recargo del 6 %.",
      "💵 pagos en efectivo o transferencia → sin recargo.",
      "",
      "⚠️ ¿NO VES LA GRÁFICA QUE BUSCAS?",
      "Lamentablemente, ya se ha vendido. ¡No te quedes sin la tuya! 🚀",
      "",
      "💬 ¿Dudas o quieres más fotos/info?",
      "Escríbenos por este chat — también puedes ver más en nuestro perfil. 😊",
    );

    const contact = contactFooterLines(settingsForm);
    if (contact.length) lines.push("", ...contact);

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // ── Generar catálogo en PDF ──────────────────────────────────────────────

  const [generatingPdf, setGeneratingPdf] = useState(false);

  async function downloadCatalogPdf() {
    setGeneratingPdf(true);
    try {
      const res = await fetch(`${API}/admin/catalog-pdf`, {
        headers: { "x-admin-token": getAdminToken() },
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `catalogo-techventuresco-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("No se pudo generar el catálogo en PDF. Intenta de nuevo.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  // ── Copiar mensaje individual de un artículo ───────────────────────────────

  const [copiedProductId, setCopiedProductId] = useState(null);

  function copyProductMessage(p) {
    const emoji = CATEGORY_EMOJI[p.category] ?? "▪️";
    const price = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(p.price);
    const tradeIn = settingsForm.trade_in_note?.trim();

    const lines = [
      `${emoji} ${productDisplayName(p)}`,
      "",
      `💵 ${price} COP`,
      "",
      "🇨🇴 Envíos a nivel nacional",
    ];

    if (tradeIn) lines.push("", `🔁 ${tradeIn}`);

    lines.push(
      "",
      "💬 Tenemos más artículos disponibles, pregúntanos sin compromiso",
      "¿Dudas o quieres más fotos/info? Escríbenos por este chat — también puedes ver más en nuestro perfil. 😊"
    );

    const contact = contactFooterLines(settingsForm);
    if (contact.length) lines.push("", ...contact);

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopiedProductId(p.id);
      setTimeout(() => setCopiedProductId(null), 2500);
    });
  }

  // ── Imagen del modal (preview actual) ─────────────────────────────────────

  const currentImageSrc = removeImage
    ? null
    : (pendingImage?.preview ?? pendingImageUrl ?? (modal.product?.image_url || null));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container-page pb-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-indigo">Catálogo</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {visibleProducts.length} de {products.length} producto{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyInventory}
            disabled={!products.filter(p => p.available).length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40"
            title="Copiar listado de inventario disponible"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? "¡Copiado!" : "Copiar lista"}</span>
          </button>
          <button
            onClick={downloadCatalogPdf}
            disabled={generatingPdf || !products.filter((p) => p.available).length}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40"
            title="Generar catálogo en PDF con los productos disponibles"
          >
            {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            <span className="hidden sm:inline">{generatingPdf ? "Generando…" : "Generar PDF"}</span>
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-indigo text-white font-semibold hover:bg-brand-hover transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>
      </div>

      {/* Filtro por categoría */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
        {FILTER_CATS.map((cat) => {
          const b = BRAND[cat];
          const active = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={active && b ? { background: b.dot, color: "#fff", borderColor: "transparent" } : {}}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border transition-all ${
                active ? "shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Filtro por disponibilidad */}
      <div className="flex gap-2 mb-5">
        {[
          { label: "Todos",          value: "Todos",          cls: "bg-white text-slate-600 border-slate-200 hover:border-slate-300", activeCls: "bg-slate-700 text-white border-transparent" },
          { label: "Disponible",     value: "Disponible",     cls: "bg-white text-emerald-600 border-emerald-200 hover:border-emerald-300", activeCls: "bg-emerald-500 text-white border-transparent" },
          { label: "No disponible",  value: "No disponible",  cls: "bg-white text-slate-400 border-slate-200 hover:border-slate-300", activeCls: "bg-slate-400 text-white border-transparent" },
        ].map(({ label, value, cls, activeCls }) => (
          <button
            key={value}
            onClick={() => setAvailabilityFilter(value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-all shadow-sm ${availabilityFilter === value ? activeCls : cls}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Productos: cuadrícula agrupada (igual que la vista pública) ─────── */}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mb-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="card text-center py-12 mb-6">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium">
            {products.length === 0 ? "Sin productos" : "Sin resultados para este filtro"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {products.length === 0 ? "Agrega tu primer producto" : "Prueba cambiando categoría o disponibilidad"}
          </p>
        </div>
      ) : categoryFilter === "Todos" ? (
        /* Vista agrupada por sección */
        <div className="space-y-6 mb-6">
          {CATEGORIES
            .map((cat) => ({ cat, items: visibleProducts.filter((p) => p.category === cat) }))
            .filter((g) => g.items.length > 0)
            .map(({ cat, items }) => {
              const b = BRAND[cat] ?? DEFAULT_BRAND;
              const avail = items.filter((p) => p.available).length;
              return (
                <section key={cat}>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-1 h-5 rounded-full shrink-0" style={{ background: b.dot }} />
                    <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: b.dot }}>{cat}</h2>
                    <span className="text-xs text-slate-400">{avail} disponible{avail !== 1 ? "s" : ""} · {items.length} total</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {items.map((p) => <AdminProductCard key={p.id} p={p} dot={b.dot} onToggle={toggleAvailable} onEdit={openEdit} onDelete={setDeleteTarget} onCopy={copyProductMessage} copied={copiedProductId === p.id} />)}
                  </div>
                </section>
              );
            })}
        </div>
      ) : (
        /* Vista filtrada por categoría */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mb-6">
          {visibleProducts.map((p) => (
            <AdminProductCard key={p.id} p={p} dot={(BRAND[p.category] ?? DEFAULT_BRAND).dot} onToggle={toggleAvailable} onEdit={openEdit} onDelete={setDeleteTarget} onCopy={copyProductMessage} copied={copiedProductId === p.id} />
          ))}
        </div>
      )}

      {/* ── Secciones del catálogo ──────────────────────────────────────────── */}

      <div className="card mb-4">
        <button
          onClick={() => setCategoriesOpen((o) => !o)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="font-bold text-slate-800">Secciones del catálogo</h2>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${categoriesOpen ? "rotate-180" : ""}`}
          />
        </button>

        {categoriesOpen && (
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.name).length;
                return (
                  <div key={cat.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200">
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => updateCategoryColor(cat, e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                      title="Color de la sección"
                    />
                    <span className="font-semibold text-slate-700 text-sm flex-1">{cat.name}</span>
                    <span className="text-xs text-slate-400">{count} producto{count !== 1 ? "s" : ""}</span>
                    <button
                      onClick={() => deleteCategory(cat)}
                      disabled={count > 0}
                      title={count > 0 ? "No se puede eliminar: tiene productos" : "Eliminar sección"}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory((c) => ({ ...c, color: e.target.value }))}
                className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer shrink-0"
                title="Color de la nueva sección"
              />
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory((c) => ({ ...c, name: e.target.value }))}
                placeholder="Ej. Periféricos, Monitores..."
                className="flex-1 px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition text-sm"
              />
              <button
                onClick={addCategory}
                disabled={savingCategory}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-indigo text-white font-semibold hover:bg-brand-hover disabled:opacity-60 transition-colors text-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            {categoryError && <p className="err">{categoryError}</p>}
          </div>
        )}
      </div>

      {/* ── Configuración de la tienda ─────────────────────────────────────── */}

      <div className="card">
        <button
          onClick={() => setSettingsOpen((o) => !o)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="font-bold text-slate-800">Configuración de la tienda</h2>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${settingsOpen ? "rotate-180" : ""}`}
          />
        </button>

        {settingsOpen && (
          <div className="mt-5 space-y-4">
            {[
              {
                key: "whatsapp_number",
                label: "Número de WhatsApp",
                hint: "Sin + ni espacios, con código de país (ej: 573108216274)",
                placeholder: "573108216274",
              },
              {
                key: "instagram_handle",
                label: "Usuario de Instagram",
                hint: "Se agrega al final de los mensajes copiados (ej: @techventuresco)",
                placeholder: "@techventuresco",
              },
              {
                key: "trade_in_note",
                label: "Nota de permuta",
                placeholder: "Acepto GPUs como parte de pago (permuta)",
              },
              {
                key: "payment_methods",
                label: "Medios de pago",
                placeholder: "Efectivo o transferencia sin recargo · Tarjeta +6%...",
              },
              {
                key: "prices_note",
                label: "Nota de precios",
                placeholder: "Los precios son fijos",
              },
            ].map(({ key, label, hint, placeholder }) => (
              <div key={key}>
                <label className="lbl text-sm">{label}</label>
                {hint && <p className="text-xs text-slate-400 -mt-1.5 mb-1.5">{hint}</p>}
                <input
                  type="text"
                  value={settingsForm[key] || ""}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition text-sm"
                />
              </div>
            ))}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-indigo text-white font-semibold hover:bg-brand-hover disabled:opacity-60 transition-colors text-sm"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? "Guardando..." : "Guardar"}
              </button>
              {settingsSaved && (
                <span className="text-sm text-emerald-600 font-medium">¡Guardado!</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Agregar / Editar ──────────────────────────────────────────── */}

      {modal.open && createPortal(
        <div className="fixed inset-0 bg-black/40 overflow-y-auto" style={{ zIndex: 9999 }}>
          <div className="flex min-h-full items-start justify-center p-4 pt-24">
            <div className="w-full max-w-lg mb-6">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

                {/* Header */}
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h3 className="font-bold text-lg">
                    {modal.product ? "Editar producto" : "Agregar producto"}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xl font-bold leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="p-5 space-y-4">

                  {/* Imagen */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="lbl text-sm mb-0">Foto del producto</label>
                      {currentImageSrc && (
                        <button
                          type="button"
                          onClick={() => { setRemoveImage(true); setPendingImage(null); setPendingImageUrl(null); }}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Eliminar imagen
                        </button>
                      )}
                    </div>
                    <div
                      className="relative w-full h-40 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {currentImageSrc ? (
                        <>
                          <img src={currentImageSrc} alt="preview" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors">
                            <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                              Cambiar foto
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                          <Upload className="w-8 h-8" />
                          <span className="text-sm">Toca para subir una foto</span>
                          <span className="text-xs text-slate-300">JPG, PNG, WebP</span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Búsqueda automática con Google */}
                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={searchImages}
                        disabled={imageSearchLoading || !form.name.trim()}
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-indigo hover:underline disabled:opacity-40 disabled:no-underline transition-opacity"
                      >
                        <Search className="w-3.5 h-3.5" />
                        {imageSearchLoading ? "Buscando..." : "Buscar imagen con Google"}
                      </button>
                      {imageSearchResults.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setImageSearchResults([])}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Grid de resultados */}
                    {imageSearchResults.length > 0 && (
                      <div className="mt-2 grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                        {imageSearchResults.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectSearchImage(img)}
                            className="aspect-square rounded-xl overflow-hidden border-2 border-slate-200 hover:border-brand-indigo transition-all"
                            title={img.title}
                          >
                            <img
                              src={img.thumb}
                              alt={img.title}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Nombre */}
                  <div>
                    <label className="lbl text-sm">
                      Nombre del producto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toUpperCase() }))}
                      placeholder="ej. RTX 3080 10GB EVGA XC3"
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition text-sm uppercase"
                    />
                  </div>

                  {/* Categoría + Memoria */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="lbl text-sm">
                        Categoría <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none bg-white transition text-sm"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="lbl text-sm">Memoria / Capacidad</label>
                      <input
                        type="text"
                        value={form.memory_capacity}
                        onChange={(e) => setForm((f) => ({ ...f, memory_capacity: e.target.value.toUpperCase() }))}
                        placeholder="8GB, 1TB, 256GB..."
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition text-sm uppercase"
                      />
                    </div>
                  </div>

                  {/* Precio + Precio original + Estado */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="lbl text-sm">
                        Precio actual (COP) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                        placeholder="1200000"
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition text-sm"
                      />
                    </div>
                    <div>
                      <label className="lbl text-sm">
                        Precio antes de oferta
                        <span className="text-slate-400 text-xs font-normal ml-1">(opcional)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.original_price}
                        onChange={(e) => setForm((f) => ({ ...f, original_price: e.target.value }))}
                        placeholder="1500000"
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-amber-200 focus:border-amber-400 outline-none transition text-sm"
                      />
                      {form.original_price && form.price &&
                       Number(form.original_price) > Number(form.price) && (
                        <p className="text-xs text-amber-600 font-semibold mt-0.5">
                          Descuento: {Math.round((1 - Number(form.price) / Number(form.original_price)) * 100)}% OFF
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="lbl text-sm">Estado / Condición</label>
                      <input
                        type="text"
                        value={form.condition}
                        onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value.toUpperCase() }))}
                        placeholder="CON CAJA, OPEN BOX, COIL WHINE... (SEPARA CON COMAS)"
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition text-sm uppercase"
                      />
                    </div>
                  </div>

                  {/* Gama */}
                  <div>
                    <label className="lbl text-sm">
                      Gama{" "}
                      <span className="text-slate-400 text-xs font-normal">(opcional, manual)</span>
                    </label>
                    <select
                      value={form.tier}
                      onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none bg-white transition text-sm"
                    >
                      <option value="">Sin definir (automático)</option>
                      {TIER_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Insignia (tope de línea/marca) */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_flagship}
                      onChange={(e) => setForm((f) => ({ ...f, is_flagship: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700 font-medium">
                      ¿Es la línea insignia de su marca?{" "}
                      <span className="text-slate-400 text-xs font-normal">(ej. Nitro+, ROG Strix, Red Devil)</span>
                    </span>
                  </label>

                  {/* WhatsApp alternativo */}
                  <div>
                    <label className="lbl text-sm">
                      Número de WhatsApp para este producto{" "}
                      <span className="text-slate-400 text-xs font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.whatsapp_number}
                      onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value }))}
                      placeholder="Ej: 313 329 3644 — déjalo vacío para usar el WhatsApp general"
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition text-sm"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Útil si este producto lo maneja otra persona. El botón "Contactar por WhatsApp" del catálogo apuntará a este número.
                    </p>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="lbl text-sm">
                      Descripción{" "}
                      <span className="text-slate-400 text-xs font-normal">(opcional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.toUpperCase() }))}
                      placeholder="DETALLES ADICIONALES, ESTADO DE LA BATERÍA, NOTAS..."
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition resize-none text-sm uppercase"
                    />
                  </div>

                  {/* Disponible */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.available}
                      onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                    />
                    <span className="text-sm text-slate-700 font-medium">
                      Disponible para la venta
                    </span>
                  </label>

                  {formError && (
                    <p className="err">{formError}</p>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t flex justify-end gap-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-indigo text-white font-semibold hover:bg-brand-hover disabled:opacity-60 transition-colors text-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving
                      ? "Guardando..."
                      : modal.product ? "Guardar cambios" : "Agregar producto"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal confirmación eliminar ────────────────────────────────────── */}

      {deleteTarget && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2">Eliminar producto</h3>
              <p className="text-slate-600 text-sm">
                ¿Eliminar <b>{deleteTarget.name}</b>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

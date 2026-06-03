import { createPortal } from "react-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { getAdminToken } from "../lib/adminSession.js";
import {
  Plus, Pencil, Trash2, Upload, Package, Save, ChevronDown,
} from "lucide-react";

const API = (
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API ??
  window.__API_BASE__ ??
  "http://localhost:4000/api"
).replace(/\/+$/, "");

const CATEGORIES      = ["NVIDIA", "AMD", "Intel", "Componentes", "Celulares"];
const FILTER_CATS     = ["Todos", ...CATEGORIES];

const BRAND = {
  NVIDIA:      { bg: "rgba(118,185,0,0.15)",    text: "#4a7a00", dot: "#76B900"  },
  AMD:         { bg: "rgba(237,28,36,0.12)",    text: "#c0111a", dot: "#ED1C24"  },
  Intel:       { bg: "rgba(0,104,181,0.12)",    text: "#005da0", dot: "#0068B5"  },
  Componentes: { bg: "rgba(100,116,139,0.12)",  text: "#475569", dot: "#64748b"  },
  Celulares:   { bg: "rgba(139,92,246,0.12)",   text: "#6d28d9", dot: "#8B5CF6"  },
};

const EMPTY_FORM = {
  name: "",
  category: "NVIDIA",
  memory_capacity: "",
  price: "",
  condition: "",
  description: "",
  available: true,
};


function formatPrice(p) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(p);
}

function AdminProductCard({ p, onToggle, onEdit, onDelete }) {
  const dot = BRAND[p.category]?.dot ?? "#94a3b8";
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
        {p.condition && <p className="text-xs text-slate-400 mt-0.5 truncate">{p.condition}</p>}
        <p className="text-xs font-extrabold text-brand-indigo mt-auto pt-1.5">{formatPrice(p.price)}</p>
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
  const [loading, setLoading]       = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("Todos");

  // Modal agregar / editar
  const [modal, setModal] = useState({ open: false, product: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Imagen pendiente de subir
  const [pendingImage, setPendingImage] = useState(null); // { base64, ext, preview }
  const fileInputRef = useRef(null);

  // Confirmar eliminación
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Configuración de tienda
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const visibleProducts = useMemo(() =>
    categoryFilter === "Todos"
      ? products
      : products.filter((p) => p.category === categoryFilter),
    [products, categoryFilter]
  );

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch(`${API}/admin/products`, { headers }),
        fetch(`${API}/admin/store-settings`, { headers }),
      ]);
      const pData = await pRes.json();
      const sData = await sRes.json();
      if (pData.ok) setProducts(pData.products);
      if (sData.ok) setSettingsForm(sData.settings);
    } catch {}
    setLoading(false);
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openAdd() {
    setForm(EMPTY_FORM);
    setPendingImage(null);
    setFormError("");
    setModal({ open: true, product: null });
  }

  function openEdit(product) {
    setForm({
      name:            product.name,
      category:        product.category,
      memory_capacity: product.memory_capacity || "",
      price:           String(product.price),
      condition:       product.condition || "",
      description:     product.description || "",
      available:       product.available,
    });
    setPendingImage(null);
    setFormError("");
    setModal({ open: true, product });
  }

  function closeModal() {
    setModal({ open: false, product: null });
    setPendingImage(null);
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

  // ── Guardar producto ───────────────────────────────────────────────────────

  async function save() {
    setFormError("");
    if (!form.name.trim()) return setFormError("El nombre es requerido.");
    if (!form.category)    return setFormError("Selecciona una categoría.");
    if (form.price === "" || isNaN(Number(form.price))) return setFormError("Ingresa un precio válido.");

    setSaving(true);
    try {
      const payload = {
        name:            form.name.trim(),
        category:        form.category,
        memory_capacity: form.memory_capacity.trim() || null,
        price:           Number(form.price),
        condition:       form.condition.trim(),
        description:     form.description.trim() || null,
        available:       form.available,
      };

      let savedProduct;
      if (modal.product) {
        const r = await fetch(`${API}/admin/products/${modal.product.id}`, {
          method: "PATCH", headers, body: JSON.stringify(payload),
        });
        const d = await r.json();
        if (!d.ok) throw new Error(d.error || "ERROR");
        savedProduct = d.product;
      } else {
        const r = await fetch(`${API}/admin/products`, {
          method: "POST", headers, body: JSON.stringify(payload),
        });
        const d = await r.json();
        if (!d.ok) throw new Error(d.error || "ERROR");
        savedProduct = d.product;
      }

      // Subir imagen si hay una pendiente
      if (pendingImage) {
        const r = await fetch(`${API}/admin/products/${savedProduct.id}/image`, {
          method: "POST",
          headers,
          body: JSON.stringify({ image: pendingImage.base64, ext: pendingImage.ext }),
        });
        const d = await r.json();
        if (d.ok) savedProduct = { ...savedProduct, image_url: d.image_url };
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

  // ── Imagen del modal (preview actual) ─────────────────────────────────────

  const currentImageSrc = pendingImage?.preview
    ?? (modal.product?.image_url || null);

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
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-indigo text-white font-semibold hover:bg-brand-hover transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar</span>
        </button>
      </div>

      {/* Filtro por categoría */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
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
            {products.length === 0 ? "Sin productos" : `Sin productos en ${categoryFilter}`}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {products.length === 0 ? "Agrega tu primer producto" : "Prueba con otra categoría"}
          </p>
        </div>
      ) : categoryFilter === "Todos" ? (
        /* Vista agrupada por sección */
        <div className="space-y-6 mb-6">
          {CATEGORIES
            .map((cat) => ({ cat, items: products.filter((p) => p.category === cat) }))
            .filter((g) => g.items.length > 0)
            .map(({ cat, items }) => {
              const b = BRAND[cat] ?? BRAND.Componentes;
              const avail = items.filter((p) => p.available).length;
              return (
                <section key={cat}>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-1 h-5 rounded-full shrink-0" style={{ background: b.dot }} />
                    <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: b.dot }}>{cat}</h2>
                    <span className="text-xs text-slate-400">{avail} disponible{avail !== 1 ? "s" : ""} · {items.length} total</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {items.map((p) => <AdminProductCard key={p.id} p={p} onToggle={toggleAvailable} onEdit={openEdit} onDelete={setDeleteTarget} />)}
                  </div>
                </section>
              );
            })}
        </div>
      ) : (
        /* Vista filtrada por categoría */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mb-6">
          {visibleProducts.map((p) => (
            <AdminProductCard key={p.id} p={p} onToggle={toggleAvailable} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

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
                    <label className="lbl text-sm">Foto del producto</label>
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

                  {/* Nombre */}
                  <div>
                    <label className="lbl text-sm">
                      Nombre del producto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="ej. RTX 3080 10GB EVGA XC3"
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition text-sm"
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
                        onChange={(e) => setForm((f) => ({ ...f, memory_capacity: e.target.value }))}
                        placeholder="8GB, 1TB, 256GB..."
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition text-sm"
                      />
                    </div>
                  </div>

                  {/* Precio + Estado */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="lbl text-sm">
                        Precio (COP) <span className="text-red-500">*</span>
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
                      <label className="lbl text-sm">Estado / Condición</label>
                      <input
                        type="text"
                        value={form.condition}
                        onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                        placeholder="Con caja, open box..."
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition text-sm"
                      />
                    </div>
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
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Detalles adicionales, estado de la batería, notas..."
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-400 outline-none transition resize-none text-sm"
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

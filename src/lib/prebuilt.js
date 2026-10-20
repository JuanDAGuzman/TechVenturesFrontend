// PCs armados: nombre de la categoría y tipos de pieza que se pueden registrar.
// La composición de cada equipo vive en products.build:
//   { components: [{ type, name }], includes: [{ type, name }] }

export const PREBUILT_CATEGORY = "PCS ARMADOS";

export function isPrebuilt(category) {
  return String(category ?? "").trim().toUpperCase() === PREBUILT_CATEGORY;
}

// Piezas internas de la torre
export const COMPONENT_TYPES = [
  "PROCESADOR",
  "TARJETA DE VIDEO",
  "BOARD",
  "MEMORIA RAM",
  "ALMACENAMIENTO",
  "FUENTE",
  "GABINETE",
  "REFRIGERACION",
];

// Lo que acompaña a la torre
export const INCLUDE_TYPES = ["MONITOR", "TECLADO", "MOUSE", "AUDIFONOS", "OTRO"];

// Etiqueta corta para el resumen de la tarjeta
export const SHORT_LABEL = {
  PROCESADOR: "CPU",
  "TARJETA DE VIDEO": "GPU",
  "MEMORIA RAM": "RAM",
  ALMACENAMIENTO: "DISCO",
  BOARD: "BOARD",
  FUENTE: "FUENTE",
  GABINETE: "CASE",
  REFRIGERACION: "COOLER",
};

// Orden en que se resumen las piezas clave en la tarjeta
const SUMMARY_ORDER = ["PROCESADOR", "TARJETA DE VIDEO", "MEMORIA RAM", "ALMACENAMIENTO"];

export function parseBuild(raw) {
  let b = raw;
  if (typeof b === "string") {
    try { b = JSON.parse(b); } catch { b = null; }
  }
  const list = (arr) => (Array.isArray(arr) ? arr : [])
    .map((i) => ({ type: String(i?.type ?? "").toUpperCase(), name: String(i?.name ?? "").trim() }))
    .filter((i) => i.name);
  return { components: list(b?.components), includes: list(b?.includes) };
}

// Hasta 4 piezas clave: primero las conocidas (CPU, GPU, RAM, disco) y, si faltan, las demás en orden
export function summaryRows(build) {
  const { components } = parseBuild(build);
  const rows = [];
  for (const t of SUMMARY_ORDER) {
    const c = components.find((x) => x.type === t);
    if (c) rows.push(c);
  }
  for (const c of components) {
    if (rows.length >= 4) break;
    if (!rows.includes(c)) rows.push(c);
  }
  return rows.slice(0, 4);
}

// Formulario del admin: una fila vacía por cada tipo de pieza
export function emptyBuildForm() {
  return { components: COMPONENT_TYPES.map((type) => ({ type, name: "" })), includes: [] };
}

export function buildToForm(raw) {
  const b = parseBuild(raw);
  if (!b.components.length && !b.includes.length) return emptyBuildForm();
  // conserva las piezas guardadas y deja filas vacías para los tipos que aún no tiene
  const missing = COMPONENT_TYPES.filter((t) => !b.components.some((c) => c.type === t)).map((type) => ({ type, name: "" }));
  return { components: [...b.components, ...missing], includes: b.includes };
}

// Limpia filas vacías; null si no queda nada
export function formToBuild(form) {
  const clean = (arr) => (arr ?? [])
    .map((i) => ({ type: String(i.type ?? "").trim().toUpperCase(), name: String(i.name ?? "").trim() }))
    .filter((i) => i.name);
  const components = clean(form?.components);
  const includes = clean(form?.includes);
  if (!components.length && !includes.length) return null;
  return { components, includes };
}

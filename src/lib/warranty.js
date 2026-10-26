// Garantía por artículo: de 1 a 6 meses, opcional. Las tarjetas gráficas la traen por defecto (1 mes);
// en los demás artículos se asigna a mano. Se cuenta desde la entrega.

export const WARRANTY_OPTIONS = [1, 2, 3, 4, 5, 6];
export const DEFAULT_WARRANTY = 1;
export const WARRANTY_PATH = "/garantia";
export const WARRANTY_URL = "www.techventuresco.com/garantia";

// Categorías que son tarjetas gráficas
export const GPU_CATEGORIES = ["NVIDIA", "AMD", "INTEL"];

export function isGpuCategory(category) {
  return GPU_CATEGORIES.includes(String(category ?? "").trim().toUpperCase());
}

// Garantía sugerida al crear un artículo: 1 mes en gráficas, ninguna en el resto
export function defaultWarrantyFor(category) {
  return isGpuCategory(category) ? DEFAULT_WARRANTY : null;
}

// Meses de garantía del artículo, o null si no tiene
export function warrantyMonths(product) {
  const n = Number(product?.warranty_months);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

export function warrantyLabel(months) {
  return `${months} ${months === 1 ? "mes" : "meses"}`;
}

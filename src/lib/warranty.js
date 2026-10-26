// Garantía por artículo: de 1 a 6 meses, 1 por defecto. Se cuenta desde la entrega.

export const WARRANTY_OPTIONS = [1, 2, 3, 4, 5, 6];
export const DEFAULT_WARRANTY = 1;
export const WARRANTY_PATH = "/garantia";
export const WARRANTY_URL = "www.techventuresco.com/garantia";

export function warrantyMonths(product) {
  const n = Number(product?.warranty_months);
  return Number.isInteger(n) && n >= 1 ? n : DEFAULT_WARRANTY;
}

export function warrantyLabel(months) {
  return `${months} ${months === 1 ? "mes" : "meses"}`;
}

// Deriva una paleta de colores (punto, hover, halo, badge) a partir de un
// único color hexadecimal de marca por categoría/sección del catálogo.

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c) => Math.round(c * (1 - amount)).toString(16).padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

// { dot, hover, ring, text, bg, badge: { background, color } }
export function brandFromColor(color) {
  const dot = color;
  const hover = darken(color, 0.18);
  const text = darken(color, 0.35);
  return {
    dot,
    hover,
    text,
    bg: rgba(color, 0.13),
    ring: rgba(color, 0.2),
    badge: { background: rgba(color, 0.13), color: text },
  };
}

export const DEFAULT_BRAND = brandFromColor("#64748b");

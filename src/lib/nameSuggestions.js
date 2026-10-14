// Sugerencias de nombre para artículos del catálogo.
//
// Entrada: el nombre que escribió el admin y, opcionalmente, los títulos que devolvió la
// búsqueda de imágenes. Salida: 3 a 5 nombres más cortos y claros (en mayúsculas, sin tildes).
//
// No usa IA externa: separa el texto en tipo de pieza / marca / modelo / especificaciones
// con listas de palabras y patrones, y arma varias combinaciones ordenadas por claridad.

// ── utilidades ───────────────────────────────────────────────────────────────

// Quita tildes sin escribir el rango Unicode como literal de regex
function stripAccents(s) {
  return s
    .normalize("NFD")
    .split("")
    .filter((ch) => {
      const c = ch.codePointAt(0);
      return c < 0x0300 || c > 0x036f;
    })
    .join("");
}

// Une las palabras de una marca ("COOLER_MASTER"). Es un carácter de palabra a propósito:
// así \bCOOLER\b ya no coincide dentro de la marca.
const SP = "_";
const esc = (s) => s.replace(/[.+*?^${}()|[\]\\]/g, "\\$&");

// ── léxico ───────────────────────────────────────────────────────────────────

// Marcas (las de varias palabras primero para que ganen al coincidir)
const BRANDS = [
  "COOLER MASTER", "WESTERN DIGITAL", "BE QUIET", "STEEL SERIES", "TEAM GROUP",
  "ASUS", "ASROCK", "MSI", "GIGABYTE", "AORUS", "ZOTAC", "EVGA", "SAPPHIRE", "XFX", "PNY",
  "POWERCOLOR", "PALIT", "GAINWARD", "GALAX", "INNO3D", "COLORFUL", "MANLI", "BIOSTAR", "ACER", "PREDATOR",
  "CORSAIR", "THERMALTAKE", "THERMALRIGHT", "DEEPCOOL", "NZXT", "SEASONIC", "ANTEC", "XPG", "ADATA",
  "KINGSTON", "CRUCIAL", "SAMSUNG", "SEAGATE", "TOSHIBA", "SANDISK", "LEXAR", "PATRIOT", "HYPERX", "G.SKILL", "GSKILL",
  "LOGITECH", "RAZER", "REDRAGON", "STEELSERIES", "HAVIT", "GAMDIAS", "ROSEWILL", "AEROCOOL", "COUGAR", "ARCTIC", "NOCTUA",
  "APPLE", "XIAOMI", "HUAWEI", "MOTOROLA", "OPPO", "REALME", "HONOR", "NOKIA", "ONEPLUS", "GOOGLE", "TECNO", "INFINIX",
  "LG", "DELL", "HP", "LENOVO", "BENQ", "AOC", "VIEWSONIC", "SONY", "JBL", "KZ", "TP-LINK", "TPLINK",
  "AMD", "INTEL", "NVIDIA",
];
const BRAND_RES = BRANDS.map((b) => ({
  b,
  re: new RegExp(`(^|\\s)${esc(b)}(?=\\s|$)`, "g"),
  joined: b.replace(/ /g, SP),
}));

// Frases que indican el tipo de pieza → forma corta ("" = el tipo se deduce del modelo)
const TYPE_PHRASES = [
  [/\bFUENTE DE PODER\b|\bFUENTE DE ALIMENTACION\b|\bFUENTE\b|\bPSU\b/, "FUENTE"],
  [/\bTARJETA DE VIDEO\b|\bTARJETA GRAFICA\b|\bGRAFICA\b|\bGPU\b|\bVGA\b/, ""],
  [/\bMEMORIA RAM\b|\bMODULO DE MEMORIA\b|\bMEMORIA\b|\bRAM\b/, "RAM"],
  [/\bUNIDAD DE ESTADO SOLIDO\b|\bDISCO SOLIDO\b|\bSSD\b/, "SSD"],
  [/\bDISCO DURO\b|\bHDD\b/, "HDD"],
  [/\bPLACA MADRE\b|\bTARJETA MADRE\b|\bMOTHERBOARD\b|\bMAINBOARD\b|\bBOARD\b/, "BOARD"],
  [/\bPROCESADOR\b|\bCPU\b/, ""],
  [/\bREFRIGERACION LIQUIDA\b|\bDISIPADOR\b|\bCOOLER\b/, "DISIPADOR"],
  [/\bAUDIFONOS\b|\bAURICULARES\b|\bHEADSET\b|\bDIADEMA\b/, "AUDIFONOS"],
  [/\bMOUSE\b|\bRATON\b/, "MOUSE"],
  [/\bTECLADO\b|\bKEYBOARD\b/, "TECLADO"],
  [/\bMONITOR\b|\bPANTALLA\b/, "MONITOR"],
  [/\bGABINETE\b|\bCASE\b/, "GABINETE"],
  [/\bCELULAR\b|\bSMARTPHONE\b|\bTELEFONO\b/, ""],
];

// Palabras que nunca aportan al nombre
const NOISE = new Set([
  "DE", "DEL", "LA", "LAS", "EL", "LOS", "CON", "PARA", "POR", "Y", "E", "EN", "UN", "UNA", "A", "O",
  "PC", "PCS", "COMPUTADOR", "COMPUTADORA", "ORDENADOR", "ORIGINAL", "OFICIAL", "NUEVO", "NUEVA", "USADO", "USADA",
  "GARANTIA", "ENVIO", "ENVIOS", "GRATIS", "OFERTA", "OFERTAS", "PRECIO", "COMPRAR", "COMPRA", "VENTA", "COLOMBIA",
  "MEJOR", "BARATO", "BARATA", "ALTO", "RENDIMIENTO", "TECNOLOGIA", "NEW", "THE", "WITH", "FOR", "AND", "OF",
  "FULLY", "POWER", "SUPPLY", "GRAPHICS", "CARD", "MEMORY", "DESKTOP",
]);

// Palabras de relleno comercial: se descartan en las versiones cortas
const FILLER = new Set([
  "FULL", "MODULAR", "SEMI", "EDITION", "GAMING", "RGB", "ARGB", "OC", "SERIES", "SERIE", "VERSION",
  "PREMIUM", "WHITE", "BLACK", "BLANCO", "NEGRO", "DIGITAL", "COLOR", "PLUS", "ULTRA", "EDICION", "CERTIFICADA", "ATX",
]);

const RATINGS = new Set(["GOLD", "BRONZE", "SILVER", "PLATINUM", "TITANIUM", "BRONCE", "PLATA", "ORO"]);

// Modelos que van primero en el nombre (así lo escribe el catálogo: "RTX 3060 TI 8GB ZOTAC ...")
const PRIMARY_PATTERNS = [
  /\b(?:RTX|GTX|GT|RX|ARC)\s?[A-Z]?\d{3,4}(?:\s?(?:TI|SUPER|XTX|XT|GRE))*\b/,
  /\bRYZEN\s?[3579]\s?\d{4}[A-Z0-9]{0,3}\b/,
  /\b(?:CORE\s)?I[3579][- ]?\d{4,5}[A-Z]{0,2}\b/,
  /\bIPHONE\s?\d{1,2}(?:\s?(?:PRO MAX|PRO|PLUS|MINI))?\b/,
  /\bGALAXY\s[A-Z]\d{1,3}(?:\s(?:ULTRA|PLUS|FE))?\b/,
];

const SPEC_RE = /^(?:\d+(?:[.,]\d+)?(?:GB|TB|MB|W|V|MHZ|GHZ|HZ|RPM|MM|CM|MAH|MP|PULGADAS)|\d+X\d+(?:GB)?|DDR\d|GDDR\d+X?|NVME|SATA|M\.2|PCIE|USB|HDMI|4K|2K|QHD|FHD|UHD|IPS|OLED)$/;
const CAPACITY_RE = /^(?:\d+(?:[.,]\d+)?(?:GB|TB|MB)|\d+X\d+(?:GB)?)$/;
const POWER_RE = /^\d+W$/;
const REV_RE = /^(?:V\d+(?:\.\d+)?|GEN\d)$/;

// ── normalización ────────────────────────────────────────────────────────────

function normalize(raw) {
  let s = stripAccents(String(raw ?? "")).toUpperCase();
  s = s.replace(/[()[\]{}"“”]/g, " ").replace(/[,;:·•]/g, " ");
  s = s.replace(/(\d)\s+(GB|TB|MB|W|MHZ|GHZ|HZ|V|MM|CM|RPM)\b/g, "$1$2");              // "8 GB" -> "8GB"
  s = s.replace(/\b\d+\s?(?:NUCLEOS|NUCLEO|CORES|HILOS|THREADS)\b/g, " ");              // "6 NUCLEOS" no aporta al nombre
  s = s.replace(/\b\d+-?BIT\b/g, " ");                                                  // "192-BIT"
  s = s.replace(/80\s?\+?\s?PLUS/g, "80+");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

// Corta un título de tienda en su parte de producto ("... - Mercado Libre", "... | Amazon")
export function cleanTitle(title) {
  const t = String(title ?? "").split(/\s[|–—-]\s|…|\.\.\./)[0];
  return t.trim();
}

// ── clasificación ────────────────────────────────────────────────────────────

// Une letras sueltas con el número vecino: "X 120 R" -> "X 120R" (para que el modelo no se parta)
function mergeModelTokens(model) {
  const out = [];
  for (let i = 0; i < model.length; i++) {
    const t = model[i];
    if (/^[A-Z]$/.test(t) && model[i + 1] && /^\d/.test(model[i + 1])) {
      let unit = `${t} ${model[i + 1]}`;
      i += 1;
      if (model[i + 1] && /^[A-Z]$/.test(model[i + 1])) { unit += model[i + 1]; i += 1; }
      out.push(unit);
    } else if (/^[A-Z]$/.test(t) && out.length && /^\d+$/.test(out[out.length - 1])) {
      out[out.length - 1] += t;
    } else {
      out.push(t);
    }
  }
  return out;
}

function classify(raw) {
  let s = normalize(raw);
  if (!s) return null;

  // 1) marcas como unidades indivisibles
  for (const { re, joined } of BRAND_RES) s = s.replace(re, (_, p) => `${p}${joined}`);

  // 2) modelo principal (GPU / CPU / teléfono)
  let primary = "";
  for (const re of PRIMARY_PATTERNS) {
    const m = s.match(re);
    if (m && !primary) {
      primary = m[0].replace(/\s+/g, " ").trim();
      s = s.replace(m[0], " ");
    }
  }
  // Con un modelo de GPU/CPU, las marcas de silicio son ruido ("NVIDIA GEFORCE RTX 3060")
  if (primary) s = s.replace(/\b(GEFORCE|RADEON|NVIDIA|AMD|INTEL)\b/g, " ");

  // 3) tipo de pieza
  let type = "";
  let typeFound = false;
  for (const [re, canon] of TYPE_PHRASES) {
    if (re.test(s)) {
      if (!typeFound) { type = canon; typeFound = true; }
      s = s.replace(new RegExp(re.source, "g"), " ");
    }
  }

  // 4) tokens restantes
  const toks = s.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const out = { primary, type, brand: "", brandPos: 0, specs: [], ratings: [], rev: [], model: [], fillers: [], combo: false };

  for (const raw2 of toks) {
    const t = raw2.replace(/^[-–—]+|[-–—]+$/g, "");
    if (!t) continue;
    if (t === "+" || t === "&") { out.combo = true; continue; }
    const spaced = t.split(SP).join(" ");
    if (BRANDS.includes(spaced)) {
      if (!out.brand) { out.brand = spaced; out.brandPos = out.model.length; } else out.model.push(spaced);
      continue;
    }
    if (NOISE.has(t)) continue;
    if (t === "80+") continue;                                        // el sello se expresa con GOLD/BRONZE…
    if (/^\d\.\d$/.test(t)) continue;                                 // versiones sueltas ("4.0", "3.0")
    if (RATINGS.has(t)) { out.ratings.push(t === "ORO" ? "GOLD" : t === "BRONCE" ? "BRONZE" : t === "PLATA" ? "SILVER" : t); continue; }
    if (REV_RE.test(t)) { out.rev.push(t); continue; }
    if (SPEC_RE.test(t)) { out.specs.push(t.replace(",", ".")); continue; }
    if (FILLER.has(t)) { out.fillers.push(t); continue; }
    out.model.push(t);
  }

  // Fuentes: "750" sin la W (típico en títulos de tienda) es la potencia
  if (out.type === "FUENTE" && !out.specs.some((x) => POWER_RE.test(x))) {
    const i = out.model.findIndex((m) => /^\d{3,4}$/.test(m) && +m >= 300 && +m <= 2000);
    if (i >= 0) { out.specs.push(`${out.model[i]}W`); out.model.splice(i, 1); if (out.brandPos > i) out.brandPos -= 1; }
  }

  out.specs = [...new Set(out.specs)];
  out.model = mergeModelTokens(out.model.filter((m, i) => out.model.indexOf(m) === i));
  out.brandPos = Math.min(out.brandPos, out.model.length);
  return out;
}

// ── armado de variantes ──────────────────────────────────────────────────────

const J = (arr) => arr.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

const isCpu = (c) => /^(RYZEN|CORE|I[3579])/.test(c.primary);
const isPhone = (c) => /^(IPHONE|GALAXY)/.test(c.primary);

function mainSpecs(c) {
  if (isCpu(c)) return [];                                   // núcleos y frecuencia no hacen falta en el nombre
  const power = c.specs.find((x) => POWER_RE.test(x));
  const cap = c.specs.find((x) => CAPACITY_RE.test(x));
  if (c.type === "FUENTE" && power) return [power];
  if (c.type === "RAM") return [cap, c.specs.find((x) => /^DDR\d$/.test(x))].filter(Boolean);
  if (cap) return [cap];
  if (power) return [power];
  return c.specs.filter((x) => !/HZ$/.test(x)).slice(0, 1);
}

// Marca y primeras palabras del modelo respetando el orden en que se escribieron
// (para artículos sin tipo conocido: "VOLANTE LOGITECH G923")
function brandAndModelInOrder(c, nModel) {
  const m = c.model.slice(0, nModel);
  if (!c.brand) return m;
  const pos = Math.min(c.brandPos, m.length);
  return [...m.slice(0, pos), c.brand, ...m.slice(pos)];
}

function variantsOf(c, impliedType) {
  const v = [];
  const specAll = c.specs;
  const specMain = mainSpecs(c);
  const modelCore = c.model.slice(0, 3);
  const modelTwo = c.model.slice(0, 2);
  const type = c.type;
  void impliedType;

  if (c.primary) {
    // GPU / CPU / teléfono
    const brand = /^IPHONE/.test(c.primary) ? "" : c.brand;          // iPhone ya implica Apple
    if (isPhone(c)) {
      v.push({ kind: "balanced", text: J([brand, c.primary, ...specMain]) });
      v.push({ kind: "minimal",  text: J([c.primary, ...specMain]) });
      v.push({ kind: "full",     text: J([brand, c.primary, ...specAll]) });
      v.push({ kind: "primary",  text: J([c.primary]) });
    } else if (isCpu(c)) {
      v.push({ kind: "balanced", text: J([c.primary, ...c.model.slice(0, 1)]) });
      v.push({ kind: "primary",  text: J([c.primary]) });
      v.push({ kind: "brandfirst", text: J([brand, c.primary]) });
      v.push({ kind: "full",     text: J([c.primary, ...c.model]) });
    } else {
      v.push({ kind: "balanced", text: J([c.primary, ...specMain, brand, ...modelCore]) });
      v.push({ kind: "minimal",  text: J([c.primary, ...specMain, brand]) });
      v.push({ kind: "brandfirst", text: J([brand, c.primary, ...specMain]) });
      v.push({ kind: "line",     text: J([c.primary, brand, ...modelTwo]) });
      v.push({ kind: "full",     text: J([c.primary, ...specAll, brand, ...c.model, ...c.fillers.filter((f) => f === "OC")]) });
      v.push({ kind: "primary",  text: J([c.primary, ...specMain]) });
    }
  } else if (type) {
    // Piezas con tipo: "TIPO MARCA MODELO CLASIFICACIÓN ESPECIFICACIÓN REVISIÓN"
    v.push({ kind: "balanced",  text: J([type, c.brand, ...modelCore, ...c.ratings.slice(0, 1), ...specMain, ...c.rev.slice(0, 1)]) });
    v.push({ kind: "notype",    text: J([c.brand, ...modelCore, ...c.ratings.slice(0, 1), ...specMain, ...c.rev.slice(0, 1)]) });
    v.push({ kind: "minimal",   text: J([c.brand, ...modelTwo, ...specMain]) });
    v.push({ kind: "specfirst", text: J([type, ...specMain, c.brand, ...modelTwo, ...c.ratings.slice(0, 1)]) });
    v.push({ kind: "full",      text: J([type, c.brand, ...c.model, ...c.ratings, ...specAll, ...c.rev]) });
    v.push({ kind: "short",     text: J([type, c.brand, ...modelTwo, ...specMain]) });
  } else {
    // Sin tipo conocido: se conserva el orden original ("VOLANTE LOGITECH G923")
    v.push({ kind: "balanced", text: J([...brandAndModelInOrder(c, 4), ...c.ratings.slice(0, 1), ...specMain, ...c.rev.slice(0, 1)]) });
    v.push({ kind: "short",    text: J([...brandAndModelInOrder(c, 2), ...specMain]) });
    v.push({ kind: "minimal",  text: J([...brandAndModelInOrder(c, 1), ...specMain]) });
    v.push({ kind: "full",     text: J([...brandAndModelInOrder(c, 8), ...c.ratings, ...specAll, ...c.rev]) });
  }
  return v;
}

// Tipos implícitos por categoría: si la categoría ya dice "FUENTES DE PODER", el nombre no necesita "FUENTE"
function impliedTypeOf(category) {
  const c = stripAccents(String(category ?? "")).toUpperCase();
  if (/FUENTE/.test(c)) return "FUENTE";
  if (/MEMORIA|RAM/.test(c)) return "RAM";
  if (/BOARD|PLACA/.test(c)) return "BOARD";
  if (/DISIPADOR|REFRIGERA/.test(c)) return "DISIPADOR";
  if (/AUDIFONO/.test(c)) return "AUDIFONOS";
  return "";
}

const KIND_WEIGHT = {
  balanced: 3, notype: 2.6, primary: 1.6, brandfirst: 1.4, minimal: 2.2, short: 2.4,
  specfirst: 1.2, line: 1.5, full: 2.4,
};

function cap(s, max) {
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const i = cut.lastIndexOf(" ");
  return (i > 8 ? cut.slice(0, i) : s.slice(0, max)).trim();
}

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * @param {string} typed        nombre escrito por el admin
 * @param {{category?: string, titles?: string[], max?: number}} opts
 * @returns {{text: string, len: number, source: "nombre"|"google"}[]}
 */
export function suggestNames(typed, { category = "", titles = [], max = 5 } = {}) {
  const typedKey = normalize(typed);
  if (typedKey.length <= 18) return [];                     // ya es corto: no hay nada que mejorar
  const base = classify(typed);
  if (!base) return [];
  const implied = impliedTypeOf(category);
  const typedTokens = new Set(typedKey.split(" ").filter((t) => !NOISE.has(t)));

  const pool = new Map(); // texto -> { score, source }
  const add = (text, weight, source) => {
    const t = cap(text, 60);
    if (!t || t.length < 4 || t === typedKey) return;
    const words = t.split(" ");
    if (words.some((w, i) => i > 0 && w === words[i - 1])) return;      // sin palabras repetidas seguidas
    const cur = pool.get(t);
    pool.set(t, { score: weight + (cur ? cur.score : 0) + 0.2, source: cur ? cur.source : source });
  };

  const lengthAdjust = (t) => {
    let a = 0;
    if (t.length > 40) a -= (t.length - 40) * 0.15;
    if (t.length < 14) a -= (14 - t.length) * 0.2;
    return a;
  };

  // a) variantes del nombre escrito
  for (const v of variantsOf(base, implied)) {
    let w = (KIND_WEIGHT[v.kind] ?? 1) + 1.5;
    if (implied && base.type === implied && (v.kind === "notype" || v.kind === "minimal")) w += 1.2;
    if (implied && base.type === implied && v.kind === "balanced") w -= 0.4;
    add(v.text, w + lengthAdjust(v.text), "nombre");
  }

  // b) variantes de los títulos de Google: solo si son del mismo producto que lo escrito
  for (const title of titles) {
    const c = classify(cleanTitle(title));
    if (!c) continue;
    if (base.brand && c.brand && base.brand !== c.brand) continue;       // otra marca: otro producto
    if (base.primary && c.primary && base.primary !== c.primary) continue; // otro modelo de GPU/CPU
    for (const v of variantsOf({ ...c, type: c.type || base.type, brand: c.brand || base.brand }, implied)) {
      if (v.kind === "full") continue;                                   // los títulos completos son lo largo que se quiere evitar
      const tokens = v.text.split(" ");
      const overlap = tokens.filter((t) => typedTokens.has(t)).length / Math.max(1, typedTokens.size);
      if (overlap < 0.5) continue;
      let w = (KIND_WEIGHT[v.kind] ?? 1) * 0.6 + overlap;
      if (implied && c.type === implied && (v.kind === "notype" || v.kind === "minimal")) w += 0.8;
      // un título que completa el nombre con modelo/especificación nuevos vale más que repetirlo
      const novel = tokens.filter((t) => !typedTokens.has(t)).length;
      w += Math.min(novel, 2) * 0.5;
      add(v.text, w + lengthAdjust(v.text), "google");
    }
  }

  const ranked = [...pool.entries()]
    .map(([text, info]) => ({ text, score: info.score, source: info.source }))
    .sort((a, b) => b.score - a.score);

  const picked = [];
  for (const r of ranked) {
    // descarta versiones casi iguales a una ya elegida (prefijo con ≤3 caracteres de diferencia)
    if (picked.some((p) => p.text.startsWith(r.text + " ") && p.text.length - r.text.length <= 3)) continue;
    if (picked.some((p) => r.text.startsWith(p.text + " ") && r.text.length - p.text.length <= 3)) continue;
    picked.push(r);
    if (picked.length >= max) break;
  }
  return picked.map(({ text, source }) => ({ text, len: text.length, source }));
}

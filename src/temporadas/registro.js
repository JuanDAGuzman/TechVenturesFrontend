// Temporadas del sitio (Navidad, etc.).
//
// Cada temporada vive en su propia carpeta (src/temporadas/<nombre>/) con sus estilos, efectos y recursos, y
// se activa solo mientras está encendida. Fuera de temporada no se descarga nada de ella.
//
// Cómo se decide cuál está activa (en este orden):
//   1. ?temporada=navidad en la dirección: vista previa (se recuerda en la pestaña). ?temporada=ninguna la apaga.
//   2. El ajuste "Temporada del sitio" del panel de administración (clave site_season):
//        "auto"    -> se activa sola dentro de la ventana de fechas de cada temporada (opción por defecto)
//        "navidad" -> siempre encendida
//        "ninguna" -> siempre apagada
//
// Para agregar otra temporada: crear su carpeta y una entrada en TEMPORADAS.

export const TEMPORADAS = {
  navidad: {
    nombre: "Navidad",
    // Del 1 de diciembre al 6 de enero (mes, día)
    ventana: { desde: [12, 1], hasta: [1, 6] },

    // Encabezado de la portada: dragón con gorro en lugar del logo, y titular alterno
    heroImagen: { src: "/temporadas/navidad/dragon-gorro.webp", ancho: 760, alto: 757 },
    heroPalabras: ["Hardware", "con", "historia", "para", "regalar."],

    // Textos de temporada
    franja: "Temporada navideña: estrena en diciembre, envíos a todo el país.",
    franjaCorta: "Navidad: envíos a todo el país",   // pantallas pequeñas
    pie: "Felices fiestas de parte de TechVenturesCO.",
    saludoCopia: "🎄 ¡Felices fiestas! 🎁",

    // Efectos y estilos (se descargan solo cuando la temporada está activa)
    cargar: () => import("./navidad/Capa.jsx"),
  },
};

export const OPCIONES_TEMPORADA = [
  { valor: "auto", etiqueta: "Automática (según la fecha)" },
  { valor: "navidad", etiqueta: "Navidad (siempre encendida)" },
  { valor: "ninguna", etiqueta: "Ninguna (apagada)" },
];

function enVentana(def, fecha) {
  const [dm, dd] = def.ventana.desde;
  const [hm, hd] = def.ventana.hasta;
  const actual = (fecha.getMonth() + 1) * 100 + fecha.getDate();
  const desde = dm * 100 + dd;
  const hasta = hm * 100 + hd;
  // Si la ventana cruza el fin de año (12-01 -> 01-06), es "después de desde" o "antes de hasta"
  return desde <= hasta ? actual >= desde && actual <= hasta : actual >= desde || actual <= hasta;
}

// Devuelve el id de la temporada activa o null. valor: "auto" | id de temporada | "ninguna" | undefined
export function resolverTemporada(valor, fecha = new Date()) {
  if (valor && valor !== "auto") return TEMPORADAS[valor] ? valor : null;
  return Object.keys(TEMPORADAS).find((id) => enVentana(TEMPORADAS[id], fecha)) ?? null;
}

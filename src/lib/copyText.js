// Copia texto al portapapeles y avisa si de verdad se copió.
//
// navigator.clipboard.writeText puede fallar sin ruido (p. ej. al volver de otra app a la pestaña, el documento
// "no tiene el foco"): el portapapeles se queda con lo último que se copió y parece que el botón trae lo de antes.
// Si eso pasa se prueba el método clásico (textarea + execCommand). Devuelve true solo si se copió.

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* se prueba el método alterno */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

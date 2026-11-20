// Estado de la temporada activa. Ver registro.js para las reglas.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { TEMPORADAS, resolverTemporada } from "./registro.js";

const API = (
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API ??
  window.__API_BASE__ ??
  "http://localhost:4000/api"
).replace(/\/+$/, "");

const Ctx = createContext({ temporada: null, def: null, activa: null });
export const useSeason = () => useContext(Ctx);

// Vista previa: ?temporada=navidad (se recuerda mientras dure la pestaña)
function leerVistaPrevia() {
  try {
    const q = new URLSearchParams(window.location.search).get("temporada");
    if (q) sessionStorage.setItem("temporada_vista_previa", q);
    return sessionStorage.getItem("temporada_vista_previa");
  } catch {
    return null;
  }
}

// Último ajuste conocido: evita un parpadeo al cargar si la temporada está apagada desde el admin
function leerAjusteGuardado() {
  try {
    return localStorage.getItem("site_season") || "auto";
  } catch {
    return "auto";
  }
}

export function SeasonProvider({ children }) {
  const { pathname } = useLocation();
  const [ajuste, setAjuste] = useState(leerAjusteGuardado);
  const [vistaPrevia] = useState(leerVistaPrevia);

  useEffect(() => {
    let cancelado = false;
    fetch(`${API}/catalog/settings`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelado || !d?.ok) return;
        const valor = d.settings?.site_season || "auto";
        setAjuste(valor);
        try { localStorage.setItem("site_season", valor); } catch { /* sin almacenamiento */ }
      })
      .catch(() => {});
    return () => { cancelado = true; };
  }, []);

  const value = useMemo(() => {
    const global = resolverTemporada(vistaPrevia || ajuste);
    // El panel de administración no lleva efectos de temporada (temporada/def); `activa` sí indica cuál está en curso
    // (el admin la usa, por ejemplo, para el saludo de las listas copiadas)
    const id = pathname.startsWith("/admin") ? null : global;
    return { temporada: id, def: id ? TEMPORADAS[id] : null, activa: global ? TEMPORADAS[global] : null };
  }, [ajuste, vistaPrevia, pathname]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

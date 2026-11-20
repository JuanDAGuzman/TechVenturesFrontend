// Franja de temporada sobre el navbar. Se puede cerrar (se recuerda mientras dure la pestaña).
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Snowflake, X } from "lucide-react";
import { useSeason } from "./SeasonContext.jsx";

export default function SeasonStrip() {
  const { def } = useSeason();
  const { pathname } = useLocation();
  const [cerrada, setCerrada] = useState(() => {
    try { return sessionStorage.getItem("franja_temporada_cerrada") === "1"; } catch { return false; }
  });
  if (!def?.franja || cerrada) return null;

  const cerrar = () => {
    setCerrada(true);
    try { sessionStorage.setItem("franja_temporada_cerrada", "1"); } catch { /* sin almacenamiento */ }
  };
  const irAOfertas = () => {
    const destino = document.getElementById("ofertas") || document.getElementById("catalogo");
    destino?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative bg-slate-900 text-white">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-9 flex items-center gap-2.5 text-[12px] sm:text-[13px]">
        <Snowflake className="w-4 h-4 shrink-0 text-rose-300" aria-hidden="true" />
        <span className="truncate flex-1 min-w-0 sm:hidden">{def.franjaCorta ?? def.franja}</span>
        <span className="truncate flex-1 min-w-0 hidden sm:inline">{def.franja}</span>
        {pathname === "/" && (
          <button
            type="button"
            onClick={irAOfertas}
            className="shrink-0 font-bold uppercase tracking-wide text-[11px] underline underline-offset-4 decoration-rose-300 hover:text-rose-200 transition-colors"
          >
            Ver ofertas
          </button>
        )}
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar aviso"
          className="shrink-0 -mr-1 w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Cinta navideña de 3 px */}
      <div
        className="absolute bottom-0 inset-x-0 h-[3px]"
        aria-hidden="true"
        style={{ background: "repeating-linear-gradient(135deg, #c62828 0 10px, #ffffff 10px 20px, #2e7d32 20px 30px, #ffffff 30px 40px)" }}
      />
    </div>
  );
}

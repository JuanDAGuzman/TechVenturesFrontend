// Descarga y monta los efectos de la temporada activa (nieve, estilos...). Si no hay temporada, no hace nada.
import { useEffect, useState } from "react";
import { useSeason } from "./SeasonContext.jsx";

export default function CapaTemporada() {
  const { def } = useSeason();
  const [Capa, setCapa] = useState(null);

  useEffect(() => {
    let cancelado = false;
    setCapa(null);
    if (def?.cargar) {
      def.cargar()
        .then((m) => { if (!cancelado) setCapa(() => m.default); })
        .catch(() => {}); // si falla la descarga, el sitio sigue normal
    }
    return () => { cancelado = true; };
  }, [def]);

  return Capa ? <Capa /> : null;
}

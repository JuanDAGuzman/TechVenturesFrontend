// Efectos de Navidad. Solo se descarga mientras la temporada está activa.
// Los detalles (gorro del logo, guirnalda) los dibuja navidad.css sobre los elementos que ya existen en la página.
import "./navidad.css";
import Nieve from "./Nieve.jsx";

export default function CapaNavidad() {
  return <Nieve />;
}

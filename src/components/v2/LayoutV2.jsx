import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavbarV2 from "./NavbarV2";
import FooterV2 from "./FooterV2";
import { useSeason } from "../../temporadas/SeasonContext.jsx";
import SeasonStrip from "../../temporadas/SeasonStrip.jsx";
import CapaTemporada from "../../temporadas/CapaTemporada.jsx";

export default function LayoutV2() {
    const { pathname } = useLocation();
    const { temporada } = useSeason();   // null fuera de temporada
    // Los modales se montan en <body>, fuera de este contenedor: la clase "atelier"
    // también va en el body para que hereden esquinas y sombras de la identidad.
    useEffect(() => {
        document.body.classList.add("atelier");
        return () => document.body.classList.remove("atelier");
    }, []);

    // El panel de administración no necesita el footer público
    const isAdmin = pathname.startsWith("/admin");

    // overflow-x: clip (no hidden) para no romper los elementos sticky.
    // La clase "atelier" activa la normalización de esquinas/sombras de index.css.
    return (
        <div
            className={`atelier min-h-screen flex flex-col font-sans text-slate-900 selection:bg-brand-indigo selection:text-white relative w-full ${temporada ? `season-${temporada}` : ""}`}
            style={{ overflowX: "clip", background: "#f6f7f9" }}
        >
            <SeasonStrip />
            <NavbarV2 />
            <CapaTemporada />
            <main className="flex-1 flex flex-col relative z-10 w-full min-w-0">
                <Outlet />
            </main>
            {!isAdmin && <FooterV2 />}
        </div>
    );
}

import { Outlet, useLocation } from "react-router-dom";
import NavbarV2 from "./NavbarV2";
import FooterV2 from "./FooterV2";
import AnimatedBackground from "./AnimatedBackground";

export default function LayoutV2() {
    const { pathname } = useLocation();
    // El catálogo usa el fondo plano y sobrio de la nueva identidad;
    // el resto de páginas conserva el fondo animado.
    const isCatalog = pathname === "/";

    // overflow-x: clip (no hidden) para no romper los elementos sticky
    return (
        <div
            className={`min-h-screen flex flex-col font-sans text-slate-900 selection:bg-brand-indigo selection:text-white relative w-full ${isCatalog ? "" : "bg-slate-50"}`}
            style={{ overflowX: "clip", ...(isCatalog ? { background: "#f6f7f9" } : {}) }}
        >
            {!isCatalog && <AnimatedBackground />}
            <NavbarV2 />
            <main className="flex-1 flex flex-col relative z-10 w-full min-w-0">
                <Outlet />
            </main>
            <FooterV2 />
        </div>
    );
}

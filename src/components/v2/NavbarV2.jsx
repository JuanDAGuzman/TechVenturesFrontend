import { Link, useLocation } from "react-router-dom";

export default function NavbarV2() {
    const location = useLocation();
    const isCatalogo = location.pathname === "/";
    const isContact  = location.pathname === "/contact";
    const hideNav    = isContact;

    const linkCls = (active) =>
        `relative pb-1 text-sm font-bold transition-colors border-b-2 ${
            active
                ? "text-slate-900 border-brand-indigo"
                : "text-slate-700 border-transparent hover:text-slate-900"
        }`;

    return (
        <header
            className="sticky top-0 z-50 w-full border-b border-slate-300 backdrop-blur"
            style={{ background: "rgba(246,247,249,0.92)" }}
        >
            <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16 sm:h-[72px]">
                    <Link
                        to="/"
                        className={`flex items-center gap-3 ${isCatalogo ? "cursor-default pointer-events-none" : ""}`}
                    >
                        <img
                            src="/logo-mark.png"
                            alt="TechVenturesCO"
                            className="h-10 w-10 sm:h-11 sm:w-11 object-contain"
                            style={{ mixBlendMode: "multiply" }}
                        />
                        <div className="flex flex-col leading-none">
                            <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-slate-900">
                                TechVentures<span className="text-brand-indigo">CO</span>
                            </span>
                            <span className="mt-1 font-mono text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
                                {isCatalogo ? "Tu aliado en tecnología" : "Agenda tu cita"}
                            </span>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-5 sm:gap-7">
                        {!hideNav && (
                            <Link to="/" className={linkCls(isCatalogo)}>Catálogo</Link>
                        )}
                        <Link to="/contact" className={linkCls(isContact)}>Contacto</Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}

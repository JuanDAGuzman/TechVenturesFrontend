import { Outlet } from "react-router-dom";
import NavbarV2 from "./NavbarV2";
import FooterV2 from "./FooterV2";
import Snowfall from "./Snowfall";
import AnimatedBackground from "./AnimatedBackground";

export default function LayoutV2() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-christmas-red selection:text-white relative">
            <AnimatedBackground />
            <Snowfall />
            <NavbarV2 />
            <main className="flex-1 flex flex-col relative z-10">
                <Outlet />
            </main>
            <FooterV2 />
        </div>
    );
}

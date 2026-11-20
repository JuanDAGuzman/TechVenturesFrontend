import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import CatalogoV2 from "./pages/v2/CatalogoV2.jsx";
import LayoutV2 from "./components/v2/LayoutV2.jsx";
import { SiteThemeProvider } from "./lib/SiteThemeContext.jsx";

// Solo el catálogo (la página de entrada) va en el paquete inicial. El resto se descarga al visitarlo.
const BookingV2 = lazy(() => import("./pages/v2/BookingV2.jsx"));
const WarrantyV2 = lazy(() => import("./pages/v2/WarrantyV2.jsx"));
const AdminGate = lazy(() => import("./pages/AdminGate.jsx"));
const AdminCatalogoGate = lazy(() => import("./pages/AdminCatalogoGate.jsx"));
const AdminMetricsGate = lazy(() => import("./pages/AdminMetricsGate.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));

export default function App() {
  return (
    <SiteThemeProvider>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-[60vh]" aria-hidden="true" />}>
        <Routes>
          <Route element={<LayoutV2 />}>
            <Route path="/" element={<CatalogoV2 />} />
            <Route path="/agendar" element={<BookingV2 />} />
            <Route path="/garantia" element={<WarrantyV2 />} />
            <Route path="/admin" element={<AdminGate />} />
            <Route path="/admin/catalogo" element={<AdminCatalogoGate />} />
            <Route path="/admin/metricas" element={<AdminMetricsGate />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
    </SiteThemeProvider>
  );
}

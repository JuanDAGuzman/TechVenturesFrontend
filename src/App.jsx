import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import BookingV2 from "./pages/v2/BookingV2.jsx";
import CatalogoV2 from "./pages/v2/CatalogoV2.jsx";
import AdminGate from "./pages/AdminGate.jsx";
import AdminCatalogoGate from "./pages/AdminCatalogoGate.jsx";
import Contact from "./pages/Contact.jsx";
import LayoutV2 from "./components/v2/LayoutV2.jsx";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LayoutV2 />}>
          <Route path="/" element={<CatalogoV2 />} />
          <Route path="/agendar" element={<BookingV2 />} />
          <Route path="/admin" element={<AdminGate />} />
          <Route path="/admin/catalogo" element={<AdminCatalogoGate />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Booking from "./pages/Booking.jsx";
import AdminGate from "./pages/AdminGate.jsx";

export default function App() {
  return (
    <BrowserRouter>
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="container-page flex items-center justify-between py-3">
          <Link to="/" className="font-extrabold text-lg text-[var(--brand)]">
            TechVenturesCO
          </Link>
          <nav className="flex gap-2">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
            >
              Agendar
            </Link>
            <Link
              to="/admin"
              className="px-3 py-1.5 rounded-lg text-white bg-[var(--brand)] hover:bg-[var(--brand-hover)]"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Rutas */}
      <main>
        <Routes>
          <Route path="/" element={<Booking />} />
          <Route path="/admin" element={<AdminGate />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

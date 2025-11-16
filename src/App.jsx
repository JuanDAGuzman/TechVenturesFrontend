import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { motion } from "framer-motion";
import Booking from "./pages/Booking.jsx";
import AdminGate from "./pages/AdminGate.jsx";
import Footer from "./components/Footer.jsx";

function Header() {
  const location = useLocation();
  const isBooking = location.pathname === "/";
  const isAdmin = location.pathname === "/admin";

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="relative bg-white sticky top-0 z-50 shadow-lg border-b-2 border-slate-100"
    >
      <div className="container-page">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-3 transition-all"
          >
            <motion.div
              className="relative"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6, type: "spring" }}
            >
              {/* Resplandor de fondo */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img
                src="/TECHVENT.png"
                alt="TechVenturesCO"
                className="relative w-12 h-12 rounded-xl shadow-md"
              />
            </motion.div>

            <div className="flex flex-col">
              <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight">
                TechVenturesCO
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Agenda tu cita
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex gap-3">
            <Link
              to="/"
              className={`relative px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                isBooking
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span className="relative z-10">📅 Agendar</span>
            </Link>

            <Link
              to="/admin"
              className={`relative px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                isAdmin
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
              }`}
            >
              <span className="relative z-10">🛠️ Admin</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Bottom gradient border decorativo */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
    </motion.header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Booking />} />
            <Route path="/admin" element={<AdminGate />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

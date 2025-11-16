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
      className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 sticky top-0 z-50 shadow-xl"
    >
      {/* Overlay para glassmorphism */}
      <div className="absolute inset-0 backdrop-blur-md bg-white/10"></div>

      <div className="container-page relative">
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
              <div className="absolute inset-0 bg-white/20 rounded-xl blur-md"></div>
              <img
                src="/TECHVENT.png"
                alt="TechVenturesCO"
                className="relative w-12 h-12 rounded-xl shadow-lg"
              />
            </motion.div>

            <div className="flex flex-col">
              <span className="font-extrabold text-xl text-white tracking-tight">
                TechVenturesCO
              </span>
              <span className="text-xs text-white/80 font-medium">
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
                  ? "bg-white text-indigo-600 shadow-lg shadow-white/30"
                  : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20"
              }`}
            >
              <span className="relative z-10">📅 Agendar</span>
              {isBooking && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-xl"
                  style={{ zIndex: 0 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>

            <Link
              to="/admin"
              className={`relative px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                isAdmin
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/50"
                  : "bg-slate-800/90 text-white hover:bg-slate-900 backdrop-blur-sm border border-slate-700"
              }`}
            >
              <span className="relative z-10">🛠️ Admin</span>
              {isAdmin && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-slate-900 rounded-xl"
                  style={{ zIndex: 0 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          </nav>
        </div>
      </div>

      {/* Bottom gradient border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600"></div>
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

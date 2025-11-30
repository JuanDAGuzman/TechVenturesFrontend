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
import Contact from "./pages/Contact.jsx";
import Footer from "./components/Footer.jsx";

function Header() {
  const location = useLocation();
  const isBooking = location.pathname === "/";
  const isAdmin = location.pathname === "/admin";
  const isContact = location.pathname === "/contact";

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="relative bg-white sticky top-0 z-50 shadow-md border-b border-slate-200"
    >
      <div className="container-page">
        <div className="flex items-center justify-between py-2">
          {/* Logo */}
          {isContact ? (
            <div className="flex items-center gap-2.5 transition-all cursor-default">
              <motion.img
                src="/TECHVENT.png"
                alt="TechVenturesCO"
                className="w-10 h-10 rounded-lg"
              />

              <div className="flex flex-col">
                <span className="font-extrabold text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight leading-tight">
                  TechVenturesCO
                </span>
                <span className="text-xs text-slate-500 font-medium leading-tight">
                  Agenda tu cita
                </span>
              </div>
            </div>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-2.5 transition-all"
            >
              <motion.img
                src="/TECHVENT.png"
                alt="TechVenturesCO"
                className="w-10 h-10 rounded-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, type: "spring" }}
              />

              <div className="flex flex-col">
                <span className="font-extrabold text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight leading-tight">
                  TechVenturesCO
                </span>
                <span className="text-xs text-slate-500 font-medium leading-tight">
                  Agenda tu cita
                </span>
              </div>
            </Link>
          )}

          {/* Navigation - Hidden on Contact page */}
          {!isContact && (
            <nav className="flex gap-2.5">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${isBooking
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
              >
                📅 Agendar
              </Link>

              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${isAdmin
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/30"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                  }`}
              >
                🛠️ Admin
              </Link>
            </nav>
          )}
        </div>
      </div>

      {/* Bottom gradient border decorativo */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
    </motion.header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Booking />} />
            <Route path="/admin" element={<AdminGate />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

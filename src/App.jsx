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
      className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/80"
    >
      <div className="container-page flex items-center justify-between py-4">
        <Link
          to="/"
          className="font-extrabold text-xl text-[var(--brand)] hover:opacity-80 transition flex items-center gap-2"
        >
          <motion.img
            src="/techvent.png"
            alt="TechVenturesCO"
            className="w-18 h-12"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          />
          TechVenturesCO
        </Link>

        <nav className="flex gap-3">
          <Link
            to="/"
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isBooking
                ? "bg-[var(--brand)] text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Agendar
          </Link>
          <Link
            to="/admin"
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isAdmin
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-800 text-white hover:bg-slate-900"
            }`}
          >
            Admin
          </Link>
        </nav>
      </div>
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

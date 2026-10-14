import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import AdminCatalogo from "./AdminCatalogo.jsx";
import AdminBar from "../components/admin/AdminBar.jsx";
import {
  getAdminToken,
  getAdminRemaining,
  clearAdminSession,
} from "../lib/adminSession.js";

export default function AdminCatalogoGate() {
  const [status, setStatus]       = useState("checking");
  const [remaining, setRemaining] = useState(getAdminRemaining());

  useEffect(() => {
    const t    = getAdminToken();
    const left = getAdminRemaining();
    setStatus(t && left > 0 ? "ready" : "need_login");
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const id = setInterval(() => {
      const left = getAdminRemaining();
      setRemaining(left);
      if (left <= 0) {
        clearAdminSession();
        setStatus("need_login");
      }
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  if (status === "checking")   return null;
  if (status === "need_login") return <Navigate to="/admin" replace />;

  return (
    <div>
      <AdminBar active="catalogo" remaining={remaining} />
      <AdminCatalogo />
    </div>
  );
}

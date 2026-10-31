import { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router";
import { getUserId, LOGOUT_EVENT } from "../../api/client";

// Ochrona tras: bez zalogowania każda strona wewnątrz przenosi na /logowanie.
export default function RequireAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const onLogout = () => navigate("/logowanie", { replace: true });
    window.addEventListener(LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(LOGOUT_EVENT, onLogout);
  }, [navigate]);

  if (!getUserId()) return <Navigate to="/logowanie" replace />;
  return <Outlet />;
}

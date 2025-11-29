import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export const AdminRoute = () => {
  const { user, isAuthenticated } = useAuthStore();

  // 1. Si no está logueado, al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Verificamos permisos específicos
  const tipo = user?.tipoUsuario;
  const area = user?.areaGestion;

  const tienePermiso = 
    tipo === "ADMIN" || 
    (tipo === "GESTOR" && (area === "EVENTOS" || area === "ADMINISTRADOR"));

  // 3. Si está logueado pero es de "FINANZAS" (u otro), lo mandamos al Home
  if (!tienePermiso) {
    return <Navigate to="/" replace />;
  }

  // 4. Si tiene permiso, lo dejamos pasar
  return <Outlet />;
};
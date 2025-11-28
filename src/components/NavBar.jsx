import { Link, useNavigate } from "react-router-dom";
import { Ticket } from "lucide-react";
import SearchBar from "./SearchBar";
import Button from "./ui/Button";
import { useAuthStore } from "../store/useAuthStore";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Nombre para mostrar en el navbar
  const displayName =
    user?.nombre ||
    user?.nombreUser ||
    (user?.correo ? user.correo.split("@")[0] : "Usuario");

    const tipo = user?.tipoUsuario;

    const showAdminPanel = tipo === "GESTOR" || tipo === "ADMIN";
    const showProductorPanel = tipo === "PRODUCTOR";

  // Clase común para TODOS los enlaces del menú (Garantiza uniformidad)
  const linkClass = "text-sm transition hover:text-primary cursor-pointer";

  return (
    <header className="border-b border-zinc-800 bg-background-dark text-zinc-100">
      <div className="relative flex h-16 items-center justify-between px-4 md:px-10">
        {/* Logo + links izquierda */}
        <div className="flex items-center gap-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Tikea</h1>
          </Link>

          {/* Navegación principal */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="#" className={linkClass}>
              Explorar Eventos
            </Link>
            
            <Link
              to="/registrarProductor"
              className={linkClass}
            >
              Colabora con nosotros
            </Link>

            {/* ENLACE CONDICIONAL: Administración */}
            {showAdminPanel && (
              <>
                <Link to="/admin/validar-locales" className={linkClass}>
                  Validar Locales
                </Link>
                <Link to="/admin/validar-eventos" className={linkClass}>
                  Validar Eventos
                </Link>
              </>
            )}

            {showProductorPanel && (
                <Link to="/registrarEvento" className={linkClass}>
                  Crear Evento
                </Link>
            )}
          </nav>
        </div>

        {/* Buscador centrado */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block w-full max-w-md">
          <SearchBar />
        </div>

        {/* Zona derecha: auth */}
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* Nombre usuario */}
              <span className="hidden sm:inline text-subtle">
                Hola,{" "}
                <span className="text-zinc-100 font-medium">{displayName}</span>
              </span>

              {/* Editar perfil */}
              <Link to="/user/configprofile">
                <Button className="text-xs px-3 py-1.5">Mi cuenta</Button>
              </Link>

              {/* Cerrar sesión */}
              <Button
                variant="gray"
                onClick={handleLogout}
                className="text-xs px-3 py-1.5"
              >
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button className="text-xs px-3 py-1.5">Iniciar Sesión</Button>
              </Link>
              <Link to="/signup">
                <Button className="text-xs px-3 py-1.5">Registrarse</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
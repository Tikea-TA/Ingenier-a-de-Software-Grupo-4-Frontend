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

  // Lógica para mostrar el botón de administración
  const showAdminLocales = user?.areaGestion === "EVENTOS" || user?.areaGestion === "ADMINISTRADOR";

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
            <Link to="#" className="text-sm transition hover:text-primary">
              Explorar Eventos
            </Link>
            
            <Link
              to="/registrarProductor"
              className="text-sm transition hover:text-primary"
            >
              Colabora con nosotros
            </Link>

            {/* ENLACE CONDICIONAL: Administración */}
            {showAdminLocales && (
              <>
                <Link
                  to="/admin/validar-locales"
                  className="text-sm transition hover:text-primary"
                >
                  Administración locales
                </Link>
                
                <Link 
                  to="/admin/validar-eventos" 
                  className="text-sm transition hover:text-primary"
                >
                  Validar Eventos
                </Link>
              </>
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
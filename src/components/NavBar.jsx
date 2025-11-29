import { Link, useNavigate } from "react-router-dom";
import { Ticket, ShoppingCart } from "lucide-react";
import SearchBar from "./SearchBar";
import Button from "./ui/Button";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const itemsCount = useCartStore((s) => (s.items || []).reduce((a, b) => a + (b.quantity || 1), 0));

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const displayName =
    user?.nombre ||
    user?.nombreUser ||
    (user?.correo ? user.correo.split("@")[0] : "Usuario");

  const tipo = user?.tipoUsuario;
  const area = user?.areaGestion;

  // Lógica de permisos (Idéntica a la del AdminRoute para coherencia visual)
  const showAdminPanel = 
    tipo === "ADMIN" || 
    (tipo === "GESTOR" && (area === "EVENTOS" || area === "ADMINISTRADOR"));
    
  const showProductorPanel = tipo === "PRODUCTOR";

  const linkClass = "text-sm transition hover:text-primary cursor-pointer whitespace-nowrap";

  return (
    <header className="border-b border-zinc-800 bg-background-dark text-zinc-100 sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 gap-4">
        
        {/* IZQUIERDA: Logo + Navegación */}
        <div className="flex items-center gap-8 shrink-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Ticket className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Tikea</h1>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            <Link to="/eventos" className={linkClass}>
              Explorar Eventos
            </Link>

            {showProductorPanel ? (
              <Link to="/test-productor-6" className={linkClass}>
                Mis Eventos
              </Link>
            ) : (
              // Solo mostramos "Colabora" si NO es admin/gestor para limpiar la vista
              !showAdminPanel && (
                <Link to="/registrarProductor" className={linkClass}>
                  Colabora con nosotros
                </Link>
              )
            )}

            {/* Panel de Administración */}
            {showAdminPanel && (
              <>
                <Link to="/admin/validar-locales" className={linkClass}>
                  Validar Locales
                </Link>
                <Link to="/admin/validar-eventos" className={linkClass}>
                  Validar Eventos
                </Link>
                <Link to="/admin/validar-productores" className={linkClass}>
                  Validar Productores
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* CENTRO: Buscador (Ahora es flexible, no absoluto) */}
        {/* 'flex-1' hace que ocupe el espacio sobrante, 'max-w-md' evita que sea gigante */}
        <div className="hidden md:flex flex-1 justify-center max-w-md mx-4">
          <div className="w-full">
             <SearchBar />
          </div>
        </div>

        {/* DERECHA: Carrito y Auth */}
        <nav className="flex items-center gap-4 shrink-0">
          {user?.tipoUsuario !== "PRODUCTOR" && user?.tipoUsuario !== "GESTOR" && (
            <Link to="/resumen-compra" className="relative">
              <Button className="text-xs px-3 py-1.5 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                {itemsCount > 0 && (
                  <span className="absolute -top-1 -right-2 inline-flex items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-white">
                    {itemsCount}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <span className="hidden xl:inline text-subtle text-sm">
                Hola, <span className="text-zinc-100 font-medium">{displayName}</span>
              </span>

              <Link to="/user/configprofile">
                <Button className="text-xs px-3 py-1.5 whitespace-nowrap">Mi cuenta</Button>
              </Link>

              <Button
                variant="gray"
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 whitespace-nowrap"
              >
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button className="text-xs px-3 py-1.5 whitespace-nowrap">Ingresar</Button>
              </Link>
              <Link to="/signup">
                <Button className="text-xs px-3 py-1.5 whitespace-nowrap">Registro</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
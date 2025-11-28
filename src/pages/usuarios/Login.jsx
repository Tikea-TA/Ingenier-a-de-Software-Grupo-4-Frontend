import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { loginCliente } from "../../api/clienteService";
import { loginProductor } from "../../api/productorService";
import { loginGestor } from "../../api/gestorService";

// Validación
import Validation from "../../components/usuarios/LoginValidation";

// Iconos
import { Mail, Lock, User, Briefcase, Key, Eye, EyeOff, Ticket } from "lucide-react";
import Button from "../../components/ui/Button";

const LOGIN_IMAGE = "/concertLogin.webp";

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [userType, setUserType] = useState("CLIENTE");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (apiError) setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    // Validación de formato (frontend)
    const validationErrors = Validation(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      const payload = { correo: formData.email, password: formData.password };
      let data;
      
      // Llamadas a la API según el tipo
      if (userType === "CLIENTE") {
        data = await loginCliente(payload);
      } else if (userType === "PRODUCTOR") {
        data = await loginProductor(payload);
      } else if (userType === "GESTOR") {
        data = await loginGestor(payload);
      }

      // Validar si la cuenta está inactiva
      if (data?.estado && String(data.estado).toUpperCase() === "INACTIVO") {
        setApiError("Tu cuenta se encuentra inactiva. Contáctanos.");
        return;
      }

      // Login exitoso
      if (data) {
        login(data, userType);
        
        // Redirección inteligente
        if (userType === "ADMIN" || userType === "GESTOR") {
          navigate("/admin/validar-eventos");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Credenciales incorrectas o usuario no encontrado.";
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background-dark text-white font-body overflow-hidden">
      
      {/* 1. SECCIÓN IZQUIERDA: FORMULARIO */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center px-6 py-12 relative z-10">
        
        {/* --- HEADER SIMPLE (Estilo Signup) --- */}
        <header className="mb-8 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <Ticket className="h-10 w-10 text-primary" />
            <span className="text-4xl font-semibold tracking-tight text-white">
              Tikea
            </span>
        </header>

        {/* CAJA CONTENEDORA */}
        <div className="w-full max-w-md p-8 rounded-2xl bg-slate-950 border border-white/10 shadow-2xl space-y-8">
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Ingresa a tu cuenta para continuar
            </p>
          </div>

          {/* Selector de Tipo de Usuario */}
          <div className="bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800 flex gap-1 shadow-inner backdrop-blur-sm">
            {[
              { id: "CLIENTE", label: "Cliente", icon: User },
              { id: "PRODUCTOR", label: "Prod.", icon: Briefcase },
              { id: "GESTOR", label: "Gestor", icon: Key },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setUserType(type.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200
                  ${
                    userType === type.id
                      ? "bg-primary text-white shadow-lg shadow-indigo-500/20"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  }
                `}
              >
                <type.icon size={14} strokeWidth={2.5} />
                {type.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* Input Correo */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 ml-1">
                CORREO ELECTRÓNICO
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  className={`block w-full pl-10 pr-3 py-3 bg-zinc-900/50 border rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all sm:text-sm
                    ${errors.email ? "border-red-500/50 focus:border-red-500" : "border-zinc-800 focus:border-primary"}
                  `}
                  name="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 ml-1 animate-pulse">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Input Contraseña */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 ml-1">
                CONTRASEÑA
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  className={`block w-full pl-10 pr-12 py-3 bg-zinc-900/50 border rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all sm:text-sm
                    ${errors.password ? "border-red-500/50 focus:border-red-500" : "border-zinc-800 focus:border-primary"}
                  `}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 ml-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Error de API */}
            {apiError && (
              <div className="animate-in fade-in slide-in-from-top-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500 shrink-0"></div>
                <p className="text-sm text-red-400">{apiError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3.5 text-sm font-bold tracking-wide uppercase shadow-lg shadow-indigo-900/20"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Ingresar"}
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-zinc-500">
              ¿Aún no tienes una cuenta?{" "}
              <Link
                to="/signup"
                className="font-semibold text-primary hover:text-indigo-400 transition-colors"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN DERECHA: IMAGEN */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900/30 mix-blend-multiply z-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-20 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-background-dark/40 to-transparent z-20 pointer-events-none"></div>

        <img
          src={LOGIN_IMAGE}
          alt="Concierto"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />

        <div className="relative z-30 p-12 text-center max-w-lg">
          <h2 className="text-4xl font-bold mb-6 tracking-tight text-white drop-shadow-2xl">
            Tu acceso a los mejores eventos
          </h2>
          <p className="text-lg text-zinc-100 drop-shadow-lg font-medium">
            Gestiona, produce o disfruta. Todo en un solo lugar con Tikea.
          </p>
        </div>
      </div>
    </div>
  );
};
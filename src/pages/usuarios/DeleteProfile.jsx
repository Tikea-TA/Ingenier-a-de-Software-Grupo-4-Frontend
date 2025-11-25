import { useState } from "react";
import { TriangleAlert, Ticket, History, UserMinus } from "lucide-react";
import { Heading, Text } from "@radix-ui/themes";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../store/useAuthStore";
import { eliminarCliente } from "../../api/clienteService";
import { useNavigate } from "react-router-dom";
import { enviarMailTexto } from "../../api/mailService";

export const DeleteProfile = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleCancel = () => {
    navigate("/config-profile");
  };

  const handleDelete = async () => {
    setApiError("");

    if (!user) {
      setApiError("No se encontró la sesión del usuario.");
      return;
    }

    // Confirmación simple
    if (!password.trim()) {
      setApiError(
        "Por favor ingresa tu contraseña para confirmar la eliminación."
      );
      return;
    }

    try {
      setIsDeleting(true);

      const id = user.id || user.idCliente;
      if (!id) {
        setApiError(
          "No se encontró el identificador del cliente en la sesión."
        );
        setIsDeleting(false);
        return;
      }

      await eliminarCliente(id);

      // Correo de confirmación de baja
      try {
        await enviarMailTexto({
          to: user.correo,
          subject: "Tu cuenta en Tikea ha sido desactivada",
          body: "Hola, tu cuenta ha sido desactivada correctamente. Si no realizaste esta acción, contáctanos de inmediato.",
        });
      } catch (mailErr) {
        console.warn("No se pudo enviar correo de baja:", mailErr);
      }

      // Cerrar sesión local (el usuario quedó INACTIVO en back)
      logout();

      // Redirigir al inicio
      navigate("/");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        "No se pudo eliminar la cuenta. Inténtalo nuevamente.";
      setApiError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="flex h-full items-center justify-center bg-background-dark text-text px-6">
      <div className="w-full max-w-2xl">
        <section className="rounded-2xl bg-slate-950/95 p-10 md:p-12 ring-1 ring-zinc-800 shadow-2xl space-y-8">
          {/* Encabezado */}
          <header className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-amber-400/20 p-4">
              <TriangleAlert size={40} className="text-amber-400" />
            </div>
            <Heading size="8" className="text-white font-semibold">
              Eliminar tu cuenta
            </Heading>
            <Text className="text-zinc-400 max-w-md">
              Esta acción desactivará tu cuenta y no podrás acceder nuevamente
              con tus credenciales. Por favor, lee atentamente las consecuencias
              antes de continuar.
            </Text>
          </header>

          {/* Consecuencias */}
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg bg-slate-900/80 p-4 items-center">
              <Ticket size={32} className="text-primary" />
              <div className="flex flex-col">
                <Text className="font-medium text-white">
                  Pérdida de acceso a tus entradas
                </Text>
                <Text size="2" className="text-subtle">
                  No podrás gestionar tus entradas asociadas a esta cuenta desde
                  la plataforma.
                </Text>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg bg-slate-900/80 p-4 items-center">
              <History size={32} className="text-primary" />
              <div className="flex flex-col">
                <Text className="font-medium text-white">
                  Historial inaccesible
                </Text>
                <Text size="2" className="text-subtle">
                  Tu historial de compras dejará de estar disponible para
                  consulta desde tu cuenta.
                </Text>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg bg-slate-900/80 p-4 items-center">
              <UserMinus size={32} className="text-primary" />
              <div className="flex flex-col">
                <Text className="font-medium text-white">
                  Desactivación de datos personales
                </Text>
                <Text size="2" className="text-subtle">
                  Tus datos serán desactivados según las políticas de la
                  plataforma.
                </Text>
              </div>
            </div>
          </div>

          {/* Confirmación */}
          <div className="space-y-3 border-t border-zinc-800 pt-6">
            <Text className="text-zinc-300">
              Para confirmar que entiendes las consecuencias y deseas continuar,
              ingresa tu contraseña actual.
            </Text>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-3 rounded-xl px-4 py-3 mb-1 text-base placeholder:text-muted ring-1 focus:outline-none focus:ring-2 focus:ring-primary transition-all bg-slate-950/90"
            />
            {apiError && (
              <p className="text-sm text-red-400 mt-1">{apiError}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-between pt-2">
            <Button type="button" onClick={handleCancel} className="px-4 py-2">
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting
                ? "Eliminando cuenta..."
                : "Eliminar mi cuenta permanentemente"}
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
};

import { useEffect, useState } from "react";
import { LoginLabel } from "../../components/usuarios/LoginLabel";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../store/useAuthStore";
import { actualizarCliente } from "../../api/clienteService";
import { Link } from "react-router-dom";

export const ConfigProfile = () => {
  const { user, updateUser } = useAuthStore();

  const [formData, setFormData] = useState({
    username: "",
    phonenumber: "",
    email: "",
    address: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  // Prefill con datos del usuario logueado
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.nombreUsuario || user.correo || "",
        phonenumber: user.telefono || "",
        email: user.correo || "",
        address: user.direccion || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    if (!user) {
      setApiError("No se encontró la sesión del usuario.");
      return;
    }

    // Validaciones básicas
    if (!formData.email.trim()) {
      setApiError("El correo es obligatorio.");
      return;
    }
    if (!formData.phonenumber.trim()) {
      setApiError("El teléfono es obligatorio.");
      return;
    }

    // Validar cambio de contraseña (opcional)
    const wantsPasswordChange =
      formData.newPassword || formData.confirmNewPassword;

    if (wantsPasswordChange) {
      if (!formData.newPassword || !formData.confirmNewPassword) {
        setApiError(
          "Para cambiar la contraseña completa ambos campos de nueva contraseña."
        );
        return;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        setApiError("La nueva contraseña y su confirmación no coinciden.");
        return;
      }
      if (formData.newPassword.length < 8) {
        setApiError("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }
    }

    try {
      setIsSaving(true);

      const id = user.id || user.idCliente;
      if (!id) {
        setApiError(
          "No se encontró el identificador del cliente en la sesión."
        );
        setIsSaving(false);
        return;
      }

      const updated = await actualizarCliente(id, formData);

      // sync estado global con lo que devuelva el back
      updateUser(updated);

      setApiSuccess("Perfil actualizado correctamente.");
      setFormData((prev) => ({
        ...prev,
        newPassword: "",
        confirmNewPassword: "",
      }));
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        "No se pudo actualizar el perfil. Inténtalo nuevamente.";
      setApiError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex h-full bg-background-dark">
      <div className="w-full h-full px-6 flex justify-center">
        <div className="w-full max-w-4xl py-10">
          <header className="text-4xl text-text mb-6">
            Modificar mi perfil
          </header>

          <form onSubmit={handleSubmit}>
            {/* Información personal */}
            <section className="rounded-2xl bg-slate-950/95 p-8 md:p-10 ring-1 shadow-2xl mb-6">
              <header className="text-text mb-4 text-xl">
                Información Personal
              </header>

              <div className="flex flex-col text-white/70 gap-4">
                {/* Nombres / Apellidos solo si existen en ClienteResponse */}
                {(user?.nombre || user?.apellidos) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <LoginLabel
                      type="text"
                      name="readonlyName"
                      label="Nombres"
                      value={user?.nombre || ""}
                      onChange={() => {}}
                      // evitamos edición hasta que el DTO lo soporte
                      required={false}
                    />
                    <LoginLabel
                      type="text"
                      name="readonlyLastname"
                      label="Apellidos"
                      value={user?.apellidos || ""}
                      onChange={() => {}}
                      required={false}
                    />
                  </div>
                )}

                {/* Username */}
                <LoginLabel
                  type="text"
                  name="username"
                  label="Nombre de usuario"
                  placeholder="Tu usuario en Tikea"
                  value={formData.username}
                  onChange={handleChange}
                />

                {/* Teléfono + Correo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LoginLabel
                    type="text"
                    name="phonenumber"
                    label="Teléfono"
                    placeholder="987654321"
                    value={formData.phonenumber}
                    onChange={handleChange}
                  />
                  <LoginLabel
                    type="email"
                    name="email"
                    label="Correo electrónico"
                    placeholder="tu@correo.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                {/* Dirección */}
                <LoginLabel
                  type="text"
                  name="address"
                  label="Dirección"
                  placeholder="Av. Universitaria 1081"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </section>

            {/* Cambiar contraseña */}
            <section className="rounded-2xl bg-slate-950/95 p-8 md:p-10 ring-1 shadow-2xl mb-4">
              <header className="text-text mb-4 text-xl">
                Cambiar Contraseña
              </header>
              <div className="flex flex-col text-white/70 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LoginLabel
                    type="password"
                    name="newPassword"
                    label="Nueva contraseña"
                    placeholder="********"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                  <LoginLabel
                    type="password"
                    name="confirmNewPassword"
                    label="Confirmar nueva contraseña"
                    placeholder="********"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  * Si no deseas cambiar tu contraseña, deja estos campos
                  vacíos.
                </p>
              </div>
            </section>

            <p className="mt-4 text-xs text-zinc-500">
              ¿Quieres desactivar tu cuenta?{" "}
              <Link
                to="/user/deleteProfile"
                className="text-red-500 hover:underline"
              >
                Eliminar mi cuenta
              </Link>
            </p>

            {/* Mensajes */}
            {apiError && (
              <p className="text-sm text-red-400 mb-2">{apiError}</p>
            )}
            {apiSuccess && (
              <p className="text-sm text-emerald-400 mb-2">{apiSuccess}</p>
            )}

            {/* Botón guardar */}
            <div className="flex justify-end p-2">
              <Button
                type="submit"
                className="flex h-12 min-w-40 items-center justify-center"
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

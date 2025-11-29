import { useEffect, useState } from "react";
import { obtenerLocalesPendientes, validarLocal, descargarDocumento } from "../../api/establecimientoService";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useAuthStore } from "../../store/useAuthStore";
import { CheckCircle, XCircle, FileDown, MapPin, Calendar } from "lucide-react";

export const ValidarLocales = () => {
  const { user } = useAuthStore(); // Obtenemos el usuario logueado
  const [locales, setLocales] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLocales = async () => {
    try {
      // Asumimos que user.idUsuario es el ID del Gestor. 
      // Si el login distingue roles, aquí podrías enviar null si es ADMIN para ver todos.
      const idGestor = user?.idUsuario; 
      
      const data = await obtenerLocalesPendientes(idGestor);
      setLocales(data);
    } catch (error) {
      console.error("Error cargando locales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocales();
  }, [user]); // Recargar si cambia el usuario

  const handleDecision = async (id, nombre, estado) => {
    // Usamos infinitivo para la pregunta ("aprobar")
    const accionPregunta = estado === "HABILITADO" ? "aprobar" : "rechazar";
    
    // Usamos participio para la confirmación ("aprobado")
    const accionConfirmacion = estado === "HABILITADO" ? "aprobado" : "rechazado";

    if (!window.confirm(`¿Estás seguro de que deseas ${accionPregunta} el establecimiento "${nombre}"?`)) return;

    try {
      await validarLocal(id, estado);
      
      // Actualizamos la lista visualmente
      setLocales(prev => prev.filter(l => l.idEstablecimiento !== id));
      
      // Mensaje mucho más natural y descriptivo
      alert(`¡Éxito! El establecimiento "${nombre}" ha sido ${accionConfirmacion} correctamente.`);
    } catch (error) {
      console.error(error);
      alert(`Hubo un error al intentar ${accionPregunta} el local. Por favor, inténtalo de nuevo.`);
    }
  };

  // Aseguramos que el fondo cubra toda la pantalla con min-h-screen y el color correcto
  return (
    <div className="min-h-screen bg-background-dark text-zinc-100 font-body">
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Validación de Locales</h1>
            <p className="text-zinc-400 text-sm">
              Revisa la documentación y aprueba los locales asignados a tu gestión.
            </p>
          </div>
          <Badge className="bg-primary/20 text-primary px-4 py-1 text-sm border border-primary/20">
            {loading ? "..." : `${locales.length} Pendientes`}
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-zinc-500 animate-pulse">
            Cargando solicitudes...
          </div>
        ) : (
          <div className="overflow-hidden bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-2xl backdrop-blur-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/50 text-zinc-400 uppercase font-semibold text-xs tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-5">Establecimiento</th>
                  <th className="px-6 py-5">Ubicación</th>
                  <th className="px-6 py-5">Documentación</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {locales.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-8 h-8 opacity-20" />
                        <p>No tienes locales pendientes de validación.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  locales.map((local) => (
                    <tr key={local.idEstablecimiento} className="group hover:bg-zinc-800/30 transition-colors duration-200">
                      {/* Info Principal */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white text-base">
                            {local.nombreEstablecimiento}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-zinc-800 text-zinc-400 text-[10px] px-1.5">
                              {local.tipo}
                            </Badge>
                            <span className="text-xs text-zinc-500">
                              Aforo: {local.capacidadMaxima}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Ubicación */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 text-zinc-400 max-w-[200px]">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-zinc-600 group-hover:text-primary transition-colors" />
                          <span className="truncate">{local.direccionEstablecimiento}</span>
                        </div>
                      </td>

                      {/* Documentación (Botón de Descarga) */}
                      <td className="px-6 py-4">
                        <Button
                          variant="gray"
                          onClick={() => descargarDocumento(local.idEstablecimiento, local.nombreEstablecimiento)}
                          className="text-xs gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 w-full sm:w-auto"
                        >
                          <FileDown className="w-4 h-4 text-blue-400" />
                          Descargar Sustento
                        </Button>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleDecision(local.idEstablecimiento, local.nombreEstablecimiento, "HABILITADO")}
                            className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20 transition-all shadow-lg hover:shadow-green-900/20"
                            title="Aprobar Local"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => handleDecision(local.idEstablecimiento, local.nombreEstablecimiento, "RECHAZADO")}
                            className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all shadow-lg hover:shadow-red-900/20"
                            title="Rechazar Local"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
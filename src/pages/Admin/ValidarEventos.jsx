import { useEffect, useState } from "react";
import { obtenerEventosPendientes, validarEvento, descargarDocumentoEvento } from "../../api/eventoService";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useAuthStore } from "../../store/useAuthStore";
import { CheckCircle, XCircle, FileDown, Calendar, MapPin, User, Music } from "lucide-react";

export const ValidarEventos = () => {
  const { user } = useAuthStore();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEventos = async () => {
    try {
      const idGestor = user?.idUsuario; 
      const data = await obtenerEventosPendientes(idGestor);
      setEventos(data);
    } catch (error) {
      console.error("Error cargando eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, [user]);

  const handleDecision = async (id, nombre, estado) => {
    const accionPregunta = estado === "PUBLICADO" ? "aprobar" : "rechazar";
    const accionConfirmacion = estado === "PUBLICADO" ? "aprobado" : "rechazado";

    if (!window.confirm(`¿Estás seguro de que deseas ${accionPregunta} el evento "${nombre}"?`)) return;

    try {
      await validarEvento(id, estado);
      setEventos(prev => prev.filter(e => e.idEvento !== id));
      alert(`¡Éxito! El evento "${nombre}" ha sido ${accionConfirmacion} correctamente.`);
    } catch (error) {
      console.error(error);
      alert(`Hubo un error al intentar ${accionPregunta} el evento.`);
    }
  };

  // Helper para formatear fecha
  const formatDate = (fechaStr) => {
    if (!fechaStr) return "Fecha por definir";
    return new Date(fechaStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background-dark text-zinc-100 font-body">
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Validación de Eventos</h1>
            <p className="text-zinc-400 text-sm">
              Revisa y aprueba los eventos solicitados por los productores.
            </p>
          </div>
          <Badge className="bg-primary/20 text-primary px-4 py-1 text-sm border border-primary/20">
            {loading ? "..." : `${eventos.length} Pendientes`}
          </Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-zinc-500 animate-pulse">
            Cargando eventos...
          </div>
        ) : (
          <div className="overflow-hidden bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-2xl backdrop-blur-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950/50 text-zinc-400 uppercase font-semibold text-xs tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-5">Evento</th>
                  <th className="px-6 py-5">Fecha y Lugar</th>
                  <th className="px-6 py-5">Productor</th>
                  <th className="px-6 py-5">Documentación</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {eventos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center gap-2">
                        <Music className="w-8 h-8 opacity-20" />
                        <p>No tienes eventos pendientes de validación.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  eventos.map((evt) => (
                    <tr key={evt.idEvento} className="group hover:bg-zinc-800/30 transition-colors duration-200">
                      
                      {/* Evento */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white text-base">
                            {evt.nombreEvento}
                          </span>
                          <span className="text-xs text-zinc-500 mt-1 bg-zinc-800 px-2 py-0.5 rounded w-fit">
                            {evt.categoria || "General"}
                          </span>
                        </div>
                      </td>

                      {/* Fecha y Lugar */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 text-zinc-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-primary" /> 
                            <span>{formatDate(evt.fecha)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-zinc-600" /> 
                            {/* Ajusta según tu DTO: puede ser evt.establecimiento.nombreEstablecimiento */}
                            <span className="truncate max-w-[180px]">
                                {evt.nombreEstablecimiento || (evt.establecimiento ? evt.establecimiento.nombreEstablecimiento : "Local N/A")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Productor */}
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2 text-zinc-300">
                            <User className="w-4 h-4 text-zinc-600" />
                            {/* Ajusta según tu DTO: evt.productor.nombre */}
                            <span>
                                {evt.nombreProductor || (evt.productor ? `${evt.productor.nombre} ${evt.productor.apellidos}` : "Productor")}
                            </span>
                         </div>
                      </td>

                      {/* Documentación */}
                      <td className="px-6 py-4">
                        <Button
                          variant="gray"
                          onClick={() => descargarDocumentoEvento(evt.idEvento, evt.nombreEvento)}
                          className="text-xs gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 w-full sm:w-auto"
                        >
                          <FileDown className="w-4 h-4 text-blue-400" />
                          Descargar
                        </Button>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-3">
                          <button
                            // Nota: Cambia "ACTIVO" por el valor de tu Enum para aprobado (ej. "APROBADO" o "ACTIVO")
                            onClick={() => handleDecision(evt.idEvento, evt.nombreEvento, "ACTIVO")} 
                            className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20 transition-all shadow-lg hover:shadow-green-900/20"
                            title="Aprobar Evento"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => handleDecision(evt.idEvento, evt.nombreEvento, "RECHAZADO")} // O "CANCELADO"
                            className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all shadow-lg hover:shadow-red-900/20"
                            title="Rechazar Evento"
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
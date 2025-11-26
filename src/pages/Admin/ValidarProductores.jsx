import { useEffect, useState } from "react";
import { obtenerProductoresPendientes, validarProductor, descargarDocumentoProductor } from "../../api/productorService";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useAuthStore } from "../../store/useAuthStore";
import { CheckCircle, XCircle, FileDown, User, Building, Mail, Phone } from "lucide-react";

export const ValidarProductores = () => {
  const { user } = useAuthStore();
  const [productores, setProductores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProductores = async () => {
    try {
      // Obtenemos el ID del gestor logueado
      const idGestor = user?.idProductor; 
      const data = await obtenerProductoresPendientes(idGestor);
      setProductores(data);
    } catch (error) {
      console.error("Error cargando productores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductores();
  }, [user]);

  const handleDecision = async (id, nombre, estado) => {
    const accionPregunta = estado === "HABILITADO" ? "aprobar" : "rechazar";
    const accionConfirmacion = estado === "HABILITADO" ? "aprobado" : "rechazado";

    if (!window.confirm(`¿Estás seguro de que deseas ${accionPregunta} al productor "${nombre}"?`)) return;

    try {
      await validarProductor(id, estado);
      setProductores(prev => prev.filter(p => p.idProductor !== id));
      alert(`¡Éxito! El productor "${nombre}" ha sido ${accionConfirmacion} correctamente.`);
    } catch (error) {
      console.error(error);
      alert(`Hubo un error al intentar ${accionPregunta} al productor.`);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark text-zinc-100 font-body">
      <div className="container mx-auto px-4 py-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Validación de Productores</h1>
            <p className="text-zinc-400 text-sm">
              Gestiona las solicitudes de registro asignadas a tu cuenta.
            </p>
          </div>
          <Badge className="bg-primary/20 text-primary px-4 py-1 text-sm border border-primary/20">
            {loading ? "..." : `${productores.length} Pendientes`}
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
                  <th className="px-6 py-5">Productor / Razón Social</th>
                  <th className="px-6 py-5">Contacto</th>
                  <th className="px-6 py-5">Identificación</th>
                  <th className="px-6 py-5">Documentación</th>
                  <th className="px-6 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {productores.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center gap-2">
                        <User className="w-8 h-8 opacity-20" />
                        <p>No tienes productores pendientes de validación.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  productores.map((prod) => (
                    <tr key={prod.idUsuario} className="group hover:bg-zinc-800/30 transition-colors duration-200">
                      
                      {/* Nombre y Razón Social */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white text-base">
                            {prod.razonSocial || `${prod.nombre} ${prod.apellidos}`}
                          </span>
                          {/* Si hay razón social, mostramos el nombre del representante abajo */}
                          {prod.razonSocial && (
                            <div className="flex items-center gap-1 mt-1 text-zinc-500 text-xs">
                                <User className="w-3 h-3" />
                                <span>Rep: {prod.nombre} {prod.apellidos}</span>
                            </div>
                          )}
                          {!prod.razonSocial && (
                             <span className="text-xs text-zinc-500 mt-1">Usuario: {prod.nombreUsuario}</span>
                          )}
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 text-zinc-400">
                          <div className="flex items-center gap-2 group-hover:text-zinc-300 transition-colors">
                            <Mail className="w-3.5 h-3.5 text-zinc-600" /> 
                            <span>{prod.correo}</span>
                          </div>
                          {prod.telefono && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-zinc-600" /> 
                                <span>{prod.telefono}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Identificación (RUC / DNI) */}
                      <td className="px-6 py-4">
                         {prod.ruc ? (
                             <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                RUC: {prod.ruc}
                             </Badge>
                         ) : (
                             <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700">
                                DNI: {prod.dni}
                             </Badge>
                         )}
                      </td>

                      {/* Documentación */}
                      <td className="px-6 py-4">
                        <Button
                          variant="gray"
                          onClick={() => descargarDocumentoProductor(prod.idProductor, prod.razonSocial || prod.nombre)}
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
                            onClick={() => handleDecision(prod.idProductor, prod.razonSocial || prod.nombre, "HABILITADO")}
                            className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20 transition-all shadow-lg hover:shadow-green-900/20"
                            title="Aprobar"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => handleDecision(prod.idProductor, prod.razonSocial || prod.nombre, "RECHAZADO")}
                            className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all shadow-lg hover:shadow-red-900/20"
                            title="Rechazar"
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
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { obtenerEvento } from "../../api/eventoService";
import { obtenerPrecioMinimoEvento } from "../../components/Evento/precioUtils";
import { obtenerEstablecimiento } from "../../api/establecimientoService";

export const DetalleEvento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetalles = async () => {
      try {
        const data = await obtenerEvento(id);
        
        // Enrich data similar to the list view
        let address = "Lugar por definir";
        let minPrice = 0;

        try {
           const idEstablecimiento = data.establecimiento?.idEstablecimiento || data.idEstablecimiento;
           if (idEstablecimiento) {
             const establecimiento = await obtenerEstablecimiento(idEstablecimiento);
             address = establecimiento.direccionEstablecimiento || establecimiento.nombreEstablecimiento || address;
             minPrice = await obtenerPrecioMinimoEvento(idEstablecimiento);
           }
        } catch (e) {
          console.error("Error fetching extra details", e);
        }

        setEvento({
          ...data,
          venue: address,
          price: minPrice,
          image: data.imagenUrl
        });

      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("No se pudo cargar la información del evento.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetalles();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-xl text-white">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <p className="mb-4 text-xl text-red-500">{error || "Evento no encontrado"}</p>
          <button 
            onClick={() => navigate(-1)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 text-sm text-zinc-400 hover:text-white"
        >
          &larr; Volver
        </button>

        <div className="overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/10">
          <img
            src={evento.image || `https://picsum.photos/seed/${evento.idEvento}/1200/600`}
            alt={evento.nombreEvento}
            className="h-64 w-full object-cover sm:h-80"
          />
          
          <div className="p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{evento.nombreEvento}</h1>
                <p className="mt-2 text-lg text-zinc-400">{evento.venue}</p>
                <p className="text-zinc-500">{evento.fecha} • {evento.horaInicio || "Hora por definir"}</p>
              </div>
              <div className="text-right">
                <span className="block text-sm text-zinc-400">Precio desde</span>
                <span className="text-2xl font-bold text-blue-400">S/. {evento.price}</span>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="md:col-span-2">
                <h2 className="mb-4 text-xl font-semibold text-white">Descripción</h2>
                <p className="text-zinc-300 leading-relaxed">
                  {evento.descripcion || "Este evento no tiene descripción disponible."}
                </p>
                
                <div className="mt-8">
                  <h3 className="mb-2 font-medium text-white">Categoría</h3>
                  <span className="inline-block rounded-full bg-slate-800 px-3 py-1 text-sm text-zinc-300">
                    {evento.categoria}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-800/50 p-6 ring-1 ring-white/5">
                <h3 className="mb-4 font-semibold text-white">Información</h3>
                <ul className="space-y-3 text-sm text-zinc-300">
                  <li className="flex justify-between">
                    <span>Estado:</span>
                    <span className="text-white">{evento.estado}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Aforo:</span>
                    <span className="text-white">{evento.aforoTotal || "N/A"}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { obtenerEvento, obtenerBanner } from "../../api/eventoService";
import { obtenerPrecioMinimoEvento } from "../../components/Evento/precioUtils";
import { obtenerEstablecimiento } from "../../api/establecimientoService";
import { listarPromocionesActivasPorEvento, eliminarPromocion } from "../../api/promocionService";

export const DetalleEvento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, nombre }

  useEffect(() => {
    const fetchDetalles = async () => {
      try {
        const data = await obtenerEvento(id);
        
        // Fetch promotions
        try {
          const promos = await listarPromocionesActivasPorEvento(id);
          console.log("Promociones obtenidas para el evento:", promos);
          setPromociones(promos || []);
        } catch (e) {
          console.error("Error fetching promotions", e);
        }
        
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

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const blob = await obtenerBanner(id);
        const url = URL.createObjectURL(blob);
        setBannerUrl(url);
      } catch (error) {
        console.error("Error fetching banner:", error);
        // Fallback handled in render
      }
    };

    if (id) {
      fetchBanner();
    }

    return () => {
      if (bannerUrl && bannerUrl.startsWith('blob:')) {
        URL.revokeObjectURL(bannerUrl);
      }
    };
  }, [id]);

  const handleDeletePromocion = async (promoId) => {
    try {
      await eliminarPromocion(promoId);
      // Refresh promotions list
      const promos = await listarPromocionesPorEvento(id);
      setPromociones(promos || []);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting promotion:", error);
      alert("Error al eliminar la promoción");
    }
  };

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
            src={bannerUrl || evento.image || `https://picsum.photos/seed/${evento.idEvento}/1200/600`}
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

            <div className="grid gap-8">
              <div>
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
                <h3 className="mb-4 text-xl font-semibold text-white">Información del Evento</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg bg-slate-900/50 p-4">
                    <span className="block text-sm text-zinc-400 mb-1">Estado</span>
                    <span className="text-lg font-medium text-white">{evento.estado}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-4">
                    <span className="block text-sm text-zinc-400 mb-1">Aforo Total</span>
                    <span className="text-lg font-medium text-white">{evento.aforoTotal || "N/A"}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-4">
                    <span className="block text-sm text-zinc-400 mb-1">Fecha</span>
                    <span className="text-lg font-medium text-white">{evento.fecha}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-4">
                    <span className="block text-sm text-zinc-400 mb-1">Hora</span>
                    <span className="text-lg font-medium text-white">{evento.horaInicio || "Por definir"}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-4">
                    <span className="block text-sm text-zinc-400 mb-1">Ubicación</span>
                    <span className="text-lg font-medium text-white">{evento.venue}</span>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-4">
                    <span className="block text-sm text-zinc-400 mb-1">Precio desde</span>
                    <span className="text-lg font-medium text-blue-400">S/. {evento.price}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-800/50 p-6 ring-1 ring-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Promociones</h3>
                  <button
                    onClick={() => navigate("/promocion/registrarPromocion", { state: { idEvento: id } })}
                    className="rounded bg-primary px-4 py-2 text-sm text-white hover:bg-primary-600 transition-colors"
                  >
                    + Nueva Promoción
                  </button>
                </div>
                
                {promociones.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {promociones.map((promo) => {
                      // Determine display value based on tipo
                      let displayValue = "";
                      if (promo.tipo === "DESCUENTO_PORCENTAJE") {
                        displayValue = `-${promo.valorDescuento}%`;
                      } else if (promo.tipo === "DESCUENTO_FIJO") {
                        displayValue = `-S/. ${promo.valorDescuento}`;
                      } else if (promo.tipo === "CUPON") {
                        displayValue = `Cupón`;
                      }

                      return (
                        <div key={promo.idPromocion} className="rounded-lg bg-blue-500/10 p-4 ring-1 ring-blue-500/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-blue-400">{promo.nombre}</span>
                            <span className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                              {displayValue}
                            </span>
                          </div>
                          {promo.descripcion && (
                            <p className="text-sm text-zinc-400 mb-3">{promo.descripcion}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/promocion/editar/${promo.idPromocion}`)}
                              className="flex-1 rounded bg-slate-700 px-3 py-1.5 text-xs text-white hover:bg-slate-600 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ id: promo.idPromocion, nombre: promo.nombre })}
                              className="flex-1 rounded bg-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600/30 transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 text-center py-8">
                    No hay promociones activas para este evento
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-slate-900 p-6 shadow-2xl ring-1 ring-white/10 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-2">Confirmar Eliminación</h3>
            <p className="text-zinc-400 mb-6">
              ¿Estás seguro de que deseas eliminar la promoción <span className="font-medium text-white">"{deleteConfirm.nombre}"</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeletePromocion(deleteConfirm.id)}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

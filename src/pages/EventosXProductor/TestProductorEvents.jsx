import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerEventosPorProductor } from "../../api/eventoService";
import { obtenerEstablecimiento } from "../../api/establecimientoService";
import { obtenerPrecioMinimoEvento } from "../../components/Evento/precioUtils";
import EventCardProd from "../../components/EventCardProd";

export const TestProductorEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await obtenerEventosPorProductor(6);
        console.log("Eventos obtenidos del backend:", data);

        // Fetch establishment details and zones for each event
        const eventsWithAddressAndPrice = await Promise.all(
          data.map(async (evt) => {
            let address = "Lugar por definir";
            let minPrice = 0;

            try {
              // Fetch Establishment
              const idEstablecimiento = evt.establecimiento?.idEstablecimiento || evt.idEstablecimiento;
              if (idEstablecimiento) {
                const establecimiento = await obtenerEstablecimiento(idEstablecimiento);
                // console.log(`Establecimiento obtenido para evento ${evt.idEvento}:`, establecimiento);
                address = establecimiento.direccionEstablecimiento || establecimiento.nombreEstablecimiento || address;
              } else if (evt.establecimiento?.direccionEstablecimiento) {
                address = evt.establecimiento.direccionEstablecimiento;
              }

              // Fetch Zones for Price using the new utility
              // Note: The utility uses establishment ID as per the new service logic requested.
              // If we wanted specific event zones, we'd need a different endpoint or logic.
              if (idEstablecimiento) {
                minPrice = await obtenerPrecioMinimoEvento(idEstablecimiento);
              }
              console.log(`Precio mínimo calculado para evento ${evt.idEvento}: ${minPrice}`);

            } catch (e) {
              console.error(`Error fetching details for event ${evt.idEvento}`, e);
            }

            return {
              id: evt.idEvento,
              title: evt.nombreEvento,
              image: evt.imagenUrl,
              badge: evt.estado,
              date: evt.fecha,
              venue: address,
              price: minPrice,
            };
          })
        );

        console.log("Eventos procesados con dirección y precio:", eventsWithAddressAndPrice);
        setEvents(eventsWithAddressAndPrice);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Error al cargar los eventos del productor.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-xl text-white">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">
            Eventos del Productor #20
          </h1>
          <button
            onClick={() => navigate('/registrarEvento')}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            + Registrar Nuevo Evento
          </button>
        </div>

        {events.length === 0 ? (
          <p className="text-zinc-400">No se encontraron eventos para este productor.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((event) => (
              <EventCardProd key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

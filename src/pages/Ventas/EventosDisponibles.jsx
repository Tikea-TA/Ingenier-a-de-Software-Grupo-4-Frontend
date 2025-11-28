import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heading, Text, Flex, Separator } from "@radix-ui/themes";
import { Search, Calendar, MapPin, Users } from "lucide-react";
import Button from "../../components/ui/Button";
import { obtenerEventosDisponibles } from "../../api/ticketService";
import { useCartStore } from "../../store/useCartStore";
import { obtenerBannerPorEvento } from "../../api/ticketService";

export const EventosDisponibles = () => {
  const navigate = useNavigate();
  const setEventInfo = useCartStore((state) => state.setEventInfo);
  const clearCart = useCartStore((state) => state.clearCart);

  const [eventos, setEventos] = useState([]);
  const [filteredEventos, setFilteredEventos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  // Cache local para banners ya cargados (performance ++)
  const bannerCache = useRef({});

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        setIsLoading(true);
        const data = await obtenerEventosDisponibles();

        if (!data) {
          setEventos([]);
          setFilteredEventos([]);
          return;
        }

        // 1. Mostrar eventos sin banners inmediatamente
        const eventosIniciales = data.map((e) => ({ ...e, banner: null }));
        setEventos(eventosIniciales);
        setFilteredEventos(eventosIniciales);

        // 2. Cargar banners en paralelo sin bloquear el render
        const eventosConBanners = await Promise.all(
          eventosIniciales.map(async (evento) => {
            if (bannerCache.current[evento.idEvento]) {
              return {
                ...evento,
                banner: bannerCache.current[evento.idEvento],
              };
            }

            try {
              const bannerUrl = await obtenerBannerPorEvento(evento.idEvento);

              // Guardar en cache
              bannerCache.current[evento.idEvento] = bannerUrl;

              return { ...evento, banner: bannerUrl };
            } catch (err) {
              console.warn(
                "Error cargando banner para evento",
                evento.idEvento
              );
              return { ...evento, banner: null };
            }
          })
        );

        setEventos(eventosConBanners);
        setFilteredEventos(eventosConBanners);
      } catch (err) {
        setError("No se pudieron cargar los eventos. Intenta nuevamente.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    cargarEventos();
  }, []);

  useEffect(() => {
    let filtered = eventos;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (evento) =>
          evento.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          evento.local?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por tipo
    if (tipoFiltro !== "todos") {
      filtered = filtered.filter(
        (evento) => evento.categoria?.toLowerCase() === tipoFiltro.toLowerCase()
      );
    }

    setFilteredEventos(filtered);
  }, [searchTerm, tipoFiltro, eventos]);

  const handleComprarEntradas = (evento) => {
    // No borrar el carrito al navegar entre eventos: permitir agregar entradas de distintos eventos
    setEventInfo(evento);
    navigate(`/comprar-entradas/${evento.idEvento}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <main className="min-h-screen bg-background-dark text-text">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-slate-950/50 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <Heading size="8" className="mb-2">
            Eventos Disponibles
          </Heading>
          <Text size="3" className="text-subtle">
            Descubre y compra entradas para tus eventos favoritos
          </Text>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Controles de búsqueda y filtro */}
        <div className="mb-8 space-y-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-3 pl-12 pr-4 text-text placeholder-zinc-500 outline-none transition-colors hover:border-zinc-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Filtro por tipo */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTipoFiltro("todos")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tipoFiltro === "todos"
                  ? "bg-primary text-white"
                  : "border border-zinc-700 text-text hover:border-primary"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTipoFiltro("concierto")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tipoFiltro === "concierto"
                  ? "bg-primary text-white"
                  : "border border-zinc-700 text-text hover:border-primary"
              }`}
            >
              Conciertos
            </button>
            <button
              onClick={() => setTipoFiltro("teatro")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tipoFiltro === "teatro"
                  ? "bg-primary text-white"
                  : "border border-zinc-700 text-text hover:border-primary"
              }`}
            >
              Teatro
            </button>
            <button
              onClick={() => setTipoFiltro("deporte")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tipoFiltro === "deporte"
                  ? "bg-primary text-white"
                  : "border border-zinc-700 text-text hover:border-primary"
              }`}
            >
              Deportes
            </button>
          </div>
        </div>

        <Separator my="4" size="4" />

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-primary"></div>
              <p className="mt-3 text-subtle">Cargando eventos...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-400">
            <p>{error}</p>
          </div>
        )}

        {/* Lista de eventos */}
        {!isLoading && !error && filteredEventos.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEventos.map((evento) => (
              <div
                key={evento.idEvento}
                className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-primary/10"
              >
                {/* Imagen del evento */}
                {evento.banner && (
                  <div className="aspect-video overflow-hidden bg-zinc-800">
                    <img
                      src={evento.banner}
                      alt={evento.nombreEvento}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Nombre del evento */}
                  <h3 className="text-lg font-semibold line-clamp-2">
                    {evento.nombreEvento}
                  </h3>

                  {/* Detalles */}
                  <div className="space-y-2 text-sm text-subtle">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <span className="line-clamp-2">
                        {evento.fecha}, {evento.horaInicio}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <span className="line-clamp-2">
                        {evento.establecimiento.nombreEstablecimiento}
                      </span>
                    </div>

                    {evento.aforoTotal && (
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        <span>Capacidad: {evento.aforoTotal}</span>
                      </div>
                    )}
                  </div>

                  {/* Precio */}
                  {evento.precioMinimo && (
                    <div className="pt-2 border-t border-zinc-800">
                      <p className="text-sm text-subtle">Desde</p>
                      <p className="text-xl font-bold text-primary">
                        S/ {evento.precioMinimo.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Botón de compra */}
                  <Button
                    onClick={() => handleComprarEntradas(evento)}
                    className="w-full mt-4"
                  >
                    Comprar Entradas
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!isLoading && !error && filteredEventos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-subtle mb-4">
              {searchTerm || tipoFiltro !== "todos"
                ? "No se encontraron eventos con esos criterios"
                : "No hay eventos disponibles en este momento"}
            </p>
            {(searchTerm || tipoFiltro !== "todos") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setTipoFiltro("todos");
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

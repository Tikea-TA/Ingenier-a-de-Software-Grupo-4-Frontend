import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heading, Text, Separator } from "@radix-ui/themes";
import { Ticket, Calendar, MapPin, Download, Eye } from "lucide-react";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../store/useAuthStore";
import { obtenerTicketsPorCliente } from "../../api/ticketService";

export const MisEntradas = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [entradas, setEntradas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todas");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const cargarEntradas = async () => {
      try {
        setIsLoading(true);
        const data = await obtenerTicketsPorCliente(user?.id);
        setEntradas(data || []);
      } catch (err) {
        setError("No se pudieron cargar tus entradas. Intenta nuevamente.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    cargarEntradas();
  }, [isAuthenticated, user?.id, navigate]);

  const entradasFiltradas = entradas.filter((entrada) => {
    if (filtro === "proximas") {
      return new Date(entrada.evento.fechaHora) > new Date();
    }
    if (filtro === "pasadas") {
      return new Date(entrada.evento.fechaHora) < new Date();
    }
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDescargarEntrada = (compraId) => {
    // En una aplicación real, esto descargaría el PDF de la entrada
    console.log("Descargar entrada:", compraId);
  };

  const handleVerDetalles = (compra) => {
    navigate(`/detalle-entrada/${compra.numeroCompra}`, {
      state: { compra },
    });
  };

  return (
    <main className="min-h-screen bg-background-dark text-text">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-slate-950/50 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3 mb-4">
            <Ticket className="h-8 w-8 text-primary" />
            <Heading size="8">Mis Entradas</Heading>
          </div>
          <Text size="3" className="text-subtle">
            Gestiona y descarga tus entradas adquiridas
          </Text>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Filtros */}
        <div className="mb-8 flex flex-wrap gap-2">
          {[
            { id: "todas", label: "Todas" },
            { id: "proximas", label: "Próximas" },
            { id: "pasadas", label: "Pasadas" },
          ].map((opcion) => (
            <button
              key={opcion.id}
              onClick={() => setFiltro(opcion.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filtro === opcion.id
                  ? "bg-primary text-white"
                  : "border border-zinc-700 text-text hover:border-primary"
              }`}
            >
              {opcion.label}
            </button>
          ))}
        </div>

        <Separator my="4" size="4" />

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-primary"></div>
              <p className="mt-3 text-subtle">Cargando tus entradas...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-400">
            <p>{error}</p>
          </div>
        )}

        {/* Lista de entradas (agrupadas por reserva) */}
        {!isLoading && !error && entradas.length > 0 && (
          <div className="space-y-4">
            {(() => {
              const groupByReserva = {};
              entradas.forEach((ticket) => {
                const reservaId = ticket.reservaId || ticket.idReserva || (ticket.reserva && (ticket.reserva.idReserva || ticket.reserva.id)) || "sin-reserva";
                if (!groupByReserva[reservaId]) groupByReserva[reservaId] = [];
                groupByReserva[reservaId].push(ticket);
              });

              const compras = Object.keys(groupByReserva).map((key) => {
                const tickets = groupByReserva[key];
                const primera = tickets[0] || {};
                const evento = primera.evento || primera.eventoResponse || primera.eventoVo || {};
                const montoTotal = tickets.reduce((s, t) => s + (t.precio || t.precioCompra || t.price || 0), 0);
                const asientos = tickets.map((t) => ({
                  numero: t.numeroAsiento || t.asiento?.numero || t.asientoNumero || t.asiento || t.numero || null,
                  tipoEntrada: t.tipoEntrada || t.tipo || t.tipoEntradaId || null,
                }));

                return {
                  numeroCompra: key,
                  reservaId: key,
                  evento: {
                    nombre: evento.nombre || evento.titulo || primera.eventName || primera.eventoNombre || "-",
                    fechaHora: evento.fechaHora || primera.fechaEvento || primera.eventDate || null,
                    local: evento.local || primera.local || primera.venue || "-",
                    banner: evento.banner || primera.banner || null,
                  },
                  montoTotal,
                  asientos,
                };
              });

              const comprasFiltradas = compras.filter((compra) => {
                if (filtro === "proximas") {
                  return new Date(compra.evento.fechaHora) > new Date();
                }
                if (filtro === "pasadas") {
                  return new Date(compra.evento.fechaHora) < new Date();
                }
                return true;
              });

              return comprasFiltradas.length > 0 ? (
                comprasFiltradas.map((compra) => {
                  const eventoProximo = new Date(compra.evento.fechaHora) > new Date();

                  return (
                    <div
                      key={compra.numeroCompra}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden hover:border-zinc-700 transition-colors"
                    >
                      <div className="md:flex">
                        {/* Imagen del evento */}
                        {compra.evento.banner && (
                          <div className="md:w-40 h-40 overflow-hidden">
                            <img
                              src={compra.evento.banner}
                              alt={compra.evento.nombre}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Contenido */}
                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            <div className="mb-3">
                              <h3 className="text-lg font-bold mb-1">
                                {compra.evento.nombre}
                              </h3>
                              <p className="text-sm text-subtle">
                                Compra #{compra.numeroCompra}
                              </p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 mb-4">
                              <div className="flex items-center gap-2 text-sm text-subtle">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>{formatDate(compra.evento.fechaHora)}</span>
                              </div>

                              <div className="flex items-center gap-2 text-sm text-subtle">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span>{compra.evento.local}</span>
                              </div>
                            </div>

                            {/* Detalle de entradas */}
                            <div className="mb-4 flex gap-4">
                              <div>
                                <p className="text-xs text-subtle">Cantidad</p>
                                <p className="font-bold text-primary">
                                  {compra.asientos.length} {compra.asientos.length === 1 ? "entrada" : "entradas"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-subtle">Total</p>
                                <p className="font-bold text-primary">
                                  S/ {compra.montoTotal.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {/* Estado */}
                            <div className="inline-block">
                              {eventoProximo ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400 border border-green-500/30">
                                  <span className="inline-block h-2 w-2 rounded-full bg-green-400"></span>
                                  Próximo
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/20 px-3 py-1 text-xs font-medium text-zinc-400 border border-zinc-500/30">
                                  <span className="inline-block h-2 w-2 rounded-full bg-zinc-400"></span>
                                  Pasado
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex md:flex-col gap-2 p-4 border-t md:border-t-0 md:border-l border-zinc-800">
                          <Button
                            onClick={() => handleVerDetalles(compra)}
                            variant="outline"
                            className="gap-2 flex-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden md:inline">Ver</span>
                          </Button>

                          <Button
                            onClick={() => handleDescargarEntrada(compra.numeroCompra)}
                            variant="outline"
                            className="gap-2 flex-1"
                          >
                            <Download className="h-4 w-4" />
                            <span className="hidden md:inline">Descargar</span>
                          </Button>
                        </div>
                      </div>

                      {/* Listado de asientos */}
                      {compra.asientos && compra.asientos.length > 0 && (
                        <div className="border-t border-zinc-800 px-6 py-3 bg-zinc-800/30">
                          <p className="text-xs text-subtle mb-2">Asientos</p>
                          <div className="flex flex-wrap gap-2">
                            {compra.asientos.map((asiento, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30"
                              >
                                {asiento.numero || asiento}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <p className="text-subtle">No tienes entradas con el filtro seleccionado.</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Sin entradas */}
        {!isLoading && !error && entradas.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              {filtro === "pasadas"
                ? "No tienes entradas pasadas"
                : filtro === "proximas"
                  ? "No tienes entradas próximas"
                  : "No has comprado entradas aún"}
            </p>
            <p className="text-subtle mb-6">
              {filtro === "todas"
                ? "Comienza comprando entradas para tus eventos favoritos"
                : "Prueba con otro filtro"}
            </p>
            <Button onClick={() => navigate("/eventos")}>
              Explorar eventos
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

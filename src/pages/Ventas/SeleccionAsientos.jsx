import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heading, Text, Flex, Separator } from "@radix-ui/themes";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import Button from "../../components/ui/Button";
import SeatMapSelector from "../../components/SeatMapSelector";
import TheaterZoneMapSelector from "../../components/TheaterZoneMapSelector";
import StadiumZoneMapSelector from "../../components/StadiumZoneMapSelector";
import {
  obtenerDetalleEvento,
  obtenerAsientosDisponibles,
} from "../../api/ticketService";
import { useCartStore } from "../../store/useCartStore";

export const SeleccionAsientos = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { addItem, setEventInfo, eventId: cartEventId } = useCartStore();

  const [evento, setEvento] = useState(null);
  const [tiposEntrada, setTiposEntrada] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedZones, setSelectedZones] = useState([]);
  const [seatQuantities, setSeatQuantities] = useState({});

  // Estado de mapa según tipo de local
  const [seatMapConfig, setSeatMapConfig] = useState(null);
  const [zoneMapType, setZoneMapType] = useState(null);
  const [asientosDisponibles, setAsientosDisponibles] = useState({});

  useEffect(() => {
    const cargarEvento = async () => {
      try {
        setIsLoading(true);
        const data = await obtenerDetalleEvento(eventId);
        setEvento(data);
        setEventInfo(data);

        // Extraer tipos de entrada
        if (data.tiposEntrada) {
          setTiposEntrada(data.tiposEntrada);
          const quantities = {};
          data.tiposEntrada.forEach((tipo) => {
            quantities[tipo.id] = 0;
          });
          setSeatQuantities(quantities);
        }

        // Cargar asientos disponibles
        const asientos = await obtenerAsientosDisponibles(eventId);
        setAsientosDisponibles(asientos);

        // Configurar mapa según tipo de local
        if (data.local?.tipoEspacio) {
          const tipoLocal = data.local.tipoEspacio.toLowerCase();
          if (tipoLocal === "auditorio") {
            setZoneMapType(null);
            if (data.local.mapaAsientos) {
              setSeatMapConfig(data.local.mapaAsientos);
            }
          } else if (tipoLocal === "teatro") {
            setZoneMapType("theater");
          } else if (tipoLocal === "estadio") {
            setZoneMapType("stadium");
          }
        }
      } catch (err) {
        setError("No se pudo cargar el evento. Intenta nuevamente.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    cargarEvento();
  }, [eventId, setEventInfo]);

  const handleSeatSelection = (seatCode, tipoEntradaId) => {
    const seatKey = `${seatCode}-${tipoEntradaId}`;
    setSelectedSeats((prev) => {
      if (prev.includes(seatKey)) {
        return prev.filter((s) => s !== seatKey);
      } else {
        return [...prev, seatKey];
      }
    });
  };

  const handleZoneSelection = (zonaId, tipoEntradaId) => {
    const zoneKey = `${zonaId}-${tipoEntradaId}`;
    setSelectedZones((prev) => {
      if (prev.includes(zoneKey)) {
        return prev.filter((z) => z !== zoneKey);
      } else {
        return [...prev, zoneKey];
      }
    });
  };

  const handleQuantityChange = (tipoEntradaId, delta) => {
    setSeatQuantities((prev) => ({
      ...prev,
      [tipoEntradaId]: Math.max(0, prev[tipoEntradaId] + delta),
    }));
  };

  const handleAddToCart = () => {
    let itemsAdded = 0;

    // Agregar asientos seleccionados
    selectedSeats.forEach((seatKey) => {
      const [seatCode, tipoEntradaId] = seatKey.split("-");
      const tipoEntrada = tiposEntrada.find((t) => t.id.toString() === tipoEntradaId);
      if (tipoEntrada) {
        addItem({
          type: "seat",
          seatCode,
          seatNumber: seatCode,
          eventId,
          tipoEntrada: tipoEntrada.nombre,
          tipoEntradaId,
          price: tipoEntrada.precio,
          quantity: 1,
        });
        itemsAdded++;
      }
    });

    // Agregar zonas seleccionadas
    selectedZones.forEach((zoneKey) => {
      const [zonaId, tipoEntradaId] = zoneKey.split("-");
      const tipoEntrada = tiposEntrada.find((t) => t.id.toString() === tipoEntradaId);
      const quantity = seatQuantities[tipoEntradaId] || 0;
      if (tipoEntrada && quantity > 0) {
        for (let i = 0; i < quantity; i++) {
          addItem({
            type: "zone",
            zoneId,
            zoneName: zonaId,
            eventId,
            tipoEntrada: tipoEntrada.nombre,
            tipoEntradaId,
            price: tipoEntrada.precio,
            quantity: 1,
          });
        }
        itemsAdded += quantity;
      }
    });

    if (itemsAdded > 0) {
      navigate("/resumen-compra");
    } else {
      setError("Debes seleccionar al menos una entrada");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background-dark text-text flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-primary"></div>
          <p className="mt-3 text-subtle">Cargando evento...</p>
        </div>
      </main>
    );
  }

  if (error || !evento) {
    return (
      <main className="min-h-screen bg-background-dark text-text">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Button
            variant="outline"
            onClick={() => navigate("/eventos")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-400">
            <p>{error || "No se pudo cargar el evento"}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-dark text-text">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-slate-950/50 py-8">
        <div className="mx-auto max-w-7xl px-4">
          <Button
            variant="outline"
            onClick={() => navigate("/eventos")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a eventos
          </Button>
          <Heading size="8" className="mb-2">
            {evento.nombre}
          </Heading>
          <Text size="3" className="text-subtle">
            Selecciona tus entradas
          </Text>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-400">
            <p>{error}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Mapa de asientos/zonas */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <Heading size="4">Mapa de Asientos</Heading>

              {zoneMapType === "theater" && evento.local?.zonasTeatro && (
                <TheaterZoneMapSelector
                  className="w-full"
                  initialState={evento.local.zonasTeatro}
                  onChange={(zones) => setSelectedZones(Object.keys(zones))}
                />
              )}

              {zoneMapType === "stadium" && evento.local?.zonasEstadio && (
                <StadiumZoneMapSelector
                  className="w-full"
                  initialState={evento.local.zonasEstadio}
                  onChange={(zones) => setSelectedZones(Object.keys(zones))}
                />
              )}

              {!zoneMapType && seatMapConfig && (
                <SeatMapSelector
                  className="w-full"
                  seatConfig={seatMapConfig}
                  initialRows={seatMapConfig.rows}
                  initialCols={seatMapConfig.cols}
                  initialBlocked={seatMapConfig.blocked || []}
                  onChange={(seats) =>
                    setSelectedSeats(
                      seats.map((s) => `${s.fila}-${s.columna}-general`)
                    )
                  }
                />
              )}
            </div>
          </div>

          {/* Resumen lateral */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sticky top-4">
              <Heading size="3" className="mb-4">
                Tus Entradas
              </Heading>

              {/* Selector de tipo de entrada y cantidad */}
              <div className="space-y-4 mb-6">
                {tiposEntrada.map((tipo) => (
                  <div key={tipo.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{tipo.nombre}</p>
                        <p className="text-xs text-subtle">{tipo.tipo}</p>
                      </div>
                      <p className="font-bold text-primary">S/ {tipo.precio.toFixed(2)}</p>
                    </div>

                    {/* Selector de cantidad para zonas */}
                    {zoneMapType && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(tipo.id, -1)}
                          disabled={seatQuantities[tipo.id] === 0}
                          className="rounded-lg border border-zinc-700 p-2 hover:bg-zinc-800 disabled:opacity-50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          type="number"
                          value={seatQuantities[tipo.id]}
                          onChange={(e) =>
                            setSeatQuantities((prev) => ({
                              ...prev,
                              [tipo.id]: Math.max(0, parseInt(e.target.value) || 0),
                            }))
                          }
                          className="w-12 rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-center text-sm"
                        />
                        <button
                          onClick={() => handleQuantityChange(tipo.id, 1)}
                          className="rounded-lg border border-zinc-700 p-2 hover:bg-zinc-800"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <Separator my="1" size="1" />
                  </div>
                ))}
              </div>

              {/* Total de entradas seleccionadas */}
              <div className="mb-6 rounded-lg bg-primary/10 p-3 border border-primary/30">
                <p className="text-sm text-subtle mb-1">Entradas seleccionadas</p>
                <p className="text-2xl font-bold text-primary">
                  {selectedSeats.length +
                    Object.values(seatQuantities).reduce((a, b) => a + b, 0)}
                </p>
              </div>

              {/* Botón de continuar */}
              <Button
                onClick={handleAddToCart}
                disabled={
                  selectedSeats.length === 0 &&
                  Object.values(seatQuantities).reduce((a, b) => a + b, 0) === 0
                }
                className="w-full"
              >
                Continuar
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSeats([]);
                  setSelectedZones([]);
                  setSeatQuantities(
                    Object.keys(seatQuantities).reduce(
                      (acc, key) => ({ ...acc, [key]: 0 }),
                      {}
                    )
                  );
                }}
                className="w-full mt-2"
              >
                Limpiar selección
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

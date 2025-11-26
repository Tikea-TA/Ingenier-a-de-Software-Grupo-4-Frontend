import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heading, Text, Flex, Separator } from "@radix-ui/themes";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import Button from "../../components/ui/Button";
import SeatMapSelector from "../../components/SeatMapSelector";
import TheaterZoneMapSelector from "../../components/TheaterZoneMapSelector";
import StadiumZoneMapSelector from "../../components/StadiumZoneMapSelector";
import {
  obtenerDetalleEvento,
  obtenerZonasPorEstablecimiento,
  obtenerAsientosPorZona,
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
  const [zonas, setZonas] = useState([]);
  const [activeZoneSelection, setActiveZoneSelection] = useState(null);

  const normalizeName = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  // Construir initialState esperado por los selectores: un map { zoneId: boolean }
  const theaterInitial = useMemo(() => {
    const keys = ["tribuna_oeste", "tribuna_este", "planta_baja", "escenario"];
    const map = {};
    keys.forEach((k) => {
      const match = zonas.find((z) => {
        const nameNorm = normalizeName(z.nombreZona || z.nombre || "");
        return (
          nameNorm === k ||
          String(z.idZona || z.id) === k ||
          nameNorm.includes(k)
        );
      });
      map[k] = !!match; // true = available, false = blocked/missing
    });
    return map;
  }, [zonas]);

  // Si el backend tiene zonas pero ninguna coincide con las claves del selector,
  // aplicar una heurística de respaldo: si solo hay una zona en backend, marcar
  // una clave por defecto como disponible para permitir selección.
  const finalTheaterInitial = useMemo(() => {
    const anyAvailable = Object.values(theaterInitial).some((v) => v === true);
    if (anyAvailable) return theaterInitial;
    if (zonas && zonas.length === 1) {
      // marcar 'planta_baja' como disponible por defecto
      return {
        tribuna_oeste: false,
        tribuna_este: false,
        planta_baja: true,
        escenario: false,
      };
    }
    return theaterInitial;
  }, [theaterInitial, zonas]);

  const stadiumInitial = useMemo(() => {
    const keys = [
      "zona_a",
      "zona_b",
      "zona_c",
      "zona_d",
      "zona_e",
      "zona_f",
      "oriente",
      "occidente",
      "norte",
    ];
    const map = {};
    keys.forEach((k) => {
      const match = zonas.find((z) => {
        const nameNorm = normalizeName(z.nombreZona || z.nombre || "");
        return (
          nameNorm === k ||
          String(z.idZona || z.id) === k ||
          nameNorm.includes(k.replace(/_/g, ""))
        );
      });
      map[k] = !!match;
    });
    return map;
  }, [zonas]);

  const finalStadiumInitial = useMemo(() => {
    const anyAvailable = Object.values(stadiumInitial).some((v) => v === true);
    if (anyAvailable) return stadiumInitial;
    if (zonas && zonas.length === 1) {
      // marcar 'zona_a' como disponible por defecto
      const fallback = {};
      Object.keys(stadiumInitial).forEach(
        (k) => (fallback[k] = k === "zona_a")
      );
      return fallback;
    }
    return stadiumInitial;
  }, [stadiumInitial, zonas]);

  // Mapa que asigna claves del selector (ej. 'planta_baja', 'zona_a') -> idBackend
  const zoneSelectorMap = useMemo(() => {
    const map = {};
    if (!zonas || zonas.length === 0) return map;

    const theaterKeys = ["tribuna_oeste", "tribuna_este", "planta_baja"];
    const stadiumKeys = [
      "zona_a",
      "zona_b",
      "zona_c",
      "zona_d",
      "zona_e",
      "zona_f",
      "oriente",
      "occidente",
      "norte",
    ];

    const keys = zoneMapType === "stadium" ? stadiumKeys : theaterKeys;

    // Inicializar
    keys.forEach((k) => (map[k] = undefined));

    // Intentar asignar por similitud/contención del nombre normalizado
    for (const z of zonas) {
      const nameNorm = normalizeName(z.nombreZona || z.nombre || "");
      for (const k of keys) {
        if (map[k]) continue; // ya asignado
        // comparaciones heurísticas
        if (nameNorm === k) {
          map[k] = z.idZona || z.id;
          break;
        }
        if (String(z.idZona || z.id) === k) {
          map[k] = z.idZona || z.id;
          break;
        }
        if (nameNorm.includes(k.replace(/_/g, "")) || k.includes(nameNorm)) {
          map[k] = z.idZona || z.id;
          break;
        }
        // casos concretos: VIP -> planta_baja (fallback heuristic)
        if (nameNorm === "vip" && keys.includes("planta_baja")) {
          map["planta_baja"] = z.idZona || z.id;
          break;
        }
      }
    }

    // Si no hay asignaciones y solo hay una zona, mapearla a la primera clave útil
    const anyAssigned = Object.values(map).some((v) => !!v);
    if (!anyAssigned && zonas.length === 1) {
      const firstId = zonas[0].idZona || zonas[0].id;
      const defaultKey = keys[0];
      map[defaultKey] = firstId;
    }

    return map;
  }, [zonas, zoneMapType]);

  const handleZonesChange = useCallback(
    async (payload) => {
      const selected = payload?.selected || [];
      if (!selected || selected.length === 0) {
        setSelectedZones([]);
        setActiveZoneSelection(null);
        return;
      }

      // Tomamos la primera zona seleccionada (el selector es exclusivo)
      const selectorZonaId = selected[0];

      // Intentar resolver mediante el map creado a partir de `zonas`
      const mappedId = zoneSelectorMap[selectorZonaId];
      let zonaBackendId = mappedId;

      // Si el mapa no resolvió, intentar encontrar por heurística (antigua lógica)
      if (!zonaBackendId) {
        const zonaObj = zonas.find((z) => {
          const nameNorm = normalizeName(z.nombreZona || z.nombre || "");
          return (
            nameNorm === selectorZonaId ||
            String(z.idZona || z.id) === selectorZonaId ||
            nameNorm.includes(selectorZonaId.replace(/_/g, ""))
          );
        });

        if (zonaObj) zonaBackendId = zonaObj.idZona || zonaObj.id;
      }

      // Fallback: si aún no hay resolución y solo hay una zona, usarla
      if (!zonaBackendId && zonas && zonas.length === 1) {
        zonaBackendId = zonas[0].idZona || zonas[0].id;
        console.debug(
          "Fallback (map) usando la única zona del backend",
          zonaBackendId
        );
      }

      if (!zonaBackendId) {
        console.warn(
          "No se encontró zona backend para selector",
          selectorZonaId,
          { selectorZonaId, zonas }
        );
        setSelectedZones([]);
        setActiveZoneSelection(null);
        return;
      }

      // Elegir un tipo de entrada por defecto si existe
      const tipoDefault =
        tiposEntrada && tiposEntrada.length > 0 && tiposEntrada[0].id
          ? tiposEntrada[0].id.toString()
          : null;

      const zoneKey = `${zonaBackendId}-${tipoDefault}`;
      setSelectedZones([zoneKey]);
      setActiveZoneSelection({
        zonaId: zonaBackendId,
        selectorId: selectorZonaId,
        tipoEntradaId: tipoDefault,
      });

      // Cargar asientos de la zona si no están
      try {
        if (!asientosDisponibles[zonaBackendId]) {
          const seats = await obtenerAsientosPorZona(zonaBackendId);

          // evitar duplicados por id o codigo
          const uniqueSeats = Array.from(
            new Map(
              seats.map((s) => [s.idAsiento || s.id || s.codigoAsiento, s])
            ).values()
          );

          setAsientosDisponibles((p) => ({
            ...p,
            [zonaBackendId]: uniqueSeats,
          }));
        }
      } catch (e) {
        console.error(
          "Error cargando asientos por zona desde handleZonesChange",
          e
        );
      }
    },
    [tiposEntrada, asientosDisponibles, zonas]
  );

  useEffect(() => {
    const cargarEvento = async () => {
      try {
        setIsLoading(true);
        const data = await obtenerDetalleEvento(eventId);
        setEvento(data);
        // setEventInfo viene del store
        try {
          setEventInfo && setEventInfo(data);
        } catch (_) {}

        // Extraer tipos de entrada
        if (data.tiposEntrada) {
          setTiposEntrada(data.tiposEntrada);
          const quantities = {};
          data.tiposEntrada.forEach((tipo) => {
            quantities[tipo.id] = 0;
          });
          setSeatQuantities(quantities);
        }

        // Cargar zonas del establecimiento asociado al evento
        const estabId =
          data.establecimiento?.idEstablecimiento ||
          data.establecimiento?.id ||
          null;
        if (estabId) {
          const zonasData = await obtenerZonasPorEstablecimiento(estabId);
          const zonasArr = Array.isArray(zonasData) ? zonasData : [];
          setZonas(zonasArr);

          // Si el evento no trae tipos de entrada, sintetizarlos a partir de las zonas
          // Esto ayuda cuando el backend modela precios por zona en lugar de tipos globales
          if ((!data.tiposEntrada || data.tiposEntrada.length === 0) && zonasArr.length > 0) {
            const synthesized = zonasArr.map((z) => ({
              id: z.idZona || z.id || `zona-${z.idEstablecimiento || Math.random()}`,
              nombre: z.nombreZona || z.nombre || `Zona ${z.idZona || z.id}`,
              precio: z.precio ?? 0,
              tipo: z.tipo || "GENERIC",
            }));
            setTiposEntrada(synthesized);
            const quantities = {};
            synthesized.forEach((tipo) => {
              quantities[tipo.id] = 0;
            });
            setSeatQuantities(quantities);
          }

          // Determinar tipo de mapa según tipos de zonas
          const tieneEnumerada = (zonasData || []).some((z) =>
            (z.tipo || "").toString().toUpperCase().includes("ENUMERADA")
          );
          const tieneLibre = (zonasData || []).some((z) =>
            (z.tipo || "").toString().toUpperCase().includes("LIBRE")
          );
          if (tieneEnumerada) setZoneMapType("theater");
          else if (tieneLibre) setZoneMapType("stadium");
          else setZoneMapType(null);
        }
      } catch (err) {
        setError("No se pudo cargar el evento. Intenta nuevamente.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    cargarEvento();
    // solo depende de eventId
  }, [eventId]);

  const handleSeatSelection = (seatId, seatLabel, tipoEntradaId, zonaId) => {
    setSelectedSeats((prev) => {
      const existsIndex = prev.findIndex(
        (s) =>
          String(s.id) === String(seatId) &&
          String(s.tipoEntradaId) === String(tipoEntradaId)
      );
      if (existsIndex >= 0) {
        return prev.filter((_, i) => i !== existsIndex);
      }
      return [...prev, { id: seatId, label: seatLabel, tipoEntradaId, zonaId }];
    });
  };

  const handleZoneSelection = (zonaId, tipoEntradaId) => {
    const zoneKey = `${zonaId}-${tipoEntradaId}`;
    setSelectedZones((prev) => {
      if (prev.includes(zoneKey)) {
        // si se quita la zona activa, limpiar selección activa
        setActiveZoneSelection((cur) =>
          cur && cur.zonaId == zonaId && cur.tipoEntradaId == tipoEntradaId
            ? null
            : cur
        );
        return prev.filter((z) => z !== zoneKey);
      } else {
        // Al seleccionar una zona, solicitar asientos de esa zona (si aplica)
        // (async () => {
        //   try {
        //     const zonaIdNum = zonaId;
        //     if (!asientosDisponibles[zonaIdNum]) {
        //       const seats = await obtenerAsientosPorZona(zonaIdNum);
        //       setAsientosDisponibles((p) => ({ ...p, [zonaIdNum]: seats }));
        //     }
        //   } catch (e) {
        //     console.error("No se pudieron cargar asientos por zona", e);
        //   }
        // })();

        // establecer zona activa para mostrar asientos
        setActiveZoneSelection({ zonaId: zonaId, tipoEntradaId });
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

    console.log(selectedSeats);
    // Agregar asientos seleccionados (cada elemento es {id,label,tipoEntradaId})
    selectedSeats.forEach((s) => {
      // normalizar y buscar tipo de entrada (aceptar string/number)
      const desiredTipoId = s.tipoEntradaId ?? (tiposEntrada && tiposEntrada.length > 0 ? tiposEntrada[0].id : null);
      const tipoEntrada = tiposEntrada.find(
        (t) => String(t.id) === String(desiredTipoId)
      ) || (tiposEntrada && tiposEntrada.length > 0 ? tiposEntrada[0] : null);

      if (tipoEntrada) {
        const tipoEntradaIdNorm = String(tipoEntrada.id);
        addItem({
          type: "seat",
          seatId: s.id,
          seatCode: s.label,
          seatNumber: s.label,
          eventId,
          zoneId: s.zonaId || activeZoneSelection?.zonaId || null,
          tipoEntrada: tipoEntrada.nombre,
          tipoEntradaId: tipoEntradaIdNorm,
          price: tipoEntrada.precio,
          quantity: 1,
        });
        itemsAdded++;
      } else {
        console.warn("No se pudo determinar tipo de entrada para el asiento", s, { tiposEntrada });
      }
    });

    // Agregar zonas seleccionadas
    selectedZones.forEach((zoneKey) => {
      const [zonaId, tipoEntradaId] = zoneKey.split("-");
      const tipoEntrada = tiposEntrada.find(
        (t) => t.id.toString() === tipoEntradaId
      );
      const quantity = seatQuantities[tipoEntradaId] || 0;
      if (tipoEntrada && quantity > 0) {
        // Buscar nombre de la zona desde datos cargados
        const zonaObj = zonas.find((z) => (z.idZona || z.id) == zonaId) || {};
        const zoneName = zonaObj.nombreZona || zonaObj.nombre || zonaId;
        for (let i = 0; i < quantity; i++) {
          addItem({
            type: "zone",
            zoneId: zonaId,
            zoneName,
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
            {evento.nombreEvento || evento.nombre || "Evento"}
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

              {zoneMapType === "theater" && zonas && zonas.length > 0 && (
                <TheaterZoneMapSelector
                  className="w-full"
                  initialState={finalTheaterInitial}
                  onChange={handleZonesChange}
                />
              )}

              {zoneMapType === "stadium" && zonas && zonas.length > 0 && (
                <StadiumZoneMapSelector
                  className="w-full"
                  initialState={finalStadiumInitial}
                  onChange={handleZonesChange}
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

              {/* Si hay una zona activa seleccionada, mostrar listado de asientos */}
              {activeZoneSelection &&
                asientosDisponibles[activeZoneSelection.zonaId] && (
                  <div className="mt-6 rounded-md border border-zinc-800 bg-zinc-900/40 p-4">
                    <h4 className="text-sm font-medium mb-2">
                      Asientos en zona{" "}
                      {zonas.find(
                        (z) => (z.idZona || z.id) == activeZoneSelection.zonaId
                      )?.nombreZona ||
                        zonas.find(
                          (z) =>
                            (z.idZona || z.id) == activeZoneSelection.zonaId
                        )?.nombre ||
                        activeZoneSelection.zonaId}
                    </h4>
                    <div className="grid grid-cols-6 gap-2">
                      {asientosDisponibles[activeZoneSelection.zonaId].map(
                        (seat) => {
                          const seatLabel =
                            seat.filaAsiento && seat.columnaAsiento
                              ? `${seat.filaAsiento}-${seat.columnaAsiento}`
                              : seat.codigoAsiento ||
                                `#${seat.idAsiento || seat.id}`;
                          const seatId = seat.idAsiento || seat.id;
                          const isSelected = selectedSeats.some(
                            (s) =>
                              String(s.id) === String(seatId) &&
                              String(s.tipoEntradaId) ===
                                String(activeZoneSelection.tipoEntradaId)
                          );
                          const available =
                            !seat.estado ||
                            (seat.estado &&
                              String(seat.estado)
                                .toUpperCase()
                                .includes("DISPONIBLE"));
                          return (
                            <button
                              key={seatId}
                              disabled={!available}
                              onClick={() =>
                                handleSeatSelection(
                                  seatId,
                                  seatLabel,
                                  activeZoneSelection.tipoEntradaId,
                                  activeZoneSelection.zonaId
                                )
                              }
                              className={`px-2 py-1 text-xs rounded ${
                                available
                                  ? isSelected
                                    ? "bg-primary text-black"
                                    : "bg-zinc-800 hover:bg-zinc-700"
                                  : "bg-zinc-800/30 text-zinc-500 cursor-not-allowed"
                              }`}
                            >
                              {seatLabel}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
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
                {tiposEntrada.map((tipo) => {
                  const selectedCount = selectedSeats.filter(
                    (s) => String(s.tipoEntradaId) === String(tipo.id)
                  ).length;
                  const extraQuantity = seatQuantities[tipo.id] || 0;
                  const displayedTotal = extraQuantity + selectedCount;

                  return (
                    <div key={tipo.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{tipo.nombre}</p>
                          <p className="text-xs text-subtle">{tipo.tipo}</p>
                        </div>
                        <p className="font-bold text-primary">
                          S/ {tipo.precio.toFixed(2)}
                        </p>
                      </div>

                      {/* Selector de cantidad para zonas */}
                      {zoneMapType && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(tipo.id, -1)}
                            disabled={extraQuantity === 0 && selectedCount === 0}
                            className="rounded-lg border border-zinc-700 p-2 hover:bg-zinc-800 disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={displayedTotal}
                            onChange={(e) => {
                              const newTotal = Math.max(0, parseInt(e.target.value) || 0);
                              const newExtra = Math.max(0, newTotal - selectedCount);
                              setSeatQuantities((prev) => ({
                                ...prev,
                                [tipo.id]: newExtra,
                              }));
                            }}
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
                  );
                })}
              </div>

              {/* Total de entradas seleccionadas */}
              <div className="mb-6 rounded-lg bg-primary/10 p-3 border border-primary/30">
                <p className="text-sm text-subtle mb-1">
                  Entradas seleccionadas
                </p>
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

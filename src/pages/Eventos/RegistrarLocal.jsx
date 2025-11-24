import FilePicker from "../../components/FilePicker";
import {
  Flex,
  Heading,
  Separator,
  Text,
  TextField,
  Select,
  Dialog,
} from "@radix-ui/themes";
import { CheckCircledIcon } from "@radix-ui/react-icons";
import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import StadiumZoneMap from "../../components/StadiumZoneMap";
import TheaterZoneMap from "../../components/TheaterZoneMap";
import SeatMapEditor from "../../components/SeatMapEditor";
import Button from "../../components/ui/Button";
import { registrarEstablecimiento } from "../../api/registrarEstablecimiento";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve(reader.result.split(",")[1]);
    };
    reader.onerror = (error) => reject(error);
  });

const ESTADO_INICIAL_LOCAL = "PENDIENTE_VALIDACION";

const mapTipoEspacioToBackend = (value) => {
  switch (value) {
    case "estadio":
      return "ESTADIO";
    case "teatro":
      return "TEATRO";
    case "auditorio":
      return "AUDITORIO";
    default:
      return null;
  }
};

/** Convierte código de asiento tipo "A1" / "AA23" a coordenadas 0-based { fila, columna } */
function seatCodeToCoord(code) {
  if (typeof code !== "string") return null;
  const match = code.trim().match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return null;
  const letters = match[1].toUpperCase();
  const numStr = match[2];

  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    const ch = letters.charCodeAt(i);
    if (ch < 65 || ch > 90) return null;
    n = n * 26 + (ch - 64); // A=1 ... Z=26
  }
  const fila = n - 1;
  const columna = parseInt(numStr, 10) - 1;
  if (Number.isNaN(fila) || Number.isNaN(columna) || fila < 0 || columna < 0) {
    return null;
  }
  return { fila, columna };
}

/** Normaliza el array de asientos bloqueados a [{fila, columna}] */
function normalizeBlockedSeats(blocked) {
  if (!Array.isArray(blocked)) return [];
  const out = [];
  for (const b of blocked) {
    if (typeof b === "string") {
      const coord = seatCodeToCoord(b);
      if (coord) out.push(coord);
    } else if (Array.isArray(b) && b.length === 2) {
      const [fila, columna] = b;
      if (typeof fila === "number" && typeof columna === "number") {
        out.push({ fila, columna });
      }
    } else if (b && typeof b === "object") {
      if (typeof b.fila === "number" && typeof b.columna === "number") {
        out.push({ fila: b.fila, columna: b.columna });
      } else if (typeof b.row === "number" && typeof b.col === "number") {
        out.push({ fila: b.row, columna: b.col });
      }
    }
  }
  return out;
}

/** Convierte un id técnico de zona en un nombre de zona legible */
function prettifyZoneId(id) {
  if (!id) return "";
  if (id === "oriente") return "ORIENTE";
  if (id === "occidente") return "OCCIDENTE";
  if (id === "norte") return "TRIBUNA NORTE";
  if (id === "escenario") return "ESCENARIO";
  if (id.startsWith("zona_")) {
    const rest = id.slice("zona_".length).toUpperCase();
    return `ZONA ${rest}`;
  }
  return String(id).toUpperCase();
}

export const RegistrarLocal = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [successOpen, setSuccessOpen] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tipoEspacio, setTipoEspacio] = useState("");

  const [documentoBase64, setDocumentoBase64] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (files) => {
    const file = files?.[0];
    if (!file) {
      setDocumentoBase64("");
      setFileName("");
      return;
    }
    setFileName(file.name);
    try {
      const base64String = await fileToBase64(file);
      setDocumentoBase64(base64String);
      if (errors.archivo) {
        setErrors((prev) => ({ ...prev, archivo: undefined }));
      }
    } catch (error) {
      console.error("Error al convertir archivo a Base64:", error);
      setErrors((prev) => ({
        ...prev,
        archivo: "Error al procesar el archivo.",
      }));
    }
  };

  // ====== ESTADIO ======
  const [zonesState, setZonesState] = useState({});
  const [enabledIds, setEnabledIds] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [zoneSeatDist, setZoneSeatDist] = useState({}); // { [zonaId]: boolean }
  const [seatMapsByZone, setSeatMapsByZone] = useState({}); // { [zonaId]: { rows, cols, blocked:[] } }

  // ====== TEATRO ======
  const [theaterZonesState, setTheaterZonesState] = useState({});
  const [theaterEnabledIds, setTheaterEnabledIds] = useState([]);
  const [selectedTheaterZoneId, setSelectedTheaterZoneId] = useState(null);
  const [theaterZoneSeatDist, setTheaterZoneSeatDist] = useState({}); // { [zonaId]: boolean }
  const [theaterSeatMapsByZone, setTheaterSeatMapsByZone] = useState({}); // { [zonaId]: { rows, cols, blocked:[] } }

  // ====== ESCENARIO ======
  const [escenarioHasSeatDist, setEscenarioHasSeatDist] = useState(false);
  const [escenarioSeatMap, setEscenarioSeatMap] = useState({
    rows: 10,
    cols: 12,
    blocked: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setErrors({});

    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    const newErrors = {};

    if (!data.nombre?.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!data.direccion?.trim())
      newErrors.direccion = "La dirección es obligatoria";
    if (!tipoEspacio) newErrors.tipoEspacio = "Selecciona el tipo de espacio";
    if (!data.capacidad?.trim()) {
      newErrors.capacidad = "La capacidad es obligatoria";
    } else if (Number.isNaN(Number(data.capacidad))) {
      newErrors.capacidad = "La capacidad debe ser numérica";
    }

    if (!documentoBase64) {
      newErrors.archivo = "Debe adjuntar la documentación.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      form.reportValidity?.();
      return;
    }

    const tipoLocal = mapTipoEspacioToBackend(tipoEspacio);
    const idGestor = 18; // Gestor de eventos

    // ===== Construir TRAMA de configuración de zonas & asientos =====
    let configuracionLocal = null;

    if (tipoEspacio === "estadio") {
      const zonas = {};
      Object.entries(zonesState || {}).forEach(([zoneId, estado]) => {
        if (zoneId === "escenario") return;
        const tieneDistribucion = !!zoneSeatDist[zoneId];
        const seatMap = seatMapsByZone[zoneId];
        zonas[zoneId] = {
          idZona: zoneId,
          nombreZona: prettifyZoneId(zoneId),
          estado, // "available" | "selected" | "blocked"
          habilitada: estado !== "blocked",
          tieneDistribucionAsientos: tieneDistribucion,
          mapaAsientos:
            tieneDistribucion && seatMap
              ? {
                  filas: seatMap.rows,
                  columnas: seatMap.cols,
                  asientosBloqueados: normalizeBlockedSeats(seatMap.blocked),
                }
              : null,
        };
      });
      configuracionLocal = {
        tipoEspacio: "ESTADIO",
        zonas,
      };
    } else if (tipoEspacio === "teatro") {
      const zonas = {};
      Object.entries(theaterZonesState || {}).forEach(([zoneId, estado]) => {
        if (zoneId === "escenario") return;
        const tieneDistribucion = !!theaterZoneSeatDist[zoneId];
        const seatMap = theaterSeatMapsByZone[zoneId];
        zonas[zoneId] = {
          idZona: zoneId,
          nombreZona: prettifyZoneId(zoneId),
          estado,
          habilitada: estado !== "blocked",
          tieneDistribucionAsientos: tieneDistribucion,
          mapaAsientos:
            tieneDistribucion && seatMap
              ? {
                  filas: seatMap.rows,
                  columnas: seatMap.cols,
                  asientosBloqueados: normalizeBlockedSeats(seatMap.blocked),
                }
              : null,
        };
      });
      configuracionLocal = {
        tipoEspacio: "TEATRO",
        zonas,
      };
    } else if (tipoEspacio === "auditorio") {
      configuracionLocal = {
        tipoEspacio: "AUDITORIO",
        tieneDistribucionAsientos: escenarioHasSeatDist,
        mapaAsientos: escenarioHasSeatDist
          ? {
              filas: escenarioSeatMap.rows,
              columnas: escenarioSeatMap.cols,
              asientosBloqueados: normalizeBlockedSeats(
                escenarioSeatMap.blocked
              ),
            }
          : null,
      };
    }

    const payload = {
      idGestor,
      nombreEstablecimiento: data.nombre.trim(),
      direccionEstablecimiento: data.direccion.trim(),
      tipo: tipoLocal,
      capacidadMaxima: Number(data.capacidad),
      estado: ESTADO_INICIAL_LOCAL,
      documentacionAdjunta: documentoBase64,
      // Adjuntamos la trama de configuración al payload
      configuracionLocal,
    };

    try {
      setIsSubmitting(true);
      console.log("Payload establecimiento:", payload);
      await registrarEstablecimiento(payload);
      setSuccessOpen(true);
    } catch (err) {
      console.error("Error al registrar establecimiento:", err);
      const msg =
        err?.response?.data?.message ||
        "No se pudo registrar el local. Intenta nuevamente.";
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // helpers igualdad superficial
  const shallowEqualObj = (a = {}, b = {}) => {
    const ak = Object.keys(a),
      bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (a[k] !== b[k]) return false;
    return true;
  };
  const arrayEqual = (a, b) => {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
      return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  // ====== onChange ESTADIO (soporta contrato viejo y nuevo) ======
  const handleStadiumChange = useCallback((arg1, arg2) => {
    if (Array.isArray(arg1) && arg2 && typeof arg2 === "object") {
      const en = arg1,
        map = arg2;
      setEnabledIds((prev) => (arrayEqual(prev, en) ? prev : en));
      setZonesState((prev) => (shallowEqualObj(prev, map) ? prev : map));
      setSelectedZoneId((prev) => prev);
      return;
    }
    const payload = arg1 || {};
    const { selected = [], map = {} } = payload;
    setZonesState((prev) => (shallowEqualObj(prev, map) ? prev : map));
    const en = Object.entries(map)
      .filter(([k, v]) => v !== "blocked" && k !== "escenario")
      .map(([k]) => k);
    setEnabledIds((prev) => (arrayEqual(prev, en) ? prev : en));
    const nextSel = selected[0] || null;
    setSelectedZoneId((prev) => (prev === nextSel ? prev : nextSel));
  }, []);

  const handleSeatDistToggle = useCallback(
    (checked) => {
      if (!selectedZoneId) return;
      setZoneSeatDist((m) => ({ ...m, [selectedZoneId]: checked }));
      if (!checked) {
        setSeatMapsByZone((prev) => {
          if (!(selectedZoneId in prev)) return prev;
          const cp = { ...prev };
          delete cp[selectedZoneId];
          return cp;
        });
      }
    },
    [selectedZoneId]
  );

  const handleSeatMapChange = useCallback(
    (m) => {
      if (!selectedZoneId || !m) return;
      setSeatMapsByZone((prev) => {
        const prevM = prev[selectedZoneId];
        const same =
          prevM &&
          prevM.rows === m.rows &&
          prevM.cols === m.cols &&
          arrayEqual(prevM.blocked, m.blocked);
        if (same) return prev;
        return {
          ...prev,
          [selectedZoneId]: { rows: m.rows, cols: m.cols, blocked: m.blocked },
        };
      });
    },
    [selectedZoneId]
  );

  // ====== onChange TEATRO ======
  const handleTheaterChange = useCallback((arg1, arg2) => {
    if (Array.isArray(arg1) && arg2 && typeof arg2 === "object") {
      const en = arg1,
        map = arg2;
      setTheaterEnabledIds((prev) => (arrayEqual(prev, en) ? prev : en));
      setTheaterZonesState((prev) =>
        shallowEqualObj(prev, map) ? prev : map
      );
      setSelectedTheaterZoneId((prev) => prev);
      return;
    }
    const payload = arg1 || {};
    const { selected = [], map = {} } = payload;
    setTheaterZonesState((prev) => (shallowEqualObj(prev, map) ? prev : map));
    const en = Object.entries(map)
      .filter(([k, v]) => v !== "blocked" && k !== "escenario")
      .map(([k]) => k);
    setTheaterEnabledIds((prev) => (arrayEqual(prev, en) ? prev : en));
    const nextSel = selected[0] || null;
    setSelectedTheaterZoneId((prev) => (prev === nextSel ? prev : nextSel));
  }, []);

  const handleTheaterSeatDistToggle = useCallback(
    (checked) => {
      if (!selectedTheaterZoneId) return;
      setTheaterZoneSeatDist((m) => ({
        ...m,
        [selectedTheaterZoneId]: checked,
      }));
      if (!checked) {
        setTheaterSeatMapsByZone((prev) => {
          if (!(selectedTheaterZoneId in prev)) return prev;
          const cp = { ...prev };
          delete cp[selectedTheaterZoneId];
          return cp;
        });
      }
    },
    [selectedTheaterZoneId]
  );

  const handleTheaterSeatMapChange = useCallback(
    (m) => {
      if (!selectedTheaterZoneId || !m) return;
      setTheaterSeatMapsByZone((prev) => {
        const prevM = prev[selectedTheaterZoneId];
        const same =
          prevM &&
          prevM.rows === m.rows &&
          prevM.cols === m.cols &&
          arrayEqual(prevM.blocked, m.blocked);
        if (same) return prev;
        return {
          ...prev,
          [selectedTheaterZoneId]: {
            rows: m.rows,
            cols: m.cols,
            blocked: m.blocked,
          },
        };
      });
    },
    [selectedTheaterZoneId]
  );

  return (
    <main className="min-h-screen bg-background-dark text-text">
      <section className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        <div className="rounded-2xl bg-slate-950/95 p-10 md:p-12 ring-1 shadow-2xl mb-5">
          <form onSubmit={handleSubmit} noValidate>
            <Flex direction="column" gap="4">
              <div>
                <Text size="2" color="var(--color-text)">
                  Completa los datos del local a registrar para futuros
                  registros de eventos. Los campos marcados con{" "}
                  <span aria-hidden="true">*</span> son obligatorios.
                </Text>
              </div>

              <Separator my="2" size="4" />

              {/* Datos del local */}
              <div className="space-y-3">
                <Heading size="3">Datos del local</Heading>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="nombre" className="text-sm font-medium">
                      Nombre del local <span className="text-red-500">*</span>
                    </label>
                    <TextField.Root
                      id="nombre"
                      name="nombre"
                      required
                      aria-describedby="nombre-help"
                      size="3"
                    />
                    <Text id="nombre-help" size="1" color="var(--color-text)">
                      Ingesa el nombre del local a registrar.
                    </Text>
                    {errors.nombre && (
                      <p className="text-sm text-red-400">{errors.nombre}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="direccion" className="text-sm font-medium">
                      Dirección del local{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <TextField.Root
                      id="direccion"
                      name="direccion"
                      required
                      aria-describedby="direccion-help"
                      size="3"
                    />
                    <Text
                      id="direccion-help"
                      size="1"
                      color="var(--color-text)"
                    >
                      Ingesa la dirección del local.
                    </Text>
                    {errors.direccion && (
                      <p className="text-sm text-red-400">
                        {errors.direccion}
                      </p>
                    )}
                  </div>

                  <div className="w-full min-w-0 space-y-1">
                    <label
                      htmlFor="tipo_espacio"
                      className="block text-sm font-medium"
                    >
                      Tipo de espacio <span className="text-red-500">*</span>
                    </label>
                    <Select.Root
                      name="tipo_espacio"
                      required
                      onValueChange={(val) => {
                        setTipoEspacio(val);
                        // reset total al cambiar tipo
                        setZonesState({});
                        setEnabledIds([]);
                        setSelectedZoneId(null);
                        setZoneSeatDist({});
                        setSeatMapsByZone({});

                        setTheaterZonesState({});
                        setTheaterEnabledIds([]);
                        setSelectedTheaterZoneId(null);
                        setTheaterZoneSeatDist({});
                        setTheaterSeatMapsByZone({});

                        setEscenarioHasSeatDist(false);
                        setEscenarioSeatMap({
                          rows: 10,
                          cols: 12,
                          blocked: [],
                        });
                      }}
                    >
                      <Select.Trigger
                        id="tipo_espacio"
                        size="3"
                        placeholder="Seleccione"
                        className="w-full"
                      />
                      <Select.Content
                        position="popper"
                        sideOffset={4}
                        className="w-(--radix-select-trigger-width)"
                      >
                        <Select.Item value="estadio">Estadio</Select.Item>
                        <Select.Item value="teatro">Teatro</Select.Item>
                        <Select.Item value="auditorio">Escenario</Select.Item>
                      </Select.Content>
                    </Select.Root>
                    {errors.tipoEspacio && (
                      <p className="text-sm text-red-400">
                        {errors.tipoEspacio}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="capacidad" className="text-sm font-medium">
                      Capacidad total <span className="text-red-500">*</span>
                    </label>
                    <TextField.Root
                      id="capacidad"
                      name="capacidad"
                      inputMode="numeric"
                      pattern="[0-9]{1,12}"
                      maxLength={12}
                      required
                      aria-describedby="capacidad-help"
                      size="3"
                    />
                    <Text
                      id="capacidad-help"
                      size="1"
                      color="var(--color-text)"
                    >
                      Ingrese la capacidad máxima registrada en los documentos
                      de seguridad.
                    </Text>
                    {errors.capacidad && (
                      <p className="text-sm text-red-400">
                        {errors.capacidad}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ====== ESTADIO ====== */}
              {tipoEspacio === "estadio" && (
                <>
                  <Separator my="2" size="4" />
                  <div className="space-y-2">
                    <Heading size="3">
                      Zonas del{" "}
                      {tipoEspacio.charAt(0).toUpperCase() +
                        tipoEspacio.slice(1)}
                    </Heading>
                    <Text size="2" color="var(--color-text)">
                      Habilita o deshabilita las zonas disponibles. Selecciona
                      una zona para configurar si tiene distribución de asiento.
                    </Text>

                    <div className="rounded-xl border p-3">
                      <StadiumZoneMap onChange={handleStadiumChange} />
                    </div>

                    {selectedZoneId && (
                      <div className="space-y-3 rounded-lg border p-3 bg-zinc-900/30">
                        <div className="text-sm font-medium text-zinc-200">
                          Zona seleccionada:{" "}
                          <span className="font-semibold">
                            {prettifyZoneId(selectedZoneId)}
                          </span>
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-4 accent-indigo-600"
                            checked={!!zoneSeatDist[selectedZoneId]}
                            onChange={(e) =>
                              handleSeatDistToggle(e.target.checked)
                            }
                          />
                          ¿La zona tiene distribución de asiento?
                        </label>

                        {zoneSeatDist[selectedZoneId] && (
                          <div className="rounded-xl border p-3">
                            <SeatMapEditor
                              key={selectedZoneId}
                              initialRows={
                                seatMapsByZone[selectedZoneId]?.rows ?? 10
                              }
                              initialCols={
                                seatMapsByZone[selectedZoneId]?.cols ?? 12
                              }
                              initialBlocked={
                                seatMapsByZone[selectedZoneId]?.blocked ?? []
                              }
                              onChange={handleSeatMapChange}
                              frontLabel="Frente"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hidden estadio */}
                    <input
                      type="hidden"
                      name="stadium_zones_state"
                      value={JSON.stringify(zonesState)}
                    />
                    <input
                      type="hidden"
                      name="stadium_zones_enabled"
                      value={JSON.stringify(enabledIds)}
                    />
                    <input
                      type="hidden"
                      name="stadium_zones_seat_distribution"
                      value={JSON.stringify(zoneSeatDist)}
                    />
                    <input
                      type="hidden"
                      name="stadium_zones_seat_maps"
                      value={JSON.stringify(seatMapsByZone)}
                    />
                  </div>
                </>
              )}

              {/* ====== TEATRO ====== */}
              {tipoEspacio === "teatro" && (
                <>
                  <Separator my="2" size="4" />
                  <div className="space-y-2">
                    <Heading size="3">
                      Zonas del{" "}
                      {tipoEspacio.charAt(0).toUpperCase() +
                        tipoEspacio.slice(1)}
                    </Heading>
                    <Text size="2" color="var(--color-text)">
                      Habilita o deshabilita las zonas disponibles. Selecciona
                      una zona para indicar si tiene distribución de asiento.
                    </Text>

                    <div className="rounded-xl border p-3">
                      <TheaterZoneMap onChange={handleTheaterChange} />
                    </div>

                    {selectedTheaterZoneId && (
                      <div className="space-y-3 rounded-lg border p-3 bg-zinc-900/30">
                        <div className="text-sm font-medium text-zinc-200">
                          Zona seleccionada:{" "}
                          <span className="font-semibold">
                            {prettifyZoneId(selectedTheaterZoneId)}
                          </span>
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="size-4 accent-indigo-600"
                            checked={
                              !!theaterZoneSeatDist[selectedTheaterZoneId]
                            }
                            onChange={(e) =>
                              handleTheaterSeatDistToggle(e.target.checked)
                            }
                          />
                          ¿La zona tiene distribución de asiento?
                        </label>

                        {theaterZoneSeatDist[selectedTheaterZoneId] && (
                          <div className="rounded-xl border p-3">
                            <SeatMapEditor
                              key={`theater-${selectedTheaterZoneId}`}
                              initialRows={
                                theaterSeatMapsByZone[selectedTheaterZoneId]
                                  ?.rows ?? 10
                              }
                              initialCols={
                                theaterSeatMapsByZone[selectedTheaterZoneId]
                                  ?.cols ?? 12
                              }
                              initialBlocked={
                                theaterSeatMapsByZone[selectedTheaterZoneId]
                                  ?.blocked ?? []
                              }
                              onChange={handleTheaterSeatMapChange}
                              frontLabel="Frente"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hidden teatro */}
                    <input
                      type="hidden"
                      name="theater_zones_state"
                      value={JSON.stringify(theaterZonesState)}
                    />
                    <input
                      type="hidden"
                      name="theater_zones_enabled"
                      value={JSON.stringify(theaterEnabledIds)}
                    />
                    <input
                      type="hidden"
                      name="theater_zones_seat_distribution"
                      value={JSON.stringify(theaterZoneSeatDist)}
                    />
                    <input
                      type="hidden"
                      name="theater_zones_seat_maps"
                      value={JSON.stringify(theaterSeatMapsByZone)}
                    />
                  </div>
                </>
              )}

              {/* ====== ESCENARIO (checkbox + seatmap condicional) ====== */}
              {tipoEspacio === "auditorio" && (
                <>
                  <Separator my="2" size="4" />
                  <div className="space-y-2">
                    <Heading size="3">
                      Distribución de asientos del Escenario
                    </Heading>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 accent-indigo-600"
                        checked={escenarioHasSeatDist}
                        onChange={(e) =>
                          setEscenarioHasSeatDist(e.target.checked)
                        }
                      />
                      ¿El escenario tiene distribución de asientos?
                    </label>

                    {escenarioHasSeatDist && (
                      <div className="rounded-xl border p-3">
                        <SeatMapEditor
                          key="escenario-seatmap"
                          initialRows={escenarioSeatMap.rows}
                          initialCols={escenarioSeatMap.cols}
                          initialBlocked={escenarioSeatMap.blocked}
                          onChange={(m) => {
                            if (!m) return;
                            setEscenarioSeatMap((prev) => {
                              const same =
                                prev &&
                                prev.rows === m.rows &&
                                prev.cols === m.cols &&
                                arrayEqual(prev.blocked, m.blocked);
                              return same
                                ? prev
                                : {
                                    rows: m.rows,
                                    cols: m.cols,
                                    blocked: m.blocked,
                                  };
                            });
                          }}
                          frontLabel="Frente"
                        />
                      </div>
                    )}

                    {/* Hidden escenario */}
                    <input
                      type="hidden"
                      name="escenario_seat_distribution"
                      value={escenarioHasSeatDist ? "true" : "false"}
                    />
                    <input
                      type="hidden"
                      name="escenario_seat_map"
                      value={JSON.stringify(escenarioSeatMap)}
                    />
                  </div>
                </>
              )}

              <Separator my="2" size="4" />

              {/* Documentación */}
              <div className="space-y-2">
                <Heading size="3">Documentación</Heading>
                <Text size="2" color="var(--color-text)">
                  Solo se acepta un único archivo en formato .zip o .rar.
                </Text>
                <FilePicker
                  labelText="Adjuntar croquis y documentación de registro público."
                  name="archivo"
                  required
                  accept=".zip,.rar"
                  multiple={false}
                  onChange={handleFileChange}
                  fileName={fileName}
                  error={errors.archivo}
                />
              </div>

              {apiError && (
                <Text size="2" color="red" align="center">
                  {apiError}
                </Text>
              )}

              <Flex gap="3" justify="end" mt="3">
                <Button type="button" variant="gray">
                  <Link to="/">Cancelar</Link>
                </Button>
                <Button type="submit" variant="primary">
                  {isSubmitting ? "Enviando..." : "Enviar solicitud"}
                </Button>
              </Flex>
            </Flex>
          </form>
        </div>
      </section>

      <Dialog.Root open={successOpen} onOpenChange={setSuccessOpen}>
        <Dialog.Content
          size="3"
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <Dialog.Title />
          <Flex direction="column" align="center" gap="3">
            <CheckCircledIcon
              width={48}
              height={48}
              className="text-green-600"
            />
            <Heading size="4">¡Registro enviado!</Heading>
            <Text size="2" color="var(--color-text)" align="center">
              Hemos recibido tu solicitud de registro de local. Te enviaremos
              una confirmación por correo.
            </Text>
            <Flex gap="3" mt="3">
              <Button onClick={() => navigate("/")}>Ir al inicio</Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </main>
  );
};

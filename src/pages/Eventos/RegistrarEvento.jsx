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
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";

import { ListaLocales, TiposEvento } from "../../lib/mock";

import StadiumZoneMapSelector from "../../components/StadiumZoneMapSelector";
import TheaterZoneMapSelector from "../../components/TheaterZoneMapSelector";
import SeatMapSelector from "../../components/SeatMapSelector";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });

function buildInitialZoneStateFromMock(configuracionLocal) {
  if (!configuracionLocal || !configuracionLocal.zonas) return undefined;

  const { zonas } = configuracionLocal;
  const map = {};

  Object.entries(zonas).forEach(([zonaId, zonaCfg]) => {
    let estado = zonaCfg.estado;

    if (!estado) {
      estado = zonaCfg.habilitada === false ? "blocked" : "available";
    }

    if (estado === "selected") estado = "available";

    map[zonaId] = estado;
  });

  return map;
}

export const RegistrarEvento = () => {
  const [errors, setErrors] = useState({});
  const [successOpen, setSuccessOpen] = useState(false);

  const [nombreEvento, setNombreEvento] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [localSeleccionado, setLocalSeleccionado] = useState("");
  const [tipoEventoSeleccionado, setTipoEventoSeleccionado] = useState("");
  const [capacidadMaximaLocal, setCapacidadMaximaLocal] = useState(null);
  const [capacidadMaximaEvento, setCapacidadMaximaEvento] = useState("");

  const [configLocalSeleccionado, setConfigLocalSeleccionado] = useState(null);
  const [tipoLocalSeleccionado, setTipoLocalSeleccionado] = useState("");

  const [seatMapZonaId, setSeatMapZonaId] = useState(null);
  const [seatMapZonaConfig, setSeatMapZonaConfig] = useState(null);

  const [tiposEntrada, setTiposEntrada] = useState([
    {
      id: 1,
      nombre: "",
      precio: "",
      tipoComision: "FIJO",
      valorComision: "",
      asientosPorZona: {},
    },
  ]);

  const [tipoEntradaSeleccionadaId, setTipoEntradaSeleccionadaId] = useState(1);

  const [bannerName, setBannerName] = useState("");
  const [bannerBase64, setBannerBase64] = useState("");
  const [docName, setDocName] = useState("");
  const [docBase64, setDocBase64] = useState("");

  const handleChangeTipoEvento = (value) => setTipoEventoSeleccionado(value);

  const handleBannerChange = async (fileOrFiles) => {
    const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
    if (!file) {
      setBannerName("");
      setBannerBase64("");
      return;
    }

    try {
      setBannerName(file.name);
      const base64 = await fileToBase64(file);
      setBannerBase64(base64);
      setErrors((prev) => ({ ...prev, banner: undefined }));
    } catch (err) {
      console.error("Error banner -> base64", err);
      setErrors((prev) => ({
        ...prev,
        banner: "Error al procesar el banner.",
      }));
    }
  };

  const handleDocChange = async (fileOrFiles) => {
    const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
    if (!file) {
      setDocName("");
      setDocBase64("");
      return;
    }

    try {
      setDocName(file.name);
      const base64 = await fileToBase64(file);
      setDocBase64(base64);
      setErrors((prev) => ({ ...prev, documentacion: undefined }));
    } catch (err) {
      console.error("Error doc -> base64", err);
      setErrors((prev) => ({
        ...prev,
        documentacion: "Error al procesar la documentación.",
      }));
    }
  };

  const handleChangeLocal = (value) => {
    setLocalSeleccionado(value);

    const local = ListaLocales.find(
      (loc) => String(loc.idLocal) === String(value)
    );

    if (local) {
      setCapacidadMaximaLocal(local.capacidadMaxima ?? null);
      setConfigLocalSeleccionado(local.configuracionLocal || null);
      setTipoLocalSeleccionado(local.tipo || "");
    } else {
      setCapacidadMaximaLocal(null);
      setConfigLocalSeleccionado(null);
      setTipoLocalSeleccionado("");
    }

    setSeatMapZonaId(null);
    setSeatMapZonaConfig(null);

    setTiposEntrada((prev) =>
      prev.map((t) => ({ ...t, asientosPorZona: {} }))
    );
  };

  const handleAddTipoEntrada = () => {
    setTiposEntrada((prev) => {
      const newId = prev.length ? prev[prev.length - 1].id + 1 : 1;
      const next = [
        ...prev,
        {
          id: newId,
          nombre: "",
          precio: "",
          tipoComision: "FIJO",
          valorComision: "",
          asientosPorZona: {},
        },
      ];
      setTipoEntradaSeleccionadaId(newId);
      return next;
    });
  };

  const handleRemoveTipoEntrada = (id) => {
    setTiposEntrada((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (tipoEntradaSeleccionadaId === id) {
        setTipoEntradaSeleccionadaId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleChangeTipoEntradaCampo = (id, campo, valor) => {
    setTiposEntrada((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [campo]: valor } : t))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!nombreEvento.trim()) newErrors.nombreEvento = "Campo requerido.";
    if (!fechaHora) newErrors.fechaHora = "Campo requerido.";
    if (!localSeleccionado) newErrors.localSeleccionado = "Campo requerido.";
    if (!tipoEventoSeleccionado) newErrors.tipoEvento = "Campo requerido.";
    if (!capacidadMaximaEvento) newErrors.capacidadEvento = "Campo requerido.";
    if (!bannerBase64) newErrors.banner = "Campo requerido.";
    if (!docBase64) newErrors.documentacion = "Campo requerido.";

    const tiposValidos = tiposEntrada.every(
      (t) =>
        t.nombre.trim() &&
        String(t.precio).trim() &&
        String(t.valorComision).trim()
    );
    if (!tiposValidos)
      newErrors.tiposEntrada =
        "Completa nombre, precio y comisión en todos los tipos.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload = {
      nombreEvento: nombreEvento.trim(),
      fechaHora,
      idLocal: localSeleccionado,
      tipoEvento: tipoEventoSeleccionado,
      capacidadMaximaEvento: Number(capacidadMaximaEvento),
      tiposEntrada: tiposEntrada.map((t) => ({
        nombre: t.nombre.trim(),
        precio: Number(t.precio),
        tipoComision: t.tipoComision,
        valorComision: Number(t.valorComision),
        asientosPorZona: t.asientosPorZona || {},
      })),
      bannerBase64,
      documentacionBase64: docBase64,
      seatMapZonaId,
    };

    console.log("Payload evento:", payload);
    setSuccessOpen(true);
  };

  const initialZoneState = useMemo(() => {
    if (!configLocalSeleccionado) return undefined;
    return buildInitialZoneStateFromMock(configLocalSeleccionado);
  }, [configLocalSeleccionado]);

  const auditoriumSeatMap = useMemo(() => {
    if (
      tipoLocalSeleccionado === "AUDITORIO" &&
      configLocalSeleccionado?.mapaAsientos
    ) {
      return configLocalSeleccionado.mapaAsientos;
    }
    return null;
  }, [tipoLocalSeleccionado, configLocalSeleccionado]);

  const handleZoneSelectionChange = useCallback(
    ({ selected }) => {
      const zonaId = selected?.[0];

      if (!zonaId || !configLocalSeleccionado?.zonas) {
        setSeatMapZonaId(null);
        setSeatMapZonaConfig(null);
        return;
      }

      const zonaCfg = configLocalSeleccionado.zonas[zonaId];

      if (zonaCfg?.tieneDistribucionAsientos && zonaCfg?.mapaAsientos) {
        const { filas, columnas, asientosBloqueados = [] } =
          zonaCfg.mapaAsientos;

        const baseBlocked = asientosBloqueados.map((a) => [a.fila, a.columna]);

        setSeatMapZonaId(zonaId);
        setSeatMapZonaConfig({
          rows: filas,
          cols: columnas,
          baseBlocked,
        });
      } else {
        setSeatMapZonaId(null);
        setSeatMapZonaConfig(null);
      }
    },
    [configLocalSeleccionado]
  );

  const currentSeatSelection = useMemo(() => {
    if (!seatMapZonaId) return [];
    const tipo = tiposEntrada.find((t) => t.id === tipoEntradaSeleccionadaId);
    if (!tipo || !tipo.asientosPorZona) return [];
    return tipo.asientosPorZona[seatMapZonaId] || [];
  }, [tiposEntrada, tipoEntradaSeleccionadaId, seatMapZonaId]);

  const handleSeatSelectionChange = useCallback(
    (sel) => {
      if (!seatMapZonaId || !tipoEntradaSeleccionadaId) return;
      setTiposEntrada((prev) =>
        prev.map((t) => {
          if (t.id !== tipoEntradaSeleccionadaId) return t;
          const prevMap = t.asientosPorZona || {};
          return {
            ...t,
            asientosPorZona: {
              ...prevMap,
              [seatMapZonaId]: sel,
            },
          };
        })
      );
    },
    [seatMapZonaId, tipoEntradaSeleccionadaId]
  );

  const dynamicBlocked = useMemo(() => {
    if (!seatMapZonaConfig || !seatMapZonaId) return [];

    const base = seatMapZonaConfig.baseBlocked || [];
    const currentKeys = new Set(
      currentSeatSelection.map(([r, c]) => `${r}-${c}`)
    );

    const seen = new Set();
    const result = [];

    const addSeat = ([r, c]) => {
      const k = `${r}-${c}`;
      if (seen.has(k)) return;
      seen.add(k);
      result.push([r, c]);
    };

    base.forEach(addSeat);

    tiposEntrada.forEach((t) => {
      if (t.id === tipoEntradaSeleccionadaId) return;
      const arr = t.asientosPorZona?.[seatMapZonaId] || [];
      arr.forEach(([r, c]) => {
        const k = `${r}-${c}`;
        if (currentKeys.has(k)) return;
        addSeat([r, c]);
      });
    });

    return result;
  }, [
    seatMapZonaConfig,
    seatMapZonaId,
    tiposEntrada,
    tipoEntradaSeleccionadaId,
    currentSeatSelection,
  ]);

  return (
    <main className="min-h-screen bg-background-dark text-text">
      <section className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        <div className="rounded-2xl bg-slate-950/95 p-10 md:p-12 ring-1 shadow-2xl mb-5">
          <form onSubmit={handleSubmit} noValidate>
            <Flex direction="column" gap="4">
              <div>
                <Text size="2" color="var(--color-text)">
                  Completa los datos del evento a registrar. Los campos
                  marcados con <span aria-hidden="true">*</span> son
                  obligatorios.
                </Text>
              </div>

              <Separator my="2" size="4" />

              <div className="space-y-3">
                <Heading size="3">Datos del espectáculo</Heading>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="nombreEvento" className="text-sm font-medium">
                      Nombre del espectáculo <span className="text-red-500">*</span>
                    </label>
                    <TextField.Root
                      id="nombreEvento"
                      name="nombreEvento"
                      value={nombreEvento}
                      onChange={(e) => setNombreEvento(e.target.value)}
                      required
                      size="3"
                    />
                    {errors.nombreEvento && (
                      <p className="text-sm text-red-400">{errors.nombreEvento}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="fechaHora" className="text-sm font-medium">
                      Fecha y hora <span className="text-red-500">*</span>
                    </label>
                    <TextField.Root
                      id="fechaHora"
                      name="fechaHora"
                      type="datetime-local"
                      value={fechaHora}
                      onChange={(e) => setFechaHora(e.target.value)}
                      required
                      size="3"
                    />
                    {errors.fechaHora && (
                      <p className="text-sm text-red-400">{errors.fechaHora}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="local" className="block text-sm font-medium">
                      Local <span className="text-red-500">*</span>
                    </label>
                    <Select.Root
                      value={localSeleccionado}
                      onValueChange={handleChangeLocal}
                      required
                    >
                      <Select.Trigger
                        id="local"
                        size="3"
                        placeholder="Seleccione un local"
                        className="w-full"
                      />
                      <Select.Content
                        position="popper"
                        sideOffset={4}
                        className="w-[var(--radix-select-trigger-width)]"
                      >
                        {ListaLocales.map((loc) => (
                          <Select.Item key={loc.idLocal} value={String(loc.idLocal)}>
                            {loc.nombreEstablecimiento}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    {errors.localSeleccionado && (
                      <p className="text-sm text-red-400">{errors.localSeleccionado}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Capacidad máxima del local
                    </label>
                    <TextField.Root value={capacidadMaximaLocal ?? ""} readOnly size="3" />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="capacidadEvento" className="text-sm font-medium">
                      Capacidad del evento <span className="text-red-500">*</span>
                    </label>
                    <TextField.Root
                      id="capacidadEvento"
                      name="capacidadEvento"
                      inputMode="numeric"
                      pattern="[0-9]{1,12}"
                      maxLength={12}
                      value={capacidadMaximaEvento}
                      onChange={(e) => setCapacidadMaximaEvento(e.target.value)}
                      required
                      size="3"
                    />
                    {errors.capacidadEvento && (
                      <p className="text-sm text-red-400">{errors.capacidadEvento}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="tipoEvento" className="block text-sm font-medium">
                      Tipo de evento <span className="text-red-500">*</span>
                    </label>
                    <Select.Root
                      value={tipoEventoSeleccionado}
                      onValueChange={handleChangeTipoEvento}
                      required
                    >
                      <Select.Trigger
                        id="tipoEvento"
                        size="3"
                        placeholder="Seleccione un tipo de evento"
                        className="w-full"
                      />
                      <Select.Content
                        position="popper"
                        sideOffset={4}
                        className="w-[var(--radix-select-trigger-width)]"
                      >
                        {TiposEvento.map((tipo) => (
                          <Select.Item key={tipo.value} value={String(tipo.value)}>
                            {tipo.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    {errors.tipoEvento && (
                      <p className="text-sm text-red-400">{errors.tipoEvento}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator my="2" size="4" />
              <div className="space-y-3">
                <Heading size="3">Tipos de entradas</Heading>
                <Text size="2" color="var(--color-text)">
                  Configura los tipos de entradas, precios y comisión por
                  entrada. Selecciona una para editarla y asignar asientos.
                </Text>

                <div className="space-y-3">
                  {tiposEntrada.map((t) => {
                    const selected = t.id === tipoEntradaSeleccionadaId;

                    return (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setTipoEntradaSeleccionadaId(t.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setTipoEntradaSeleccionadaId(t.id);
                          }
                        }}
                        className={[
                          "rounded-xl border p-4 space-y-3 cursor-pointer transition",
                          selected
                            ? "border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/40"
                            : "border-zinc-800/70 hover:border-zinc-700",
                        ].join(" ")}
                        aria-pressed={selected}
                      >
                        <div className="flex justify-between items-center">
                          <Text size="2" className="font-medium">
                            Entrada #{t.id}
                          </Text>

                          <div className="flex items-center gap-3">
                            {selected && (
                              <span className="text-xs text-indigo-300">
                                Seleccionada
                              </span>
                            )}

                            {tiposEntrada.length > 1 && (
                              <button
                                type="button"
                                className="text-sm text-red-400 hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveTipoEntrada(t.id);
                                }}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-sm font-medium">
                              Nombre de la entrada
                            </label>
                            <TextField.Root
                              value={t.nombre}
                              onChange={(e) =>
                                handleChangeTipoEntradaCampo(
                                  t.id,
                                  "nombre",
                                  e.target.value
                                )
                              }
                              size="3"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Precio (S/)
                            </label>
                            <TextField.Root
                              inputMode="numeric"
                              value={t.precio}
                              onChange={(e) =>
                                handleChangeTipoEntradaCampo(
                                  t.id,
                                  "precio",
                                  e.target.value
                                )
                              }
                              size="3"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Tipo de comisión
                            </label>
                            <Select.Root
                              value={t.tipoComision}
                              onValueChange={(val) =>
                                handleChangeTipoEntradaCampo(
                                  t.id,
                                  "tipoComision",
                                  val
                                )
                              }
                            >
                              <Select.Trigger
                                size="3"
                                className="w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Select.Content
                                position="popper"
                                sideOffset={4}
                                className="w-[var(--radix-select-trigger-width)]"
                              >
                                <Select.Item value="FIJO">
                                  Precio fijo (S/)
                                </Select.Item>
                                <Select.Item value="PORCENTAJE">
                                  Porcentaje (%)
                                </Select.Item>
                              </Select.Content>
                            </Select.Root>
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              Valor de comisión
                            </label>
                            <TextField.Root
                              inputMode="numeric"
                              value={t.valorComision}
                              onChange={(e) =>
                                handleChangeTipoEntradaCampo(
                                  t.id,
                                  "valorComision",
                                  e.target.value
                                )
                              }
                              size="3"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTipoEntrada}
                  >
                    Agregar tipo de entrada
                  </Button>

                  {errors.tiposEntrada && (
                    <p className="text-sm text-red-400">
                      {errors.tiposEntrada}
                    </p>
                  )}
                </div>
              </div>

              {localSeleccionado && configLocalSeleccionado && (
                <>
                  <Separator my="2" size="4" />
                  <div className="space-y-3">
                    <Heading size="3">Mapa del local seleccionado</Heading>

                    <div className="rounded-xl border border-zinc-800/70 p-4 space-y-4">
                      {tipoLocalSeleccionado === "ESTADIO" && (
                        <StadiumZoneMapSelector
                          initialState={initialZoneState}
                          onChange={handleZoneSelectionChange}
                        />
                      )}

                      {tipoLocalSeleccionado === "TEATRO" && (
                        <TheaterZoneMapSelector
                          initialState={initialZoneState}
                          onChange={handleZoneSelectionChange}
                        />
                      )}

                      {tipoLocalSeleccionado === "AUDITORIO" && (
                        <>
                          {auditoriumSeatMap ? (
                            <SeatMapSelector
                              seatConfig={{
                                rows: auditoriumSeatMap.filas,
                                cols: auditoriumSeatMap.columnas,
                                blocked: (
                                  auditoriumSeatMap.asientosBloqueados || []
                                ).map((a) => [a.fila, a.columna]),
                              }}
                            />
                          ) : (
                            <Text size="2" color="var(--color-text)">
                              Este auditorio no tiene configuración de asientos
                              definida en el mock.
                            </Text>
                          )}
                        </>
                      )}
                    </div>

                    {seatMapZonaConfig && (
                      <div className="rounded-xl border border-zinc-800/70 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Heading size="3">
                            Distribución de asientos - {seatMapZonaId}
                          </Heading>
                          <Button
                            type="button"
                            variant="gray"
                            onClick={() => {
                              setSeatMapZonaId(null);
                              setSeatMapZonaConfig(null);
                            }}
                          >
                            Cerrar mapa
                          </Button>
                        </div>

                        <Text size="2" color="var(--color-text)">
                          Selecciona los asientos correspondientes a esta zona
                          para el tipo de entrada seleccionado.
                        </Text>

                        <SeatMapSelector
                          key={`${seatMapZonaId}-${tipoEntradaSeleccionadaId}`}
                          seatConfig={{
                            rows: seatMapZonaConfig.rows,
                            cols: seatMapZonaConfig.cols,
                            blocked: dynamicBlocked,
                          }}
                          initialSelected={currentSeatSelection}
                          onChange={handleSeatSelectionChange}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <Separator my="2" size="4" />

              <div className="space-y-4">
                <Heading size="3">Archivos del evento</Heading>

                <div className="space-y-2">
                  <Text size="2" color="var(--color-text)">
                    Banner del evento (imagen).
                  </Text>
                  <FilePicker
                    labelText="Cargar banner del evento"
                    name="banner"
                    required
                    accept="image/*"
                    multiple={false}
                    onChange={handleBannerChange}
                    fileName={bannerName}
                    error={errors.banner}
                  />
                </div>

                <div className="space-y-2">
                  <Text size="2" color="var(--color-text)">
                    Documentación de sustento (contratos, permisos, etc.).
                  </Text>
                  <FilePicker
                    labelText="Adjuntar documentación"
                    name="documentacion"
                    required
                    accept=".pdf,.zip,.rar"
                    multiple={false}
                    onChange={handleDocChange}
                    fileName={docName}
                    error={errors.documentacion}
                  />
                </div>
              </div>

              <Flex gap="3" justify="end" mt="3">
                <Button type="button" variant="gray">
                  <Link to="/">Cancelar</Link>
                </Button>
                <Button type="submit">Registrar evento</Button>
              </Flex>
            </Flex>
          </form>
        </div>
      </section>

      <Dialog.Root open={successOpen} onOpenChange={setSuccessOpen}>
        <Dialog.Content style={{ maxWidth: 520 }}>
          <Dialog.Title className="flex items-center gap-2">
            <CheckCircledIcon />
            Evento registrado
          </Dialog.Title>
          <Dialog.Description size="2" color="var(--color-text)">
            El evento se registró correctamente (mock).
          </Dialog.Description>
          <Flex mt="4" justify="end">
            <Button onClick={() => setSuccessOpen(false)}>Cerrar</Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </main>
  );
};

export default RegistrarEvento;

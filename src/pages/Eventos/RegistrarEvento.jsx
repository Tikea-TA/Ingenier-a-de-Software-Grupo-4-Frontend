// RegistrarEvento.jsx
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
import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";

import {
  ListaLocales,
  TiposEvento,
} from "../../lib/mock";

import StadiumZoneMapSelector from "../../components/StadiumZoneMapSelector";
import TheaterZoneMapSelector from "../../components/TheaterZoneMapSelector";
import SeatMapSelector from "../../components/SeatMapSelector";

// ---- util: archivo -> base64 ----
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

// ---- helper: arma estado inicial de zonas desde configuracionLocal.zonas ----
function buildInitialZoneStateFromMock(configuracionLocal) {
  if (!configuracionLocal || !configuracionLocal.zonas) return undefined;

  const { zonas } = configuracionLocal;
  const map = {};

  // zonas es un objeto: { zona_a: { estado, ...}, tribuna_oeste: {...}, ... }
  Object.entries(zonas).forEach(([zonaId, zonaCfg]) => {
    // En el mock ya usas "available" / "blocked" / "selected" como estado,
    // pero por si acaso mapeamos fallback:
    let estado = zonaCfg.estado;
    if (!estado) {
      if (zonaCfg.habilitada === false) estado = "blocked";
      else estado = "available";
    }
    map[zonaId] = estado;
  });

  return map;
}

export const RegistrarEvento = () => {
  const [errors, setErrors] = useState({});
  const [successOpen, setSuccessOpen] = useState(false);

  // -------- campos básicos --------
  const [nombreEvento, setNombreEvento] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [localSeleccionado, setLocalSeleccionado] = useState("");
  const [tipoEventoSeleccionado, setTipoEventoSeleccionado] = useState("");
  const [capacidadMaximaLocal, setCapacidadMaximaLocal] = useState(null);
  const [capacidadMaximaEvento, setCapacidadMaximaEvento] = useState("");

  // config del local seleccionado (desde mock)
  const [configLocalSeleccionado, setConfigLocalSeleccionado] = useState(null);
  const [tipoLocalSeleccionado, setTipoLocalSeleccionado] = useState("");

  // -------- tipos de entrada --------
  const [tiposEntrada, setTiposEntrada] = useState([
    {
      id: 1,
      nombre: "",
      tipo: "", // por ejemplo: "GENERAL", "VIP", etc.
      precio: "",
      tipoComision: "FIJO", // "FIJO" | "PORCENTAJE"
      valorComision: "",
    },
  ]);

  // -------- archivos --------
  const [bannerBase64, setBannerBase64] = useState("");
  const [bannerName, setBannerName] = useState("");
  const [docBase64, setDocBase64] = useState("");
  const [docName, setDocName] = useState("");

  // -------- handlers de archivo --------
  const handleBannerChange = async (files) => {
    const file = files?.[0];
    if (!file) {
      setBannerBase64("");
      setBannerName("");
      return;
    }
    setBannerName(file.name);
    try {
      const base64 = await fileToBase64(file);
      setBannerBase64(base64);
      if (errors.banner) {
        setErrors((prev) => ({ ...prev, banner: undefined }));
      }
    } catch (err) {
      console.error("Error banner -> base64", err);
      setErrors((prev) => ({
        ...prev,
        banner: "Error al procesar el banner.",
      }));
    }
  };

  const handleDocChange = async (files) => {
    const file = files?.[0];
    if (!file) {
      setDocBase64("");
      setDocName("");
      return;
    }
    setDocName(file.name);
    try {
      const base64 = await fileToBase64(file);
      setDocBase64(base64);
      if (errors.documentacion) {
        setErrors((prev) => ({ ...prev, documentacion: undefined }));
      }
    } catch (err) {
      console.error("Error doc -> base64", err);
      setErrors((prev) => ({
        ...prev,
        documentacion: "Error al procesar la documentación.",
      }));
    }
  };

  // -------- cambio de local --------
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

    // al cambiar de local, podrías resetear tipos de entrada si quieres
    // setTiposEntrada([...]);
  };

  // -------- cambio de tipo de evento --------
  const handleChangeTipoEvento = (value) => {
    setTipoEventoSeleccionado(value);
  };

  // -------- tipos de entrada (add/update/remove) --------
  const handleChangeTipoEntradaCampo = (id, campo, valor) => {
    setTiposEntrada((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              [campo]: valor,
            }
          : t
      )
    );
  };

  const handleAddTipoEntrada = () => {
    setTiposEntrada((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        nombre: "",
        tipo: "",
        precio: "",
        tipoComision: "FIJO",
        valorComision: "",
      },
    ]);
  };

  const handleRemoveTipoEntrada = (id) => {
    setTiposEntrada((prev) => prev.filter((t) => t.id !== id));
  };

  // -------- submit --------
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!nombreEvento.trim())
      newErrors.nombreEvento = "El nombre del espectáculo es obligatorio.";
    if (!fechaHora)
      newErrors.fechaHora = "La fecha y hora son obligatorias.";
    if (!localSeleccionado)
      newErrors.local = "Debes seleccionar un local.";
    if (!tipoEventoSeleccionado)
      newErrors.tipoEvento = "Debes seleccionar un tipo de evento.";

    if (!capacidadMaximaEvento) {
      newErrors.capacidadEvento = "La capacidad máxima del evento es obligatoria.";
    } else if (Number.isNaN(Number(capacidadMaximaEvento))) {
      newErrors.capacidadEvento = "La capacidad máxima debe ser numérica.";
    } else if (
      capacidadMaximaLocal &&
      Number(capacidadMaximaEvento) > Number(capacidadMaximaLocal)
    ) {
      newErrors.capacidadEvento =
        "La capacidad del evento no puede superar la capacidad del local.";
    }

    if (!bannerBase64) {
      newErrors.banner = "Debes cargar un banner para el evento.";
    }
    if (!docBase64) {
      newErrors.documentacion = "Debes adjuntar la documentación requerida.";
    }

    if (!tiposEntrada.length) {
      newErrors.tiposEntrada = "Debes configurar al menos un tipo de entrada.";
    } else {
      const algunInvalido = tiposEntrada.some((t) => {
        if (!t.nombre.trim()) return true;
        if (!t.precio || Number.isNaN(Number(t.precio))) return true;
        if (!t.valorComision || Number.isNaN(Number(t.valorComision)))
          return true;
        return false;
      });
      if (algunInvalido) {
        newErrors.tiposEntrada =
          "Todos los tipos de entrada deben tener nombre, precio y comisión válidos.";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // payload demo
    const payload = {
      nombreEvento: nombreEvento.trim(),
      fechaHora,
      idLocal: localSeleccionado,
      tipoEvento: tipoEventoSeleccionado,
      capacidadMaximaEvento: Number(capacidadMaximaEvento),
      tiposEntrada: tiposEntrada.map((t) => ({
        nombre: t.nombre.trim(),
        tipo: t.tipo,
        precio: Number(t.precio),
        tipoComision: t.tipoComision,
        valorComision: Number(t.valorComision),
      })),
      bannerBase64,
      documentacionBase64: docBase64,
      // Podrías también incluir lo que devuelvan los mapas (zonas/selecciones)
    };

    console.log("Payload evento:", payload);
    setSuccessOpen(true);
  };

  // -------- configuración inicial del mapa desde el mock --------
  const initialZoneState =
    configLocalSeleccionado
      ? buildInitialZoneStateFromMock(configLocalSeleccionado)
      : undefined;

  const auditoriumSeatMap =
    tipoLocalSeleccionado === "AUDITORIO" &&
    configLocalSeleccionado &&
    configLocalSeleccionado.mapaAsientos
      ? configLocalSeleccionado.mapaAsientos
      : null;

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

              {/* -------- Datos generales del evento -------- */}
              <div className="space-y-3">
                <Heading size="3">Datos del espectáculo</Heading>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Nombre del espectáculo */}
                  <div className="space-y-1">
                    <label
                      htmlFor="nombreEvento"
                      className="text-sm font-medium"
                    >
                      Nombre del espectáculo{" "}
                      <span className="text-red-500">*</span>
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
                      <p className="text-sm text-red-400">
                        {errors.nombreEvento}
                      </p>
                    )}
                  </div>

                  {/* Fecha y hora */}
                  <div className="space-y-1">
                    <label
                      htmlFor="fechaHora"
                      className="text-sm font-medium"
                    >
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
                      <p className="text-sm text-red-400">
                        {errors.fechaHora}
                      </p>
                    )}
                  </div>

                  {/* Selección del local */}
                  <div className="space-y-1">
                    <label
                      htmlFor="local"
                      className="block text-sm font-medium"
                    >
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
                        {ListaLocales.map((local) => (
                          <Select.Item
                            key={local.idLocal}
                            value={String(local.idLocal)}
                          >
                            {local.nombreEstablecimiento}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    {capacidadMaximaLocal !== null && (
                      <Text size="1" color="var(--color-text)">
                        Capacidad máxima del local:{" "}
                        <strong>{capacidadMaximaLocal}</strong> personas
                      </Text>
                    )}
                    {errors.local && (
                      <p className="text-sm text-red-400">
                        {errors.local}
                      </p>
                    )}
                  </div>

                  {/* Capacidad máxima del evento */}
                  <div className="space-y-1">
                    <label
                      htmlFor="capacidadEvento"
                      className="text-sm font-medium"
                    >
                      Capacidad máxima del evento{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <TextField.Root
                      id="capacidadEvento"
                      name="capacidadEvento"
                      inputMode="numeric"
                      pattern="[0-9]{1,12}"
                      maxLength={12}
                      value={capacidadMaximaEvento}
                      onChange={(e) =>
                        setCapacidadMaximaEvento(e.target.value)
                      }
                      required
                      size="3"
                    />
                    {errors.capacidadEvento && (
                      <p className="text-sm text-red-400">
                        {errors.capacidadEvento}
                      </p>
                    )}
                  </div>

                  {/* Tipo de evento */}
                  <div className="space-y-1">
                    <label
                      htmlFor="tipoEvento"
                      className="block text-sm font-medium"
                    >
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
                          <Select.Item
                            key={tipo.value}
                            value={String(tipo.value)}
                          >
                            {tipo.label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                    {errors.tipoEvento && (
                      <p className="text-sm text-red-400">
                        {errors.tipoEvento}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* -------- Configuración de tipos de entrada -------- */}
              <Separator my="2" size="4" />
              <div className="space-y-3">
                <Heading size="3">Tipos de entradas</Heading>
                <Text size="2" color="var(--color-text)">
                  Configura los tipos de entradas, precios y comisión por
                  entrada.
                </Text>

                <div className="space-y-3">
                  {tiposEntrada.map((t) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-zinc-800/70 p-4 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <Text size="2" className="font-medium">
                          Entrada #{t.id}
                        </Text>
                        {tiposEntrada.length > 1 && (
                          <button
                            type="button"
                            className="text-sm text-red-400 hover:underline"
                            onClick={() => handleRemoveTipoEntrada(t.id)}
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        {/* Nombre */}
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
                          />
                        </div>

                        {/* Tipo (opcional / libre) */}
                        <div className="space-y-1">
                          <label className="text-sm font-medium">
                            Tipo (ej. General, VIP)
                          </label>
                          <TextField.Root
                            value={t.tipo}
                            onChange={(e) =>
                              handleChangeTipoEntradaCampo(
                                t.id,
                                "tipo",
                                e.target.value
                              )
                            }
                            size="3"
                          />
                        </div>

                        {/* Precio */}
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
                          />
                        </div>

                        {/* Tipo de comisión */}
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

                        {/* Valor de comisión */}
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
                          />
                        </div>
                      </div>
                    </div>
                  ))}

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

              {/* -------- Mapa del local (debajo de tipos de entrada) -------- */}
              {localSeleccionado && configLocalSeleccionado && (
                <>
                  <Separator my="2" size="4" />
                  <div className="space-y-3">
                    <Heading size="3">Mapa del local seleccionado</Heading>
                    <Text size="2" color="var(--color-text)">
                      Visualiza la distribución del local según su tipo y
                      configuración guardada.
                    </Text>

                    <div className="rounded-xl border border-zinc-800/70 p-4">
                      {tipoLocalSeleccionado === "ESTADIO" && (
                        <StadiumZoneMapSelector
                          initialState={initialZoneState}
                        />
                      )}

                      {tipoLocalSeleccionado === "TEATRO" && (
                        <TheaterZoneMapSelector
                          initialState={initialZoneState}
                        />
                      )}

                      {tipoLocalSeleccionado === "AUDITORIO" && (
                        <>
                          {auditoriumSeatMap ? (
                            <SeatMapSelector
                              initialRows={auditoriumSeatMap.filas}
                              initialCols={auditoriumSeatMap.columnas}
                              initialBlocked={
                                auditoriumSeatMap.asientosBloqueados || []
                              }
                            />
                          ) : (
                            <Text size="2" color="var(--color-text)">
                              Este auditorio no tiene configuración de asientos
                              definida en el mock.
                            </Text>
                          )}
                        </>
                      )}

                      {!tipoLocalSeleccionado && (
                        <Text size="2" color="var(--color-text)">
                          Selecciona un local para visualizar su mapa.
                        </Text>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator my="2" size="4" />

              {/* -------- Archivos -------- */}
              <div className="space-y-4">
                <Heading size="3">Archivos del evento</Heading>

                {/* Banner */}
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

                {/* Documentación */}
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

      {/* -------- diálogo éxito -------- */}
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
            <Heading size="4">¡Evento registrado!</Heading>
            <Text size="2" color="var(--color-text)" align="center">
              Hemos registrado tu evento con la configuración seleccionada.
            </Text>
            <Flex gap="3" mt="3">
              <Button asChild>
                <Link to="/">Ir al inicio</Link>
              </Button>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </main>
  );
};

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heading, Text, Flex, Separator } from "@radix-ui/themes";
import { ArrowLeft, Lock, AlertCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { crearReserva, crearTicket, obtenerTicketsPorEvento } from "../../api/ticketService";

export const PantallaPago = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { items, getCartSummary, clearCart } = useCartStore();
  const summary = getCartSummary();

  const [paymentMethod, setPaymentMethod] = useState("tarjeta");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");

  // Datos de tarjeta
  const [cardData, setCardData] = useState({
    numeroTarjeta: "",
    nombreTitular: "",
    fechaExpiracion: "",
    cvv: "",
  });

  const [datosComprador, setDatosComprador] = useState({
    email: user?.correo || "",
    telefono: user?.telefono || "",
    nombre: user?.nombre || "",
  });

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "numeroTarjeta") {
      processedValue = value.replace(/\D/g, "").slice(0, 16);
    } else if (name === "fechaExpiracion") {
      processedValue = value.replace(/\D/g, "").slice(0, 4);
      if (processedValue.length === 2) {
        processedValue += "/";
      } else if (processedValue.length > 2) {
        processedValue = `${processedValue.slice(0, 2)}/${processedValue.slice(2, 4)}`;
      }
    } else if (name === "cvv") {
      processedValue = value.replace(/\D/g, "").slice(0, 3);
    }

    setCardData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleCompradorInputChange = (e) => {
    const { name, value } = e.target;
    setDatosComprador((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateCardData = () => {
    const errors = {};

    if (!cardData.numeroTarjeta || cardData.numeroTarjeta.length !== 16) {
      errors.numeroTarjeta = "Ingresa un número de tarjeta válido (16 dígitos)";
    }

    if (!cardData.nombreTitular.trim()) {
      errors.nombreTitular = "Ingresa el nombre del titular";
    }

    if (!cardData.fechaExpiracion || cardData.fechaExpiracion.length !== 5) {
      errors.fechaExpiracion = "Ingresa la fecha de expiración (MM/YY)";
    }

    if (!cardData.cvv || cardData.cvv.length !== 3) {
      errors.cvv = "Ingresa un CVV válido (3 dígitos)";
    }

    return errors;
  };

  const validateCompradorData = () => {
    const errors = {};

    if (!datosComprador.email.trim() || !datosComprador.email.includes("@")) {
      errors.email = "Ingresa un email válido";
    }

    if (!datosComprador.telefono.trim()) {
      errors.telefono = "Ingresa un número de teléfono";
    }

    if (!datosComprador.nombre.trim()) {
      errors.nombre = "Ingresa tu nombre";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setApiError("");

    // Validaciones
    const compradorErrors = validateCompradorData();
    if (Object.keys(compradorErrors).length > 0) {
      setError("Por favor, completa todos los datos del comprador");
      return;
    }

    let cardErrors = {};
    if (paymentMethod === "tarjeta") {
      cardErrors = validateCardData();
      if (Object.keys(cardErrors).length > 0) {
        setError("Por favor, ingresa datos de tarjeta válidos");
        return;
      }
    }

    if (items.length === 0) {
      setError("Tu carrito está vacío");
      return;
    }

    try {
      setIsProcessing(true);

        // Determinar idEvento: preferir summary.eventId, si no está, derivar del primer item
        const eventIdForReserva = summary.eventId || (items && items.length > 0 ? items[0].eventId : null);
        if (!eventIdForReserva) {
          setError("No se pudo determinar el evento para la reserva. Intenta desde la pantalla de selección de entradas.");
          setIsProcessing(false);
          return;
        }

        // Determinar idCliente a partir del user (varias formas posibles según el backend)
        const clientId =
          user?.id ||
          user?.idCliente ||
          user?.clienteId ||
          user?.id_usuario ||
          user?.idUsuario ||
          null;

        if (!clientId) {
          setError("No se pudo determinar el cliente (id). Vuelve a iniciar sesión e intenta de nuevo.");
          setIsProcessing(false);
          return;
        }

        // Paso 1: Crear reserva (temporal)
        const reservaPayload = {
          idCliente: clientId,
          idEvento: eventIdForReserva,
          asientos: items
            .filter((item) => item.type === "seat")
            .map((item) => ({
              idAsiento: item.seatId || null,
              numero: item.seatNumber || null,
              tipoEntrada: item.tipoEntradaId ? Number(item.tipoEntradaId) : null,
            })),
          zonas: items
            .filter((item) => item.type === "zone")
            .map((item) => ({
              idZona: item.zoneId ? Number(item.zoneId) : null,
              tipoEntrada: item.tipoEntradaId ? Number(item.tipoEntradaId) : null,
              cantidad: Number(item.quantity || 1),
            })),
          montoTotal: summary.total,
          descuentoAplicado: summary.discount || 0,
          codigoPromocion: summary.discountCode || null,
        };

      const reserva = await crearReserva(reservaPayload);
      console.log("Reserva creada:", reserva);

      // Paso 2: Consultar tickets existentes y crear tickets (después de confirmación de pago)
      // Obtener tickets ya creados para el evento para evitar duplicados por asiento
      let existingTickets = [];
      try {
        existingTickets = await obtenerTicketsPorEvento(eventIdForReserva);
      } catch (e) {
        console.warn("No se pudieron obtener tickets existentes para el evento:", e);
        existingTickets = [];
      }

      const existingAsientoIds = new Set(
        (existingTickets || [])
          .map((t) => t.asientoId)
          .filter((v) => v !== null && v !== undefined)
      );

      // Construir payloads usando los nombres esperados por el backend (DTO TicketRequest)
      const ticketsPayload = items
        // clonar y normalizar
        .map((item) => ({ ...item }))
        // deduplicar por asientoId (si aplica)
        .filter((v, i, arr) => {
          if (v.type === "seat") {
            const firstIndex = arr.findIndex((x) => x.seatId === v.seatId);
            return firstIndex === i;
          }
          return true;
        })
        .map((item) => {
        // construir una cadena única y convertirla a base64. Garantizar valor no nulo.
        const baseSeed = `${reserva.idReserva}-${item.zoneId ?? item.seatId ?? item.id ?? ""}-${Date.now()}`;
        let base64Code = null;
        try {
          if (typeof window !== "undefined" && typeof window.btoa === "function") {
            base64Code = window.btoa(baseSeed);
          } else if (typeof Buffer !== "undefined") {
            base64Code = Buffer.from(baseSeed).toString("base64");
          } else {
            // Fallback simple: encodeURIComponent -> unescape -> btoa-like
            base64Code = window && window.btoa ? window.btoa(unescape(encodeURIComponent(baseSeed))) : baseSeed;
          }
        } catch (e) {
          // En caso de fallo inesperado, garantizar al menos una cadena
          base64Code = `${reserva.idReserva}-${item.id || ""}-${Date.now()}`;
        }

        return {
          reservaId: reserva.idReserva,
          clienteId: clientId,
          eventoId: eventIdForReserva,
          zonaId: item.zoneId ? Number(item.zoneId) : null,
          asientoId: item.seatId ? Number(item.seatId) : null,
          // El backend espera un TipoTicket (enum). Usamos 'QR' por defecto para la simulación.
          tipo: "QR",
          precioCompra: item.price != null ? Number(item.price) : 0,
          descuentoAplicado: 0,
          estado: "DISPONIBLE",
          puntosGanados: 0,
          comision: 0,
          // Proveer un código base64 en la clave `codigoBase64` — el backend actual lee ese campo
          codigoBase64: base64Code,
          // Enviar `codigo` como base64 string (Jackson lo decodifica a byte[]) para evitar NPE en backend
          codigo: base64Code,
        };
      });

      // Filtrar ticketsPayload para omitir asientos que ya tienen ticket (evitar Duplicate entry)
      const ticketsToCreate = ticketsPayload.filter((t) => {
        if (t.asientoId != null) {
          return !existingAsientoIds.has(Number(t.asientoId));
        }
        return true;
      });

      if (ticketsToCreate.length !== ticketsPayload.length) {
        console.warn("Omitiendo creación de tickets já creados para algunos asientos.");
      }

      // Log payloads para diagnóstico
      console.debug("ticketsPayload", ticketsPayload);

      // Crear todos los tickets y capturar errores individuales
      for (const ticketData of ticketsToCreate) {
        try {
          console.debug("Creando ticket:", ticketData);
          await crearTicket(ticketData);
        } catch (ticketErr) {
          // Intentar extraer información útil del error del servidor
          const serverData = ticketErr?.response?.data;
          console.error("Error creando ticket", ticketData, ticketErr, serverData);

          // Mostrar mensaje detallado al usuario (stringify server data si existe)
          const serverMsg = serverData
            ? typeof serverData === "string"
              ? serverData
              : JSON.stringify(serverData)
            : ticketErr.message;

          setApiError(
            `Error creando ticket: ${serverMsg}` ||
              "Error al crear uno de los tickets. Revisa la consola para más detalles."
          );
        }
      }

      // Guardar datos en sessionStorage
      const compraData = {
        numeroCompra: reserva.idReserva,
        reservaId: reserva.idReserva,
        email: datosComprador.email,
        nombreComprador: datosComprador.nombre,
        telefono: datosComprador.telefono,
        montoTotal: Number(summary.total ?? summary.totalPrice ?? summary.subtotal ?? 0),
        descuento: Number(summary.discount || 0),
        asientos: items.map((it) => ({
          ...it,
          precio: Number(it.price || it.precio || 0),
        })),
        evento: {
          nombre: summary.eventName,
          fechaHora: summary.eventDate,
          local: summary.eventVenue,
        },
        fechaCompra: new Date().toISOString(),
        metodoPago: paymentMethod,
      };

      sessionStorage.setItem("numeroCompra", reserva.idReserva);
      sessionStorage.setItem("compraData", JSON.stringify(compraData));
      clearCart();

      // Redirigir a confirmación
      navigate("/confirmacion-compra", { state: { compra: compraData } });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Error al procesar el pago. Intenta nuevamente.";
      setApiError(message);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-background-dark text-text">
        <div className="border-b border-zinc-800 bg-slate-950/50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <Heading size="8" className="mb-2">
              Pago
            </Heading>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-300 mb-2">
                  Debes iniciar sesión
                </h3>
                <p className="text-amber-400 text-sm mb-4">
                  Para completar tu compra, necesitas estar autenticado.
                </p>
                <Button onClick={() => navigate("/login")}>Iniciar sesión</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background-dark text-text">
        <div className="border-b border-zinc-800 bg-slate-950/50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <Button
              variant="outline"
              onClick={() => navigate("/resumen-compra")}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Heading size="8" className="mb-2">
              Pago
            </Heading>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="text-center">
            <p className="text-subtle mb-6">Tu carrito está vacío</p>
            <Button onClick={() => navigate("/eventos")}>Explorar eventos</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-dark text-text">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-slate-950/50 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <Button
            variant="outline"
            onClick={() => navigate("/resumen-compra")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Heading size="8" className="mb-2">
            Completar Pago
          </Heading>
          <Text size="3" className="text-subtle">
            Ingresa tus datos para procesar el pago
          </Text>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Mensajes de error */}
          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-400">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {apiError && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-red-400">
              <p className="text-sm">{apiError}</p>
            </div>
          )}

          {/* Datos del comprador */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <Heading size="3" className="mb-6">
              Datos del Comprador
            </Heading>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={datosComprador.nombre}
                  onChange={handleCompradorInputChange}
                  placeholder="Tu nombre completo"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-text placeholder-zinc-500 outline-none transition-colors hover:border-zinc-600 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={datosComprador.email}
                  onChange={handleCompradorInputChange}
                  placeholder="tu@email.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-text placeholder-zinc-500 outline-none transition-colors hover:border-zinc-600 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-xs text-subtle mt-1">
                  Aquí recibirás tus entradas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={datosComprador.telefono}
                  onChange={handleCompradorInputChange}
                  placeholder="+51 900 000 000"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-text placeholder-zinc-500 outline-none transition-colors hover:border-zinc-600 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </section>

          {/* Método de pago */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <Heading size="3" className="mb-6">
              Método de Pago
            </Heading>

            <div className="space-y-3 mb-6">
              {["tarjeta", "yape", "plin"].map((method) => (
                <label key={method} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="capitalize font-medium">
                    {method === "tarjeta"
                      ? "Tarjeta de Crédito/Débito"
                      : method.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>

            {/* Datos de tarjeta (solo si está seleccionada) */}
            {paymentMethod === "tarjeta" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Número de Tarjeta
                  </label>
                  <input
                    type="text"
                    name="numeroTarjeta"
                    value={cardData.numeroTarjeta}
                    onChange={handleCardInputChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="16"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-text placeholder-zinc-500 outline-none transition-colors hover:border-zinc-600 focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nombre del Titular
                  </label>
                  <input
                    type="text"
                    name="nombreTitular"
                    value={cardData.nombreTitular}
                    onChange={handleCardInputChange}
                    placeholder="JUAN PÉREZ"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-text placeholder-zinc-500 outline-none transition-colors hover:border-zinc-600 focus:border-primary focus:ring-2 focus:ring-primary/20 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Expiración
                    </label>
                    <input
                      type="text"
                      name="fechaExpiracion"
                      value={cardData.fechaExpiracion}
                      onChange={handleCardInputChange}
                      placeholder="MM/YY"
                      maxLength="5"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-text placeholder-zinc-500 outline-none transition-colors hover:border-zinc-600 focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">CVV</label>
                    <input
                      type="password"
                      name="cvv"
                      value={cardData.cvv}
                      onChange={handleCardInputChange}
                      placeholder="123"
                      maxLength="3"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-text placeholder-zinc-500 outline-none transition-colors hover:border-zinc-600 focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Información de seguridad */}
            <div className="mt-6 flex items-center gap-2 text-xs text-subtle">
              <Lock className="h-4 w-4" />
              <span>Tu información está protegida con encriptación SSL</span>
            </div>
          </section>

          {/* Resumen de orden */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <Heading size="3" className="mb-4">
              Resumen de la Orden
            </Heading>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-subtle">Subtotal</span>
                <span>S/ {summary.subtotal.toFixed(2)}</span>
              </div>

              {summary.discount > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Descuento</span>
                  <span>-S/ {summary.discount.toFixed(2)}</span>
                </div>
              )}

              <Separator my="2" size="1" />

              <div className="flex justify-between text-lg font-bold">
                <span>Total a Pagar</span>
                <span className="text-primary">S/ {summary.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botones de acción */}
            <Button
              type="submit"
              disabled={isProcessing}
              className="w-full mb-2"
            >
              {isProcessing ? "Procesando pago..." : "Confirmar y Pagar"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/resumen-compra")}
              disabled={isProcessing}
              className="w-full"
            >
              Volver al carrito
            </Button>

            <p className="text-xs text-subtle text-center mt-4">
              Al confirmar, aceptas nuestros términos y condiciones
            </p>
          </section>
        </form>
      </div>
    </main>
  );
};

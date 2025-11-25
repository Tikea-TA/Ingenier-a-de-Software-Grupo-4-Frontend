import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heading, Text, Flex, Separator } from "@radix-ui/themes";
import { ArrowLeft, Lock, AlertCircle } from "lucide-react";
import Button from "../../components/ui/Button";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { crearReserva, crearTicket } from "../../api/ticketService";

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

      // Paso 1: Crear reserva (temporal)
      const reservaPayload = {
        idCliente: user?.id,
        idEvento: summary.eventId,
        asientos: items
          .filter((item) => item.type === "seat")
          .map((item) => ({
            numero: item.seatNumber,
            tipoEntrada: item.tipoEntradaId,
          })),
        zonas: items
          .filter((item) => item.type === "zone")
          .map((item) => ({
            idZona: item.zoneId,
            tipoEntrada: item.tipoEntradaId,
            cantidad: item.quantity || 1,
          })),
        montoTotal: summary.total,
        descuentoAplicado: summary.discount || 0,
        codigoPromocion: summary.discountCode || null,
      };

      const reserva = await crearReserva(reservaPayload);
      console.log("Reserva creada:", reserva);

      // Paso 2: Crear tickets (después de confirmación de pago)
      const ticketsPayload = items.map((item) => ({
        idReserva: reserva.idReserva,
        idCliente: user?.id,
        idEvento: summary.eventId,
        idZona: item.zoneId || null,
        numeroAsiento: item.seatNumber || null,
        tipoEntrada: item.tipoEntrada,
        precio: item.price,
        estado: "DISPONIBLE", // Estado inicial del ticket
        fechaCompra: new Date().toISOString(),
        codigoQR: `${reserva.idReserva}-${item.id}`, // Formato básico, el backend generará uno real
      }));

      // Crear todos los tickets
      for (const ticketData of ticketsPayload) {
        await crearTicket(ticketData);
      }

      // Guardar datos en sessionStorage
      const compraData = {
        numeroCompra: reserva.idReserva,
        reservaId: reserva.idReserva,
        email: datosComprador.email,
        nombreComprador: datosComprador.nombre,
        telefono: datosComprador.telefono,
        montoTotal: summary.total,
        descuento: summary.discount || 0,
        asientos: items,
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

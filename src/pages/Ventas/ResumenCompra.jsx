import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heading, Text, Flex, Separator } from "@radix-ui/themes";
import { ArrowLeft, Trash2, Tag } from "lucide-react";
import Button from "../../components/ui/Button";
import { useCartStore } from "../../store/useCartStore";
import { validarCupon } from "../../api/ticketService";

export const ResumenCompra = () => {
  const navigate = useNavigate();
  const {
    items,
    eventName,
    eventDate,
    removeItem,
    setDiscount,
    clearCart,
    getTotalItems,
    getCartSummary,
  } = useCartStore();

  const [cupomCode, setCupomCode] = useState("");
  const [cupomError, setCupomError] = useState("");
  const [cupomSuccess, setCupomSuccess] = useState("");
  const [isValidatingCupom, setIsValidatingCupom] = useState(false);

  const summary = getCartSummary();

  const handleValidateCupom = async () => {
    if (!cupomCode.trim()) {
      setCupomError("Ingresa un código de cupón");
      return;
    }

    try {
      setIsValidatingCupom(true);
      setCupomError("");
      setCupomSuccess("");

      const result = await validarCupon(cupomCode, summary.eventId);

      if (result.valido) {
        setDiscount(result.descuento, cupomCode, result.idPromocion);
        setCupomSuccess(`Cupón aplicado: descuento de S/ ${result.descuento}`);
        setCupomCode("");
      } else {
        setCupomError(result.mensaje || "Cupón no válido");
      }
    } catch (error) {
      setCupomError(
        error?.response?.data?.message || "Error al validar el cupón"
      );
    } finally {
      setIsValidatingCupom(false);
    }
  };

  const handleContinuePayment = () => {
    if (items.length === 0) {
      navigate("/eventos");
      return;
    }
    navigate("/pago");
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background-dark text-text">
        <div className="border-b border-zinc-800 bg-slate-950/50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <Button
              variant="outline"
              onClick={() => navigate("/eventos")}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Heading size="8" className="mb-2">
              Tu Carrito
            </Heading>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-center">
            <p className="text-subtle mb-6">Tu carrito está vacío</p>
            <Button onClick={() => navigate("/eventos")}>
              Explorar eventos
            </Button>
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
            Volver
          </Button>
          <Heading size="8" className="mb-2">
            Tu Carrito
          </Heading>
          <Text size="3" className="text-subtle">
            Revisa y confirma tus entradas
          </Text>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Listado de entradas */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {/* Información del evento */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <Heading size="4" className="mb-3">
                  {eventName}
                </Heading>
                <Text size="2" className="text-subtle">
                  {eventDate && new Date(eventDate).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </div>

              {/* Entradas */}
              <div className="space-y-3">
                <Heading size="4">Entradas ({getTotalItems()})</Heading>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{item.tipoEntrada}</p>
                        {item.type === "seat" && (
                          <p className="text-sm text-subtle">
                            Asiento: {item.seatNumber}
                          </p>
                        )}
                        {item.type === "zone" && (
                          <p className="text-sm text-subtle">
                            Zona: {item.zoneName}
                          </p>
                        )}
                        <p className="text-sm font-medium text-primary mt-2">
                          S/ {item.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-lg hover:bg-red-950/20 text-red-400 transition-colors"
                        aria-label="Eliminar entrada"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cupón de descuento */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <Heading size="4" className="mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Aplicar Cupón
                </Heading>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Código de cupón"
                      value={cupomCode}
                      onChange={(e) => setCupomCode(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-text placeholder-zinc-500 outline-none transition-colors hover:border-zinc-600 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <Button
                      onClick={handleValidateCupom}
                      disabled={!cupomCode.trim() || isValidatingCupom}
                      className="min-w-fit"
                    >
                      {isValidatingCupom ? "Validando..." : "Aplicar"}
                    </Button>
                  </div>

                  {cupomError && (
                    <p className="text-sm text-red-400">{cupomError}</p>
                  )}
                  {cupomSuccess && (
                    <p className="text-sm text-green-400">{cupomSuccess}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de precios */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 sticky top-4">
              <Heading size="3" className="mb-6">
                Resumen
              </Heading>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-subtle">Subtotal</span>
                  <span className="font-medium">
                    S/ {summary.subtotal.toFixed(2)}
                  </span>
                </div>

                {summary.discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-400">
                      <span>Descuento</span>
                      <span className="font-medium">
                        -S/ {summary.discount.toFixed(2)}
                      </span>
                    </div>
                    <Separator my="2" size="1" />
                  </>
                )}

                <div className="flex justify-between text-lg font-bold pt-2 border-t border-zinc-700">
                  <span>Total</span>
                  <span className="text-primary">
                    S/ {summary.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="space-y-2">
                <Button onClick={handleContinuePayment} className="w-full">
                  Continuar al Pago
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/eventos")}
                  className="w-full"
                >
                  Seguir comprando
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    clearCart();
                    navigate("/eventos");
                  }}
                  className="w-full text-red-400 hover:text-red-300"
                >
                  Vaciar carrito
                </Button>
              </div>

              {/* Información adicional */}
              <div className="mt-6 pt-6 border-t border-zinc-800 space-y-2 text-xs text-subtle">
                <p>✓ Entradas digitales enviadas por email</p>
                <p>✓ Cambios y devoluciones según política</p>
                <p>✓ Compra segura con SSL</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

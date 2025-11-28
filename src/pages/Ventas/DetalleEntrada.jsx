import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Heading, Text } from "@radix-ui/themes";
import { ArrowLeft, Download, Share2, Copy } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import Button from "../../components/ui/Button";

export const DetalleEntrada = () => {
  const navigate = useNavigate();
  const { numeroCompra } = useParams();
  const location = useLocation();
  const [copiado, setCopiado] = useState(false);

  const compra = location.state?.compra;

  if (!compra) {
    return (
      <main className="min-h-screen bg-background-dark text-text">
        <div className="border-b border-zinc-800 bg-slate-950/50 py-8">
          <div className="mx-auto max-w-4xl px-4">
            <Button
              variant="outline"
              onClick={() => navigate("/mis-entradas")}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Heading size="8" className="mb-2">
              Detalle de Entrada
            </Heading>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="text-center">
            <p className="text-subtle mb-4">No se encontró la entrada</p>
            <Button onClick={() => navigate("/mis-entradas")}>
              Volver a mis entradas
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const handleCopiarNumero = () => {
    navigator.clipboard.writeText(compra.numeroCompra);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleDescargar = () => {
    // En una aplicación real, esto descargaría el PDF
    console.log("Descargar entrada:", numeroCompra);
  };

  const handleCompartir = async () => {
    const texto = `Voy al evento: ${compra.evento.nombre}. ¡Te espero allá! #Tikea`;
    if (navigator.share) {
      navigator.share({
        title: "Tikea - Mis entradas",
        text: texto,
        url: window.location.href,
      });
    }
  };

  const qrValue = JSON.stringify({
    numeroCompra: compra.numeroCompra,
    evento: compra.evento.nombre,
    email: compra.email,
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-background-dark text-text">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-slate-950/50 py-8">
        <div className="mx-auto max-w-4xl px-4">
          <Button
            variant="outline"
            onClick={() => navigate("/mis-entradas")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Heading size="8" className="mb-2">
            Detalle de Entrada
          </Heading>
          <Text size="3" className="text-subtle">
            Compra #{compra.numeroCompra}
          </Text>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Información del evento */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden mb-8">
          {compra.evento.banner && (
            <div className="w-full h-80 overflow-hidden">
              <img
                src={compra.evento.banner}
                alt={compra.evento.nombre}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <Heading size="6" className="mb-2">
              {compra.evento.nombre}
            </Heading>

            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div>
                <p className="text-sm text-subtle mb-1">Fecha y Hora</p>
                <p className="font-medium">
                  {formatDate(compra.evento.fechaHora)}
                </p>
              </div>

              <div>
                <p className="text-sm text-subtle mb-1">Ubicación</p>
                <p className="font-medium">{compra.evento.local}</p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDescargar} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar
              </Button>

              {navigator.share && (
                <Button onClick={handleCompartir} variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Compartir
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Datos de compra */}
          <div className="lg:col-span-2 space-y-6">
            {/* Número de compra */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <Heading size="3" className="mb-4">
                Información de Compra
              </Heading>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-subtle mb-2">Número de Compra</p>
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-mono font-bold text-primary bg-zinc-800 px-4 py-2 rounded-lg">
                      {compra.numeroCompra}
                    </code>
                    <button
                      onClick={handleCopiarNumero}
                      className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Copiar número"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  {copiado && (
                    <p className="text-xs text-green-400 mt-1">
                      Copiado al portapapeles
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-subtle mb-1">Fecha de Compra</p>
                    <p className="font-medium">
                      {new Date(compra.fechaCompra).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-subtle mb-1">Método de Pago</p>
                    <p className="font-medium capitalize">
                      {compra.metodoPago === "tarjeta"
                        ? "Tarjeta de Crédito"
                        : compra.metodoPago?.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Entradas adquiridas */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <Heading size="3" className="mb-4">
                Entradas
              </Heading>

              <div className="space-y-3">
                {compra.asientos && compra.asientos.length > 0 ? (
                  compra.asientos.map((asiento, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-4 rounded-lg bg-zinc-800/50 border border-zinc-700"
                    >
                      <div>
                        <p className="font-medium">
                          {asiento.tipoEntrada || "Entrada General"}
                        </p>
                        <p className="text-sm text-subtle">
                          {asiento.tipo === "seat"
                            ? `Asiento ${asiento.numero}`
                            : `Zona ${asiento.zona}`}
                        </p>
                      </div>
                      <p className="text-primary font-bold">
                        S/ {asiento.precio?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-subtle">Sin asientos registrados</p>
                )}
              </div>
            </div>

            {/* Resumen de precios */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <Heading size="3" className="mb-4">
                Resumen
              </Heading>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-subtle">Subtotal</span>
                  <span>
                    S/ {(compra.montoTotal + (compra.descuento || 0)).toFixed(2)}
                  </span>
                </div>

                {compra.descuento > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Descuento</span>
                    <span>-S/ {compra.descuento.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-zinc-700 pt-3 flex justify-between text-lg font-bold">
                  <span>Total Pagado</span>
                  <span className="text-primary">
                    S/ {compra.montoTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QR y validación */}
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 flex flex-col items-center">
              <Heading size="3" className="mb-4 text-center">
                Código QR
              </Heading>

              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeCanvas
                  value={qrValue}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p className="text-xs text-subtle text-center">
                Escanea este código al momento de entrar al evento
              </p>
            </div>

            {/* Datos del comprador */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <Heading size="3" className="mb-4">
                Comprador
              </Heading>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-subtle mb-1">Nombre</p>
                  <p className="font-medium">{compra.nombreComprador}</p>
                </div>

                <div>
                  <p className="text-xs text-subtle mb-1">Correo</p>
                  <p className="font-medium text-sm break-all">
                    {compra.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-subtle mb-1">Teléfono</p>
                  <p className="font-medium">{compra.telefono}</p>
                </div>
              </div>
            </div>

            {/* Estado de validación */}
            <div className="rounded-xl border border-green-900/50 bg-green-950/20 p-6">
              <p className="text-sm text-green-400 text-center">
                ✓ Entrada verificada y validada
              </p>
            </div>
          </div>
        </div>

        {/* Información de soporte */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <Heading size="4" className="mb-2">
            ¿Necesitas ayuda?
          </Heading>
          <p className="text-subtle mb-4">
            Si tienes problemas con tu entrada, contacta a nuestro equipo de soporte
          </p>
          <a
            href="mailto:support@tikea.com"
            className="text-primary hover:underline font-medium"
          >
            support@tikea.com
          </a>
        </div>
      </div>
    </main>
  );
};

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Heading, Text } from "@radix-ui/themes";
import { CheckCircle2, Copy, Download, ArrowRight } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import Button from "../../components/ui/Button";

export const ConfirmacionCompra = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [compra, setCompra] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    // Obtener datos de compra del estado de navegación o sessionStorage
    const compraData =
      location.state?.compra ||
      (() => {
        try {
          const stored = sessionStorage.getItem("compraData");
          return stored ? JSON.parse(stored) : null;
        } catch {
          return null;
        }
      })();

    if (!compraData) {
      navigate("/eventos");
      return;
    }

    setCompra(compraData);
  }, [location, navigate]);

  const handleCopiarNumero = () => {
    if (compra?.numeroCompra) {
      navigator.clipboard.writeText(compra.numeroCompra);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const handleDescargarTicket = () => {
    // Abrir diálogo de impresión para descargar/guardar la confirmación
    try {
      window.print();
    } catch (e) {
      console.error("No se pudo abrir la impresión:", e);
    }
  };

  if (!compra) {
    return (
      <main className="min-h-screen bg-background-dark text-text flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-primary"></div>
          <p className="mt-3 text-subtle">Cargando confirmación...</p>
        </div>
      </main>
    );
  }

  const qrValue = JSON.stringify({
    numeroCompra: compra.numeroCompra,
    eventos: compra.eventos,
    email: compra.email,
  });

  const totalPagado = Number(compra.montoTotal ?? compra.total ?? compra.totalPrice ?? 0);

  return (
    <main className="min-h-screen bg-background-dark text-text">
      {/* Fondo animado */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-zinc-800 bg-slate-950/50 py-8">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/50 mb-4 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <Heading size="8" className="mb-2 text-green-400">
              ¡Compra Confirmada!
            </Heading>
            <Text size="3" className="text-subtle">
              Tus entradas han sido procesadas exitosamente
            </Text>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-8">
          {/* Información principal */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Datos de compra */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-subtle mb-1">Número de Compra</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xl font-mono font-bold text-primary">
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
                    <p className="text-xs text-green-400 mt-1">Copiado al portapapeles</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-subtle mb-1">Fecha de Compra</p>
                  <p className="font-medium">
                    {new Date(compra.fechaCompra).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-subtle mb-1">Correo de Confirmación</p>
                  <p className="font-medium">{compra.email}</p>
                </div>

                <div>
                  <p className="text-sm text-subtle mb-1">Total Pagado</p>
                    <p className="text-2xl font-bold text-primary">
                      S/ {totalPagado.toFixed(2)}
                    </p>
                </div>

                {/* Botones de descarga */}
                <div className="space-y-2 pt-4">
                  <Button
                    onClick={handleDescargarTicket}
                    className="w-full gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar Ticket
                  </Button>
                </div>
              </div>

              {/* Código QR */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-white p-4 rounded-lg mb-4">
                  <QRCodeCanvas
                    value={qrValue}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-subtle text-center">
                  Escanea este código QR al momento de entrar al evento
                </p>
              </div>
            </div>
          </div>

          {/* Detalle de entradas */}
          {compra.asientos && compra.asientos.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 mb-8">
              <Heading size="4" className="mb-4">
                Entradas Adquiridas
              </Heading>

              <div className="space-y-3">
                {compra.asientos.map((asiento, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-4 rounded-lg bg-zinc-800/50 border border-zinc-700"
                  >
                    <div>
                      <p className="font-medium">{asiento.tipoEntrada}</p>
                      <p className="text-sm text-subtle">
                        {asiento.tipo === "seat"
                          ? `Asiento: ${asiento.numero}`
                          : `Zona: ${asiento.zona}`}
                      </p>
                    </div>
                    <p className="text-primary font-bold">
                      S/ {Number(asiento.precio || asiento.price || 0).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información importante */}
          <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-8 mb-8">
            <Heading size="4" className="mb-4 text-amber-300">
              Información Importante
            </Heading>

            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  Tus entradas digitales han sido enviadas a{" "}
                  <strong>{compra.email}</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  Presenta el código QR o tus entradas al momento de ingresar
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  Revisa tu bandeja de spam si no recibes el correo en 5 minutos
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span>
                  Puedes descargar y guardar tus entradas desde tu perfil
                </span>
              </li>
            </ul>
          </div>

          {/* Botones de acción finales */}
          <div className="grid md:grid-cols-2 gap-4">
            <Button
              onClick={() => navigate("/mis-entradas")}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Ver mis entradas
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/eventos")}
              className="gap-2"
            >
              Seguir comprando
            </Button>
          </div>

          {/* Soporte */}
          <div className="mt-12 p-6 rounded-lg bg-zinc-900/30 border border-zinc-800 text-center">
            <p className="text-subtle mb-2">¿Tienes dudas o problemas?</p>
            <p className="text-sm">
              Contacta a nuestro equipo de soporte en{" "}
              <a href="mailto:support@tikea.com" className="text-primary hover:underline">
                support@tikea.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Theme, Flex, Separator } from "@radix-ui/themes";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { buscarPromocionPorId, actualizarPromocion } from "../../api/promocionService.js";

import Button from "../../components/ui/Button";

import { SeleccionarPromocion } from "./SeleccionarPromocion.jsx";
import { RellenarFormulario } from "./RellenarFormulario.jsx";
import { ResumenPromocion } from "./ResumenPromocion.jsx";

import Validation from "../../components/Promociones/PromocionValidation.js";

export const EditarPromocion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [promocionData, setPromocionData] = useState({
    tipoPromocion: null,
    nombrePromocion: "",
    descripcion: "",
    valorDescuento: "",
    fechaInicio: "",
    fechaFin: "",
    stockDisponible: "",
    condicionesCanal: "",
    condicionesSector: "",
    idEvento: 1,
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPromocion = async () => {
      try {
        const data = await buscarPromocionPorId(id);
        console.log("Datos de promoción obtenidos:", data);
        
        // Format dates for input fields (YYYY-MM-DD)
        const formatDateForInput = (dateString) => {
          if (!dateString) return "";
          // If date is already in YYYY-MM-DD format, return as is
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
          }
          // Otherwise, try to parse and format
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return "";
          return date.toISOString().split('T')[0];
        };

        setPromocionData({
          tipoPromocion: data.tipo,
          nombrePromocion: data.nombre,
          descripcion: data.descripcion,
          valorDescuento: data.valorDescuento.toString(),
          fechaInicio: formatDateForInput(data.fechaInicio),
          fechaFin: formatDateForInput(data.fechaFin),
          stockDisponible: data.stockDisponible.toString(),
          condicionesCanal: data.condicionesCanal || "",
          condicionesSector: data.condicionesSector || "",
          idEvento: data.idEvento || 1,
        });
      } catch (error) {
        console.error("Error fetching promotion:", error);
        setApiError("No se pudo cargar la promoción");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPromocion();
    }
  }, [id]);

  const handleNext = async () => {
    console.log("Datos actuales de la promoción:", promocionData);

    setErrors({});
    setApiError("");

    if (currentStep === 2) {
      const validationErrors = Validation(promocionData);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    if (currentStep === 3) {
      setIsSubmitting(true);
      try {
        const payload = {
          nombre: promocionData.nombrePromocion,
          descripcion: promocionData.descripcion,
          tipo: promocionData.tipoPromocion,
          valorDescuento: parseFloat(promocionData.valorDescuento) || 0,
          fechaInicio: promocionData.fechaInicio,
          fechaFin: promocionData.fechaFin,
          stockDisponible: parseInt(promocionData.stockDisponible, 10) || 0,
          condicionesCanal: promocionData.condicionesCanal,
          condicionesSector: promocionData.condicionesSector,
        };
        await actualizarPromocion(id, payload);
        // Navigate back to event details
        navigate(-1);
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          "Error al actualizar la promoción. Por favor, intenta nuevamente.";
        setApiError(message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (currentStep < 3) {
      setCurrentStep((step) => step + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
    }
  };

  const updateData = (key, value) => {
    setPromocionData((prevData) => ({
      ...prevData,
      [key]: value,
    }));

    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return promocionData.tipoPromocion !== null;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const nextButtonText =
    currentStep === 3
      ? isSubmitting
        ? "Guardando..."
        : "Actualizar Promoción"
      : "Siguiente";

  if (loading) {
    return (
      <Theme appearance="dark">
        <main className="flex h-full min-h-screen w-full bg-background-dark text-text items-center justify-center">
          <div className="text-white">Cargando promoción...</div>
        </main>
      </Theme>
    );
  }

  return (
    <Theme appearance="dark">
      <main className="flex h-full min-h-screen w-full bg-background-dark text-text">
        <section className="mx-auto max-w-3xl w-full px-4 py-6 md:py-12">
          <div className="rounded-2xl bg-slate-950/95 p-6 md:p-10 shadow-2xl">
            <h1 className="text-2xl font-bold text-white mb-6">Editar Promoción</h1>
            
            {apiError && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-4 text-red-400 ring-1 ring-red-500/20">
                {apiError}
              </div>
            )}

            <div className="min-h-[300px]">
              <div style={{ display: currentStep === 1 ? "block" : "none" }}>
                <SeleccionarPromocion
                  data={promocionData}
                  updateData={updateData}
                />
              </div>
              <div style={{ display: currentStep === 2 ? "block" : "none" }}>
                <RellenarFormulario
                  data={promocionData}
                  updateData={updateData}
                  errors={errors}
                />
              </div>
              <div style={{ display: currentStep === 3 ? "block" : "none" }}>
                <ResumenPromocion
                  data={promocionData}
                  updateData={updateData}
                />
              </div>
            </div>

            <Separator my="5" size="4" />
            <Flex justify="between" align="center">
              <Button
                variant="ghost"
                size="3"
                className="text-subtle hover:bg-white/10 cursor-pointer"
                onClick={handleBack}
                disabled={currentStep === 1}
                style={{
                  visibility: currentStep === 1 ? "hidden" : "visible",
                }}
              >
                <ArrowLeft size={18} />
                Atrás
              </Button>

              <Button
                size="3"
                onClick={handleNext}
                disabled={!isStepComplete()}
              >
                {nextButtonText}
                <ArrowRight size={18} />
              </Button>
            </Flex>
          </div>
        </section>
      </main>
    </Theme>
  );
};

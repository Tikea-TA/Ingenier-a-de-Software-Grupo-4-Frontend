import api from "./axiosConfig";

// Obtener solo los locales pendientes
export const obtenerLocalesPendientes = async (idGestor = null) => {
  let url = "/establecimientos/estado/PENDIENTE_VALIDACION";
  
  // Si tenemos un ID de gestor, usamos el endpoint específico
  if (idGestor) {
    url = `/establecimientos/gestor/${idGestor}/estado/PENDIENTE_VALIDACION`;
  }

  const { data } = await api.get(url);
  return data;
};

// Actualizar el estado (Aprobar o Rechazar)
export const validarLocal = async (idEstablecimiento, nuevoEstado) => {
  const payload = {
    estado: nuevoEstado, 
    fechaVerificacion: new Date().toISOString()
  };
  const { data } = await api.put(`/establecimientos/${idEstablecimiento}`, payload);
  return data;
};

// Función para descargar el archivo directamente
export const descargarDocumento = async (idEstablecimiento, nombreArchivo) => {
  try {
    const response = await api.get(`/establecimientos/${idEstablecimiento}/documento`, {
      responseType: 'blob', // Importante para manejar archivos binarios
    });

    // Crear un link temporal en el navegador para forzar la descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Doc_${nombreArchivo}.pdf`); // Nombre sugerido
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Error al descargar documento:", error);
    alert("No se pudo descargar el documento (puede que no exista).");
  }
};
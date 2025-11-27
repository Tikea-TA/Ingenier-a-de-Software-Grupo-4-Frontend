import api from "./axiosConfig";

// Registrar
export const registrarEvento = async (formData) => {
  const { data } = await api.post("/eventos/registro", formData);
  return data;
};

// Obtener pendientes
export const obtenerEventosPendientes = async (idGestor) => {
  const endpoint = idGestor 
    ? `/eventos/gestor/${idGestor}/pendientes`
    : `/eventos/gestor/0/pendientes`;
  const { data } = await api.get(endpoint);
  return data;
};

// Validar
export const validarEvento = async (idEvento, nuevoEstado) => {
  const { data } = await api.put(`/eventos/${idEvento}/validacion`, null, {
    params: { nuevoEstado }
  });
  return data;
};

// Descargar Doc
export const descargarDocumentoEvento = async (idEvento, nombreEvento) => {
  try {
    const response = await api.get(`/eventos/${idEvento}/documentacion`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sustento_${nombreEvento}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Error descarga:", error);
    alert("No se pudo descargar el documento.");
  }
};
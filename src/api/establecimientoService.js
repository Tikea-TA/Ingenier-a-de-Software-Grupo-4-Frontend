import api from "./axiosConfig";

<<<<<<< HEAD
export const obtenerTodosEstablecimientos = async () => {
  const { data } = await api.get("/establecimientos");
  return data;
};

export const registrarEstablecimiento = async (payload) => {
  const { data } = await api.post("/establecimientos/registro", payload);
  return data;
};

export const obtenerEstablecimiento = async (idEstablecimiento) => {
  const { data } = await api.get(`/establecimientos/${idEstablecimiento}`);
  return data;
};

export const obtenerEstablecimientosPorGestor = async (idGestor) => {
  const { data } = await api.get(`/establecimientos/gestor/${idGestor}`);
  return data;
};

export const obtenerEstablecimientosActivosPorGestor = async (idGestor) => {
  const { data } = await api.get(`/establecimientos/gestor/${idGestor}/activos`);
  return data;
};

export const obtenerEstablecimientosPorTipo = async (tipo) => {
  const { data } = await api.get(`/establecimientos/tipo/${tipo}`);
  return data;
};

export const obtenerEstablecimientosPorEstado = async (estado) => {
  const { data } = await api.get(`/establecimientos/estado/${estado}`);
  return data;
};

export const obtenerEstablecimientosActivos = async () => {
  const { data } = await api.get("/establecimientos/activos");
  return data;
};

export const actualizarEstablecimiento = async (idEstablecimiento, payload) => {
=======
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
>>>>>>> main
  const { data } = await api.put(`/establecimientos/${idEstablecimiento}`, payload);
  return data;
};

<<<<<<< HEAD
export const eliminarEstablecimiento = async (idEstablecimiento) => {
  const { data } = await api.delete(`/establecimientos/${idEstablecimiento}`);
  return data;
};

export const obtenerEstablecimientosPorEstadoYGestor = async (idGestor, estado) => {
  const { data } = await api.get(`/establecimientos/gestor/${idGestor}/estado/${estado}`);
  return data;
};

export const descargarDocumentacion = async (idEstablecimiento) => {
  const response = await api.get(`/establecimientos/${idEstablecimiento}/documento`, {
    responseType: "blob",
  });
  return response.data;
};
=======
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
>>>>>>> main

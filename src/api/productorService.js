import api from "./axiosConfig";

export const registrarProductor = async (payload) => {
  const { data } = await api.post("/productores/registro", payload);
  return data;
};

export const actualizarProductor = async (id, formData) => {
  const { data } = await api.put(`/productores/${id}`, payload);
  return data;
};

export const eliminarProductor = async (id) => {
  const response = await api.delete(`/productores/${id}`);
  return response.data;
};

export const listarProductores = async () => {
  const response = await api.get("/productores");
  return response.data;
};

export const buscarProductorPorId = async (id) => {
  const response = await api.get(`/productores/${id}`);
  return response.data;
};

export const listarProductoresPorGestor = async (idGestor) => {
  const response = await api.get(`/productores/gestor/${idGestor}`);
  return response.data;
};


export const listarProductoresPorEstado = async (estado) => {
  const response = await api.get(`/productores/estado/${estado}`);
  return response.data;
};

export const obtenerProductoresPendientes = async (idGestor) => {
  // Si hay ID de gestor, lo usamos. Si no, podrías manejar una ruta genérica o enviar '0'
  const endpoint = idGestor 
    ? `/productores/gestor/${idGestor}/pendientes`
    : `/productores/gestor/0/pendientes`; // Asumiendo que 0 o null en el back devuelve todos

  const { data } = await api.get(endpoint);
  return data;
};

export const validarProductor = async (idProductor, nuevoEstado) => {
  const { data } = await api.put(`/productores/${idProductor}/validacion`, null, {
    params: { nuevoEstado }
  });
  return data;
};

export const descargarDocumentoProductor = async (idProductor, nombreArchivo) => {
  try {
    const response = await api.get(`/productores/${idProductor}/documento`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sustento_${nombreArchivo}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Error descarga:", error);
    alert("No se pudo descargar el documento.");
  }
};

export const loginProductor = async (credentials) => {
  const { data } = await api.post("/productores/login", credentials);
  return data;
};
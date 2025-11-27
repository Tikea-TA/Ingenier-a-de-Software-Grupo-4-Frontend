import api from "./axiosConfig";

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
  const { data } = await api.put(`/establecimientos/${idEstablecimiento}`, payload);
  return data;
};

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

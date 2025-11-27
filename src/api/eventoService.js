import api from "./axiosConfig";

export const obtenerTodosEventos = async () => {
  const { data } = await api.get("/eventos");
  return data;
};

export const registrarEvento = async (payload) => {
  const { data } = await api.post("/eventos/registro", payload);
  return data;
};

export const obtenerEvento = async (idEvento) => {
  const { data } = await api.get(`/eventos/${idEvento}`);
  return data;
};

export const obtenerEventosPorEstablecimiento = async (idEstablecimiento) => {
  const { data } = await api.get(`/eventos/establecimiento/${idEstablecimiento}`);
  return data;
};

export const obtenerEventosPorProductor = async (idProductor) => {
  const { data } = await api.get(`/eventos/productor/${idProductor}`);
  return data;
};

export const obtenerEventosPorGestor = async (idGestor) => {
  const { data } = await api.get(`/eventos/gestor/${idGestor}`);
  return data;
};

export const obtenerEventosPorCategoria = async (categoria) => {
  const { data } = await api.get(`/eventos/categoria/${categoria}`);
  return data;
};

export const obtenerEventosPorEstado = async (estado) => {
  const { data } = await api.get(`/eventos/estado/${estado}`);
  return data;
};

export const obtenerEventosPorFecha = async (fecha) => {
  const { data } = await api.get(`/eventos/fecha/${fecha}`);
  return data;
};

export const obtenerEventosPorRangoFechas = async (fechaInicio, fechaFin) => {
  const { data } = await api.get("/eventos/fechas", {
    params: { fechaInicio, fechaFin },
  });
  return data;
};

export const obtenerEventosActivos = async () => {
  const { data } = await api.get("/eventos/activos");
  return data;
};

export const actualizarEvento = async (idEvento, payload) => {
  const { data } = await api.put(`/eventos/${idEvento}`, payload);
  return data;
};

export const eliminarEvento = async (idEvento) => {
  const { data } = await api.delete(`/eventos/${idEvento}`);
  return data;
};

export const generarReporteDetalladoDeEventos = async (payload) => {
  const { data } = await api.post("/eventos/eventosReporte", payload);
  return data;
};
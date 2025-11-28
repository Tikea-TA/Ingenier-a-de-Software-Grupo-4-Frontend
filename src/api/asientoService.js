import api from "./axiosConfig";

export const registrarAsiento = async (payload) => {
  const { data } = await api.post("/asientos/registro", payload);
  return data;
};

export const modificarAsiento = async (id, payload) => {
  const { data } = await api.put(`/asientos/${id}`, payload);
  return data;
};

export const obtenerAsientoPorId = async (id) => {
  const { data } = await api.get(`/asientos/${id}`);
  return data;
};

export const listarAsientosActivos = async () => {
  const { data } = await api.get("/asientos/activos");
  return data;
};

export const listarAsientosPorZona = async (idZona) => {
  const { data } = await api.get(`/asientos/zona/${idZona}`);
  return data;
};

export const listarAsientosPorEstado = async (estado) => {
  const { data } = await api.get(`/asientos/estado/${estado}`);
  return data;
};

export const eliminarAsiento = async (id) => {
  await api.delete(`/asientos/${id}`);
};

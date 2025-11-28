import api from "./axiosConfig";

export const crearZona = async (payload) => {
  const { data } = await api.post("/zonas", payload);
  return data;
};

export const listarZonas = async () => {
  const { data } = await api.get("/zonas");
  return data;
};

export const listarZonasActivasPorEstablecimiento = async (idEstablecimiento) => {
  const { data } = await api.get(`/zonas/establecimiento/${idEstablecimiento}/activas`);
  return data;
};

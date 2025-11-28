import api from "./axiosConfig";

export const loginGestor = async (credentials) => {
    const { data } = await api.post("/gestores/login", credentials);
    return data;
  };
import api from "./axiosConfig";

// Registrar cliente
export const registrarCliente = async (formData) => {
  const payload = {
    nombre: formData.name,
    apellidos: formData.lastname,
    correo: formData.email,
    nombreUsuario: formData.username,
    password: formData.password,
    telefono: formData.phonenumber,
    dni: formData.dni,
    direccion: formData.address,
    puntosPromociones: 0,
    tipoCliente: "REGISTRADO",
  };

  const { data } = await api.post("/clientes/registro", payload);
  return data;
};

// Login cliente
export const loginCliente = async (credentials) => {
  const { data } = await api.post("/clientes/login", credentials);
  return data;
};

// Actualizar cliente
export const actualizarCliente = async (id, formData) => {
  const payload = {
    correo: formData.email,
    nombreUsuario: formData.username,
    telefono: formData.phonenumber,
    direccion: formData.address,
    tipoCliente: formData.tipoCliente || "REGISTRADO",
    puntosPromocionales: formData.puntosPromocionales ?? undefined,
  };

  // cambio de contraseña
  if (formData.newPassword) {
    payload.password = formData.newPassword;
  }

  const { data } = await api.put(`/clientes/${id}`, payload);
  return data;
};

// Eliminar (inactivar) cliente
export const eliminarCliente = async (id) => {
  const response = await api.delete(`/clientes/${id}`);
  return response.data;
};

// Listar todos los clientes
export const listarClientes = async () => {
  const response = await api.get("/clientes");
  return response.data;
};

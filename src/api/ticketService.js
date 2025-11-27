import api from "./axiosConfig";

// EVENTOS

// Obtener eventos disponibles para compra
export const obtenerEventosDisponibles = async () => {
  const { data } = await api.get("/eventos");
  return data;
};

// Obtener detalles de un evento
export const obtenerDetalleEvento = async (eventId) => {
  const { data } = await api.get(`/eventos/${eventId}`);
  return data;
};

// Obtener asientos disponibles de un evento
export const obtenerAsientosDisponibles = async (eventId) => {
  const { data } = await api.get(`/eventos/${eventId}/asientos`);
  return data;
};

// Obtener asientos por zona (usa controlador de asientos)
export const obtenerAsientosPorZona = async (zonaId) => {
  const { data } = await api.get(`/asientos/zona/${zonaId}`);
  return data;
};

// Obtener zonas disponibles de un evento
export const obtenerZonasDisponibles = async (eventId) => {
  const { data } = await api.get(`/eventos/${eventId}/zonas`);
  return data;
};

// Obtener zonas por establecimiento (usa controlador de zonas)
export const obtenerZonasPorEstablecimiento = async (establecimientoId) => {
  const { data } = await api.get(
    `/zonas/establecimiento/${establecimientoId}/activas`
  );
  return data;
};

// Obtener banners
export const obtenerBannerPorEvento = async (eventId) => {
  const { data } = await api.get(`/eventos/${eventId}/banner`, {
    responseType: "blob",
  });

  return URL.createObjectURL(data); // Devuelve un URL usable en <img>
};


// RESERVAS

// Crear una nueva reserva (temporal, antes de pago)
export const crearReserva = async (reservaData) => {
  const { data } = await api.post("/reservas/crear", reservaData);
  return data;
};

// Obtener todas las reservas (admin)
export const obtenerTodasLasReservas = async () => {
  const { data } = await api.get("/reservas");
  return data;
};

// Obtener reservas activas
export const obtenerReservasActivas = async () => {
  const { data } = await api.get("/reservas/activas");
  return data;
};

// Obtener reservas por cliente
export const obtenerReservasPorCliente = async (clienteId) => {
  const { data } = await api.get(`/reservas/cliente/${clienteId}`);
  return data;
};

// Obtener reservas por taquillero
export const obtenerReservasPorTaquillero = async (taquilleroId) => {
  const { data } = await api.get(`/reservas/taquillero/${taquilleroId}`);
  return data;
};

// Modificar una reserva
export const modificarReserva = async (reservaId, reservaData) => {
  const { data } = await api.put(`/reservas/${reservaId}`, reservaData);
  return data;
};

// TICKETS

// Crear ticket (después de confirmación de pago)
export const crearTicket = async (ticketData) => {
  const { data } = await api.post("/tiket/crear", ticketData);
  return data;
};

// Obtener todos los tickets
export const obtenerTodosLosTickets = async () => {
  const { data } = await api.get("/tiket");
  return data;
};

// Obtener tickets por cliente
export const obtenerTicketsPorCliente = async (clienteId) => {
  const { data } = await api.get(`/tiket/cliente/${clienteId}`);
  return data;
};

// Obtener tickets por zona
export const obtenerTicketsPorZona = async (zonaId) => {
  const { data } = await api.get(`/tiket/zona/${zonaId}`);
  return data;
};

// Obtener tickets por evento
export const obtenerTicketsPorEvento = async (eventId) => {
  const { data } = await api.get(`/tiket/evento/${eventId}`);
  return data;
};

// Obtener tickets por evento y zona
export const obtenerTicketsPorEventoYZona = async (eventId, zonaId) => {
  const { data } = await api.get(`/tiket/evento/${eventId}/zona/${zonaId}`);
  return data;
};

// Obtener tickets por estado
export const obtenerTicketsPorEstado = async (estado) => {
  const { data } = await api.get(`/tiket/estado/${estado}`);
  return data;
};

// Modificar estado de un ticket
export const modificarTicket = async (ticketId, ticketData) => {
  const { data } = await api.put(`/tiket/${ticketId}`, ticketData);
  return data;
};

// VALIDACIÓN Y DESCUENTOS (provisional hasta que se haga el back o depende de como se maneje)

// Validar disponibilidad de asientos
export const validarDisponibilidadAsientos = async (eventId, asientos) => {
  const { data } = await api.post(`/eventos/${eventId}/validar-asientos`, {
    asientos,
  });
  return data;
};

// Validar cupón de descuento
export const validarCupon = async (codigoCupon, eventId) => {
  const { data } = await api.post("/cupones/validar", {
    codigo: codigoCupon,
    idEvento: eventId,
  });
  return data;
};

// Aplicar promoción
export const aplicarPromocion = async (promotionId, eventId, asientos) => {
  const { data } = await api.post("/promociones/aplicar", {
    idPromocion: promotionId,
    idEvento: eventId,
    asientos,
  });
  return data;
};

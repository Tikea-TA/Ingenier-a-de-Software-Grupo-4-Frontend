import { listarZonasActivasPorEstablecimiento } from "../../api/zonaService";

/**
 * Obtiene el precio mínimo de un evento basado en sus zonas activas.
 * Nota: El endpoint del backend filtra por establecimiento, pero si el evento tiene zonas específicas,
 * deberíamos usar un endpoint que filtre por evento si existiera.
 * Dado el requerimiento actual, usaremos el servicio de zonas.
 * 
 * @param {number} idEstablecimiento - ID del establecimiento (si se usa ese endpoint)
 * @param {number} idEvento - ID del evento (para futura implementación si cambia el endpoint)
 * @returns {Promise<number>} Precio mínimo o 0 si no hay zonas/precios.
 */
export const obtenerPrecioMinimoEvento = async (idEstablecimiento) => {
  try {
    // El controller proporcionado usa /zonas/establecimiento/{id}/activas
    // Asumimos que esto es lo que se quiere usar por ahora, aunque lo ideal sería por evento.
    // Si el usuario quiso decir "zonas del evento", el controller proporcionado no tiene ese endpoint específico
    // PERO ticketService tenía obtenerZonasDisponibles(eventId).
    // El usuario pidió usar la lógica del controller NUEVO (ZonaController).
    // Revisando el request: "Para obtener los precios de las zonas... siguiendo la lógica del controller siguiente... listarActivasPorEstablecimiento".
    // Esto es confuso porque un establecimiento tiene muchas zonas de muchos eventos (o zonas genéricas).
    // Sin embargo, si el evento está ligado a un establecimiento y usa sus zonas...
    
    // CORRECCIÓN: El ticketService tenía `obtenerZonasDisponibles(eventId)`.
    // El nuevo ZonaController tiene `listarActivasPorEstablecimiento`.
    // Si uso el del establecimiento, obtendré zonas de TODO el local.
    // Pero el usuario dijo "con la lógica de ticketService, quiero que obtengas el precio mínimo...".
    // Y luego "Para obtener los precios de las zonas, tenemos que crear un zonaService... siguiendo la lógica del controller siguiente".
    // Voy a usar el endpoint que el usuario ME DIO explícitamente en el ZonaController: listarActivasPorEstablecimiento.
    // Si esto devuelve zonas genéricas del local, entonces el precio mínimo será el del local.
    
    const zonas = await listarZonasActivasPorEstablecimiento(idEstablecimiento);
    
    if (zonas && zonas.length > 0) {
      const precios = zonas
        .map((z) => z.precio)
        .filter((p) => p !== undefined && p !== null);
      
      if (precios.length > 0) {
        return Math.min(...precios);
      }
    }
    return 0;
  } catch (error) {
    console.error("Error al obtener precio mínimo:", error);
    return 0;
  }
};

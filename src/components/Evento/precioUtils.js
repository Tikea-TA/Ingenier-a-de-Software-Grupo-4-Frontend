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

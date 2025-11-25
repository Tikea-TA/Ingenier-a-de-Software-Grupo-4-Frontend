import { create } from "zustand";

const STORAGE_KEY = "carrito_tikea";

export const useCartStore = create((set, get) => ({
  // Estado del carrito
  items: (() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })(),
  eventId: null,
  eventName: "",
  eventDate: "",
  eventVenue: "",
  totalPrice: 0,
  discount: 0,
  discountCode: "",
  promotionId: null,

  // Agregar asiento al carrito
  addItem: (item) => {
    set((state) => {
      const newItems = [...state.items, { ...item, id: Date.now() }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      get().updateTotal();
      return { items: newItems };
    });
  },

  // Eliminar asiento del carrito
  removeItem: (itemId) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== itemId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      get().updateTotal();
      return { items: newItems };
    });
  },

  // Actualizar cantidad de un asiento
  updateItemQuantity: (itemId, quantity) => {
    set((state) => {
      const newItems = state.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      get().updateTotal();
      return { items: newItems };
    });
  },

  // Establecer información del evento
  setEventInfo: (eventInfo) => {
    set((state) => ({
      eventId: eventInfo.id,
      eventName: eventInfo.nombre || eventInfo.name,
      eventDate: eventInfo.fechaHora || eventInfo.date,
      eventVenue: eventInfo.local || eventInfo.venue,
    }));
  },

  // Aplicar descuento
  setDiscount: (discount, discountCode, promotionId = null) => {
    set((state) => {
      const newState = {
        discount,
        discountCode,
        promotionId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
      return newState;
    });
    get().updateTotal();
  },

  // Calcular total
  updateTotal: () => {
    set((state) => {
      const subtotal = state.items.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0
      );
      const totalPrice = Math.max(0, subtotal - state.discount);
      return { totalPrice };
    });
  },

  // Vaciar carrito
  clearCart: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      items: [],
      eventId: null,
      eventName: "",
      eventDate: "",
      eventVenue: "",
      totalPrice: 0,
      discount: 0,
      discountCode: "",
      promotionId: null,
    });
  },

  // Obtener total de entradas
  getTotalItems: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  },

  // Obtener resumen de compra
  getCartSummary: () => {
    const state = get();
    return {
      items: state.items,
      eventId: state.eventId,
      eventName: state.eventName,
      eventDate: state.eventDate,
      eventVenue: state.eventVenue,
      subtotal: state.items.reduce(
        (sum, item) => sum + item.price * (item.quantity || 1),
        0
      ),
      discount: state.discount,
      discountCode: state.discountCode,
      promotionId: state.promotionId,
      total: state.totalPrice,
    };
  },
}));

import { create } from "zustand";

const STORAGE_KEY = "carrito_tikea";

const defaultState = {
  items: [],
  eventId: null,
  eventName: "",
  eventDate: "",
  eventVenue: "",
  totalPrice: 0,
  discount: 0,
  discountCode: "",
  promotionId: null,
};

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    // Backwards compatibility: if older value was an array of items
    if (Array.isArray(parsed)) {
      return { ...defaultState, items: parsed };
    }
    return { ...defaultState, ...parsed };
  } catch (e) {
    return { ...defaultState };
  }
}

function persist(state) {
  try {
    const toStore = {
      items: state.items || [],
      eventId: state.eventId || null,
      eventName: state.eventName || "",
      eventDate: state.eventDate || "",
      eventVenue: state.eventVenue || "",
      totalPrice: state.totalPrice || 0,
      discount: state.discount || 0,
      discountCode: state.discountCode || "",
      promotionId: state.promotionId || null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (e) {
    // ignore
  }
}

export const useCartStore = create((set, get) => ({
  ...readStored(),

  // Agregar asiento al carrito
  addItem: (item) => {
    set((state) => {
      const newItem = { ...item, id: Date.now() };
      const newItems = [...(state.items || []), newItem];
      const nextState = { ...state, items: newItems };
      // actualizar subtotal/total
      const subtotal = newItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
      nextState.totalPrice = Math.max(0, subtotal - (state.discount || 0));
      persist(nextState);
      return { items: newItems, totalPrice: nextState.totalPrice };
    });
  },

  // Eliminar asiento del carrito
  removeItem: (itemId) => {
    set((state) => {
      const newItems = (state.items || []).filter((item) => item.id !== itemId);
      const nextState = { ...state, items: newItems };
      const subtotal = newItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
      nextState.totalPrice = Math.max(0, subtotal - (state.discount || 0));
      persist(nextState);
      return { items: newItems, totalPrice: nextState.totalPrice };
    });
  },

  // Actualizar cantidad de un asiento
  updateItemQuantity: (itemId, quantity) => {
    set((state) => {
      const newItems = (state.items || []).map((item) => (item.id === itemId ? { ...item, quantity } : item));
      const nextState = { ...state, items: newItems };
      const subtotal = newItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
      nextState.totalPrice = Math.max(0, subtotal - (state.discount || 0));
      persist(nextState);
      return { items: newItems, totalPrice: nextState.totalPrice };
    });
  },

  // Establecer información del evento
  setEventInfo: (eventInfo) => {
    set((state) => {
      const next = {
        ...state,
        // soportar formato del backend: `idEvento` o `id`
        eventId: eventInfo.idEvento || eventInfo.id || null,
        eventName: eventInfo.nombreEvento || eventInfo.nombre || eventInfo.name || "",
        eventDate: eventInfo.fechaHora || eventInfo.date || "",
        eventVenue:
          (eventInfo.establecimiento && (eventInfo.establecimiento.nombreEstablecimiento || eventInfo.establecimiento.nombre)) ||
          eventInfo.local ||
          eventInfo.venue ||
          "",
      };
      persist(next);
      return {
        eventId: next.eventId,
        eventName: next.eventName,
        eventDate: next.eventDate,
        eventVenue: next.eventVenue,
      };
    });
  },

  // Aplicar descuento
  setDiscount: (discount, discountCode, promotionId = null) => {
    set((state) => {
      const nextState = {
        ...state,
        discount,
        discountCode,
        promotionId,
      };
      // recalcular total
      const subtotal = (nextState.items || []).reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
      nextState.totalPrice = Math.max(0, subtotal - (discount || 0));
      persist(nextState);
      return { discount, discountCode, promotionId, totalPrice: nextState.totalPrice };
    });
  },

  // Calcular total (expuesto por compatibilidad)
  updateTotal: () => {
    set((state) => {
      const subtotal = (state.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      const totalPrice = Math.max(0, subtotal - (state.discount || 0));
      const next = { ...state, totalPrice };
      persist(next);
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
    return (state.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
  },

  // Obtener resumen de compra
  getCartSummary: () => {
    const state = get();
    return {
      items: state.items || [],
      eventId: state.eventId,
      eventName: state.eventName,
      eventDate: state.eventDate,
      eventVenue: state.eventVenue,
      subtotal: (state.items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0),
      discount: state.discount,
      discountCode: state.discountCode,
      promotionId: state.promotionId,
      total: state.totalPrice,
    };
  },
}));

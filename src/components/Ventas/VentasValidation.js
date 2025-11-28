function VentasValidation(formData, tipoValidacion = "comprador") {
  let error = {};

  if (tipoValidacion === "comprador") {
    // Validación de datos del comprador
    if (!formData.nombre || !formData.nombre.trim()) {
      error.nombre = "El nombre es obligatorio";
    }

    if (!formData.email || !formData.email.trim()) {
      error.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      error.email = "El email no es válido";
    }

    if (!formData.telefono || !formData.telefono.trim()) {
      error.telefono = "El teléfono es obligatorio";
    } else if (!/^[0-9\s\-\+\(\)]+$/.test(formData.telefono)) {
      error.telefono = "El teléfono no es válido";
    }
  } else if (tipoValidacion === "tarjeta") {
    // Validación de datos de tarjeta
    if (!formData.numeroTarjeta || formData.numeroTarjeta.length !== 16) {
      error.numeroTarjeta =
        "Ingresa un número de tarjeta válido (16 dígitos)";
    }

    if (!formData.nombreTitular || !formData.nombreTitular.trim()) {
      error.nombreTitular = "Ingresa el nombre del titular";
    }

    if (!formData.fechaExpiracion || formData.fechaExpiracion.length !== 5) {
      error.fechaExpiracion = "Ingresa la fecha de expiración (MM/YY)";
    } else {
      // Validar que el formato sea MM/YY
      const [mes, año] = formData.fechaExpiracion.split("/");
      const mesNum = parseInt(mes, 10);
      if (mesNum < 1 || mesNum > 12) {
        error.fechaExpiracion = "El mes debe estar entre 01 y 12";
      }
    }

    if (!formData.cvv || formData.cvv.length !== 3) {
      error.cvv = "Ingresa un CVV válido (3 dígitos)";
    }
  }

  return error;
}

export default VentasValidation;

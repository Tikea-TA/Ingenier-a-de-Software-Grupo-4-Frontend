# Módulo de Venta de Entradas - Tikea

## Descripción

Este módulo implementa el flujo completo de compra de entradas por canal digital para la plataforma Tikea. Permite a los clientes explorar eventos, seleccionar asientos/zonas, aplicar descuentos y realizar pagos.

## Estructura de Carpetas

```
src/
├── pages/Ventas/
│   ├── EventosDisponibles.jsx      # Listado de eventos disponibles
│   ├── SeleccionAsientos.jsx       # Selección interactiva de asientos/zonas
│   ├── ResumenCompra.jsx           # Carrito y aplicación de cupones
│   ├── PantallaPago.jsx            # Formulario de pago
│   ├── ConfirmacionCompra.jsx      # Confirmación con QR
│   ├── MisEntradas.jsx             # Historial de compras del usuario
│   └── DetalleEntrada.jsx          # Detalle de una entrada específica
├── components/Ventas/
│   ├── VentasValidation.js         # Funciones de validación
│   └── Alert.jsx                   # Componente de alertas reutilizable
├── api/
│   └── ticketService.js            # Servicios de API para venta de entradas
└── store/
    └── useCartStore.js             # Estado global del carrito (Zustand)
```

## Casos de Uso Implementados

### 1. **Explorar Eventos** (EventosDisponibles.jsx)
- Ver listado de eventos disponibles
- Buscar eventos por nombre/ubicación
- Filtrar por tipo de evento (Conciertos, Teatro, Deportes)
- Ver detalles básicos: fecha, ubicación, capacidad, precio mínimo

### 2. **Seleccionar Asientos** (SeleccionAsientos.jsx)
- Visualización de mapa de asientos/zonas según tipo de local
- Soporta 3 tipos de locales:
  - **Auditorio**: Mapa de asientos individual
  - **Teatro**: Selección de zonas con mapa visual
  - **Estadio**: Selección de zonas con mapa visual
- Seleccionar múltiples asientos
- Especificar cantidad de entradas por tipo
- Resumen lateral de entradas seleccionadas

### 3. **Revisar Compra** (ResumenCompra.jsx)
- Visualizar todas las entradas seleccionadas
- Eliminar entradas individualmente
- Aplicar códigos de cupón para descuentos
- Validación de cupones en tiempo real
- Resumen de precios (subtotal, descuentos, total)
- Opción de vaciar carrito o seguir comprando

### 4. **Procesar Pago** (PantallaPago.jsx)
- Ingreso de datos del comprador (nombre, email, teléfono)
- Soporte para múltiples métodos de pago:
  - Tarjeta de Crédito/Débito
  - Yape
  - Plin
- Validación de datos de tarjeta en tiempo real
- Formateo automático de campos
- Información de seguridad SSL

### 5. **Confirmar Compra** (ConfirmacionCompra.jsx)
- Resumen de compra realizada
- Número de compra único
- Código QR para validación en el evento
- Información de entradas adquiridas
- Opción para descargar ticket
- Instrucciones post-compra

### 6. **Gestionar Entradas** (MisEntradas.jsx)
- Historial de todas las compras del usuario
- Filtros: Todas, Próximas, Pasadas
- Información de cada evento
- Botones de acción: Ver detalle, Descargar
- Estado visual de eventos (Próximo/Pasado)

### 7. **Detalle de Entrada** (DetalleEntrada.jsx)
- Información completa de la entrada
- Código QR para validación
- Datos del comprador
- Resumen de precios
- Opciones: Descargar, Compartir, Copiar número

## Flujo de Compra

```
1. EventosDisponibles    (Explorar eventos)
   ↓
2. SeleccionAsientos     (Seleccionar asientos/zonas)
   ↓
3. ResumenCompra         (Revisar y aplicar descuentos)
   ↓
4. PantallaPago          (Ingresar datos de pago)
   ↓
5. ConfirmacionCompra    (Confirmación y QR)
   ↓
6. MisEntradas           (Historial de compras)
   └→ DetalleEntrada     (Detalle de cada entrada)
```

## Store Global (Zustand)

### useCartStore

Gestiona el estado del carrito con las siguientes acciones:

```javascript
// Agregar item al carrito
addItem(item)

// Remover item por ID
removeItem(itemId)

// Actualizar cantidad
updateItemQuantity(itemId, quantity)

// Establecer información del evento
setEventInfo(eventInfo)

// Aplicar descuento
setDiscount(discount, discountCode, promotionId)

// Recalcular total
updateTotal()

// Vaciar carrito
clearCart()

// Obtener total de items
getTotalItems()

// Obtener resumen
getCartSummary()
```

## Servicios de API (ticketService.js)

```javascript
// Obtener eventos disponibles
obtenerEventosDisponibles()

// Obtener detalles de un evento
obtenerDetalleEvento(eventId)

// Obtener asientos disponibles
obtenerAsientosDisponibles(eventId)

// Obtener zonas disponibles
obtenerZonasDisponibles(eventId)

// Validar disponibilidad de asientos
validarDisponibilidadAsientos(eventId, asientos)

// Crear compra
crearCompra(compraData)

// Obtener compras del cliente
obtenerComprasCliente(clienteId)

// Validar cupón
validarCupon(codigoCupon, eventId)

// Aplicar promoción
aplicarPromocion(promotionId, eventId, asientos)
```

## Componentes Reutilizables

### Alert.jsx
Componente para mostrar alertas de diferentes tipos:
- **error**: Para errores
- **success**: Para operaciones exitosas
- **warning**: Para advertencias
- **info**: Para información general

Uso:
```jsx
<Alert
  type="success"
  title="¡Compra confirmada!"
  message="Tus entradas han sido procesadas exitosamente"
/>
```

### VentasValidation.js
Funciones de validación para:
- Datos del comprador
- Datos de tarjeta de crédito
- Formatos de teléfono y email

## Rutas Implementadas

| Ruta | Componente | Descripción | Protegida |
|------|-----------|-------------|-----------|
| `/eventos` | EventosDisponibles | Listar eventos | No |
| `/comprar-entradas/:eventId` | SeleccionAsientos | Seleccionar asientos | No |
| `/resumen-compra` | ResumenCompra | Revisar carrito | No |
| `/pago` | PantallaPago | Procesar pago | No |
| `/confirmacion-compra` | ConfirmacionCompra | Confirmación | No |
| `/mis-entradas` | MisEntradas | Historial | Sí |
| `/detalle-entrada/:numeroCompra` | DetalleEntrada | Detalle | Sí |

## Tecnologías Utilizadas

- **React 19**: Framework principal
- **React Router DOM 7**: Enrutamiento
- **Zustand 5**: Estado global
- **Tailwind CSS 4**: Estilos
- **Radix UI**: Componentes accesibles
- **Lucide React**: Iconos
- **Axios**: Llamadas HTTP
- **QRCode.react**: Generación de códigos QR

## Características de Seguridad

- Autenticación requerida para acceso a datos de usuario
- Validación de entrada en cliente
- Encriptación SSL para datos de pago (indicador visual)
- Tokens de autenticación almacenados en localStorage
- Componente ProtectedRoute para rutas restringidas

## Almacenamiento Local

- **localStorage**: 
  - `cliente`: Datos del usuario autenticado
  - `carrito_tikea`: Items del carrito

- **sessionStorage**:
  - `numeroCompra`: Número de compra después de pago
  - `compraData`: Datos completos de la compra

## Estados de Error Manejados

- Usuario no autenticado
- Evento no encontrado
- Asientos no disponibles
- Cupón inválido
- Error en procesamiento de pago
- Conexión perdida con servidor

## Próximas Mejoras

- [ ] Integración real con pasarela de pagos (Stripe, etc.)
- [ ] Envío de emails con confirmación de compra
- [ ] Descarga de PDF de tickets
- [ ] Sistema de reembolsos y cambios
- [ ] Notificaciones en tiempo real
- [ ] Soporte para múltiples monedas
- [ ] Carrito compartible entre dispositivos
- [ ] Historial de búsquedas y eventos favoritos

## Notas de Desarrollo

- Las imágenes de eventos se obtienen desde el backend
- Los tipos de local (auditorio, teatro, estadio) determinan qué componente de mapa se utiliza
- Los códigos QR contienen información de validación y pueden escanearse en la entrada
- El carrito persiste en localStorage para no perder datos entre sesiones

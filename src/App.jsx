import { Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { Login } from "./pages/usuarios/Login";
import { RegistrarProductor } from "./pages/Eventos/RegistrarProductor";
import { RegistrarLocal } from "./pages/Eventos/RegistrarLocal";
import Layout from "./components/layout/Layout";
import { Signup } from "./pages/usuarios/Signup";
import { ConfigProfile } from "./pages/usuarios/ConfigProfile";
import { DeleteProfile } from "./pages/usuarios/DeleteProfile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RegistrarPromocion } from "./pages/Promociones/RegistrarPromocion";
import { EditarPromocion } from "./pages/Promociones/EditarPromocion";
import { RegistrarEvento } from "./pages/Eventos/RegistrarEvento";
import { EventosDisponibles } from "./pages/Ventas/EventosDisponibles";
import { SeleccionAsientos } from "./pages/Ventas/SeleccionAsientos";
import { ResumenCompra } from "./pages/Ventas/ResumenCompra";
import { PantallaPago } from "./pages/Ventas/PantallaPago";
import { ConfirmacionCompra } from "./pages/Ventas/ConfirmacionCompra";
import { MisEntradas } from "./pages/Ventas/MisEntradas";
import { DetalleEntrada } from "./pages/Ventas/DetalleEntrada";
import { DetalleEvento } from "./pages/Eventos/DetalleEventoProd";
import { TestProductorEvents } from "./pages/EventosXProductor/TestProductorEvents";

function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Rutas de venta de entradas (públicas) */}
          <Route path="/eventos" element={<EventosDisponibles />} />
          <Route path="/comprar-entradas/:eventId" element={<SeleccionAsientos />} />
          <Route path="/resumen-compra" element={<ResumenCompra />} />
          <Route path="/pago" element={<PantallaPago />} />
          <Route path="/confirmacion-compra" element={<ConfirmacionCompra />} />
          
          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/user/configprofile" element={<ConfigProfile />} />
            <Route path="/user/deleteprofile" element={<DeleteProfile />} />
            <Route path="/mis-entradas" element={<MisEntradas />} />
            <Route path="/detalle-entrada/:numeroCompra" element={<DetalleEntrada />} />
          </Route>
          
          <Route path="/registrarProductor" element={<RegistrarProductor />} />
          <Route path="/registrarLocal" element={<RegistrarLocal />} />
          <Route path="/registrarEvento" element={<RegistrarEvento />} />
          <Route path="/promocion/registrarPromocion" element={<RegistrarPromocion />} />
          <Route path="/promocion/editar/:id" element={<EditarPromocion />} />

          <Route path="/test-productor-20" element={<TestProductorEvents />} />
          <Route path="/eventos/detalle/:id" element={<DetalleEvento />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;

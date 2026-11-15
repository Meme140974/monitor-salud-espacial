import { Navigate, Route, Routes } from "react-router-dom";
import { obtenerToken } from "./api";
import Capa from "./components/Capa";
import Dashboard from "./pages/Dashboard";
import IndicadorDetalle from "./pages/IndicadorDetalle";
import Login from "./pages/Login";
import Rutina from "./pages/Rutina";

function Protegido({ children }: { children: React.ReactNode }) {
  if (!obtenerToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protegido>
            <Capa />
          </Protegido>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/indicador/:id" element={<IndicadorDetalle />} />
        <Route path="/rutina" element={<Rutina />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

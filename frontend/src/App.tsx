import { Navigate, Route, Routes } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { RoleRoute } from "@/components/routing/RoleRoute";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ClientesPage } from "@/pages/ClientesPage";
import { PlanosPage } from "@/pages/PlanosPage";
import { ChipsPage } from "@/pages/ChipsPage";
import { ChipDetailsPage } from "@/pages/ChipDetailsPage";
import { UsuariosPage } from "@/pages/UsuariosPage";
import { ReportsPage } from "@/pages/ReportsPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="planos" element={<PlanosPage />} />
            <Route path="chips" element={<ChipsPage />} />
            <Route path="chips/:iccid" element={<ChipDetailsPage />} />
            <Route path="relatorios" element={<ReportsPage />} />
            <Route element={<RoleRoute roles={["admin"]} />}>
              <Route path="usuarios" element={<UsuariosPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

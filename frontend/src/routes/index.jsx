import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Campanhas } from '../pages/Campanhas';
import { Participantes } from '../pages/Participantes';
import { SorteioRoleta } from '../pages/SorteioRoleta';
import { HistoricoSorteios } from '../pages/HistoricoSorteios';
import { Usuarios } from '../pages/Usuarios';
import { AdminLayout } from '../layouts/AdminLayout';
import { PrivateRoute } from './PrivateRoute';

export function AppRoutes() {
  return (
    <Routes>
      {/* Rota Pública de Login */}
      <Route path="/login" element={<Login />} />

      {/* Rotas Protegidas Administrativas */}
      <Route element={<PrivateRoute />}>
        <Route
          path="/"
          element={
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/campanhas"
          element={
            <AdminLayout>
              <Campanhas />
            </AdminLayout>
          }
        />
        <Route
          path="/campanhas/:campanha_id/participantes"
          element={
            <AdminLayout>
              <Participantes />
            </AdminLayout>
          }
        />
        <Route
          path="/campanhas/:campanha_id/sorteios"
          element={
            <AdminLayout>
              <HistoricoSorteios />
            </AdminLayout>
          }
        />
        <Route
          path="/campanhas/:campanha_id/historico"
          element={
            <AdminLayout>
              <HistoricoSorteios />
            </AdminLayout>
          }
        />
        <Route
          path="/usuarios"
          element={
            <AdminLayout>
              <Usuarios />
            </AdminLayout>
          }
        />
        {/* Tela Imersiva de Sorteio com Roleta Eletrônica */}
        <Route
          path="/sorteio"
          element={<SorteioRoleta />}
        />
      </Route>

      {/* Fallback de rotas desconhecidas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

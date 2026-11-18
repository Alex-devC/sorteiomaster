import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Campanhas } from '../pages/Campanhas';
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
      </Route>

      {/* Fallback de rotas desconhecidas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

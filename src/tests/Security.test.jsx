import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { supabase } from '../supabase/client';

// Mockeamos componentes simples para las rutas
const Dashboard = () => <div>Panel Secreto del Admin</div>;
const Login = () => <div>Login Page</div>;

describe('Sistema de Seguridad (Rutas Protegidas)', () => {
  
  it('Redirige al login si NO hay usuario autenticado', async () => {
    // Simulamos que NO hay sesión
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Esperamos que aparezca el Login, NO el Dashboard
    await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
        expect(screen.queryByText('Panel Secreto del Admin')).not.toBeInTheDocument();
    });
  });

  it('Permite acceso si hay usuario autenticado', async () => {
    // Simulamos que SÍ hay sesión
    supabase.auth.getSession.mockResolvedValue({ 
        data: { session: { user: { email: 'admin@venefoods.com' } } } 
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Esperamos que aparezca el Dashboard
    await waitFor(() => {
        expect(screen.getByText('Panel Secreto del Admin')).toBeInTheDocument();
    });
  });
});
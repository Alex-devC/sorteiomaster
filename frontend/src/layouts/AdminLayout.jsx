import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Layers,
  Dices,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Shield,
  X
} from 'lucide-react';

export function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Backdrop Mobile */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Retrátil */}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="Sorteio Master Logo" className="sidebar-logo" />
            {!collapsed && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-title">Sorteio Master</span>
                <span className="sidebar-brand-sub">Painel Administrativo</span>
              </div>
            )}
          </div>

          {/* Fechar Sidebar no Mobile */}
          <button
            className="btn-toggle-sidebar"
            style={{ display: mobileOpen ? 'flex' : 'none' }}
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Links de Navegação */}
        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <LayoutDashboard className="sidebar-link-icon" size={20} />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink
            to="/campanhas"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Layers className="sidebar-link-icon" size={20} />
            {!collapsed && <span>Campanhas</span>}
          </NavLink>

          <NavLink
            to="/sorteio"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <Dices className="sidebar-link-icon" size={20} style={{ color: '#F7C248' }} />
            {!collapsed && <span>Roleta Ao Vivo</span>}
          </NavLink>
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LogOut className="sidebar-link-icon" size={20} style={{ color: '#F87171' }} />
            {!collapsed && <span style={{ color: '#F87171' }}>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <div className={`admin-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Cabeçalho */}
        <header className="admin-header">
          <div className="header-left">
            {/* Botão Mobile */}
            <button
              className="btn-toggle-sidebar"
              style={{ display: window.innerWidth <= 768 ? 'flex' : 'none' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>

            {/* Botão Desktop Recolher/Expandir */}
            <button
              className="btn-toggle-sidebar"
              style={{ display: window.innerWidth > 768 ? 'flex' : 'none' }}
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
              aria-label="Alternar menu lateral"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            <span className="header-title">Painel de Gestão Corporativa</span>
          </div>

          <div className="header-right">
            {/* Usuário Conectado */}
            <div className="user-profile">
              <div className="user-avatar">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.nome || 'Administrador'}</span>
                <span className="user-role">@{user?.usuario || 'admin'}</span>
              </div>
            </div>

            <button onClick={handleLogout} className="btn-logout" title="Encerrar Sessão">
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* Conteúdo da Página */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}

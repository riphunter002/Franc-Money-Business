import { useEffect } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { useTheme } from '../hooks/useTheme.jsx';

function IconPainel() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconTransacoes() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h13l-3.5-3.5" />
      <path d="M20 16H7l3.5 3.5" />
    </svg>
  );
}

function IconCategorias() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 6h16" />
      <path d="M4 12h10" />
      <path d="M4 18h6" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: '/', label: 'Painel', end: true, Icon: IconPainel },
  { to: '/transactions', label: 'Transações', end: false, Icon: IconTransacoes },
  { to: '/categories', label: 'Categorias', end: false, Icon: IconCategorias },
];

// Casca compartilhada por Painel/Transacoes/Categorias: sidebar + <Outlet/>
// (onde a rota filha atual entra). A checagem de "tem negocio ativo?" mora
// aqui, uma vez so, em vez de repetida em cada pagina.
export function AppLayout() {
  const { user, logout } = useAuth();
  const { activeBusiness, clearBusiness } = useBusiness();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // aplica o tema no <html> SO enquanto este componente estiver montado -
  // ou seja, so durante o uso logado do app. Ao desmontar (logout, sessao
  // expirada), o atributo e removido e as telas de login/selecao de negocio
  // voltam ao visual escuro fixo delas.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    return () => {
      document.documentElement.removeAttribute('data-theme');
    };
  }, [theme]);

  if (!activeBusiness) {
    return <Navigate to="/business-setup" replace />;
  }

  function handleLogout() {
    logout();
    clearBusiness();
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">
          <img className="brand-mark" src="/logo-franc.png" alt="" />
          <span className="brand-name">
            Franc Money <strong>Business</strong>
          </span>
        </div>

        {/* antes so dava pra trocar de negocio deslogando - agora e um
            atalho direto pra tela de selecao */}
        <button type="button" className="business-switch" onClick={() => navigate('/business-setup')}>
          <span className="business-switch-badge">{activeBusiness.name.charAt(0).toUpperCase()}</span>
          <span className="business-switch-info">
            <span className="business-switch-name">{activeBusiness.name}</span>
            <span className="business-switch-hint">Trocar negócio</span>
          </span>
        </button>

        <nav className="app-nav">
          {NAV_ITEMS.map(({ to, label, end, Icon }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <span className="sidebar-user">{user?.name}</span>
          <button
            type="button"
            className="sidebar-action"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          >
            <span className="sidebar-action-icon">{theme === 'dark' ? '☀' : '☾'}</span>
            {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          </button>
          <button type="button" className="sidebar-action" onClick={handleLogout}>
            <span className="sidebar-action-icon">⏻</span>
            Sair
          </button>
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

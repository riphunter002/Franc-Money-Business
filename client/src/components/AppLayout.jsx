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

function IconImportar() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
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
  { to: '/import', label: 'Importar', end: false, Icon: IconImportar },
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
          <span className="brand-name" translate="no">
            Franc Money <strong>Business</strong>
          </span>
        </div>

        {/* antes so dava pra trocar de negocio deslogando - agora e um
            atalho direto pra tela de selecao */}
        {/* o negocio e o contexto de tudo que a tela mostra, entao e ele que
            tem destaque; o usuario logado vem abaixo, menor. O "Trocar negocio"
            deixou de ser texto pra virar icone - a terceira linha roubaria o
            destaque que o nome do negocio precisa ter. */}
        <button
          type="button"
          className="business-switch"
          onClick={() => navigate('/business-setup')}
          title="Trocar de negócio"
        >
          <span className="business-switch-badge">{activeBusiness.name.charAt(0).toUpperCase()}</span>
          <span className="business-switch-info">
            <span className="business-switch-name">{activeBusiness.name}</span>
            <span className="business-switch-user">{user?.name}</span>
          </span>
          <svg
            className="business-switch-icone"
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 8h13l-3-3" />
            <path d="M20 16H7l3 3" />
          </svg>
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

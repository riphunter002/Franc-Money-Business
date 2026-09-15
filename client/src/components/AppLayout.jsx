import { useEffect } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { useTheme } from '../hooks/useTheme.jsx';

// Casca compartilhada por Dashboard/Transacoes/Categorias: cabecalho +
// navegacao + <Outlet/> (onde a rota filha atual entra). A checagem de
// "tem negocio ativo?" mora aqui, uma vez so, em vez de repetida em cada
// pagina.
export function AppLayout() {
  const { user, logout } = useAuth();
  const { activeBusiness, clearBusiness } = useBusiness();
  const { theme, toggleTheme } = useTheme();

  // aplica o tema no <html> SO enquanto este componente estiver montado -
  // ou seja, so durante o uso logado do app. Ao desmontar (logout, sessao
  // expirada), o atributo e removido e as telas de login/cadastro voltam a
  // aparecer sempre no visual claro fixo delas, mesmo que o usuario tenha
  // escolhido o tema escuro aqui dentro.
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
    <div>
      <header className="app-header">
        <div className="app-header-info">
          <strong>{activeBusiness.name}</strong>
          <span className="hint">{user?.name}</span>
        </div>
        <nav className="app-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/transactions">Transações</NavLink>
          <NavLink to="/categories">Categorias</NavLink>
        </nav>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button type="button" className="secondary-button" onClick={handleLogout}>
          Sair
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

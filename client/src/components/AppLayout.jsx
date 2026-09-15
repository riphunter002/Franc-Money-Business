import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';

// Casca compartilhada por Dashboard/Transacoes/Categorias: cabecalho +
// navegacao + <Outlet/> (onde a rota filha atual entra). A checagem de
// "tem negocio ativo?" mora aqui, uma vez so, em vez de repetida em cada
// pagina.
export function AppLayout() {
  const { user, logout } = useAuth();
  const { activeBusiness, clearBusiness } = useBusiness();

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

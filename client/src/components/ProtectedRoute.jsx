import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

// "guarda" de rota: so deixa renderizar o conteudo se tiver sessao ativa,
// senao redireciona pro login - centraliza essa checagem num lugar so em
// vez de repetir "if (!token) navigate('/login')" em toda pagina protegida
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

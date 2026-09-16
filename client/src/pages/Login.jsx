import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client.js';
import { AuthCard } from '../components/AuthCard.jsx';
import { PasswordField } from '../components/PasswordField.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Entrar" tagline="Acompanhe as finanças do seu negócio">
      <form onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}

        <div className="auth-field">
          <div className="auth-field-head">
            <label htmlFor="email">E-mail</label>
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <PasswordField
          id="senha"
          label="Senha"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="auth-divider" />

      <p className="auth-footer">
        Ainda não tem conta? <Link to="/register">Criar conta</Link>
      </p>
    </AuthCard>
  );
}

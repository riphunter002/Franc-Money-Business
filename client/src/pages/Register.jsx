import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client.js';
import { AuthCard } from '../components/AuthCard.jsx';
import { PasswordField } from '../components/PasswordField.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // cadastro ja retorna token (auto-login) - nao precisa de uma
      // segunda tela pedindo pra logar depois de se cadastrar
      await register({ name, email, password });
      navigate('/business-setup');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível cadastrar');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Criar conta" tagline="Comece a controlar o seu negócio hoje">
      <form onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}

        <div className="auth-field">
          <div className="auth-field-head">
            <label htmlFor="nome">Nome</label>
          </div>
          <input
            id="nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

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
          minLength={8}
          autoComplete="new-password"
        />
        <p className="auth-hint">Mínimo de 8 caracteres.</p>

        <button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Criando...' : 'Criar conta'}
        </button>
      </form>

      <div className="auth-divider" />

      <p className="auth-footer">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthCard>
  );
}

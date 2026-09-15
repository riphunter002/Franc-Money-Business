import { LoginBackground } from './LoginBackground.jsx';

// casca compartilhada entre Login e Cadastro: mesmo fundo, mesmo cartao.
// Sem isso, clicar em "Criar conta" jogaria o usuario numa tela com
// identidade visual completamente diferente da que ele acabou de ver.
export function AuthCard({ tagline, children }) {
  return (
    <div className="login-page">
      <LoginBackground />

      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">FM</span>
          <span className="auth-brand-name">
            Franc Money <strong>Business</strong>
          </span>
        </div>
        <p className="auth-tagline">{tagline}</p>

        {children}
      </div>
    </div>
  );
}

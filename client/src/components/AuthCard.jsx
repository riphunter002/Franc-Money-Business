import { LoginBackground } from './LoginBackground.jsx';
import { LoginEmblem } from './LoginEmblem.jsx';

// casca compartilhada entre Login e Cadastro: mesmo fundo, mesmo layout.
// Sem isso, clicar em "Criar conta" jogaria o usuario numa tela com
// identidade visual completamente diferente da que ele acabou de ver.
export function AuthCard({ title, tagline, children }) {
  return (
    <div className="login-page">
      <LoginBackground />

      <div className="login-layout">
        <div className="auth-card">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-tagline">{tagline}</p>
          {children}
        </div>

        <LoginEmblem />
      </div>
    </div>
  );
}

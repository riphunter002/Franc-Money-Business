import { LoginBackground } from './LoginBackground.jsx';
import { LoginBrand } from './LoginBrand.jsx';

// casca compartilhada entre Login e Cadastro: mesmo fundo, mesmo layout.
// Sem isso, clicar em "Criar conta" jogaria o usuario numa tela com
// identidade visual completamente diferente da que ele acabou de ver.
export function AuthCard({ title, tagline, children }) {
  return (
    <div className="login-page">
      <LoginBackground />

      {/* coluna unica encostada a esquerda: e ali que o video e escuro por
          natureza (as arvores), entao o cartao ganha contraste da propria
          imagem em vez de precisar de uma camada escura pesada por cima */}
      <div className="login-layout">
        <LoginBrand />

        <div className="auth-card">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-tagline">{tagline}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

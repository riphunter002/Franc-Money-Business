// Emblema grande do lado direito: e ele que carrega a marca, por isso o
// cartao de login do lado esquerdo nao repete o logo - numa tela so, dizer
// a mesma coisa duas vezes enfraquece as duas
export function LoginEmblem() {
  return (
    <div className="login-emblem">
      <div className="login-emblem-rings" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <img className="login-emblem-logo" src="/logo-franc.png" alt="Franc Money Business" />

      <p className="login-emblem-name">
        Franc Money <strong>Business</strong>
      </p>
      <p className="login-emblem-tagline">
        Controle financeiro para pequenos e médios negócios, com alertas de gasto fora do padrão.
      </p>
    </div>
  );
}

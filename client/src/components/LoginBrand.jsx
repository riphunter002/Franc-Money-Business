// Marca em versao compacta, acima do cartao.
//
// Antes ela era um emblema de 260px no lado direito da tela. Com o video, esse
// lado passou a ser o ponto focal da imagem (a silhueta no pier), e um escudo
// daquele tamanho ali disputaria atencao com ela. Reduzida e alinhada ao
// cartao, a marca continua presente sem competir.
export function LoginBrand() {
  return (
    <div className="login-brand">
      {/* alt vazio de proposito: o nome vem escrito ao lado, em texto. Com um
          alt preenchido o leitor de tela anunciaria a marca duas vezes. */}
      <img className="login-brand-mark" src="/logo-franc.png" alt="" />
      <span className="login-brand-name" translate="no">
        Franc Money <strong>Business</strong>
      </span>
    </div>
  );
}

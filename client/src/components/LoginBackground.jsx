import { useCallback, useSyncExternalStore } from 'react';

/* ----------------------------------------------------------
   Fundo em video da tela de autenticacao.

   Uma fonte SO no DOM. Nao usamos dois <video> escondidos por CSS
   (o navegador baixaria os dois arquivos, ~1,7 MB em vez de ~800 KB)
   nem <source media="...">, cujo suporte e inconsistente entre
   navegadores. Quem decide e o JS, via matchMedia.
   ---------------------------------------------------------- */

const MIDIA = {
  retrato: { video: '/login-mobile.mp4', poster: '/login-mobile-poster' },
  paisagem: { video: '/login-desktop.mp4', poster: '/login-desktop-poster' },
};

// Calculado UMA vez, fora do componente: o suporte a WebP nao muda durante a
// vida da pagina, entao nao precisa ser estado nem rodar a cada render.
//
// O teste e de CODIFICACAO (toDataURL), que e mais restrito que decodificacao.
// Um navegador que so decodifica cai no .jpg: mais pesado, porem correto. O
// erro, se houver, e sempre pro lado seguro.
const EXTENSAO_POSTER = (() => {
  try {
    return document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp')
      ? 'webp'
      : 'jpg';
  } catch {
    return 'jpg';
  }
})();

/* Hook proprio pra ler uma media query.

   Por que useSyncExternalStore e nao o classico useState + useEffect?
   Porque matchMedia e um valor que vive FORA do React. Com useState voce le
   o valor no primeiro render e so assina as mudancas depois, no efeito - e
   existe uma janela entre as duas coisas em que a tela mostra um valor velho
   (girar o celular exatamente nesse instante deixaria o video errado). O
   useSyncExternalStore existe pra esse caso: recebe COMO assinar e COMO ler,
   e garante que o valor usado no render e sempre o atual.

   Ele tambem evita duplicar a danca de addEventListener/removeEventListener,
   que apareceria duas vezes aqui - uma pra orientacao, outra pra reduced
   motion. */
function useMediaQuery(query) {
  // useCallback porque o useSyncExternalStore reassina sempre que a funcao
  // muda de identidade. Sem ele, cada render criaria funcoes novas e o
  // listener seria removido e re-adicionado a toa.
  const assinar = useCallback(
    (avisarReact) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', avisarReact);
      return () => mql.removeEventListener('change', avisarReact);
    },
    [query],
  );

  const lerValor = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(assinar, lerValor);
}

export function LoginBackground() {
  const retrato = useMediaQuery('(orientation: portrait)');
  const semMovimento = useMediaQuery('(prefers-reduced-motion: reduce)');

  // derivado durante o render, nao guardado em estado: se virasse estado,
  // haveria dois lugares (orientacao e midia) pra ficarem fora de sincronia
  const midia = retrato ? MIDIA.retrato : MIDIA.paisagem;
  const poster = `${midia.poster}.${EXTENSAO_POSTER}`;

  return (
    /* aria-hidden: o video e decoracao. Sem isso, um leitor de tela anunciaria
       um elemento de midia antes do formulario, que e o que importa aqui. */
    <div className="login-video" aria-hidden="true">
      {semMovimento ? (
        // preferencia do sistema por menos movimento: so o quadro parado
        <img className="login-video-midia" src={poster} alt="" />
      ) : (
        <video
          /* key amarrada a fonte: o React reaproveita elementos do DOM quando
             so um atributo muda, e trocar o src de um <video> que ja carregou
             nao recarrega de forma confiavel em todo navegador. Com a key, ao
             girar a tela ele monta um <video> novo e limpo. */
          key={midia.video}
          className="login-video-midia"
          src={midia.video}
          poster={poster}
          autoPlay
          // muted e obrigatorio: sem ele o navegador bloqueia o autoplay
          muted
          loop
          // sem playsInline o iOS abre o video em tela cheia nativa
          playsInline
        />
      )}

      {/* camada escura entre o video e o formulario, pra garantir contraste */}
      <div className="login-video-scrim" />
    </div>
  );
}

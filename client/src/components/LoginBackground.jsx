import { useMemo } from 'react';

const COIN_COUNT = 18;

// gera as moedas uma vez so (useMemo) - se gerasse a cada render, toda vez
// que o usuario digitasse no formulario as moedas reiniciariam do zero
function useCoins() {
  return useMemo(
    () =>
      Array.from({ length: COIN_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 24 + Math.random() * 20,
        duration: 6 + Math.random() * 6,
        delay: Math.random() * -12,
      })),
    [],
  );
}

// linha ascendente tipo grafico de crescimento - o stroke-dasharray/offset
// animado da a sensacao de "fluxo" continuo na linha, nao so um desenho
// estatico
export function LoginBackground() {
  const coins = useCoins();

  return (
    <div className="login-bg" aria-hidden="true">
      {/* textura de papel milimetrado - da o contexto "financeiro" sem
          competir com o conteudo, porque a mascara apaga as bordas */}
      <div className="login-grid" />

      <svg className="login-chart-bg" viewBox="0 0 400 200" preserveAspectRatio="none">
        <polyline
          className="login-chart-line"
          points="0,160 40,150 80,165 120,120 160,135 200,90 240,100 280,60 320,75 360,30 400,45"
        />
        <polyline
          className="login-chart-line login-chart-line--soft"
          points="0,180 50,175 100,185 150,150 200,160 250,120 300,130 350,95 400,105"
        />
      </svg>

      <div className="login-coins">
        {coins.map((coin) => (
          <span
            key={coin.id}
            className="login-coin"
            style={{
              left: `${coin.left}%`,
              width: `${coin.size}px`,
              height: `${coin.size}px`,
              fontSize: `${coin.size * 0.4}px`,
              animationDuration: `${coin.duration}s`,
              animationDelay: `${coin.delay}s`,
            }}
          >
            $
          </span>
        ))}
      </div>
    </div>
  );
}

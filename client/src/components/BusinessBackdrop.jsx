import { useEffect, useState } from 'react';

// As fotos ficam em client/public/business-bg/. Para trocar, basta
// substituir o arquivo; para adicionar mais, coloque o arquivo na pasta e
// acrescente o caminho nesta lista. Se um arquivo nao existir, o onError
// descarta aquela camada e o fundo fica so no gradiente azul-marinho, sem
// imagem quebrada aparecendo.
const SOURCES = ['/business-bg/1.jpg', '/business-bg/2.jpg', '/business-bg/3.jpg'];

const ROTATION_MS = 6000;

export function BusinessBackdrop() {
  const [available, setAvailable] = useState(SOURCES);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // com 0 ou 1 foto nao ha o que alternar - nao cria o timer a toa
    if (available.length < 2) return undefined;

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % available.length);
    }, ROTATION_MS);

    return () => clearInterval(timer);
  }, [available.length]);

  function handleError(src) {
    setAvailable((current) => current.filter((item) => item !== src));
    setIndex(0);
  }

  return (
    <div className="setup-backdrop" aria-hidden="true">
      {available.map((src, position) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`setup-backdrop-photo${position === index ? ' is-active' : ''}`}
          onError={() => handleError(src)}
        />
      ))}
      {/* veu escuro por cima: mantem a identidade azul-marinho e garante que
          o cartao branco continue legivel sobre qualquer foto */}
      <div className="setup-backdrop-veil" />
    </div>
  );
}

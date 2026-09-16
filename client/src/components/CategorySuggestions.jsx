import { useState } from 'react';
import { ApiError } from '../api/client.js';
import { createCategory } from '../api/categories.js';
import { useBusiness } from '../hooks/useBusiness.jsx';

// Sugestoes genericas, uteis pra praticamente qualquer negocio. Sao apenas
// atalhos: nada e criado sem o usuario clicar.
//
// As cores das DESPESAS seguem a ordem fixa da paleta categorica validada
// (azul, laranja, aqua, amarelo, magenta, verde, vermelho) - e esse conjunto
// que forma o ranking de "Gastos por categoria" no painel, entao a ordem
// mantem as barras distinguiveis, inclusive sob daltonismo. As RECEITAS
// usam tons fora dessa paleta: nunca dividem grafico com as despesas, mas
// dividem a lista de categorias e os pontinhos da tabela de transacoes.
export const CATEGORY_SUGGESTIONS = [
  { name: 'Vendas', type: 'INCOME', color: '#0F766E', photo: '/category-icons/vendas.jpg' },
  { name: 'Serviços', type: 'INCOME', color: '#7C3AED', photo: '/category-icons/servicos.jpg' },
  { name: 'Fornecedores', type: 'EXPENSE', color: '#2A78D6', photo: '/category-icons/fornecedores.jpg' },
  { name: 'Aluguel', type: 'EXPENSE', color: '#EB6834', photo: '/category-icons/aluguel.jpg' },
  { name: 'Salários', type: 'EXPENSE', color: '#1BAF7A', photo: '/category-icons/salarios.jpg' },
  { name: 'Água, luz e internet', type: 'EXPENSE', color: '#EDA100', photo: '/category-icons/contas.jpg' },
  { name: 'Marketing', type: 'EXPENSE', color: '#E87BA4', photo: '/category-icons/marketing.jpg' },
  { name: 'Impostos', type: 'EXPENSE', color: '#008300', photo: '/category-icons/impostos.jpg' },
  { name: 'Transporte', type: 'EXPENSE', color: '#E34948', photo: '/category-icons/transporte.jpg' },
];

export function CategorySuggestions({ existentes, onCriada, onErro }) {
  const { activeBusiness } = useBusiness();
  const [criando, setCriando] = useState(null);

  // some da lista o que o usuario ja tem - alem de nao poluir, evita criar
  // duas categorias com o mesmo nome sem querer
  const jaTem = new Set(existentes.map((categoria) => categoria.name.toLowerCase()));
  const disponiveis = CATEGORY_SUGGESTIONS.filter((s) => !jaTem.has(s.name.toLowerCase()));

  if (disponiveis.length === 0) return null;

  async function handleAdicionar(sugestao) {
    setCriando(sugestao.name);
    onErro(null);

    try {
      await createCategory(activeBusiness.id, {
        name: sugestao.name,
        type: sugestao.type,
        color: sugestao.color,
      });
      onCriada();
    } catch (err) {
      onErro(err instanceof ApiError ? err.message : 'Erro ao criar categoria');
    } finally {
      setCriando(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Sugestões</h2>
      </div>
      <p className="hint suggestion-intro">
        Toque numa categoria comum para adicioná-la, ou crie a sua em "Nova categoria".
      </p>

      <ul className="suggestion-grid">
        {disponiveis.map((sugestao) => (
          <li key={sugestao.name}>
            <button
              type="button"
              className="suggestion-tile"
              onClick={() => handleAdicionar(sugestao)}
              disabled={criando !== null}
            >
              <span className="suggestion-photo-wrap">
                <img className="suggestion-photo" src={sugestao.photo} alt="" />
              </span>
              <span className="suggestion-name">{sugestao.name}</span>
              <span className={`suggestion-type suggestion-type--${sugestao.type.toLowerCase()}`}>
                {sugestao.type === 'INCOME' ? 'Receita' : 'Despesa'}
              </span>
              {criando === sugestao.name && <span className="suggestion-loading">Adicionando...</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

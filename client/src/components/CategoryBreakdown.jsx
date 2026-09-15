import { formatCurrency } from '../utils/format.js';

// So DESPESAS de proposito: misturar receita e despesa num unico ranking
// compara medidas diferentes (uma venda de R$ 3.450 "ganhando" do aluguel
// de R$ 1.200 nao quer dizer nada). O ranking de gastos com percentual e o
// que responde a pergunta central do produto: onde estou gastando mais.
export function CategoryBreakdown({ categories }) {
  const expenses = categories.filter((category) => category.type === 'EXPENSE');

  if (expenses.length === 0) {
    return <p className="empty-state">Nenhuma despesa neste período ainda.</p>;
  }

  const total = expenses.reduce((sum, category) => sum + category.total, 0);

  return (
    <ul className="breakdown">
      {expenses.map((category) => {
        const share = total > 0 ? (category.total / total) * 100 : 0;

        return (
          <li key={category.categoryId} className="breakdown-row">
            <div className="breakdown-head">
              <span className="breakdown-name">
                <span className="breakdown-dot" style={{ backgroundColor: category.color }} />
                {category.name}
              </span>
              <span className="breakdown-value">
                {formatCurrency(category.total)} <span className="breakdown-share">({Math.round(share)}%)</span>
              </span>
            </div>
            <div className="breakdown-track">
              <div
                className="breakdown-fill"
                style={{ width: `${share}%`, backgroundColor: category.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

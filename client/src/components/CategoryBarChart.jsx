import { formatCurrency } from '../utils/format.js';

// barras horizontais, nao pizza: comprimento da barra ja comunica "quem
// gasta mais" (a pergunta central do produto) mesmo se a cor da categoria
// escolhida pelo usuario for ruim de enxergar - a cor nunca e o unico
// jeito de ler o grafico, o nome e o valor sempre estao em texto ao lado
export function CategoryBarChart({ categories }) {
  if (categories.length === 0) {
    return <p className="empty-state">Nenhuma transação neste período ainda.</p>;
  }

  const max = categories[0].total;

  return (
    <ul className="category-bars">
      {categories.map((category) => (
        <li key={category.categoryId} className="category-bar-row">
          <span className="category-bar-label">{category.name}</span>
          <div className="category-bar-track">
            <div
              className="category-bar-fill"
              style={{
                width: `${max > 0 ? (category.total / max) * 100 : 0}%`,
                backgroundColor: category.color,
              }}
            />
          </div>
          <span className="category-bar-value">{formatCurrency(category.total)}</span>
        </li>
      ))}
    </ul>
  );
}

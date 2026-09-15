import { formatCurrency } from '../utils/format.js';

// a cor de "atencao" (borda/icone amarelo) e status, nao identidade -
// nao confundir com a cor da categoria, que so aparece como um deteail
// pequeno (a bolinha), nunca como o sinal principal do card
export function AlertCard({ alert }) {
  return (
    <li className="alert-card">
      <span className="alert-card-icon" aria-hidden="true">
        ⚠
      </span>
      <div className="alert-card-body">
        <p className="alert-card-message">{alert.message}</p>
        <div className="alert-card-meta">
          <span className="alert-card-category">
            <span className="alert-card-dot" style={{ backgroundColor: alert.color }} />
            {alert.name}
          </span>
          <span>
            {formatCurrency(alert.currentAmount)} vs. média de {formatCurrency(alert.averageAmount)}
          </span>
        </div>
      </div>
    </li>
  );
}

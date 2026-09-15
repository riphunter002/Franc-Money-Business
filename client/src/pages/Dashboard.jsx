import { useEffect, useState } from 'react';
import { getAlerts } from '../api/alerts.js';
import { ApiError } from '../api/client.js';
import { getSummary } from '../api/summary.js';
import { AlertCard } from '../components/AlertCard.jsx';
import { CategoryBarChart } from '../components/CategoryBarChart.jsx';
import { StatTile } from '../components/StatTile.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { formatCurrency } from '../utils/format.js';

export function Dashboard() {
  const { activeBusiness } = useBusiness();

  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // summary e alerts sao independentes um do outro - buscar os dois em
    // paralelo (nao um esperando o outro) deixa a pagina pronta mais rapido
    Promise.all([getSummary(activeBusiness.id), getAlerts(activeBusiness.id)])
      .then(([summaryData, alertsData]) => {
        setSummary(summaryData);
        setAlerts(alertsData.alerts);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar o dashboard'));
  }, [activeBusiness.id]);

  const isLoading = !summary || !alerts;

  return (
    <div className="page-wide">
      {error && <p className="error">{error}</p>}

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <>
          {/* alertas primeiro e com mais destaque - e a peca central do
              produto, o dono do negocio nao devia precisar procurar isso */}
          <section className="dashboard-section">
            <h2>Alertas</h2>
            {alerts.length > 0 ? (
              <ul className="alert-list">
                {alerts.map((alert) => (
                  <AlertCard key={alert.categoryId} alert={alert} />
                ))}
              </ul>
            ) : (
              <p className="alert-empty">Nenhum gasto fora do padrão este mês. Tudo dentro do esperado.</p>
            )}
          </section>

          <section className="dashboard-section stat-row">
            <StatTile label="Receita" value={formatCurrency(summary.income)} />
            <StatTile label="Despesa" value={formatCurrency(summary.expense)} />
            <StatTile
              label="Saldo"
              value={formatCurrency(summary.balance)}
              status={summary.balance >= 0 ? 'good' : 'critical'}
              statusLabel={summary.balance >= 0 ? 'positivo' : 'negativo'}
            />
          </section>

          <section className="dashboard-section">
            <h2>Por categoria</h2>
            <CategoryBarChart categories={summary.byCategory} />
          </section>
        </>
      )}
    </div>
  );
}

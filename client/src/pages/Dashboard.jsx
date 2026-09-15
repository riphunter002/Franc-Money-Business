import { useEffect, useState } from 'react';
import { getAlerts } from '../api/alerts.js';
import { ApiError } from '../api/client.js';
import { getSummary } from '../api/summary.js';
import { AlertCard } from '../components/AlertCard.jsx';
import { CategoryBreakdown } from '../components/CategoryBreakdown.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { formatCurrency } from '../utils/format.js';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

// UTC de proposito - mesma razao do backend: o periodo vem calculado em UTC,
// ler com getMonth() local poderia mostrar o mes errado na virada
function nomeDoPeriodo(periodo) {
  const inicio = new Date(periodo.start);
  const mes = MESES[inicio.getUTCMonth()];
  // so a primeira letra maiuscula - o CSS nao pode fazer isso com
  // text-transform: capitalize, que capitalizaria o "de" tambem
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} de ${inicio.getUTCFullYear()}`;
}

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
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar o painel'));
  }, [activeBusiness.id]);

  const isLoading = !summary || !alerts;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="page-eyebrow">Painel</p>
          <h1>{activeBusiness.name}</h1>
        </div>
        {summary && <span className="period-chip">{nomeDoPeriodo(summary.period)}</span>}
      </header>

      {error && <p className="error">{error}</p>}

      {isLoading ? (
        <p className="empty-state">Carregando...</p>
      ) : (
        <>
          <section className="stat-grid">
            <StatCard
              label="Saldo do mês"
              value={formatCurrency(summary.balance)}
              note={summary.balance >= 0 ? 'No azul neste período' : 'No vermelho neste período'}
              tone={summary.balance >= 0 ? 'good' : 'critical'}
            />
            <StatCard label="Receitas" value={formatCurrency(summary.income)} note="Entradas do período" direction="income" />
            <StatCard label="Despesas" value={formatCurrency(summary.expense)} note="Saídas do período" direction="expense" />
          </section>

          {/* alertas em destaque - e a peca central do produto, o dono do
              negocio nao devia precisar procurar isso */}
          <section className={`panel panel--alerts${alerts.length > 0 ? ' is-active' : ''}`}>
            <div className="panel-head">
              <h2>Alertas de gasto</h2>
              {alerts.length > 0 && <span className="panel-badge">{alerts.length}</span>}
            </div>
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

          <section className="panel">
            <div className="panel-head">
              <h2>Gastos por categoria</h2>
            </div>
            <CategoryBreakdown categories={summary.byCategory} />
          </section>
        </>
      )}
    </div>
  );
}

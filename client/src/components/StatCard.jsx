// tone ('good' | 'critical') colore o numero, mas nunca sozinho: quando ha
// tone, vem sempre acompanhado de `note` em texto dizendo o que significa
export function StatCard({ label, value, note, direction, tone }) {
  return (
    <div className="stat-card">
      <div className="stat-card-head">
        <span className="stat-card-label">{label}</span>
        {direction && (
          <span className={`stat-card-icon stat-card-icon--${direction}`} aria-hidden="true">
            {direction === 'income' ? '↑' : '↓'}
          </span>
        )}
      </div>
      <span className={`stat-card-value${tone ? ` stat-card-value--${tone}` : ''}`}>{value}</span>
      {note && <span className="stat-card-note">{note}</span>}
    </div>
  );
}

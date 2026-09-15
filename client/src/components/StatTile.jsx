// status ('good' | 'critical') so colors nunca carregam significado
// sozinhas - statusLabel (texto) + o icone de seta acompanham a cor,
// sempre, mesmo aqui num cartao simples
export function StatTile({ label, value, status, statusLabel }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile-label">{label}</span>
      <span className={`stat-tile-value${status ? ` stat-tile-value--${status}` : ''}`}>{value}</span>
      {statusLabel && (
        <span className={`stat-tile-status stat-tile-status--${status}`}>
          {status === 'good' ? '▲' : '▼'} {statusLabel}
        </span>
      )}
    </div>
  );
}

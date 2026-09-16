import { useState } from 'react';
import { formatCurrency } from '../utils/format.js';

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// area do desenho dentro do viewBox - a folga na esquerda e pros valores do
// eixo, a de baixo pros nomes dos meses
const L = 62;
const R = 14;
const T = 16;
const B = 30;
const W = 720;
const H = 240;
const PLOT_W = W - L - R;
const PLOT_H = H - T - B;

function rotuloMes(chave) {
  const [ano, mes] = chave.split('-');
  return `${MESES_CURTOS[Number(mes) - 1]}/${ano.slice(2)}`;
}

// eixo com numero curto: "R$ 3,5 mil" em vez de "R$ 3.450,00", que nao cabe
function valorCurto(valor) {
  const abs = Math.abs(valor);
  if (abs >= 1000) return `${valor < 0 ? '-' : ''}R$ ${(abs / 1000).toFixed(1).replace('.', ',')} mil`;
  return `R$ ${Math.round(valor)}`;
}

export function BalanceChart({ months }) {
  const [ativo, setAtivo] = useState(null);

  const temMovimento = months.some((m) => m.income !== 0 || m.expense !== 0);
  if (!temMovimento) {
    return (
      <p className="empty-state">
        Ainda não há transações suficientes para desenhar a evolução. Lance a primeira e ela aparece aqui.
      </p>
    );
  }

  const valores = months.map((m) => m.balance);
  // o zero sempre entra na escala: sem isso, uma sequencia toda negativa
  // pareceria estar "subindo" sem deixar claro que esta abaixo de zero
  const bruto = [...valores, 0];
  const maxBruto = Math.max(...bruto);
  const minBruto = Math.min(...bruto);
  const folga = (maxBruto - minBruto) * 0.12 || Math.abs(maxBruto) * 0.2 || 1;
  const max = maxBruto + folga;
  const min = minBruto - folga;

  const x = (i) => L + (months.length === 1 ? PLOT_W / 2 : (i * PLOT_W) / (months.length - 1));
  const y = (valor) => T + PLOT_H - ((valor - min) / (max - min)) * PLOT_H;

  const pontos = months.map((m, i) => `${x(i)},${y(m.balance)}`).join(' ');
  const area = `${L},${y(min)} ${pontos} ${x(months.length - 1)},${y(min)}`;
  // o zero entra como linha propria quando a serie cruza de negativo pra
  // positivo. Depois descarta rotulos que cairiam praticamente um em cima
  // do outro - dois numeros colados sao piores que um numero a menos
  const linhasGrade = [max, (max + min) / 2, min]
    .concat(min < 0 && max > 0 ? [0] : [])
    .sort((a, b) => b - a)
    .filter((valor, i, lista) => i === 0 || Math.abs(y(valor) - y(lista[i - 1])) > 26);
  const ultimo = months.length - 1;

  return (
    <div className="chart-wrap">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Evolução do saldo por mês">
        {linhasGrade.map((valor) => (
          <g key={valor}>
            <line
              className={valor === 0 ? 'chart-zero' : 'chart-grid'}
              x1={L}
              x2={W - R}
              y1={y(valor)}
              y2={y(valor)}
            />
            <text className="chart-axis" x={L - 10} y={y(valor) + 4} textAnchor="end">
              {valorCurto(valor)}
            </text>
          </g>
        ))}

        <polygon className="chart-area" points={area} />
        <polyline className="chart-line" points={pontos} />

        {months.map((m, i) => (
          <circle
            key={m.month}
            className={`chart-dot${i === ativo ? ' is-active' : ''}${i === ultimo ? ' is-last' : ''}`}
            cx={x(i)}
            cy={y(m.balance)}
            r={i === ultimo || i === ativo ? 5 : 3.5}
          />
        ))}

        {months.map((m, i) => (
          <text key={m.month} className="chart-axis" x={x(i)} y={H - 10} textAnchor="middle">
            {rotuloMes(m.month)}
          </text>
        ))}

        {/* faixas invisiveis so pra capturar o mouse - alvo bem maior que o
            pontinho, senao acertar o ponto exigiria precisao demais */}
        {months.map((m, i) => (
          <rect
            key={m.month}
            className="chart-hit"
            x={x(i) - PLOT_W / months.length / 2}
            y={T}
            width={PLOT_W / months.length}
            height={PLOT_H}
            onMouseEnter={() => setAtivo(i)}
            onMouseLeave={() => setAtivo(null)}
          />
        ))}
      </svg>

      {ativo !== null && (
        <div
          // nas pontas o balao encosta na borda do cartao, entao ele deixa
          // de ser centralizado no ponto e passa a se alinhar pra dentro
          className={`chart-tooltip${
            (x(ativo) / W) * 100 > 72 ? ' is-right' : (x(ativo) / W) * 100 < 22 ? ' is-left' : ''
          }`}
          style={{ left: `${(x(ativo) / W) * 100}%`, top: `${(y(months[ativo].balance) / H) * 100}%` }}
        >
          <strong>{rotuloMes(months[ativo].month)}</strong>
          <span className="chart-tooltip-linha">
            Receita <b className="amount-income">{formatCurrency(months[ativo].income)}</b>
          </span>
          <span className="chart-tooltip-linha">
            Despesa <b>{formatCurrency(months[ativo].expense)}</b>
          </span>
          <span className="chart-tooltip-linha">
            Saldo{' '}
            <b className={months[ativo].balance >= 0 ? 'amount-income' : 'amount-negative'}>
              {formatCurrency(months[ativo].balance)}
            </b>
          </span>
        </div>
      )}
    </div>
  );
}

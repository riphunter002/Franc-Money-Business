import { useCallback, useEffect, useState } from 'react';
import { listCategories } from '../api/categories.js';
import { ApiError } from '../api/client.js';
import {
  bulkCreateImportedTransactions,
  confirmImportedTransaction,
  discardImportedTransaction,
  listImportedTransactions,
} from '../api/importedTransactions.js';
import { CategorySelect } from '../components/CategorySelect.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';

/* ----------------------------------------------------------
   Leitura do CSV - portada do Franc Money (public/import.js).
   Sao funcoes puras, sem nada de React, por isso ficam fora do
   componente: nao dependem de estado nem precisam ser recriadas
   a cada render.
   ---------------------------------------------------------- */

// Le um valor em dinheiro SEM depender do cabecalho do arquivo.
//
// O cabecalho e um sinal fraco pra isso: um mesmo extrato pode vir com data
// em dd/mm/aaaa e valor com ponto decimal, ou o contrario. Quem sabe qual e
// o separador decimal e o proprio valor - entao e ele que decide.
//
// Regra: o ULTIMO ponto ou virgula e o separador decimal; o que vier antes
// dele e separador de milhar e some.
//   "1.234,56" -> 1234.56        "1,234.56" -> 1234.56
//   "178,28"   -> 178.28         "178.28"   -> 178.28
// Excecao: 3 digitos depois do separador, sem nenhum outro separador antes,
// e milhar e nao centavos - "1.500" sao mil e quinhentos, porque dinheiro
// nao tem 3 casas decimais.
function parseMoney(text) {
  // tira "R$", espaco, sinal de mais e qualquer outro enfeite
  const limpo = text.trim().replace(/[^\d.,-]/g, '');
  const ultimoSeparador = Math.max(limpo.lastIndexOf('.'), limpo.lastIndexOf(','));
  if (ultimoSeparador === -1) return Number(limpo);

  const antes = limpo.slice(0, ultimoSeparador);
  const depois = limpo.slice(ultimoSeparador + 1);

  if (depois.length === 3 && !/[.,]/.test(antes)) {
    return Number(antes + depois);
  }

  return Number(antes.replace(/[.,]/g, '') + '.' + depois);
}

// "05/09/2026" -> "2026-09-05" (formato que o <input type="date"> e o
// backend esperam)
function parseBRDate(text) {
  const parts = text.trim().split('/');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  if (!day || !month || !year || year.length !== 4) return null;

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// "2026-09-05" ja vem no formato certo; so confere se tem essa cara mesmo
function parseIsoDate(text) {
  const trimmed = text.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

// Mesma ideia do valor: a data se identifica sozinha pela forma, entao nao
// precisa que o cabecalho diga qual das duas convencoes o arquivo usa.
function parseDate(text) {
  return parseIsoDate(text) ?? parseBRDate(text);
}

// Separa uma linha de CSV pelo delimitador respeitando campos entre aspas
// (ex: "25,99" nao pode quebrar em dois campos mesmo com a virgula sendo o
// delimitador - e assim que a fatura do Nubank escapa o valor)
function splitCsvLine(line, delimiter) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

// O cabecalho agora decide so DUAS coisas: qual o delimitador das colunas e
// se a primeira linha e titulo ou ja e dado. Data e valor se identificam
// sozinhos pela forma, entao um arquivo com cabecalho desconhecido (ou com
// o BOM que o Excel cola na frente) continua sendo lido certo.
//   "data;titulo;valor" -> generico (planilha/banco em pt-BR)
//   "date,title,amount" -> export de fatura do Nubank
function detectCsvFormat(firstLine) {
  const headerLower = firstLine.trim().toLowerCase();

  if (headerLower === 'date,title,amount') {
    return { delimiter: ',', hasHeader: true };
  }

  if (headerLower.split(';')[0]?.trim() === 'data') {
    return { delimiter: ';', hasHeader: true };
  }

  // sem cabecalho conhecido: vale o separador que mais divide a linha
  const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
  return { delimiter, hasHeader: false };
}

// Le o texto do CSV e devolve as linhas validas + a lista de linhas
// ignoradas. Uma linha ruim nunca trava a importacao das outras.
function parseCsv(text) {
  const lines = text
    // BOM que Excel e varios bancos colam no inicio do arquivo - sem tirar,
    // o cabecalho nunca casa e o formato acaba detectado errado
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return { rows: [], errors: [] };

  const { delimiter, hasHeader } = detectCsvFormat(lines[0]);
  const rows = [];
  const errors = [];

  lines.forEach((line, index) => {
    if (index === 0 && hasHeader) return;

    const parts = splitCsvLine(line, delimiter);
    if (parts.length < 3) {
      errors.push(`linha ${index + 1} (esperava 3 colunas)`);
      return;
    }

    const [rawDate, rawTitle, rawAmount] = parts;
    const date = parseDate(rawDate);
    const description = rawTitle.trim();
    const amount = parseMoney(rawAmount);

    // valor negativo passa: numa fatura e credito/estorno, e quem decide se
    // isso vira entrada ou saida e o usuario, escolhendo a categoria na
    // revisao. So o zero (e o que nao for numero) continua invalido.
    if (!date || !description || !amount || Number.isNaN(amount)) {
      errors.push(`linha ${index + 1} (dados inválidos)`);
      return;
    }

    rows.push({ date, description, amount });
  });

  return { rows, errors };
}

// o <input type="date"> so entende "YYYY-MM-DD"; a data vem do backend em
// ISO completo. Cortar a string (em vez de usar new Date) evita o fuso do
// navegador reinterpretar o dia - mesmo cuidado do TransactionModal.
function paraCampoData(isoString) {
  return isoString.slice(0, 10);
}

export function ImportTransactions() {
  const { activeBusiness } = useBusiness();

  const [categories, setCategories] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [arquivo, setArquivo] = useState(null);
  const [isImportando, setIsImportando] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [processando, setProcessando] = useState(null);
  const [isArrastando, setIsArrastando] = useState(false);

  useEffect(() => {
    listCategories(activeBusiness.id)
      .then(setCategories)
      .catch(() => {});
  }, [activeBusiness.id]);

  // useCallback pra funcao poder entrar na lista de dependencias do efeito
  // sem ser recriada a cada render
  const recarregar = useCallback(async () => {
    try {
      const lidas = await listImportedTransactions(activeBusiness.id);
      // o sinal negativo que veio do arquivo e a marca de credito. Aqui ele
      // vira um booleano e o valor fica positivo, que e como o formulario e o
      // resto do sistema trabalham. Normalizar na fronteira evita que cada
      // pedaco do JSX tenha que lembrar de tratar o sinal - a linha no banco
      // continua guardando o negativo, fiel ao extrato.
      setPendentes(
        lidas.map((linha) => ({
          ...linha,
          ehCredito: Number(linha.amount) < 0,
          amount: Math.abs(Number(linha.amount)).toFixed(2),
        })),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar as linhas importadas');
    } finally {
      setIsLoading(false);
    }
  }, [activeBusiness.id]);

  // envolvido numa arrow de proposito: recarregar() devolve uma Promise, e
  // o useEffect so aceita receber de volta uma funcao de limpeza
  useEffect(() => {
    recarregar();
  }, [recarregar]);

  async function handleImportar(event) {
    event.preventDefault();
    if (!arquivo) return;

    setError(null);
    setResumo(null);
    setIsImportando(true);

    try {
      const texto = await arquivo.text();
      const { rows, errors } = parseCsv(texto);

      if (rows.length === 0) {
        setError('Nenhuma linha válida encontrada no arquivo. Confira o formato aceito acima.');
        return;
      }

      await bulkCreateImportedTransactions(activeBusiness.id, rows);
      setResumo({ quantidade: rows.length, errors });
      await recarregar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao ler o arquivo');
    } finally {
      setIsImportando(false);
    }
  }

  // edicao local da linha antes de confirmar - so mexe no estado da tela,
  // nada vai pro banco ate o usuario clicar em Confirmar
  function alterarLinha(id, campo, valor) {
    setPendentes((atual) => atual.map((linha) => (linha.id === id ? { ...linha, [campo]: valor } : linha)));
  }

  async function handleConfirmar(linha) {
    setError(null);
    setProcessando(linha.id);

    try {
      await confirmImportedTransaction(activeBusiness.id, linha.id, {
        description: linha.description,
        amount: Number(linha.amount),
        date: paraCampoData(linha.date),
        categoryId: linha.categoryId,
      });
      setPendentes((atual) => atual.filter((item) => item.id !== linha.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao confirmar a linha');
    } finally {
      setProcessando(null);
    }
  }

  async function handleDescartar(linha) {
    if (!window.confirm(`Descartar a linha "${linha.description}"?`)) return;

    setError(null);
    setProcessando(linha.id);

    try {
      await discardImportedTransaction(activeBusiness.id, linha.id);
      setPendentes((atual) => atual.filter((item) => item.id !== linha.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao descartar a linha');
    } finally {
      setProcessando(null);
    }
  }

  async function handleConfirmarTodas() {
    const prontas = pendentes.filter((linha) => linha.categoryId);
    if (prontas.length === 0) return;

    setError(null);
    // uma de cada vez, nao em paralelo: assim uma linha que falhar nao
    // derruba as outras e o usuario ve a lista diminuindo aos poucos
    for (const linha of prontas) {
      await handleConfirmar(linha);
    }
  }

  const semCategoria = pendentes.filter((linha) => !linha.categoryId).length;
  const creditos = pendentes.filter((linha) => linha.ehCredito).length;

  function aoSoltarArquivo(event) {
    event.preventDefault();
    setIsArrastando(false);
    const solto = event.dataTransfer.files?.[0];
    if (solto) setArquivo(solto);
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="page-eyebrow">Movimentações</p>
          <h1>Importar</h1>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="panel">
        <div className="panel-head">
          <h2>Importar arquivo CSV</h2>
        </div>

        <form onSubmit={handleImportar} className="import-form">
          {/* um <label> envolvendo o input escondido: o clique no label ja
              abre o seletor de arquivo do sistema, sem precisar de useRef nem
              de disparar .click() na mao. O arrastar e tratado a parte,
              escrevendo direto no estado - o input nem fica sabendo. */}
          <label
            className={`dropzone${isArrastando ? ' dropzone--ativa' : ''}${arquivo ? ' dropzone--cheia' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsArrastando(true);
            }}
            onDragLeave={() => setIsArrastando(false)}
            onDrop={aoSoltarArquivo}
          >
            <input
              type="file"
              accept=".csv,text/csv"
              className="dropzone-input"
              // limpar antes de abrir faz o onChange disparar mesmo quando o
              // usuario escolhe o MESMO arquivo de novo
              onClick={(event) => {
                event.target.value = '';
              }}
              onChange={(event) => setArquivo(event.target.files?.[0] ?? null)}
            />

            <span className="dropzone-icone" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15V3" />
                <path d="M8 7l4-4 4 4" />
                <path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
              </svg>
            </span>

            <span className="dropzone-texto">
              {arquivo ? (
                <>
                  <strong>{arquivo.name}</strong>
                  <span>{(arquivo.size / 1024).toFixed(1)} KB — clique para trocar</span>
                </>
              ) : (
                <>
                  <strong>Arraste o arquivo aqui</strong>
                  <span>ou clique para escolher um .csv</span>
                </>
              )}
            </span>
          </label>

          <button type="submit" className="primary-button import-enviar" disabled={!arquivo || isImportando}>
            {isImportando ? 'Lendo arquivo...' : 'Importar'}
          </button>
        </form>

        <p className="hint import-formats">
          Formatos aceitos: <code>data;titulo;valor</code> ou o CSV de fatura do Nubank (<code>date,title,amount</code>).
          A data pode vir como <code>05/09/2026</code> ou <code>2026-09-05</code>, e o valor com vírgula
          (<code>150,00</code>) ou com ponto (<code>150.00</code>) — tudo é reconhecido automaticamente.
        </p>

        {resumo && (
          <p className="import-resumo">
            {resumo.quantidade} transação(ões) identificada(s), aguardando revisão abaixo.
            {resumo.errors.length > 0 && ` ${resumo.errors.length} linha(s) ignorada(s): ${resumo.errors.join(', ')}.`}
          </p>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Transações identificadas</h2>
          {pendentes.length > 0 && <span className="panel-badge">{pendentes.length}</span>}
          {pendentes.length > 0 && (
            <button
              type="button"
              className="primary-button panel-head-action"
              onClick={handleConfirmarTodas}
              disabled={processando !== null || pendentes.every((linha) => !linha.categoryId)}
            >
              Confirmar todas
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="empty-state">Carregando...</p>
        ) : pendentes.length === 0 ? (
          <p className="empty-state">Nenhuma linha aguardando revisão. Importe um arquivo para começar.</p>
        ) : (
          <>
            {semCategoria > 0 && (
              <p className="hint import-aviso">
                {semCategoria} linha(s) ainda sem categoria. Escolha uma para poder confirmar.
              </p>
            )}

            {creditos > 0 && (
              <p className="hint import-aviso import-aviso--credito">
                {creditos} linha(s) vieram como crédito na fatura (valor negativo). Escolha uma categoria de entrada
                para registrar como recebimento, ou uma de saída se preferir tratar como despesa.
              </p>
            )}

            <table className="data-table tabela-revisao">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor (R$)</th>
                  <th>Categoria</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pendentes.map((linha) => (
                  <tr key={linha.id} className={linha.categoryId ? undefined : 'linha-sem-categoria'}>
                    <td>
                      <input
                        type="date"
                        className="celula-editavel"
                        value={paraCampoData(linha.date)}
                        onChange={(event) => alterarLinha(linha.id, 'date', event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="celula-editavel"
                        value={linha.description}
                        onChange={(event) => alterarLinha(linha.id, 'description', event.target.value)}
                      />
                    </td>
                    <td>
                      <span className="celula-valor">
                        <span className="celula-valor-moeda" aria-hidden="true">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="celula-editavel celula-editavel--valor"
                          value={linha.amount}
                          onChange={(event) => alterarLinha(linha.id, 'amount', event.target.value)}
                        />
                      </span>
                      {linha.ehCredito && <span className="tag-credito">crédito na fatura</span>}
                    </td>
                    <td>
                      <CategorySelect
                        categories={categories}
                        value={linha.categoryId ?? ''}
                        onChange={(valor) => alterarLinha(linha.id, 'categoryId', valor)}
                      />
                    </td>
                    <td className="table-actions">
                      <button
                        type="button"
                        className="row-button row-button--confirmar"
                        onClick={() => handleConfirmar(linha)}
                        disabled={!linha.categoryId || processando !== null}
                        title={linha.categoryId ? 'Confirmar esta linha' : 'Escolha uma categoria primeiro'}
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 12.5l5 5L20 6.5" />
                        </svg>
                        Confirmar
                      </button>
                      <button
                        type="button"
                        className="row-button row-button--descartar"
                        onClick={() => handleDescartar(linha)}
                        disabled={processando !== null}
                        title="Descartar esta linha"
                      >
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                        Descartar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}

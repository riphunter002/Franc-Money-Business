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

    if (!date || !description || !amount || Number.isNaN(amount) || amount <= 0) {
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

  useEffect(() => {
    listCategories(activeBusiness.id)
      .then(setCategories)
      .catch(() => {});
  }, [activeBusiness.id]);

  // useCallback pra funcao poder entrar na lista de dependencias do efeito
  // sem ser recriada a cada render
  const recarregar = useCallback(async () => {
    try {
      setPendentes(await listImportedTransactions(activeBusiness.id));
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
          <input type="file" accept=".csv,text/csv" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
          <button type="submit" className="primary-button" disabled={!arquivo || isImportando}>
            {isImportando ? 'Lendo...' : 'Importar'}
          </button>
        </form>

        <p className="hint import-formats">
          Formatos aceitos: <code>data;titulo;valor</code> (ex.: <code>05/09/2026;Supermercado Extra;150,00</code>) ou o
          CSV de fatura do Nubank (<code>date,title,amount</code>). A data pode vir como <code>05/09/2026</code> ou{" "}
          <code>2026-09-05</code>, e o valor com vírgula (<code>150,00</code>) ou com ponto (<code>150.00</code>) — tudo
          é reconhecido automaticamente.
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

            <table className="data-table">
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
                        onChange={(e) => alterarLinha(linha.id, 'date', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="celula-editavel"
                        value={linha.description}
                        onChange={(e) => alterarLinha(linha.id, 'description', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="celula-editavel celula-editavel--valor"
                        value={linha.amount}
                        onChange={(e) => alterarLinha(linha.id, 'amount', e.target.value)}
                      />
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
                        className="link-button"
                        onClick={() => handleConfirmar(linha)}
                        disabled={!linha.categoryId || processando !== null}
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        className="link-button link-button--danger"
                        onClick={() => handleDescartar(linha)}
                        disabled={processando !== null}
                      >
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

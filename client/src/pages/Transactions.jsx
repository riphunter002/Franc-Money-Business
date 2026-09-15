import { useEffect, useState } from 'react';
import { listCategories } from '../api/categories.js';
import { ApiError } from '../api/client.js';
import { deleteTransaction, listTransactions } from '../api/transactions.js';
import { TransactionModal } from '../components/TransactionModal.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { formatCurrency } from '../utils/format.js';

const PAGE_SIZE = 20;

export function Transactions() {
  const { activeBusiness } = useBusiness();

  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // undefined = modal fechado; null = modo criacao; objeto = modo edicao
  const [modalTransaction, setModalTransaction] = useState(undefined);

  // categorias so pro select do modal e pra pintar a bolinha da tabela -
  // busca uma vez, nao precisa refazer a cada filtro/pagina
  useEffect(() => {
    listCategories(activeBusiness.id).then(setCategories).catch(() => {});
  }, [activeBusiness.id]);

  function refetch() {
    setIsLoading(true);
    listTransactions(activeBusiness.id, { type: typeFilter || undefined, page, limit: PAGE_SIZE })
      .then((result) => {
        setTransactions(result.data);
        setMeta(result.meta);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar transações'))
      .finally(() => setIsLoading(false));
  }

  useEffect(refetch, [activeBusiness.id, typeFilter, page]);

  function handleFilterChange(value) {
    setTypeFilter(value);
    setPage(1); // mudou o filtro, volta pra primeira pagina
  }

  function closeModal() {
    setModalTransaction(undefined);
  }

  function handleSaved() {
    closeModal();
    refetch();
  }

  async function handleDelete(transaction) {
    if (!window.confirm(`Excluir a transação "${transaction.description}"?`)) return;

    try {
      await deleteTransaction(activeBusiness.id, transaction.id);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao excluir transação');
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="page-eyebrow">Movimentações</p>
          <h1>Transações</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setModalTransaction(null)}>
          Nova transação
        </button>
      </header>

      <div className="filters-row">
        <select value={typeFilter} onChange={(e) => handleFilterChange(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="INCOME">Receita</option>
          <option value="EXPENSE">Despesa</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}

      {isLoading ? (
        <p>Carregando...</p>
      ) : transactions.length === 0 ? (
        <p className="empty-state">Nenhuma transação encontrada.</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  {/* timeZone: 'UTC' de proposito - mesma razao do
                      TransactionModal, nao deixar o navegador reinterpretar
                      o dia pela hora local */}
                  <td>{new Date(transaction.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                  <td>{transaction.description}</td>
                  <td>
                    <span className="color-swatch" style={{ backgroundColor: transaction.category.color }} />{' '}
                    {transaction.category.name}
                  </td>
                  <td className={transaction.type === 'INCOME' ? 'amount-income' : 'amount-expense'}>
                    {transaction.type === 'INCOME' ? '+ ' : '- '}
                    {formatCurrency(Number(transaction.amount))}
                  </td>
                  <td className="table-actions">
                    <button type="button" className="link-button" onClick={() => setModalTransaction(transaction)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="link-button link-button--danger"
                      onClick={() => handleDelete(transaction)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </button>
            <span>
              Página {meta.page} de {meta.totalPages}
            </span>
            <button type="button" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </button>
          </div>
        </>
      )}

      {modalTransaction !== undefined && (
        <TransactionModal
          transaction={modalTransaction}
          categories={categories}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

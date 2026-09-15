import { useState } from 'react';
import { ApiError } from '../api/client.js';
import { createTransaction, updateTransaction } from '../api/transactions.js';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { CategorySelect } from './CategorySelect.jsx';
import { Modal } from './Modal.jsx';

// input type="date" espera "YYYY-MM-DD" - pegamos so os 10 primeiros
// caracteres do ISO em vez de usar new Date(...).getDate()/getMonth(), que
// reinterpretaria pela hora LOCAL do navegador (mesmo bug de fuso que a
// Etapa 6 corrigiu no backend)
function toDateInputValue(isoString) {
  if (!isoString) return new Date().toISOString().slice(0, 10);
  return isoString.slice(0, 10);
}

// transaction === null -> modo criacao; transaction === {...} -> modo
// edicao. Mesmo principio do CategoryModal.
export function TransactionModal({ transaction, categories, onClose, onSaved }) {
  const { activeBusiness } = useBusiness();
  const isEditing = Boolean(transaction);

  const [description, setDescription] = useState(transaction?.description ?? '');
  const [amount, setAmount] = useState(transaction?.amount ?? '');
  const [date, setDate] = useState(toDateInputValue(transaction?.date));
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '');
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // sem "type" no payload de proposito - o backend deriva da categoria
      // escolhida (decisao da Etapa 4), entao nao existe campo pra
      // contradizer a categoria
      const data = { description, amount: Number(amount), date, categoryId };
      if (isEditing) {
        await updateTransaction(activeBusiness.id, transaction.id, data);
      } else {
        await createTransaction(activeBusiness.id, data);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar transação');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={isEditing ? 'Editar transação' : 'Nova transação'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="field-group">
        {error && <p className="error">{error}</p>}

        <label>
          Descrição
          <input value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>

        <label>
          Valor
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <label>
          Data
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        <label>
          Categoria
          <CategorySelect categories={categories} value={categoryId} onChange={setCategoryId} required />
        </label>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { useState } from 'react';
import { ApiError } from '../api/client.js';
import { createCategory, updateCategory } from '../api/categories.js';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { Modal } from './Modal.jsx';

const DEFAULT_COLOR = '#2a78d6';

// category === null -> modo criacao; category === {...} -> modo edicao,
// formulario pre-preenchido. Mesmo componente pros dois casos.
export function CategoryModal({ category, onClose, onSaved }) {
  const { activeBusiness } = useBusiness();
  const isEditing = Boolean(category);

  const [name, setName] = useState(category?.name ?? '');
  const [type, setType] = useState(category?.type ?? 'EXPENSE');
  const [color, setColor] = useState(category?.color ?? DEFAULT_COLOR);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const data = { name, type, color };
      if (isEditing) {
        await updateCategory(activeBusiness.id, category.id, data);
      } else {
        await createCategory(activeBusiness.id, data);
      }
      onSaved();
    } catch (err) {
      // ex: 409 "categoria ja tem transacoes, tipo nao pode mudar" -
      // a mensagem do backend ja e clara o suficiente pra mostrar direto
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar categoria');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={isEditing ? 'Editar categoria' : 'Nova categoria'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="field-group">
        {error && <p className="error">{error}</p>}

        <label>
          Nome
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Tipo
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita</option>
          </select>
        </label>

        <label>
          Cor
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
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

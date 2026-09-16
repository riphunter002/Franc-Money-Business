import { useEffect, useState } from 'react';
import { deleteCategory, listCategories } from '../api/categories.js';
import { ApiError } from '../api/client.js';
import { CategoryModal } from '../components/CategoryModal.jsx';
import { CategorySuggestions } from '../components/CategorySuggestions.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';

export function Categories() {
  const { activeBusiness } = useBusiness();

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // undefined = modal fechado; null = modo criacao; objeto = modo edicao
  const [modalCategory, setModalCategory] = useState(undefined);

  function refetch() {
    setIsLoading(true);
    listCategories(activeBusiness.id)
      .then(setCategories)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar categorias'))
      .finally(() => setIsLoading(false));
  }

  useEffect(refetch, [activeBusiness.id]);

  function closeModal() {
    setModalCategory(undefined);
  }

  function handleSaved() {
    closeModal();
    refetch();
  }

  async function handleDelete(category) {
    if (!window.confirm(`Excluir a categoria "${category.name}"?`)) return;

    try {
      await deleteCategory(activeBusiness.id, category.id);
      refetch();
    } catch (err) {
      // ex: 409 "categoria tem transacoes" - mensagem do backend ja e clara
      setError(err instanceof ApiError ? err.message : 'Erro ao excluir categoria');
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="page-eyebrow">Organização</p>
          <h1>Categorias</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setModalCategory(null)}>
          Nova categoria
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      {!isLoading && (
        <CategorySuggestions existentes={categories} onCriada={refetch} onErro={setError} />
      )}

      {isLoading ? (
        <p className="empty-state">Carregando...</p>
      ) : categories.length === 0 ? (
        <p className="empty-state">Nenhuma categoria cadastrada ainda.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Cor</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.type === 'INCOME' ? 'Receita' : 'Despesa'}</td>
                <td>
                  <span className="color-swatch" style={{ backgroundColor: category.color }} />
                </td>
                <td className="table-actions">
                  <button type="button" className="link-button" onClick={() => setModalCategory(category)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="link-button link-button--danger"
                    onClick={() => handleDelete(category)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalCategory !== undefined && (
        <CategoryModal category={modalCategory} onClose={closeModal} onSaved={handleSaved} />
      )}
    </div>
  );
}

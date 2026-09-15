import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client.js';
import { createBusiness, listBusinesses } from '../api/businesses.js';
import { useBusiness } from '../hooks/useBusiness.jsx';

export function BusinessSetup() {
  const { selectBusiness } = useBusiness();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // useEffect roda um "efeito colateral" (aqui, buscar dado de fora do
  // React) quando o componente monta - array de dependencias vazio [] quer
  // dizer "so uma vez, ao montar", nao a cada re-render
  useEffect(() => {
    listBusinesses()
      .then(setBusinesses)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar negocios'))
      .finally(() => setIsLoading(false));
  }, []);

  function handleSelect(business) {
    selectBusiness(business);
    navigate('/');
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const business = await createBusiness({ name, type });
      selectBusiness(business);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar negocio');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="page">
      <h1>Seus negócios</h1>
      {error && <p className="error">{error}</p>}

      {isLoading ? (
        <p>Carregando...</p>
      ) : businesses.length > 0 ? (
        <ul className="business-list">
          {businesses.map((business) => (
            <li key={business.id}>
              <button type="button" className="business-item" onClick={() => handleSelect(business)}>
                {business.name} <span className="business-type">({business.type})</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Você ainda não tem nenhum negócio cadastrado.</p>
      )}

      <h2>Criar novo negócio</h2>
      <form onSubmit={handleCreate} className="field-group">
        <label>
          Nome
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Tipo
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="ex: barbearia, pizzaria"
            required
          />
        </label>

        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Criando...' : 'Criar negócio'}
        </button>
      </form>
    </div>
  );
}

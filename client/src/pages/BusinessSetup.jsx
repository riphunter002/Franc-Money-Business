import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client.js';
import { createBusiness, listBusinesses } from '../api/businesses.js';
import { BusinessBackdrop } from '../components/BusinessBackdrop.jsx';
import { useBusiness } from '../hooks/useBusiness.jsx';

export function BusinessSetup() {
  const { selectBusiness } = useBusiness();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // useEffect roda um "efeito colateral" (aqui, buscar dado de fora do
  // React) quando o componente monta - array de dependencias vazio [] quer
  // dizer "so uma vez, ao montar", nao a cada re-render
  useEffect(() => {
    listBusinesses()
      .then((data) => {
        setBusinesses(data);
        // quem ainda nao tem negocio nenhum nao deveria precisar procurar o
        // formulario escondido - abre ja aberto nesse caso
        if (data.length === 0) setIsFormOpen(true);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Erro ao carregar negócios'))
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
      setError(err instanceof ApiError ? err.message : 'Erro ao criar negócio');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="setup-page">
      <BusinessBackdrop />

      <div className="setup-card">
        <h1>Seus negócios</h1>
        {error && <p className="error">{error}</p>}

        {isLoading ? (
          <p>Carregando...</p>
        ) : businesses.length > 0 ? (
          <ul className="business-grid">
            {businesses.map((business) => (
              <li key={business.id}>
                <button type="button" className="business-tile" onClick={() => handleSelect(business)}>
                  <span className="business-tile-badge">{business.name.charAt(0).toUpperCase()}</span>
                  <span className="business-tile-name">{business.name}</span>
                  <span className="business-tile-type">{business.type}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">Você ainda não tem nenhum negócio cadastrado.</p>
        )}

        <button
          type="button"
          className={`disclosure-trigger${isFormOpen ? ' is-open' : ''}`}
          onClick={() => setIsFormOpen((open) => !open)}
          aria-expanded={isFormOpen}
        >
          <span>{isFormOpen ? 'Cancelar' : 'Criar novo negócio'}</span>
          <span className="disclosure-chevron">⌄</span>
        </button>

        {isFormOpen && (
          <form onSubmit={handleCreate} className="field-group disclosure-panel">
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
        )}
      </div>
    </div>
  );
}

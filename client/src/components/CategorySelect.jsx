// componente "burro": recebe a lista de categorias pronta via prop em vez
// de buscar a sua propria - quem usa (TransactionModal) ja tinha essa
// lista carregada, evita duplicar a busca
export function CategorySelect({ categories, value, onChange, required }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
      <option value="" disabled>
        Selecione uma categoria
      </option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name} ({category.type === 'INCOME' ? 'receita' : 'despesa'})
        </option>
      ))}
    </select>
  );
}

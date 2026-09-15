import { createContext, useCallback, useContext, useState } from 'react';

const BusinessContext = createContext(null);
const STORAGE_KEY = 'fmb_active_business';

function loadInitialBusiness() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

// guarda qual negocio esta "ativo" no momento - o mesmo principio do
// useAuth, mas pro contexto de trabalho atual em vez da sessao de login.
// Fica separado do AuthProvider porque sao duas responsabilidades
// diferentes: "quem sou eu" vs "em qual negocio estou trabalhando agora"
export function BusinessProvider({ children }) {
  const [activeBusiness, setActiveBusiness] = useState(loadInitialBusiness);

  const selectBusiness = useCallback((business) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(business));
    setActiveBusiness(business);
  }, []);

  const clearBusiness = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveBusiness(null);
  }, []);

  const value = { activeBusiness, selectBusiness, clearBusiness };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness precisa ser usado dentro de um <BusinessProvider>');
  }
  return context;
}

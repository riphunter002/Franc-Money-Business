import { createContext, useCallback, useContext, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'fmb_theme';

// sem preferencia salva ainda - usa o que o sistema operacional do usuario
// ja esta configurado, em vez de sempre comecar no claro
function getPreferredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// so guarda O ESTADO e a preferencia (localStorage) - quem realmente aplica
// o atributo no <html> e o AppLayout, de proposito: assim o tema so existe
// enquanto o usuario esta logado, nunca vazando pras telas de login/cadastro
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getPreferredTheme);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = { theme, toggleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme precisa ser usado dentro de um <ThemeProvider>');
  }
  return context;
}

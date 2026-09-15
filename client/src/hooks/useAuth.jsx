import { createContext, useCallback, useContext, useState } from 'react';
import * as authApi from '../api/auth.js';
import { clearSession, getStoredUser, getToken, saveSession } from '../api/session.js';

const AuthContext = createContext(null);

// componente "provedor" - guarda o estado de sessao UMA vez, no topo da
// arvore (ver main.jsx), pra qualquer componente abaixo conseguir ler com
// useAuth() sem precisar receber isso via prop
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => getStoredUser());

  const applySession = useCallback((session) => {
    saveSession(session);
    setToken(session.token);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const session = await authApi.login(credentials);
      applySession(session);
    },
    [applySession],
  );

  const register = useCallback(
    async (data) => {
      const session = await authApi.register(data);
      applySession(session);
    },
    [applySession],
  );

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = { token, user, isAuthenticated: Boolean(token), login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de um <AuthProvider>');
  }
  return context;
}

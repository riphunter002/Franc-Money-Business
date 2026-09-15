import { getToken } from './session.js';

const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// equivalente ao fetchWithAuth: injeta o token automaticamente (a menos que
// auth:false seja passado, usado so em /users e /login) e padroniza como um
// erro de resposta HTTP vira um erro de JS que os componentes conseguem
// capturar com try/catch
export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? 'Erro inesperado', data?.details);
  }

  return data;
}

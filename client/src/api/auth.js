import { apiFetch } from './client.js';

export function register({ name, email, password }) {
  return apiFetch('/users', { method: 'POST', body: { name, email, password }, auth: false });
}

export function login({ email, password }) {
  return apiFetch('/login', { method: 'POST', body: { email, password }, auth: false });
}

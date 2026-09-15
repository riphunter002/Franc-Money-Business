import { apiFetch } from './client.js';

export function listBusinesses() {
  return apiFetch('/businesses');
}

export function createBusiness({ name, type }) {
  return apiFetch('/businesses', { method: 'POST', body: { name, type } });
}

import { apiFetch } from './client.js';

export function getSummary(businessId) {
  return apiFetch(`/businesses/${businessId}/summary`);
}

import { apiFetch } from './client.js';

export function getHistory(businessId, months) {
  return apiFetch(`/businesses/${businessId}/history?months=${months}`);
}

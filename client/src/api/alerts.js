import { apiFetch } from './client.js';

export function getAlerts(businessId) {
  return apiFetch(`/businesses/${businessId}/alerts`);
}

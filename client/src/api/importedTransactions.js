import { apiFetch } from './client.js';

export function listImportedTransactions(businessId) {
  return apiFetch(`/businesses/${businessId}/imported-transactions`);
}

export function bulkCreateImportedTransactions(businessId, rows) {
  return apiFetch(`/businesses/${businessId}/imported-transactions`, { method: 'POST', body: { rows } });
}

export function confirmImportedTransaction(businessId, id, overrides) {
  return apiFetch(`/businesses/${businessId}/imported-transactions/${id}/confirm`, {
    method: 'POST',
    body: overrides,
  });
}

export function discardImportedTransaction(businessId, id) {
  return apiFetch(`/businesses/${businessId}/imported-transactions/${id}`, { method: 'DELETE' });
}

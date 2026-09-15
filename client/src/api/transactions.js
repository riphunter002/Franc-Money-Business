import { apiFetch } from './client.js';

export function listTransactions(businessId, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  ).toString();

  return apiFetch(`/businesses/${businessId}/transactions${query ? `?${query}` : ''}`);
}

export function createTransaction(businessId, data) {
  return apiFetch(`/businesses/${businessId}/transactions`, { method: 'POST', body: data });
}

export function updateTransaction(businessId, transactionId, data) {
  return apiFetch(`/businesses/${businessId}/transactions/${transactionId}`, { method: 'PUT', body: data });
}

export function deleteTransaction(businessId, transactionId) {
  return apiFetch(`/businesses/${businessId}/transactions/${transactionId}`, { method: 'DELETE' });
}

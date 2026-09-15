import { apiFetch } from './client.js';

export function listCategories(businessId) {
  return apiFetch(`/businesses/${businessId}/categories`);
}

export function createCategory(businessId, data) {
  return apiFetch(`/businesses/${businessId}/categories`, { method: 'POST', body: data });
}

export function updateCategory(businessId, categoryId, data) {
  return apiFetch(`/businesses/${businessId}/categories/${categoryId}`, { method: 'PUT', body: data });
}

export function deleteCategory(businessId, categoryId) {
  return apiFetch(`/businesses/${businessId}/categories/${categoryId}`, { method: 'DELETE' });
}

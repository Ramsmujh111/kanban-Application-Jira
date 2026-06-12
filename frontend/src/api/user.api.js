import api from './axios';

export const userApi = {
  search: (query) => api.get('/users/search', { params: { q: query } }),
};

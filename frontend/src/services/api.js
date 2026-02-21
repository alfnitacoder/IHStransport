import axios from 'axios';

// In dev, call backend directly so PATCH is not dropped by proxy. Prod: /api (or set VITE_API_URL).
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Build URL explicitly so PATCH /api/cards/2 is never wrong (base + path with one slash)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.url && typeof config.url === 'string' && !config.url.startsWith('http')) {
    const base = (config.baseURL || '').replace(/\/+$/, '');
    const path = config.url.replace(/^\/+/, '');
    config.url = path ? `${base}/${path}` : base || '/';
    config.baseURL = '';
  }
  return config;
});

// Handle auth errors and log 404 path
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/landing';
    }
    if (error.response?.status === 404) {
      const path = error.response?.data?.path || error.config?.url || (error.config?.baseURL || '') + (error.config?.url || '');
      const fullUrl = error.config?.baseURL && error.config?.url && !error.config.url.startsWith('http')
        ? error.config.baseURL.replace(/\/+$/, '') + '/' + error.config.url.replace(/^\/+/, '')
        : path;
      console.error('[API 404]', error.config?.method, fullUrl || path);
    }
    return Promise.reject(error);
  }
);

export default api;

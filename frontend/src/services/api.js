import axios from 'axios';

// Use VITE_API_URL if set. Else: when app is opened from same machine (localhost) use backend direct;
// when opened from another host (e.g. 172.16.0.68:8080) use relative /api so the dev server proxies to backend.
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const devApiUrl = isLocalhost ? 'http://localhost:3001/api' : '/api';
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? devApiUrl : '/api');

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
    const status = error.response?.status;
    const message = error.response?.data?.error || '';
    if (status === 401 || (status === 403 && (message.includes('expired') || message.includes('Invalid or expired')))) {
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

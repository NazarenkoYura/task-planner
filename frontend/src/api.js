import axios from 'axios';

const API = axios.create({
  // Динамический выбор базового URL:
  // Если запуск локальный (Vite на порту 5173) -> шлем напрямую на 8000 порт.
  // Если запуск в Docker (порт не 5173) -> используем относительный путь /api/ (Nginx проксирует)
  baseURL: window.location.port === '5173' ? 'http://127.0.0.1:8000/api/' : '/api/',
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
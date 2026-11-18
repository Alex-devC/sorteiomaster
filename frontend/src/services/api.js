import axios from 'axios';

// Utiliza a variável de ambiente VITE_API_URL ou fallback seguro
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Requisição: Anexa o Bearer JWT caso exista no localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@SorteioMaster:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: Trata HTTP 401 e encerra a sessão automaticamente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Se não for a própria requisição de login que falhou
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('@SorteioMaster:token');
        localStorage.removeItem('@SorteioMaster:user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

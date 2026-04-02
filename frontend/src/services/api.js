import axios from 'axios';

// Aqui está a mágica: ele tenta pegar a variável da Vercel. 
// Se não achar (no seu PC), usa o localhost.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Antes de cada requisição, verifica se tem token salvo e adiciona no cabeçalho
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('user_token');
  if (token) {
    config.headers['auth-token'] = token;
  }
  return config;
});

export default api;
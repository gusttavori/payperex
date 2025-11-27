import axios from 'axios';

const api = axios.create({
  baseURL: 'https://payperex.onrender.com', // Endereço do seu Backend
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
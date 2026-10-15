import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) {
  console.warn('[API] VITE_API_URL nao configurado! Verifique o arquivo .env');
}

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Injeta o token automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tratamento global de respostas de erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: Token expirado, ausente ou conta inativa -> Redireciona para login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/#/login';
      window.location.reload();
      return Promise.reject(error);
    }

    // 403: Acesso Negado (ex: Operador tentando ação restrita a Admin)
    // NÃO remove o token nem desloga; formata mensagem amigável para exibição
    if (error.response?.status === 403) {
      if (!error.response.data || typeof error.response.data !== 'object') {
        error.response.data = {};
      }
      if (!error.response.data.message && !error.response.data.erro && !error.response.data.error) {
        error.response.data.message = 'Acesso negado: apenas Administradores têm permissão para realizar esta operação.';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
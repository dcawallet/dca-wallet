import { getAuthHeaders } from './auth';

const BASE_URL = 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    // Redireciona para a página de login em caso de 401 Unauthorized
    // Isso forçará o usuário a fazer login novamente.
    window.location.href = '/auth'; // Ajuste esta rota para a sua página de login
    throw new Error('Unauthorized: Redirecting to login.');
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const apiClient = {
  get: async <T>(path: string, options?: RequestOptions): Promise<T> => {
    const headers = options?.requireAuth ? getAuthHeaders() : {};
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...options,
    });
    return handleResponse(response);
  },

  post: async <T>(path: string, data: any, options?: RequestOptions): Promise<T> => {
    const headers = options?.requireAuth ? getAuthHeaders() : {};
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse(response);
  },

  put: async <T>(path: string, data: any, options?: RequestOptions): Promise<T> => {
    const headers = options?.requireAuth ? getAuthHeaders() : {};
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    return handleResponse(response);
  },

  delete: async <T>(path: string, options?: RequestOptions): Promise<T> => {
    const headers = options?.requireAuth ? getAuthHeaders() : {};
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...options,
    });
    return handleResponse(response);
  },
};

export default apiClient;

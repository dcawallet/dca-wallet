import { AuthResponse, LoginRequest, RegisterRequest } from './types';

const BASE_URL = 'http://localhost:8000/api';

export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Registration failed');
  }
  return response.json();
};

export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const params = new URLSearchParams();
  params.append('grant_type', data.grant_type || 'password');
  params.append('username', data.username);
  params.append('password', data.password);
  params.append('scope', data.scope || '');
  params.append('client_id', data.client_id || 'string');
  params.append('client_secret', data.client_secret || '');

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Login failed');
  }
  const authResponse: AuthResponse = await response.json();
  localStorage.setItem('access_token', authResponse.access_token);
  localStorage.setItem('token_type', authResponse.token_type);
  return authResponse;
};

export const logoutUser = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token_type');
};

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  const tokenType = localStorage.getItem('token_type');
  if (token && tokenType) {
    return {
      'Authorization': `${tokenType} ${token}`,
      'Content-Type': 'application/json',
    };
  }
  return { 'Content-Type': 'application/json' };
};

import { User, UpdateUserRequest } from './types';
import { getAuthHeaders } from './auth';

const BASE_URL = 'http://localhost:8000/api';

export const getUserInfo = async (): Promise<User> => {
  const response = await fetch(`${BASE_URL}/user/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch user info');
  }
  return response.json();
};

export const updateUserInfo = async (data: UpdateUserRequest): Promise<User> => {
  const response = await fetch(`${BASE_URL}/user/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update user info');
  }
  return response.json();
};

import { CreateTransactionRequest, Transaction } from './types';
import { getAuthHeaders } from './auth';

const BASE_URL = 'http://localhost:8000/api';

export const createTransaction = async (data: CreateTransactionRequest): Promise<Transaction> => {
  const response = await fetch(`${BASE_URL}/transactions/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create transaction');
  }
  return response.json();
};

export const listTransactions = async (walletId: string): Promise<Transaction[]> => {
  const response = await fetch(`${BASE_URL}/transactions/${walletId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to list transactions');
  }
  return response.json();
};

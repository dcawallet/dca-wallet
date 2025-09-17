import { CreateTransactionRequest, Transaction } from './types';
import apiClient from './apiClient'; // Importar o novo apiClient

// REMOVER: const BASE_URL = 'http://localhost:8000/api';
// REMOVER: import { getAuthHeaders } from './auth';

export const createTransaction = async (data: CreateTransactionRequest): Promise<Transaction> => {
  return apiClient.post<Transaction>('/transactions/', data, { requireAuth: true });
};

export const listTransactions = async (walletId: string): Promise<Transaction[]> => {
  return apiClient.get<Transaction[]>(`/transactions/${walletId}`, { requireAuth: true });
};

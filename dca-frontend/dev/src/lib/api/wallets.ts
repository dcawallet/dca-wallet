import { CreateWalletRequest, CreateBlockchainSyncWalletRequest, UpdateDCAConfigRequest, Wallet } from './types';
import apiClient from './apiClient'; // Importar o novo apiClient

// REMOVER: const BASE_URL = 'http://localhost:8000/api';
// REMOVER: import { getAuthHeaders } from './auth';

export const createWallet = async (data: CreateWalletRequest): Promise<Wallet> => {
  return apiClient.post<Wallet>('/wallets/', data, { requireAuth: true });
};

export const createBlockchainSyncWallet = async (data: CreateBlockchainSyncWalletRequest): Promise<Wallet> => {
  return apiClient.post<Wallet>('/wallets/blockchain-sync', data, { requireAuth: true });
};

export const listWallets = async (): Promise<Wallet[]> => {
  return apiClient.get<Wallet[]>('/wallets/', { requireAuth: true });
};

export const getWalletDetails = async (walletId: string): Promise<Wallet> => {
  return apiClient.get<Wallet>(`/wallets/${walletId}`, { requireAuth: true });
};

export const updateDcaConfig = async (walletId: string, data: UpdateDCAConfigRequest): Promise<Wallet> => {
  return apiClient.put<Wallet>(`/wallets/${walletId}/dca`, data, { requireAuth: true });
};

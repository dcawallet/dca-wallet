import { CreateWalletRequest, CreateBlockchainSyncWalletRequest, UpdateDCAConfigRequest, Wallet } from './types';
import { getAuthHeaders } from './auth';

const BASE_URL = 'http://localhost:8000/api';

export const createWallet = async (data: CreateWalletRequest): Promise<Wallet> => {
  const response = await fetch(`${BASE_URL}/wallets/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create wallet');
  }
  return response.json();
};

export const createBlockchainSyncWallet = async (data: CreateBlockchainSyncWalletRequest): Promise<Wallet> => {
  const response = await fetch(`${BASE_URL}/wallets/blockchain-sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create blockchain sync wallet');
  }
  return response.json();
};

export const listWallets = async (): Promise<Wallet[]> => {
  const response = await fetch(`${BASE_URL}/wallets/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to list wallets');
  }
  return response.json();
};

export const getWalletDetails = async (walletId: string): Promise<Wallet> => {
  const response = await fetch(`${BASE_URL}/wallets/${walletId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to get wallet details');
  }
  return response.json();
};

export const updateDcaConfig = async (walletId: string, data: UpdateDCAConfigRequest): Promise<Wallet> => {
  const response = await fetch(`${BASE_URL}/wallets/${walletId}/dca`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update DCA configuration');
  }
  return response.json();
};

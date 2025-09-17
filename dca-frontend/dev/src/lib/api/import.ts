import { ImportCoinMarketCapRequest } from './types';
import { getAuthHeaders } from './auth';

const BASE_URL = 'http://localhost:8000/api';

export const importCoinMarketCap = async (data: { file: File; new_wallet_label?: string; wallet_id?: string; }): Promise<any> => {
  const formData = new FormData();
  formData.append('file', data.file);
  if (data.new_wallet_label) {
    formData.append('new_wallet_label', data.new_wallet_label);
  }
  if (data.wallet_id) {
    formData.append('wallet_id', data.wallet_id);
  }

  const headers = getAuthHeaders();
  // Remove 'Content-Type': 'application/json' when sending FormData
  // The browser will set the correct 'Content-Type': 'multipart/form-data' with boundary automatically
  delete (headers as any)['Content-Type'];

  const response = await fetch(`${BASE_URL}/import/coinmarketcap`, {
    method: 'POST',
    headers: headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to import CoinMarketCap data');
  }
  return response.json();
};

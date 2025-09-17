export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  profile_picture?: string;
  country?: string;
  language?: string;
  currencies?: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DcaSetting {
  dca_amount: number;
  dca_currency: string;
  dca_frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  dca_price_range_min?: number | null;
  dca_price_range_max?: number | null;
}

export interface Wallet {
  id: string;
  label: string;
  currency: string;
  notes?: string;
  wallet_address?: string;
  dca_enabled: boolean;
  dca_settings?: DcaSetting[];
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  transaction_type: 'manual_buy' | 'manual_sell' | 'dca_buy';
  amount_btc: number;
  price_per_btc_usd: number;
  total_value_usd: number;
  currency: string;
  notes?: string;
  transaction_date: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: { message: string; details?: any };
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  grant_type?: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}

export interface CreateWalletRequest {
  label: string;
  currency: string;
  notes?: string;
}

export interface CreateBlockchainSyncWalletRequest {
  label: string;
  wallet_address: string;
  currency: string;
  notes?: string;
}

export interface UpdateDCAConfigRequest {
  dca_enabled: boolean;
  dca_settings: DcaSetting[];
}

export interface CreateTransactionRequest {
  wallet_id: string;
  transaction_type: 'manual_buy' | 'manual_sell';
  amount_btc: number;
  price_per_btc_usd: number;
  total_value_usd: number;
  currency: string;
  notes?: string;
}

export interface UpdateUserRequest {
  full_name?: string;
  profile_picture?: string;
  country?: string;
  language?: string;
  currencies?: string[];
}

export interface ImportCoinMarketCapRequest {
  file: File;
  new_wallet_label?: string;
  wallet_id?: string;
}

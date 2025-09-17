import { useState, useEffect } from 'react';
import apiClient from '../lib/api/apiClient'; // Importar o apiClient

interface BitcoinPriceData {
  btc_usd_price: number;
  btc_brl_price: number;
  last_updated: string;
  usd_brl_currencyapi: number;
  usd_brl_calculated: number;
}

const STORAGE_KEY = 'bitcoinPriceData';
const FETCH_INTERVAL = 2 * 60 * 1000; // 2 minutos em milissegundos

export const useBitcoinPrice = () => {
  const [priceData, setPriceData] = useState<BitcoinPriceData | null>(() => {
    // Tenta carregar dados da sessionStorage na inicialização
    const storedData = sessionStorage.getItem(STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBitcoinPrice = async () => {
    try {
      setLoading(true);
      setError(null);
      // Usar apiClient.get para buscar os dados de preço
      const data: BitcoinPriceData = await apiClient.get<BitcoinPriceData>('/price/bitcoin_price');
      setPriceData(data);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err: any) {
      console.error("Failed to fetch Bitcoin price:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBitcoinPrice(); // Busca inicial

    const intervalId = setInterval(fetchBitcoinPrice, FETCH_INTERVAL);

    return () => clearInterval(intervalId); // Limpa o intervalo na desmontagem do componente
  }, []);

  return { priceData, loading, error };
};

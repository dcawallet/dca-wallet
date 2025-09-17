import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PlusIcon, QrCodeIcon, DownloadCloud } from 'lucide-react';
import WalletSelector from '../components/dashboard/WalletSelector';
import CreateWalletModal from '../components/modals/CreateWalletModal';
import AddTransactionModal from '../components/modals/AddTransactionModal';
import ReceiveModal from '../components/modals/ReceiveModal';
import ImportDataModal from '../components/modals/ImportDataModal';
import { listWallets } from '../lib/api/wallets';
import { listTransactions } from '../lib/api/transactions';
import { Wallet, Transaction } from '../lib/api/types';
import { useBitcoinPrice } from '../hooks/useBitcoinPrice'; // Importar o hook

// Sample data for the chart
const data = [
  { date: '20', value: 1000 },
  { date: '21', value: 1200 },
  { date: '22', value: 1100 },
  { date: '23', value: 1400 },
  { date: '24', value: 1300 },
  { date: '25', value: 1700 },
];

// REMOVER: Mock current BTC price (replace with real API call when available)
// const MOCK_CURRENT_BTC_PRICE_USD = 116315;

// REMOVER: Conversion rates (for demo purposes) - será atualizado dinamicamente
// const conversionRates = {
//   USD: 1,
//   BRL: 5.31, // 1 USD = 5.2 BRL
// };

const DashboardPage = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [isCreateWalletModalOpen, setCreateWalletModalOpen] = useState(false);
  const [isAddTransactionModalOpen, setAddTransactionModalOpen] = useState(false);
  const [isReceiveModalOpen, setReceiveModalOpen] = useState(false);
  const [isImportDataModalOpen, setImportDataModalOpen] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [walletsError, setWalletsError] = useState<string | null>(null);
  const [currentBtcBalance, setCurrentBtcBalance] = useState(0);
  const [currentUsdValue, setCurrentUsdValue] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Usar o hook useBitcoinPrice
  const { priceData, loading: loadingPrice, error: priceError } = useBitcoinPrice();

  // States for toggling display formats
  const [btcDisplayMode, setBtcDisplayMode] = useState<'btc' | 'sats'>('btc');
  const [currencyIndex, setCurrencyIndex] = useState(0);
  const availableCurrencies = ['USD', 'BRL']; // This would come from user preferences in a real app

  const timeRanges = [
    { id: '24h', label: '24h' },
    { id: '7d', label: '7d' },
    { id: '30d', label: '30d' },
    { id: '90d', label: '90d' },
    { id: 'all', label: 'all' },
  ];

  useEffect(() => {
    fetchWallets();
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      fetchTransactionsAndCalculateBalance(selectedWallet.id);
    }
  }, [selectedWallet, priceData]); // Adicionar priceData como dependência

  const fetchWallets = async () => {
    setLoadingWallets(true);
    setWalletsError(null);
    try {
      const fetchedWallets = await listWallets();
      setWallets(fetchedWallets);
      if (fetchedWallets.length > 0) {
        setSelectedWallet(fetchedWallets[0]); // Select the first wallet by default
      }
    } catch (err: any) {
      setWalletsError(err.message || 'Failed to load wallets.');
    } finally {
      setLoadingWallets(false);
    }
  };

  const fetchTransactionsAndCalculateBalance = async (walletId: string) => {
    try {
      const fetchedTransactions = await listTransactions(walletId);
      setTransactions(fetchedTransactions);

      let btcTotal = 0;
      for (const tx of fetchedTransactions) {
        if (tx.transaction_type.includes('buy')) {
          btcTotal += tx.amount_btc;
        } else if (tx.transaction_type.includes('sell')) {
          btcTotal -= tx.amount_btc;
        }
      }
      setCurrentBtcBalance(btcTotal);
      // Usar priceData.btc_usd_price para calcular o valor em USD
      if (priceData?.btc_usd_price) {
        setCurrentUsdValue(btcTotal * priceData.btc_usd_price);
      } else {
        setCurrentUsdValue(0);
      }

    } catch (err: any) {
      console.error('Failed to fetch transactions or calculate balance:', err);
      setWalletsError('Failed to load transactions for selected wallet.');
      setCurrentBtcBalance(0);
      setCurrentUsdValue(0);
    }
  };

  // Toggle between BTC and sats display
  const toggleBtcDisplay = () => {
    setBtcDisplayMode(btcDisplayMode === 'btc' ? 'sats' : 'btc');
  };

  // Toggle between available currencies
  const toggleCurrency = () => {
    setCurrencyIndex((currencyIndex + 1) % availableCurrencies.length);
  };

  // Get current currency symbol
  const getCurrentCurrencySymbol = () => {
    const currency = availableCurrencies[currencyIndex];
    return currency === 'USD' ? '$' : currency === 'BRL' ? 'R$' : currency;
  };

  // Get current currency value
  const getCurrentCurrencyValue = () => {
    const currency = availableCurrencies[currencyIndex];
    // Usar priceData.usd_brl_calculated para a taxa BRL
    const usdToBrlRate = priceData?.usd_brl_calculated || 1; // Default 1 se não houver dados
    const rate = currency === 'USD' ? 1 : usdToBrlRate;
    return (currentUsdValue * rate).toFixed(2);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex space-x-3">
          <button onClick={() => setCreateWalletModalOpen(true)} className="px-6 py-2 bg-[#ff9416] text-white rounded-full flex items-center">
            <PlusIcon size={16} className="mr-2" /> create wallet
          </button>
          <button onClick={() => setImportDataModalOpen(true)} className="px-6 py-2 bg-[#ff9416] text-white rounded-full flex items-center">
            <DownloadCloud size={16} className="mr-2" /> import data
          </button>
          <button onClick={() => setAddTransactionModalOpen(true)} className="px-6 py-2 bg-[#ff9416] text-white rounded-full flex items-center">
            <PlusIcon size={16} className="mr-2" /> add transaction
          </button>
          {/* <button onClick={() => setReceiveModalOpen(true)} className="px-6 py-2 bg-[#ff9416] text-white rounded-full flex items-center">
            <QrCodeIcon size={16} className="mr-2" /> receive
          </button> */}
        </div>
      </div>

      {loadingWallets && <p>Loading wallets...</p>}
      {walletsError && <p className="text-red-500">Error: {walletsError}</p>}
      {!loadingWallets && wallets.length === 0 && <p>No wallets found. Create one!</p>}

      {priceError && <p className="text-red-500">Error fetching price data: {priceError}</p>}
      {loadingPrice && <p>Loading current Bitcoin prices...</p>}

      {selectedWallet && priceData && ( // Renderizar somente se tiver priceData
        <WalletSelector wallets={wallets} selectedWallet={selectedWallet} onSelectWallet={setSelectedWallet} />
      )}

      {selectedWallet && priceData && ( // Renderizar somente se tiver priceData
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-zinc-400">Total balance ({selectedWallet.label})</p>
              <h2 className="text-4xl font-bold">
                <span onClick={toggleBtcDisplay} className="cursor-pointer hover:text-[#ff9416] transition-colors">
                  {btcDisplayMode === 'btc' ? (
                    <>
                      {currentBtcBalance.toFixed(8)}{' '}
                      <span className="text-[#ff9416] text-2xl">btc</span>
                    </>
                  ) : (
                    <>
                      {(currentBtcBalance * 100000000).toLocaleString()} <span className="text-[#ff9416] text-2xl">sats</span>
                    </>
                  )}
                </span>
              </h2>
              <div className="flex items-center">
                <p className="text-2xl cursor-pointer hover:text-[#ff9416] transition-colors" onClick={toggleCurrency}>
                  {getCurrentCurrencySymbol()} {getCurrentCurrencyValue()}{' '}
                  <span className="text-sm text-zinc-400">
                    {availableCurrencies[currencyIndex]}
                  </span>
                </p>
                <p className="ml-3 text-green-500">
                  + 96.48 <span className="text-green-500">▲ 6.32%</span>{' '}
                  <span className="text-zinc-500 text-xs">24h</span>
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {timeRanges.map(range => (
                <button
                  key={range.id}
                  className={`px-4 py-1 rounded-md ${selectedTimeRange === range.id ? 'bg-zinc-800' : 'bg-zinc-900 hover:bg-zinc-800'}`}
                  onClick={() => setSelectedTimeRange(range.id)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff9416" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff9416" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#999' }}
                />
                <Area type="monotone" dataKey="value" stroke="#ff9416" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {isCreateWalletModalOpen && (
        <CreateWalletModal
          onClose={() => setCreateWalletModalOpen(false)}
          onWalletCreated={fetchWallets}
        />
      )}
      {isImportDataModalOpen && (
        <ImportDataModal
          onClose={() => setImportDataModalOpen(false)}
          onImportSuccess={fetchWallets}
        />
      )}
      {isAddTransactionModalOpen && selectedWallet && (
        <AddTransactionModal
          onClose={() => setAddTransactionModalOpen(false)}
          onTransactionAdded={() => fetchTransactionsAndCalculateBalance(selectedWallet.id)}
          initialWalletId={selectedWallet.id}
          initialWalletCurrency={selectedWallet.currency}
          btcUsdPrice={priceData?.btc_usd_price} // Passar o preço atual do BTC em USD
          usdBrlRate={priceData?.usd_brl_calculated} // Passar a taxa USD/BRL
        />
      )}
      {isReceiveModalOpen && <ReceiveModal onClose={() => setReceiveModalOpen(false)} />}
    </div>
  );
};

export default DashboardPage;

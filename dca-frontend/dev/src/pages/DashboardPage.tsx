import React, { useState, useEffect, useMemo } from 'react';
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
import { useBitcoinPrice } from '../hooks/useBitcoinPrice';
import mockBitcoinPrices from '../assets/bitcoin_prices_last_30_days.json';
import { format, parseISO, getMonth } from 'date-fns';

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

  const { priceData, loading: loadingPrice, error: priceError } = useBitcoinPrice();

  const [btcDisplayMode, setBtcDisplayMode] = useState<'btc' | 'sats'>('btc');
  const [currencyIndex, setCurrencyIndex] = useState(0);
  const availableCurrencies = ['USD', 'BRL'];

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
  }, [selectedWallet, priceData]);

  const fetchWallets = async () => {
    setLoadingWallets(true);
    setWalletsError(null);
    try {
      const fetchedWallets = await listWallets();
      setWallets(fetchedWallets);
      if (fetchedWallets.length > 0) {
        setSelectedWallet(fetchedWallets[0]);
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

  const toggleBtcDisplay = () => {
    setBtcDisplayMode(btcDisplayMode === 'btc' ? 'sats' : 'btc');
  };

  const toggleCurrency = () => {
    setCurrencyIndex((currencyIndex + 1) % availableCurrencies.length);
  };

  const getCurrentCurrencySymbol = () => {
    const currency = availableCurrencies[currencyIndex];
    return currency === 'USD' ? '$' : currency === 'BRL' ? 'R$' : currency;
  };

  const chartData = useMemo(() => {
    if (!priceData || currentBtcBalance === 0) {
      return mockBitcoinPrices.map(p => ({ date: p.date, value: 0 }));
    }

    const usdBrlRate = priceData.usd_brl_calculated || 1;

    // Ensure mockBitcoinPrices is sorted ascending by date
    const sortedPrices = [...mockBitcoinPrices].sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    return sortedPrices.map(price => {
      const portfolioValueUsd = currentBtcBalance * price.price_usd;
      const portfolioValueBrl = portfolioValueUsd * usdBrlRate;
      const displayValue = availableCurrencies[currencyIndex] === 'USD' ? portfolioValueUsd : portfolioValueBrl;

      return {
        date: price.date,
        value: displayValue,
      };
    });
  }, [mockBitcoinPrices, currentBtcBalance, priceData, availableCurrencies, currencyIndex]);

  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0 || currentBtcBalance === 0) {
      return [0, 'auto'];
    }

    const values = chartData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const paddedMin = minValue * 0.98;
    const paddedMax = maxValue * 1.02;

    const finalMin = Math.min(paddedMin, minValue * 0.98);
    const finalMax = Math.max(paddedMax, maxValue * 1.02);

    return [finalMin, finalMax];
  }, [chartData, currentBtcBalance]);

  const getCurrentCurrencyValue = () => {
    const currency = availableCurrencies[currencyIndex];
    const usdToBrlRate = priceData?.usd_brl_calculated || 1;
    const rate = currency === 'USD' ? 1 : usdToBrlRate;
    return (currentUsdValue * rate).toFixed(2);
  };

  const formatCurrencyTick = (tickValue: number) => {
    return `${getCurrentCurrencySymbol()} ${tickValue.toFixed(2)}`;
  };

  const CustomXTick = (props: any) => {
    const { x, y, payload, index } = props;
    const dateStr = payload.value;
    const date = parseISO(dateStr);

    const day = format(date, 'dd');
    const monthAbbr = format(date, 'MMM');

    let showMonth = false;
    if (index === 0) {
      showMonth = true;
    } else {
      // Ensure we are comparing with the actual previous data point in chartData
      const prevDateStr = chartData[index - 1].date;
      const prevDate = parseISO(prevDateStr);
      if (getMonth(date) !== getMonth(prevDate)) {
        showMonth = true;
      }
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#666" fontSize={12}>
          {day}
        </text>
        {showMonth && (
          <text x={0} y={0} dy={36} textAnchor="middle" fill="#999" fontSize={12}> {/* Adjusted dy and fontSize */}
            {monthAbbr}
          </text>
        )}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = parseISO(label);
      const formattedDate = format(date, 'MMM dd');

      return (
        <div className="bg-zinc-800 p-3 rounded-md border border-zinc-700">
          <p className="text-zinc-400 text-sm">{formattedDate}</p>
          <p className="text-white font-bold">
            {getCurrentCurrencySymbol()} {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const portfolioChange = useMemo(() => {
    if (chartData.length < 2) {
      return { absolute: 0, percentage: 0, isPositive: true };
    }

    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;

    const absoluteChange = lastValue - firstValue;
    const percentageChange = firstValue === 0 ? 0 : (absoluteChange / firstValue) * 100;
    const isPositive = absoluteChange >= 0;

    return {
      absolute: absoluteChange,
      percentage: percentageChange,
      isPositive: isPositive,
    };
  }, [chartData]);

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
        </div>
      </div>

      {loadingWallets && <p>Loading wallets...</p>}
      {walletsError && <p className="text-red-500">Error: {walletsError}</p>}
      {!loadingWallets && wallets.length === 0 && <p>No wallets found. Create one!</p>}

      {priceError && <p className="text-red-500">Error fetching price data: {priceError}</p>}
      {loadingPrice && <p>Loading current Bitcoin prices...</p>}

      {selectedWallet && priceData && (
        <WalletSelector wallets={wallets} selectedWallet={selectedWallet} onSelectWallet={setSelectedWallet} />
      )}

      {selectedWallet && priceData && (
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
                <p className={`ml-3 ${portfolioChange.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {portfolioChange.isPositive ? '+' : ''}
                  {getCurrentCurrencySymbol()} {portfolioChange.absolute.toFixed(2)}{' '}
                  <span className={portfolioChange.isPositive ? 'text-green-500' : 'text-red-500'}>
                    {portfolioChange.isPositive ? '▲' : '▼'} {portfolioChange.percentage.toFixed(2)}%
                  </span>{' '}
                  <span className="text-zinc-500 text-xs">{selectedTimeRange}</span>
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
              <AreaChart data={chartData} margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 40,
              }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff9416" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff9416" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#666" tick={CustomXTick} interval="preserveStart" />
                <YAxis
                  stroke="#666"
                  domain={yAxisDomain}
                  tickFormatter={formatCurrencyTick}
                  orientation="right"
                  width={100}
                />
                <Tooltip
                  content={CustomTooltip}
                  cursor={{ stroke: '#ff9416', strokeWidth: 1 }}
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
          btcUsdPrice={priceData?.btc_usd_price}
          usdBrlRate={priceData?.usd_brl_calculated}
        />
      )}
      {isReceiveModalOpen && <ReceiveModal onClose={() => setReceiveModalOpen(false)} />}
    </div>
  );
};

export default DashboardPage;

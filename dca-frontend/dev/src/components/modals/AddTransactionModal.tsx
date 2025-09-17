import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { createTransaction } from '../../lib/api/transactions';
import { listWallets } from '../../lib/api/wallets'; // Import listWallets
import { Wallet } from '../../lib/api/types'; // Import Wallet type

interface AddTransactionModalProps {
  onClose: () => void;
  onTransactionAdded: () => void;
  initialWalletId: string; // Renamed for clarity as it's the default
  initialWalletCurrency: string; // Renamed for clarity
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  onClose,
  onTransactionAdded,
  initialWalletId,
  initialWalletCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [amountBtc, setAmountBtc] = useState<number | ''>('');
  const [pricePerBtc, setPricePerBtc] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 16));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allWallets, setAllWallets] = useState<Wallet[]>([]);
  const [selectedWalletIdForTransaction, setSelectedWalletIdForTransaction] = useState(initialWalletId);
  const [displayCurrency, setDisplayCurrency] = useState(initialWalletCurrency);
  const [loadingWallets, setLoadingWallets] = useState(true);

  useEffect(() => {
    const fetchAndSetWallets = async () => {
      setLoadingWallets(true);
      try {
        const fetchedWallets = await listWallets();
        setAllWallets(fetchedWallets);
        // If initialWalletId is provided, try to find it and set as selected
        const defaultWallet = fetchedWallets.find(w => w.id === initialWalletId);
        if (defaultWallet) {
          setSelectedWalletIdForTransaction(defaultWallet.id);
          setDisplayCurrency(defaultWallet.currency);
        } else if (fetchedWallets.length > 0) {
          // If initialWalletId not found or not provided, default to the first wallet
          setSelectedWalletIdForTransaction(fetchedWallets[0].id);
          setDisplayCurrency(fetchedWallets[0].currency);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load wallets for selection.');
      } finally {
        setLoadingWallets(false);
      }
    };
    fetchAndSetWallets();
  }, [initialWalletId, initialWalletCurrency]);

  const handleWalletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWalletId = e.target.value;
    const selected = allWallets.find(w => w.id === newWalletId);
    if (selected) {
      setSelectedWalletIdForTransaction(newWalletId);
      setDisplayCurrency(selected.currency);
    }
  };

  // Calculate total value based on amount_btc and price_per_btc
  const totalValue = (typeof amountBtc === 'number' && typeof pricePerBtc === 'number')
    ? (amountBtc * pricePerBtc)
    : 0;

  const handleConfirmTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedWalletIdForTransaction) {
      setError('Please select a wallet.');
      return;
    }
    if (!amountBtc || !pricePerBtc || typeof amountBtc !== 'number' || typeof pricePerBtc !== 'number') {
      setError('Please enter valid numbers for amount and price.');
      return;
    }
    if (amountBtc <= 0 || pricePerBtc <= 0) {
      setError('Amount and price must be greater than zero.');
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionType = activeTab === 'buy' ? 'manual_buy' : 'manual_sell';
      const transactionData = {
        wallet_id: selectedWalletIdForTransaction,
        transaction_type: transactionType,
        amount_btc: amountBtc,
        price_per_btc_usd: pricePerBtc,
        total_value_usd: totalValue,
        currency: displayCurrency,
        notes: notes || undefined,
      };
      console.log('Sending transaction data:', transactionData);
      await createTransaction(transactionData);
      onTransactionAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add transaction. Please try again.');
      console.error('Error adding transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Add Transaction</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Wallet Selection Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Select Wallet
          </label>
          {loadingWallets ? (
            <p className="text-zinc-400">Loading wallets...</p>
          ) : allWallets.length === 0 ? (
            <p className="text-red-400">No wallets found. Please create a wallet first.</p>
          ) : (
            <div className="relative">
              <select
                value={selectedWalletIdForTransaction}
                onChange={handleWalletChange}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 pr-8"
              >
                {allWallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.label} ({wallet.currency})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown size={16} className="text-zinc-400" />
              </div>
            </div>
          )}
        </div>

        <div className="flex mb-6 bg-zinc-800 rounded-full p-1">
          <button
            className={`flex-1 py-2 px-4 rounded-full ${activeTab === 'buy' ? 'bg-[#ff9416]' : ''}`}
            onClick={() => setActiveTab('buy')}
          >
            buy
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-full ${activeTab === 'sell' ? 'bg-[#ff9416]' : ''}`}
            onClick={() => setActiveTab('sell')}
          >
            sell
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold">
              {totalValue.toFixed(2)} <span className="text-zinc-400">{displayCurrency}</span>
            </div>
            <div className="text-sm text-zinc-400 mt-1">
              {typeof amountBtc === 'number' ? amountBtc.toFixed(8) : '0.00000000'} <span className="text-[#ff9416]">btc</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Amount (BTC)
              </label>
              <input
                type="number"
                step="any"
                value={amountBtc}
                onChange={e => setAmountBtc(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., 0.0005"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Price per BTC ({displayCurrency})
              </label>
              <input
                type="number"
                step="any"
                value={pricePerBtc}
                onChange={e => setPricePerBtc(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., 70000.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Transaction Date
            </label>
            <input
              type="datetime-local"
              value={transactionDate}
              onChange={e => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Add notes about this transaction..."
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleConfirmTransaction}
            disabled={isSubmitting || !amountBtc || !pricePerBtc || !selectedWalletIdForTransaction}
            className={`w-full py-2 px-4 bg-[#ff9416] text-white rounded-full hover:bg-[#e08414] transition-colors ${
              (isSubmitting || !amountBtc || !pricePerBtc || !selectedWalletIdForTransaction) ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Confirm Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;

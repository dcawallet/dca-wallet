import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Edit2, Trash2, PlusCircle, Check, X } from 'lucide-react';
import { getWalletDetails, updateDcaConfig } from '../lib/api/wallets';
import { listTransactions } from '../lib/api/transactions';
import { Wallet, Transaction, DcaSetting } from '../lib/api/types';

const WalletDetailsPage = () => {
  const { walletId } = useParams<{ walletId: string }>();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempWalletName, setTempWalletName] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempWalletDescription, setTempWalletDescription] = useState('');

  // DCA state
  const [isDcaEnabled, setIsDcaEnabled] = useState(false);
  const [dcaSettings, setDcaSettings] = useState<DcaSetting[]>([]);
  const [isAddingDcaSetting, setIsAddingDcaSetting] = useState(false);
  const [newDcaAmount, setNewDcaAmount] = useState<number | ''>('');
  const [newDcaCurrency, setNewDcaCurrency] = useState('USD');
  const [newDcaFrequency, setNewDcaFrequency] = useState<'daily' | 'weekly' | 'bi-weekly' | 'monthly'>('monthly');
  const [newDcaPriceRangeMin, setNewDcaPriceRangeMin] = useState<number | ''>('');
  const [newDcaPriceRangeMax, setNewDcaPriceRangeMax] = useState<number | ''>('');
  const [dcaUpdateError, setDcaUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletId) return;
      setLoading(true);
      setError(null);
      try {
        const fetchedWallet = await getWalletDetails(walletId);
        setWallet(fetchedWallet);
        setTempWalletName(fetchedWallet.label);
        setTempWalletDescription(fetchedWallet.notes || '');
        setIsDcaEnabled(fetchedWallet.dca_enabled);
        setDcaSettings(fetchedWallet.dca_settings || []);

        const fetchedTransactions = await listTransactions(walletId);
        setTransactions(fetchedTransactions);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch wallet details or transactions.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [walletId]);

  const handleSaveWalletName = () => {
    // For now, only update local state as there's no backend API for wallet name update
    if (wallet) {
      setWallet({ ...wallet, label: tempWalletName });
    }
    setIsEditingName(false);
  };

  const handleSaveWalletDescription = () => {
    // For now, only update local state as there's no backend API for wallet description update
    if (wallet) {
      setWallet({ ...wallet, notes: tempWalletDescription });
    }
    setIsEditingDescription(false);
  };

  const handleUpdateDcaConfig = async () => {
    if (!walletId) return;
    setDcaUpdateError(null);
    try {
      await updateDcaConfig(walletId, { dca_enabled: isDcaEnabled, dca_settings: dcaSettings });
      // Optionally refetch wallet details to ensure consistency
      const updatedWallet = await getWalletDetails(walletId);
      setWallet(updatedWallet);
      setIsDcaEnabled(updatedWallet.dca_enabled);
      setDcaSettings(updatedWallet.dca_settings || []);
    } catch (err: any) {
      setDcaUpdateError(err.message || 'Failed to update DCA configuration.');
    }
  };

  const handleAddDcaSetting = () => {
    if (newDcaAmount === '' || isNaN(Number(newDcaAmount))) {
      setDcaUpdateError('DCA amount must be a valid number.');
      return;
    }

    const newSetting: DcaSetting = {
      dca_amount: Number(newDcaAmount),
      dca_currency: newDcaCurrency,
      dca_frequency: newDcaFrequency,
      dca_price_range_min: newDcaPriceRangeMin === '' ? null : Number(newDcaPriceRangeMin),
      dca_price_range_max: newDcaPriceRangeMax === '' ? null : Number(newDcaPriceRangeMax),
    };
    setDcaSettings([...dcaSettings, newSetting]);
    setIsAddingDcaSetting(false);
    setNewDcaAmount('');
    setNewDcaPriceRangeMin('');
    setNewDcaPriceRangeMax('');
    setDcaUpdateError(null);
  };

  const handleRemoveDcaSetting = (index: number) => {
    setDcaSettings(dcaSettings.filter((_, i) => i !== index));
  };

  if (loading) return <div className="text-center mt-8">Loading wallet details...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
  if (!wallet) return <div className="text-center mt-8">Wallet not found.</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Wallet Details</h1>
      <div className="bg-zinc-900 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          {isEditingName ? (
            <input
              type="text"
              value={tempWalletName}
              onChange={e => setTempWalletName(e.target.value)}
              className="text-2xl font-bold bg-zinc-800 border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              onBlur={handleSaveWalletName}
              onKeyPress={(e) => { if (e.key === 'Enter') handleSaveWalletName(); }}
              autoFocus
            />
          ) : (
            <div className="flex items-center">
              <h2 className="text-2xl font-bold">{wallet.label}</h2>
              <button onClick={() => setIsEditingName(true)} className="ml-2 p-1 hover:bg-zinc-800 rounded-full">
                <Edit2 size={16} />
              </button>
            </div>
          )}
        </div>
        <div className="mb-6">
          {isEditingDescription ? (
            <textarea
              value={tempWalletDescription}
              onChange={e => setTempWalletDescription(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Add a description for this wallet..."
              onBlur={handleSaveWalletDescription}
              onKeyPress={(e) => { if (e.key === 'Enter') handleSaveWalletDescription(); }}
              autoFocus
            />
          ) : (
            <div className="flex items-start">
              <p className="text-zinc-400">
                {wallet.notes || 'No description added.'}
              </p>
              <button onClick={() => setIsEditingDescription(true)} className="ml-2 p-1 hover:bg-zinc-800 rounded-full">
                <Edit2 size={16} />
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-zinc-400 text-sm">Primary Currency</p>
            <p className="text-xl font-bold">{wallet.currency}</p>
          </div>
          <div>
            <p className="text-zinc-400 text-sm">Wallet Address</p>
            <p className="text-xl font-bold">{wallet.wallet_address || 'N/A'}</p>
          </div>
          {/* Mockup Data for Balances, replace with real data once available */}
          <div>
            <p className="text-zinc-400 text-sm">Current Balance (BTC)</p>
            <p className="text-xl font-bold">0.00064928 BTC</p>
          </div>
          <div>
            <p className="text-zinc-400 text-sm">Current Value (USD)</p>
            <p className="text-xl font-bold">$1,621.88 USD</p>
          </div>
        </div>
      </div>

      {/* DCA Configuration Section */}
      <div className="bg-zinc-900 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-bold mb-4">DCA Configuration</h3>
        {dcaUpdateError && <p className="text-red-500 mb-4">Error: {dcaUpdateError}</p>}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="dca-toggle"
            checked={isDcaEnabled}
            onChange={(e) => setIsDcaEnabled(e.target.checked)}
            className="mr-2 w-4 h-4 text-[#ff9416] bg-zinc-700 border-zinc-600 rounded focus:ring-[#ff9416]"
          />
          <label htmlFor="dca-toggle" className="text-lg font-medium">
            Enable Dollar-Cost Averaging (DCA)
          </label>
        </div>

        {isDcaEnabled && (
          <div className="space-y-4">
            {dcaSettings.length === 0 && <p className="text-zinc-400">No DCA settings configured. Add one below.</p>}
            {
              dcaSettings.map((setting, index) => (
                <div key={index} className="flex items-center justify-between bg-zinc-800 p-3 rounded-md">
                  <span>
                    Buy {setting.dca_amount} {setting.dca_currency} {setting.dca_frequency}
                    {setting.dca_price_range_min && setting.dca_price_range_max && (
                      ` when price is between ${setting.dca_price_range_min} and ${setting.dca_price_range_max} USD`
                    )}
                    {setting.dca_price_range_min && !setting.dca_price_range_max && ` when price is above ${setting.dca_price_range_min} USD`}
                    {!setting.dca_price_range_min && setting.dca_price_range_max && ` when price is below ${setting.dca_price_range_max} USD`}
                  </span>
                  <button onClick={() => handleRemoveDcaSetting(index)} className="ml-4 text-red-500 hover:text-red-400 p-1 rounded-full">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            }

            {isAddingDcaSetting ? (
              <div className="bg-zinc-800 p-4 rounded-md space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400">Amount</label>
                    <input
                      type="number"
                      value={newDcaAmount}
                      onChange={(e) => setNewDcaAmount(parseFloat(e.target.value))}
                      className="w-full px-2 py-1 bg-zinc-700 border border-zinc-600 rounded-md"
                      placeholder="e.g., 50.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400">Currency</label>
                    <select
                      value={newDcaCurrency}
                      onChange={(e) => setNewDcaCurrency(e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-700 border border-zinc-600 rounded-md"
                    >
                      <option value="USD">USD</option>
                      <option value="BRL">BRL</option>
                      <option value="BTC">BTC</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400">Frequency</label>
                  <select
                    value={newDcaFrequency}
                    onChange={(e) => setNewDcaFrequency(e.target.value as DcaSetting['dca_frequency'])}
                    className="w-full px-2 py-1 bg-zinc-700 border border-zinc-600 rounded-md"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400">Price Range Min (USD)</label>
                    <input
                      type="number"
                      value={newDcaPriceRangeMin}
                      onChange={(e) => setNewDcaPriceRangeMin(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-2 py-1 bg-zinc-700 border border-zinc-600 rounded-md"
                      placeholder="e.g., 65000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400">Price Range Max (USD)</label>
                    <input
                      type="number"
                      value={newDcaPriceRangeMax}
                      onChange={(e) => setNewDcaPriceRangeMax(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full px-2 py-1 bg-zinc-700 border border-zinc-600 rounded-md"
                      placeholder="e.g., 75000"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setIsAddingDcaSetting(false)} className="px-3 py-1 bg-zinc-600 rounded-full hover:bg-zinc-500">
                    Cancel
                  </button>
                  <button onClick={handleAddDcaSetting} className="px-3 py-1 bg-[#ff9416] rounded-full hover:bg-[#e08414]">
                    Add Setting
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingDcaSetting(true)} className="flex items-center space-x-1 text-[#ff9416] hover:text-[#e08414] mt-4">
                <PlusCircle size={18} />
                <span>Add DCA Setting</span>
              </button>
            )}
            <button onClick={handleUpdateDcaConfig} className="mt-4 w-full py-2 px-4 bg-green-600 text-white rounded-full hover:bg-green-500">
              Save DCA Configuration
            </button>
          </div>
        )}
      </div>

      {/* Transactions Section */}
      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h3 className="text-xl font-bold">Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <p className="p-6 text-zinc-400">No transactions found for this wallet.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Amount (BTC)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Price per BTC ({wallet.currency})
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Total Value ({wallet.currency})
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.transaction_type.includes('buy') ? 'bg-green-900 text-green-300' :
                        transaction.transaction_type.includes('sell') ? 'bg-red-900 text-red-300' :
                        'bg-blue-900 text-blue-300' // Fallback for other types if any
                      }`}>
                        {transaction.transaction_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.amount_btc.toFixed(8)} BTC
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.price_per_btc_usd.toFixed(2)} {transaction.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.total_value_usd.toFixed(2)} {transaction.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.notes || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button className="p-1 hover:bg-zinc-800 rounded-full">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-1 hover:bg-zinc-800 rounded-full text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletDetailsPage;

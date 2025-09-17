import React, { useState, useEffect } from 'react';
import { X, Upload, ChevronDown } from 'lucide-react';
import { importCoinMarketCap } from '../../lib/api/import';
import { listWallets } from '../../lib/api/wallets';
import { Wallet } from '../../lib/api/types';

interface ImportDataModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

const ImportDataModal: React.FC<ImportDataModalProps> = ({
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'new_wallet' | 'existing_wallet'>('new_wallet');
  const [newWalletLabel, setNewWalletLabel] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const fetchedWallets = await listWallets();
        setWallets(fetchedWallets);
        if (fetchedWallets.length > 0) {
          setSelectedWalletId(fetchedWallets[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load wallets.');
      } finally {
        setLoadingWallets(false);
      }
    };
    fetchWallets();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Please select a CSV file.');
      return;
    }

    setIsImporting(true);
    try {
      if (importType === 'new_wallet') {
        if (!newWalletLabel.trim()) {
          setError('New wallet label is required.');
          setIsImporting(false);
          return;
        }
        await importCoinMarketCap({ file, new_wallet_label: newWalletLabel });
      } else {
        if (!selectedWalletId) {
          setError('Please select an existing wallet.');
          setIsImporting(false);
          return;
        }
        await importCoinMarketCap({ file, wallet_id: selectedWalletId });
      }
      onImportSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import data.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Import Data (CoinMarketCap CSV)</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full text-sm text-zinc-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-[#ff9416] file:text-white
                hover:file:bg-[#e08414]"
            />
            {file && <p className="text-zinc-400 text-sm mt-2">Selected file: {file.name}</p>}
          </div>

          <div className="flex mb-4 bg-zinc-800 rounded-full p-1">
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-full ${importType === 'new_wallet' ? 'bg-[#ff9416]' : ''}`}
              onClick={() => setImportType('new_wallet')}
            >
              Import to New Wallet
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-full ${importType === 'existing_wallet' ? 'bg-[#ff9416]' : ''}`}
              onClick={() => setImportType('existing_wallet')}
            >
              Import to Existing Wallet
            </button>
          </div>

          {importType === 'new_wallet' ? (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                New Wallet Label
              </label>
              <input
                type="text"
                value={newWalletLabel}
                onChange={(e) => setNewWalletLabel(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., My CMC Imported Wallet"
                required={importType === 'new_wallet'}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Select Existing Wallet
              </label>
              {loadingWallets ? (
                <p>Loading wallets...</p>
              ) : wallets.length === 0 ? (
                <p className="text-zinc-400">No wallets available. Create one first.</p>
              ) : (
                <div className="relative">
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 pr-8"
                    required={importType === 'existing_wallet'}
                  >
                    {wallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <ChevronDown size={16} className="text-zinc-400" />
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isImporting || !file || (importType === 'new_wallet' && !newWalletLabel) || (importType === 'existing_wallet' && !selectedWalletId)}
            className={`w-full py-2 px-4 bg-[#ff9416] text-white rounded-full hover:bg-[#e08414] transition-colors ${
              (isImporting || !file || (importType === 'new_wallet' && !newWalletLabel) || (importType === 'existing_wallet' && !selectedWalletId))
                ? 'opacity-70 cursor-not-allowed'
                : ''
            }`}
          >
            {isImporting ? 'Importing...' : 'Import Transactions'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ImportDataModal;

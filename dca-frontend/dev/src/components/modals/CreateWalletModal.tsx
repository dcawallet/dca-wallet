import React, { useState } from 'react';
import { X, FileText, ChevronDown } from 'lucide-react';
import { createWallet, createBlockchainSyncWallet } from '../../lib/api/wallets';

interface CreateWalletModalProps {
  onClose: () => void;
  onWalletCreated: () => void; // New prop to refresh wallet list
}

const CreateWalletModal: React.FC<CreateWalletModalProps> = ({
  onClose,
  onWalletCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'import'>('new');
  const [walletName, setWalletName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateWallet = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError('');
    if (!walletName.trim()) {
      setError('Wallet name is required');
      return;
    }
    setIsCreating(true);

    try {
      if (activeTab === 'new') {
        await createWallet({
          label: walletName,
          currency,
          notes: description || undefined,
        });
      } else {
        if (!address.trim()) {
          setError('Bitcoin address is required for blockchain sync wallet');
          setIsCreating(false);
          return;
        }
        await createBlockchainSyncWallet({
          label: walletName,
          wallet_address: address,
          currency,
          notes: description || undefined,
        });
      }
      onWalletCreated(); // Notify parent to refresh wallets
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet. Please try again.');
      console.error('Error creating wallet:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Create Wallet</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded-md">
            {error}
          </div>
        )}
        <div className="flex mb-6 bg-zinc-800 rounded-full p-1">
          <button className={`flex-1 py-2 px-4 rounded-full ${activeTab === 'new' ? 'bg-[#ff9416]' : ''}`}
            onClick={() => setActiveTab('new')}>
            new
          </button>
          <button className={`flex-1 py-2 px-4 rounded-full ${activeTab === 'import' ? 'bg-[#ff9416]' : ''}`}
            onClick={() => setActiveTab('import')}>
            import
          </button>
        </div>
        {activeTab === 'new' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                name
              </label>
              <input
                type="text"
                value={walletName}
                onChange={e => setWalletName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="your-wallet1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                currency
              </label>
              <div className="relative">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="USD">US USD (American Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="BRL">BRL (Brazilian Real)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-zinc-400" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                className="flex items-center space-x-1 text-zinc-400 hover:text-white"
                onClick={() => setDescription(description ? '' : 'My DCA wallet for long-term Bitcoin savings')}>
                <FileText size={16} />
                <span>notes</span>
              </button>
            </div>
            {description && (
              <div className="mt-2">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Add notes about this wallet..."
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                name
              </label>
              <input
                type="text"
                value={walletName}
                onChange={e => setWalletName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="your-wallet1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                bitcoin address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="xpub..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                currency
              </label>
              <div className="relative">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="USD">US USD (American Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="BRL">BRL (Brazilian Real)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={16} className="text-zinc-400" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                className="flex items-center space-x-1 text-zinc-400 hover:text-white"
                onClick={() => setDescription(description ? '' : 'Imported wallet from hardware device')}>
                <FileText size={16} />
                <span>notes</span>
              </button>
            </div>
            {description && (
              <div className="mt-2">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Add notes about this wallet..."
                />
              </div>
            )}
          </div>
        )}
        <div className="mt-8">
          <button
            onClick={handleCreateWallet}
            disabled={isCreating}
            className={`w-full py-2 px-4 bg-[#ff9416] text-white rounded-full hover:bg-[#e08414] transition-colors ${isCreating ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isCreating ? 'creating...' : 'create wallet'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWalletModal;

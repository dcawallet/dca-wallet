import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Wallet } from '../../lib/api/types';

interface WalletSelectorProps {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  onSelectWallet: (wallet: Wallet) => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({
  wallets,
  selectedWallet,
  onSelectWallet,
}) => {
  if (!wallets || wallets.length === 0) {
    return null; // Or display a message like "No wallets to display"
  }

  return (
    <div className="inline-block relative">
      <select
        className="flex items-center space-x-2 px-4 py-2 bg-zinc-900 rounded-md border border-zinc-800 appearance-none pr-8 cursor-pointer"
        value={selectedWallet?.id || ''}
        onChange={(e) => {
          const wallet = wallets.find(w => w.id === e.target.value);
          if (wallet) {
            onSelectWallet(wallet);
          }
        }}
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
  );
};

export default WalletSelector;

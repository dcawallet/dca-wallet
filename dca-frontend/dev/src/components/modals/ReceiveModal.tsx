import React, { useState } from 'react';
import { X, Copy, ChevronDown } from 'lucide-react';
interface ReceiveModalProps {
  onClose: () => void;
}
const ReceiveModal: React.FC<ReceiveModalProps> = ({
  onClose
}) => {
  const [selectedWallet, setSelectedWallet] = useState('dca_wallet1');
  const [copied, setCopied] = useState(false);
  // Sample wallet address
  const walletAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
  // Sample wallets
  const wallets = [{
    id: 'wallet1',
    name: 'dca_wallet1',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  }, {
    id: 'wallet2',
    name: 'hardware_wallet',
    address: 'bc1q9h6mqc7m5j3fcmgj4gvc6mrvqm85mhahkq5nwm'
  }];
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Receive Bitcoin</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-800">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Select Wallet
            </label>
            <div className="relative">
              <select value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500">
                {wallets.map(wallet => <option key={wallet.id} value={wallet.name}>
                    {wallet.name}
                  </option>)}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown size={16} className="text-zinc-400" />
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg">
              {/* This is a placeholder for a real QR code - in a real app you would use a QR code library */}
              <div className="w-48 h-48 bg-black relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-xs">
                    QR Code for {selectedWallet}
                  </div>
                </div>
                <div className="absolute inset-2 border-2 border-white" />
                <div className="absolute inset-6 border-2 border-white" />
                <div className="absolute inset-[40%] border-2 border-white" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Wallet Address
            </label>
            <div className="flex">
              <input type="text" value={walletAddress} readOnly className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-l-md focus:outline-none" />
              <button onClick={handleCopyAddress} className={`px-3 py-2 ${copied ? 'bg-green-600' : 'bg-zinc-700'} border border-zinc-700 rounded-r-md transition-colors`}>
                {copied ? 'Copied!' : <Copy size={18} />}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Only send Bitcoin (BTC) to this address. Sending any other coin
              may result in permanent loss.
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default ReceiveModal;
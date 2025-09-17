import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, User } from 'lucide-react';


const Navbar = () => {
  const currentPrice = '$116,315';
  return <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="text-lg font-bold">DCA Wallet 🟠</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="bg-zinc-800 rounded-full px-4 py-1 text-sm flex items-center">
          <img src='/src/assets/bitcoin-logo.png' alt="Bitcoin Logo" className="w-8 mr-1.2" />
          <span className="text-zinc-400">BTC </span>
          <span>{currentPrice}</span>
        </div>
        <Link to="/profile" className="p-2 hover:bg-zinc-800 rounded-full">
          <User size={20} />
        </Link>
        <Link to="/settings" className="p-2 hover:bg-zinc-800 rounded-full">
          <Settings size={20} />
        </Link>
      </div>
    </header>;
};
export default Navbar;
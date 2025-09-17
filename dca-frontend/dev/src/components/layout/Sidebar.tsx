import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, GitFork, HelpCircle, Import, Star } from 'lucide-react';




const Sidebar = () => {
  return <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="bg-black p-0 rounded">
            <img src='/src/assets/logov2-dark.png' alt="DCA Wallet Logo" className="w-12 h-12" />
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1"></nav>
      <div className="p-4 space-y-3 border-t border-zinc-800">
        <Link to="/import" className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-zinc-800 rounded-md">
          <Import size={18} />
          <span>Import CSV</span>
        </Link>
        <Link to="/docs" className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-zinc-800 rounded-md">
          <FileText size={18} />
          <span>Documentation</span>
        </Link>
        <Link to="/tutorial" className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-zinc-800 rounded-md">
          <HelpCircle size={18} />
          <span>Tutorial</span>
        </Link>
        <Link to="/contribute" className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-zinc-800 rounded-md">
          <GitFork size={18} />
          <span>Contribute</span>
        </Link>
        <Link to="https://github.com/dcawallet/dca-wallet" className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:bg-zinc-800 rounded-md">
          <Star size={18} />
          <span>Github</span>
        </Link>
      </div>
    </aside>;
};
export default Sidebar;
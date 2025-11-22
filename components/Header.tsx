import React from 'react';
import { RefreshCw, Settings, Bell } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  onOpenSettings: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, onOpenSettings, isRefreshing }) => {
  return (
    <header className="w-full bg-black border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-md bg-black/80">
       <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
           {/* Left: Logo & Title */}
           <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-black rounded-full"></div>
                </div>
                <h1 className="text-lg font-bold text-zinc-100 tracking-tight">DeFi Simulator</h1>
           </div>

           {/* Right: Actions */}
           <div className="flex items-center gap-2">
               {/* Sync Prices */}
               <button 
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    title="Sync Live Prices"
                    className={`p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800 ${isRefreshing ? 'animate-spin text-primary' : ''}`}
               >
                   <RefreshCw size={20} />
               </button>

               {/* Notifications */}
               <button className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800">
                   <Bell size={20} />
               </button>

               {/* Settings */}
               <button 
                    onClick={onOpenSettings}
                    className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
                    title="Settings"
               >
                   <Settings size={20} />
               </button>
           </div>
       </div>
    </header>
  );
};
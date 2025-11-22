
import React from 'react';
import { RefreshCw, Settings, PlusCircle, LogOut, UserCircle2, BarChart3, Activity, Calculator } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  onOpenSettings: () => void;
  isRefreshing: boolean;
  onAddIsolated: () => void;
  account: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
  
  // Widget Toggles
  showSimulator: boolean;
  setShowSimulator: (v: boolean) => void;
  showLiquidation: boolean;
  setShowLiquidation: (v: boolean) => void;
  showCharts: boolean;
  setShowCharts: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onRefresh, onOpenSettings, isRefreshing, onAddIsolated,
    account, onLoginClick, onLogout,
    showSimulator, setShowSimulator,
    showLiquidation, setShowLiquidation,
    showCharts, setShowCharts
}) => {
  
  const formatAccount = (acc: string) => {
      if (acc.startsWith('User:')) return acc.replace('User:', '');
      return acc;
  };

  const ToggleButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
            active 
            ? 'bg-zinc-800 border-zinc-600 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' 
            : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
        }`}
      >
          <Icon size={16} className={active ? 'text-indigo-400' : ''} />
          <span className="hidden xl:inline">{label}</span>
      </button>
  );

  return (
    <header className="w-full bg-black border-b border-zinc-800 sticky top-0 z-[60] backdrop-blur-md bg-black/80">
       <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
           
           {/* Left: Logo & Title */}
           <div className="flex items-center gap-4 shrink-0">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    <div className="w-4 h-4 bg-black rounded-full"></div>
                </div>
                <h1 className="text-lg font-bold text-zinc-100 tracking-tight hidden md:block">DeFi Simulator</h1>
           </div>

           {/* Center: Widget Toggles (Restored) */}
           <div className="hidden lg:flex items-center gap-2">
                <ToggleButton 
                    active={showSimulator} 
                    onClick={() => setShowSimulator(!showSimulator)} 
                    icon={Calculator} 
                    label="Simulator" 
                />
                <ToggleButton 
                    active={showLiquidation} 
                    onClick={() => setShowLiquidation(!showLiquidation)} 
                    icon={Activity} 
                    label="Liquidation" 
                />
                <ToggleButton 
                    active={showCharts} 
                    onClick={() => setShowCharts(!showCharts)} 
                    icon={BarChart3} 
                    label="Charts" 
                />
           </div>

           {/* Right: System Actions */}
           <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <button 
                    onClick={onAddIsolated}
                    className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-900/20"
                >
                    <PlusCircle size={16} />
                    <span className="hidden sm:inline">Add Isolated</span>
                </button>

               <div className="w-px h-6 bg-zinc-800 mx-1 hidden md:block"></div>
               
               {/* Auth Button */}
               {account ? (
                   <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full pl-1 pr-3 py-1">
                       <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
                           <UserCircle2 size={16} className="text-emerald-100" />
                       </div>
                       <span className="text-sm font-medium text-zinc-300 hidden md:inline">{formatAccount(account)}</span>
                       <button 
                            onClick={onLogout}
                            title="Sign Out"
                            className="ml-1 p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-full transition-colors"
                       >
                           <LogOut size={14} />
                       </button>
                   </div>
               ) : (
                   <button 
                        onClick={onLoginClick}
                        className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                   >
                       <span className="hidden sm:inline">Sign In</span>
                   </button>
               )}

               <div className="w-px h-6 bg-zinc-800 mx-1 hidden md:block"></div>

               <button 
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    title="Sync Live Prices"
                    className={`p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800 ${isRefreshing ? 'animate-spin text-primary' : ''}`}
               >
                   <RefreshCw size={20} />
               </button>
               {/* Bell Removed */}
               <button 
                    onClick={onOpenSettings}
                    className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800"
               >
                   <Settings size={20} />
               </button>
           </div>
       </div>
    </header>
  );
};

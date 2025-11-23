import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Settings, PlusCircle, LogOut, UserCircle2, BarChart3, TrendingUp, LayoutDashboard, ChevronDown, Layers, ShieldCheck, X, Bot, Gauge, PieChart, Activity } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  onOpenSettings: () => void;
  isRefreshing: boolean;
  onAddIsolated: () => void;
  onAddCore: () => void;
  account: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
  
  // Widget Toggles
  showSimulator: boolean;
  setShowSimulator: (v: boolean) => void;
  showLiqChart: boolean;
  setShowLiqChart: (v: boolean) => void;
  showCompChart: boolean;
  setShowCompChart: (v: boolean) => void;
  showMarket: boolean;
  setShowMarket: (v: boolean) => void;
  showAgent: boolean;
  setShowAgent: (v: boolean) => void;
  showFearGreed: boolean;
  setShowFearGreed: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onRefresh, onOpenSettings, isRefreshing, onAddIsolated, onAddCore,
    account, onLoginClick, onLogout,
    showSimulator, setShowSimulator,
    showLiqChart, setShowLiqChart,
    showCompChart, setShowCompChart,
    showMarket, setShowMarket,
    showAgent, setShowAgent,
    showFearGreed, setShowFearGreed
}) => {
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isChartsMenuOpen, setIsChartsMenuOpen] = useState(false);
  
  // Onboarding State
  const [showPriceTooltip, setShowPriceTooltip] = useState(false);
  
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const chartsMenuRef = useRef<HTMLDivElement>(null);

  const formatAccount = (acc: string) => {
      if (acc.startsWith('User:')) return acc.replace('User:', '');
      return acc;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setIsViewMenuOpen(false);
      }
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
      if (chartsMenuRef.current && !chartsMenuRef.current.contains(event.target as Node)) {
        setIsChartsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check for first-time visit
  useEffect(() => {
      const hasSeen = localStorage.getItem('dewell_has_seen_price_onboarding');
      if (!hasSeen) {
          // Small delay to ensure UI is ready
          const timer = setTimeout(() => setShowPriceTooltip(true), 1000);
          return () => clearTimeout(timer);
      }
  }, []);

  const handleRefreshClick = () => {
      if (showPriceTooltip) {
          setShowPriceTooltip(false);
          localStorage.setItem('dewell_has_seen_price_onboarding', 'true');
      }
      onRefresh();
  };

  const dismissTooltip = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowPriceTooltip(false);
      localStorage.setItem('dewell_has_seen_price_onboarding', 'true');
  };

  const ToggleButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border w-full md:w-auto justify-start md:justify-center ${
            active 
            ? 'bg-zinc-800 border-zinc-600 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' 
            : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
        }`}
      >
          <Icon size={16} className={active ? 'text-indigo-400' : ''} />
          <span>{label}</span>
      </button>
  );

  return (
    <header className="w-full bg-zinc-900 border-b border-zinc-800 sticky top-0 z-[60] backdrop-blur-md bg-zinc-900/90">
       <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
           
           {/* Left: Logo & Title */}
           <div className="flex items-center gap-4 shrink-0">
                <div className="relative flex items-center justify-center w-8 h-8">
                    {/* Pulsing Glow Layer */}
                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-60 animate-pulse"></div>
                    {/* Main Logo */}
                    <div className="relative z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        <div className="w-4 h-4 bg-black rounded-full"></div>
                    </div>
                </div>
                <h1 className="text-lg font-bold text-zinc-100 tracking-tight hidden md:block">DeWell</h1>
                <h1 className="text-lg font-bold text-zinc-100 tracking-tight md:hidden">DeWell</h1>
           </div>

           {/* Center: Widget Toggles (Desktop) */}
           <div className="hidden xl:flex items-center gap-2">
                <ToggleButton 
                    active={showSimulator} 
                    onClick={() => setShowSimulator(!showSimulator)} 
                    icon={Bot} 
                    label="Simulator" 
                />
                
                {/* Split Charts Dropdown */}
                <div className="relative" ref={chartsMenuRef}>
                    <button
                        onClick={() => setIsChartsMenuOpen(!isChartsMenuOpen)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
                            (showLiqChart || showCompChart)
                            ? 'bg-zinc-800 border-zinc-600 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                            : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                        }`}
                    >
                        <BarChart3 size={16} className={(showLiqChart || showCompChart) ? 'text-indigo-400' : ''} />
                        <span>Charts</span>
                        <ChevronDown size={14} className={`transition-transform ${isChartsMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isChartsMenuOpen && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-2 flex flex-col gap-1 z-50">
                            <button
                                onClick={() => setShowLiqChart(!showLiqChart)}
                                className={`flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors w-full text-sm font-medium ${
                                    showLiqChart ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                                }`}
                            >
                                <Activity size={16} className={showLiqChart ? 'text-indigo-400' : ''} />
                                Liquidation Chart
                            </button>
                            <button
                                onClick={() => setShowCompChart(!showCompChart)}
                                className={`flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors w-full text-sm font-medium ${
                                    showCompChart ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                                }`}
                            >
                                <PieChart size={16} className={showCompChart ? 'text-indigo-400' : ''} />
                                Composition Chart
                            </button>
                        </div>
                    )}
                </div>

                <ToggleButton 
                    active={showMarket} 
                    onClick={() => setShowMarket(!showMarket)} 
                    icon={TrendingUp} 
                    label="Market" 
                />
                 <ToggleButton 
                    active={showAgent} 
                    onClick={() => setShowAgent(!showAgent)} 
                    icon={Bot} 
                    label="Analyst" 
                />
                <ToggleButton 
                    active={showFearGreed} 
                    onClick={() => setShowFearGreed(!showFearGreed)} 
                    icon={Gauge} 
                    label="Fear & Greed" 
                />
           </div>

           {/* Right: System Actions */}
           <div className="flex items-center gap-2 md:gap-4 shrink-0">
               
               {/* Mobile View Menu */}
               <div className="xl:hidden relative" ref={viewMenuRef}>
                   <button 
                        onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                        className={`p-2 rounded-full transition-colors ${isViewMenuOpen ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                   >
                       <LayoutDashboard size={20} />
                   </button>
                   {isViewMenuOpen && (
                       <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-2 flex flex-col gap-1 z-50">
                           <div className="px-3 py-2 text-xs font-bold text-zinc-500 uppercase">Widgets</div>
                           <ToggleButton 
                                active={showSimulator} 
                                onClick={() => setShowSimulator(!showSimulator)} 
                                icon={Bot} 
                                label="Simulator" 
                            />
                            <ToggleButton 
                                active={showLiqChart} 
                                onClick={() => setShowLiqChart(!showLiqChart)} 
                                icon={Activity} 
                                label="Liquidation Chart" 
                            />
                            <ToggleButton 
                                active={showCompChart} 
                                onClick={() => setShowCompChart(!showCompChart)} 
                                icon={PieChart} 
                                label="Composition Chart" 
                            />
                            <ToggleButton 
                                active={showMarket} 
                                onClick={() => setShowMarket(!showMarket)} 
                                icon={TrendingUp} 
                                label="Market" 
                            />
                             <ToggleButton 
                                active={showAgent} 
                                onClick={() => setShowAgent(!showAgent)} 
                                icon={Bot} 
                                label="AI Analyst" 
                            />
                            <ToggleButton 
                                active={showFearGreed} 
                                onClick={() => setShowFearGreed(!showFearGreed)} 
                                icon={Gauge} 
                                label="Fear & Greed" 
                            />
                       </div>
                   )}
               </div>

               {/* Add Market Dropdown */}
               <div className="relative" ref={addMenuRef}>
                    <button 
                        onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                        className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-500 px-3 md:px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-900/20"
                    >
                        <PlusCircle size={16} />
                        <span className="hidden sm:inline">Add Market</span>
                        <ChevronDown size={14} className={`transition-transform ${isAddMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAddMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-2 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                             <div className="px-3 py-2 text-xs font-bold text-zinc-500 uppercase">Select Market Type</div>
                             
                             <button
                                onClick={() => { onAddCore(); setIsAddMenuOpen(false); }}
                                className="flex items-center gap-3 px-3 py-3 text-left hover:bg-zinc-800 rounded-lg transition-colors group w-full"
                            >
                                <div className="p-2 bg-zinc-800 group-hover:bg-zinc-700 rounded-lg text-zinc-200 transition-colors border border-zinc-700">
                                    <Layers size={18} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-zinc-200">Secondary Core</div>
                                    <div className="text-xs text-zinc-500">Shared liquidity simulation</div>
                                </div>
                            </button>

                            <button
                                onClick={() => { onAddIsolated(); setIsAddMenuOpen(false); }}
                                className="flex items-center gap-3 px-3 py-3 text-left hover:bg-zinc-800 rounded-lg transition-colors group w-full"
                            >
                                <div className="p-2 bg-indigo-900/30 group-hover:bg-indigo-900/50 rounded-lg text-indigo-400 transition-colors border border-indigo-500/20">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-zinc-200">Isolated Market</div>
                                    <div className="text-xs text-zinc-500">Segregated risk pool</div>
                                </div>
                            </button>
                        </div>
                    )}
               </div>

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
                       <span className="sm:hidden"><UserCircle2 size={20}/></span>
                   </button>
               )}

               <div className="w-px h-6 bg-zinc-800 mx-1 hidden md:block"></div>

               <div className="relative z-50">
                   <button 
                        onClick={handleRefreshClick}
                        disabled={isRefreshing}
                        title="Sync Live Prices"
                        className={`p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-zinc-800 ${isRefreshing ? 'animate-spin text-primary' : ''} ${showPriceTooltip ? 'bg-zinc-800 text-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-black' : ''}`}
                   >
                       <RefreshCw size={20} />
                   </button>

                   {/* Onboarding Tooltip Bubble */}
                   {showPriceTooltip && (
                       <div className="absolute top-full right-0 mt-4 w-72 animate-in fade-in slide-in-from-top-2 duration-300">
                           {/* Triangle Pointer */}
                           <div className="absolute -top-2 right-3 w-4 h-4 bg-zinc-800 border-t border-l border-zinc-600 transform rotate-45 z-10"></div>
                           
                           {/* Main Bubble */}
                           <div className="bg-zinc-800 border border-zinc-600 rounded-xl p-4 shadow-2xl relative z-0">
                               <button 
                                    onClick={dismissTooltip}
                                    className="absolute top-2 right-2 text-zinc-400 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                               <div className="flex items-start gap-3">
                                   <div className="p-2 bg-indigo-600/20 rounded-lg">
                                       <TrendingUp size={20} className="text-indigo-400" />
                                   </div>
                                   <div>
                                       <h3 className="text-white font-bold text-sm mb-1">Start Here</h3>
                                       <p className="text-zinc-400 text-xs leading-relaxed">
                                           Press this button to fetch the latest live market prices for your portfolio simulation.
                                       </p>
                                   </div>
                               </div>
                           </div>
                       </div>
                   )}
               </div>
               
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
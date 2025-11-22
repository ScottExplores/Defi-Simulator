
import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_SUPPLIED, INITIAL_BORROWED, INITIAL_RISK_PARAMS, PRESET_ASSETS } from './constants';
import { Position, RiskParameters, SimulationState, LiquidationScenario, AccountHealth } from './types';
import { SummaryCard } from './components/SummaryCard';
import { PortfolioTable } from './components/PortfolioTable';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { LiquidationCard } from './components/LiquidationCard';
import { HealthChart, CompositionChart } from './components/Charts';
import { Header } from './components/Header';
import { SettingsDialog } from './components/SettingsDialog';
import { AuthModal } from './components/AuthModal';
import { BackgroundOrbs } from './components/BackgroundOrbs';
import { fetchTokenPrices } from './priceService';
import { Trash2, PenLine } from 'lucide-react';

interface IsolatedMarket {
    id: string;
    name: string;
}

interface DashboardProps {
    account: string | null;
    onLoginClick: () => void;
    onLogout: () => void;
    // Auth Props passed down
    isAuthOpen: boolean;
    setIsAuthOpen: (v: boolean) => void;
    onLoginSuccess: (id: string) => void; 
    savedProfiles: string[];
    onDeleteProfile: (id: string) => void;
}

// The main logic component
const Dashboard: React.FC<DashboardProps> = ({ 
    account, onLoginClick, onLogout, isAuthOpen, setIsAuthOpen,
    onLoginSuccess, savedProfiles, onDeleteProfile
}) => {
  // Determine storage key prefix based on account
  const getStorageKey = (key: string) => account ? `${account}_${key}` : `guest_${key}`;

  // --- State ---
  const [supplied, setSupplied] = useState<Position[]>(() => {
    const saved = localStorage.getItem(getStorageKey('supplied'));
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIED;
  });
  const [borrowed, setBorrowed] = useState<Position[]>(() => {
    const saved = localStorage.getItem(getStorageKey('borrowed'));
    return saved ? JSON.parse(saved) : INITIAL_BORROWED;
  });
  const [riskParams, setRiskParams] = useState<RiskParameters>(() => {
    const saved = localStorage.getItem(getStorageKey('riskParams'));
    return saved ? JSON.parse(saved) : INITIAL_RISK_PARAMS;
  });
  const [simulation, setSimulation] = useState<SimulationState>({
    globalShock: 0,
    assetShocks: {},
  });
  
  const [isolatedMarkets, setIsolatedMarkets] = useState<IsolatedMarket[]>(() => {
      const saved = localStorage.getItem(getStorageKey('isolatedMarkets'));
      if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && (parsed.length === 0 || typeof parsed[0] === 'string')) {
             return parsed.map((id: string, idx: number) => ({ id, name: `Isolated Market #${idx + 1}` }));
          }
          return parsed;
      }
      return [];
  });

  // Widget Visibility State
  const [showSimulator, setShowSimulator] = useState(true);
  const [showLiquidation, setShowLiquidation] = useState(true);
  const [showCharts, setShowCharts] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(getStorageKey('supplied'), JSON.stringify(supplied));
    localStorage.setItem(getStorageKey('borrowed'), JSON.stringify(borrowed));
    localStorage.setItem(getStorageKey('riskParams'), JSON.stringify(riskParams));
    localStorage.setItem(getStorageKey('isolatedMarkets'), JSON.stringify(isolatedMarkets));
  }, [supplied, borrowed, riskParams, isolatedMarkets, account]);

  // --- Price Fetching ---
  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
        const allSymbols = Array.from(new Set([
            ...supplied.map(p => p.symbol),
            ...borrowed.map(p => p.symbol)
        ]));
        
        if (allSymbols.length === 0) {
            setIsRefreshing(false);
            return;
        }
        
        const prices = await fetchTokenPrices(allSymbols);
        
        if (Object.keys(prices).length > 0) {
            setSupplied(prev => prev.map(p => {
                const newPrice = prices[p.symbol.toUpperCase()];
                return newPrice ? { ...p, basePrice: newPrice } : p;
            }));
            
            setBorrowed(prev => prev.map(p => {
                const newPrice = prices[p.symbol.toUpperCase()];
                return newPrice ? { ...p, basePrice: newPrice } : p;
            }));
        }
    } catch (e) {
        console.error("Failed to refresh prices", e);
    } finally {
        setIsRefreshing(false);
    }
  };

  const getLatestPrice = (symbol: string) => {
      const normSymbol = symbol.toUpperCase();
      const sup = supplied.find(p => p.symbol.toUpperCase() === normSymbol);
      if (sup) return sup.basePrice;
      const bor = borrowed.find(p => p.symbol.toUpperCase() === normSymbol);
      if (bor) return bor.basePrice;
      const preset = PRESET_ASSETS.find(a => a.symbol.toUpperCase() === normSymbol);
      return preset ? preset.price : 0;
  };

  // --- Actions ---
  const handleAddIsolated = () => {
      const newGroupId = `iso-${Date.now()}`;
      const newMarket = { id: newGroupId, name: 'New Isolated Market' };
      setIsolatedMarkets([...isolatedMarkets, newMarket]);

      const ethPreset = PRESET_ASSETS.find(a => a.symbol === 'ETH') || PRESET_ASSETS[0];
      const usdcPreset = PRESET_ASSETS.find(a => a.symbol === 'USDC') || PRESET_ASSETS[0];

      const ethPrice = getLatestPrice(ethPreset.symbol);
      const usdcPrice = getLatestPrice(usdcPreset.symbol);

      const newSupply: Position = {
          id: `iso-supply-${Date.now()}`,
          symbol: ethPreset.symbol,
          amount: 1,
          basePrice: ethPrice,
          collateralFactor: ethPreset.cf,
          isCollateral: true,
          isStable: ethPreset.stable,
          type: 'supply',
          marketType: 'isolated',
          isolationGroup: newGroupId
      };

      const newBorrow: Position = {
          id: `iso-borrow-${Date.now()}`,
          symbol: usdcPreset.symbol,
          amount: 1000,
          basePrice: usdcPrice,
          collateralFactor: 0,
          isCollateral: false,
          isStable: usdcPreset.stable,
          type: 'borrow',
          marketType: 'isolated',
          isolationGroup: newGroupId
      };

      setSupplied(prev => [...prev, newSupply]);
      setBorrowed(prev => [...prev, newBorrow]);
  };

  const handleRemoveIsolated = (id: string) => {
      setIsolatedMarkets(isolatedMarkets.filter(m => m.id !== id));
      setSupplied(supplied.filter(p => p.isolationGroup !== id));
      setBorrowed(borrowed.filter(p => p.isolationGroup !== id));
  };

  const handleRenameIsolated = (id: string, newName: string) => {
      setIsolatedMarkets(isolatedMarkets.map(m => m.id === id ? { ...m, name: newName } : m));
  };

  // --- Export / Import ---
  const handleExportData = () => {
      const data = {
          supplied, borrowed, riskParams, isolatedMarkets
      };
      return JSON.stringify(data);
  };

  const handleImportData = (jsonStr: string) => {
      try {
          const data = JSON.parse(jsonStr);
          if (data.supplied) setSupplied(data.supplied);
          if (data.borrowed) setBorrowed(data.borrowed);
          if (data.riskParams) setRiskParams(data.riskParams);
          if (data.isolatedMarkets) setIsolatedMarkets(data.isolatedMarkets);
          // Force save immediately
          setTimeout(() => {
              // LocalStorage update handled by useEffect
          }, 0);
      } catch (e) {
          console.error("Import Failed", e);
          throw e;
      }
  };

  // --- Core Logic ---
  
  const getSimulatedPrice = (pos: Position) => {
    let multiplier = 1;
    if (!pos.isStable) {
        multiplier *= (1 + simulation.globalShock);
    }
    const groupKey = pos.isolationGroup || 'core';
    const compositeKey = `${groupKey}:${pos.symbol}`;
    const assetShock = simulation.assetShocks[compositeKey] || 0;
    multiplier *= (1 + assetShock);
    return Math.max(0, pos.basePrice * multiplier);
  };

  const { healthGroups, processedSupplied, processedBorrowed } = useMemo(() => {
    const pSupplied = supplied.map(p => {
        const currentPrice = getSimulatedPrice(p);
        const currentValue = p.amount * currentPrice;
        const currentBorrowPower = p.isCollateral ? currentValue * p.collateralFactor : 0;
        return { ...p, currentPrice, currentValue, currentBorrowPower };
    });

    const pBorrowed = borrowed.map(p => {
        const currentPrice = getSimulatedPrice(p);
        const currentValue = p.amount * currentPrice;
        return { ...p, currentPrice, currentValue, currentBorrowPower: 0 };
    });

    const isoIds = isolatedMarkets.map(m => m.id);
    const groupsToCalc = ['core', ...isoIds];
    const healthResults: AccountHealth[] = [];

    groupsToCalc.forEach(group => {
        const groupSupplied = pSupplied.filter(p => (p.isolationGroup || 'core') === group);
        const groupBorrowed = pBorrowed.filter(p => (p.isolationGroup || 'core') === group);

        const totalSupplyValue = groupSupplied.reduce((acc, p) => acc + p.currentValue, 0);
        const totalCollateralValue = groupSupplied.reduce((acc, p) => acc + p.currentBorrowPower, 0);
        const totalDebtValue = groupBorrowed.reduce((acc, p) => acc + p.currentValue, 0);
        
        const healthFactor = totalDebtValue === 0 ? Infinity : totalCollateralValue / totalDebtValue;

        healthResults.push({
            groupName: group,
            totalSupplyValue,
            totalCollateralValue,
            totalDebtValue,
            healthFactor,
            liquidationThreshold: 1.0,
            loanToValue: totalSupplyValue > 0 ? totalDebtValue / totalSupplyValue : 0
        });
    });

    return { 
        healthGroups: healthResults, 
        processedSupplied: pSupplied, 
        processedBorrowed: pBorrowed 
    };
  }, [supplied, borrowed, simulation, riskParams, isolatedMarkets]);

  const coreHealth = healthGroups.find(h => h.groupName === 'core') || {
      groupName: 'core',
      totalSupplyValue: 0,
      totalCollateralValue: 0,
      totalDebtValue: 0,
      healthFactor: Infinity,
      liquidationThreshold: 1.0,
      loanToValue: 0
  };

  const liquidationScenario: LiquidationScenario | null = useMemo(() => {
      if (coreHealth.healthFactor >= 1.0) return null; 

      const maxRepayAmount = coreHealth.totalDebtValue * riskParams.closeFactor;
      const seizeTarget = maxRepayAmount * riskParams.liquidationIncentive;
      
      let remainingSeize = seizeTarget;
      const seizedBreakdown: { symbol: string; amount: number; valueUSD: number }[] = [];

      const collateralPositions = processedSupplied
          .filter(p => (p.isolationGroup || 'core') === 'core' && p.isCollateral)
          .sort((a, b) => b.currentValue - a.currentValue);

      for (const pos of collateralPositions) {
          if (remainingSeize <= 0) break;
          const availableValue = pos.currentValue;
          const seizeValue = Math.min(availableValue, remainingSeize);
          const seizeAmount = pos.currentPrice > 0 ? seizeValue / pos.currentPrice : 0;
          seizedBreakdown.push({ symbol: pos.symbol, amount: seizeAmount, valueUSD: seizeValue });
          remainingSeize -= seizeValue;
      }

      const newDebt = coreHealth.totalDebtValue - maxRepayAmount;
      let newBorrowPower = 0;
      processedSupplied.filter(p => (p.isolationGroup || 'core') === 'core').forEach(p => {
          const seizedItem = seizedBreakdown.find(s => s.symbol === p.symbol);
          const seizedVal = seizedItem ? seizedItem.valueUSD : 0;
          if (p.isCollateral) {
             const remainingVal = Math.max(0, p.currentValue - seizedVal);
             newBorrowPower += remainingVal * p.collateralFactor;
          }
      });

      const postHealth = newDebt === 0 ? Infinity : newBorrowPower / newDebt;

      return { maxRepayAmount, seizedCollateralUSD: seizeTarget, postLiquidationHealth: postHealth, seizedBreakdown };
  }, [coreHealth, processedSupplied, riskParams]);

  return (
    <div className="min-h-screen pb-40 text-zinc-100 font-sans selection:bg-blue-500/30 relative">
      <BackgroundOrbs />
      
      <Header 
        onRefresh={handleRefreshPrices} 
        isRefreshing={isRefreshing} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onAddIsolated={handleAddIsolated}
        account={account}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        
        showSimulator={showSimulator} setShowSimulator={setShowSimulator}
        showLiquidation={showLiquidation} setShowLiquidation={setShowLiquidation}
        showCharts={showCharts} setShowCharts={setShowCharts}
      />

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 relative z-10">
        <main className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN */}
          <div className="xl:col-span-7 space-y-6">
              {/* CORE MARKET */}
              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-sm">
                  <div className="px-6 pt-6 pb-2">
                      <h2 className="text-2xl font-bold text-white mb-1">Core Market</h2>
                      <p className="text-zinc-500 text-sm">Primary cross-collateralized portfolio</p>
                  </div>
                  <div className="px-4 md:px-6 pb-6">
                    <SummaryCard health={coreHealth} title="Core Portfolio" />
                    <div className="space-y-8 mt-8">
                        <PortfolioTable 
                            title="Core Supplied" 
                            positions={supplied.filter(p => (p.isolationGroup || 'core') === 'core')} 
                            onUpdate={setSupplied} 
                            type="supply"
                            group="core"
                            allPositions={supplied}
                            setAllPositions={setSupplied}
                            getPrice={getLatestPrice}
                        />
                        <PortfolioTable 
                            title="Core Borrowed" 
                            positions={borrowed.filter(p => (p.isolationGroup || 'core') === 'core')} 
                            onUpdate={setBorrowed} 
                            type="borrow" 
                            group="core"
                            allPositions={borrowed}
                            setAllPositions={setBorrowed}
                            getPrice={getLatestPrice}
                        />
                    </div>
                  </div>
              </div>

              {/* ISOLATED MARKETS */}
              {isolatedMarkets.map((market) => {
                  const isoHealth = healthGroups.find(h => h.groupName === market.id);
                  if (!isoHealth) return null;
                  return (
                    <div key={market.id} className="relative group rounded-2xl p-[1px] bg-gradient-to-br from-blue-600/50 via-indigo-500/50 to-blue-600/50 shadow-lg shadow-indigo-900/5">
                        <div className="bg-zinc-950 rounded-2xl w-full relative">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                 <button onClick={() => handleRemoveIsolated(market.id)} className="text-indigo-400/50 hover:text-red-400 p-2 bg-zinc-900/80 rounded-full backdrop-blur-sm">
                                     <Trash2 size={18} />
                                 </button>
                            </div>
                            <div className="px-6 pt-6 pb-2">
                                <div className="flex items-center gap-2 group/edit">
                                    <input 
                                        type="text" 
                                        value={market.name}
                                        onChange={(e) => handleRenameIsolated(market.id, e.target.value)}
                                        className="text-2xl font-bold text-indigo-100 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none transition-colors w-full max-w-md placeholder-indigo-500/30"
                                        placeholder="Unnamed Market"
                                    />
                                    <PenLine size={16} className="text-indigo-500/30 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-indigo-400/60 text-sm mt-1">Segregated risk pool</p>
                            </div>
                            <div className="px-4 md:px-6 pb-6">
                                <SummaryCard health={isoHealth} title={market.name} variant="default" />
                                <div className="space-y-8 mt-8">
                                    <PortfolioTable 
                                        title="Supplied Assets" 
                                        positions={supplied.filter(p => p.isolationGroup === market.id)} 
                                        type="supply"
                                        group={market.id}
                                        allPositions={supplied}
                                        setAllPositions={setSupplied}
                                        getPrice={getLatestPrice}
                                    />
                                    <PortfolioTable 
                                        title="Borrowed Assets" 
                                        positions={borrowed.filter(p => p.isolationGroup === market.id)} 
                                        type="borrow" 
                                        group={market.id}
                                        allPositions={borrowed}
                                        setAllPositions={setBorrowed}
                                        getPrice={getLatestPrice}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                  );
              })}
          </div>

          {/* RIGHT COLUMN */}
          <div className="xl:col-span-5 space-y-6 sticky top-24">
              {showSimulator && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <ScenarioSimulator simulation={simulation} onUpdate={setSimulation} positions={[...supplied, ...borrowed]} isolatedMarkets={isolatedMarkets} />
                  </div>
              )}
              {showLiquidation && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                      <LiquidationCard scenario={liquidationScenario} health={coreHealth} isLiquidatable={coreHealth.healthFactor < 1.0} />
                  </div>
              )}
              {showCharts && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                      <HealthChart currentPositions={processedSupplied.filter(p => (p.isolationGroup || 'core') === 'core')} health={coreHealth} riskParams={riskParams} />
                      <CompositionChart supplies={processedSupplied.filter(p => (p.isolationGroup || 'core') === 'core')} borrows={processedBorrowed.filter(p => (p.isolationGroup || 'core') === 'core')} />
                  </div>
              )}
          </div>
        </main>
      </div>

      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        riskParams={riskParams}
        onRiskChange={setRiskParams}
        positions={supplied}
        onPositionUpdate={setSupplied}
      />

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLogin={onLoginSuccess}
        savedProfiles={savedProfiles}
        onDeleteProfile={onDeleteProfile}
        currentDataExport={handleExportData}
        onImportData={handleImportData}
      />
    </div>
  );
};

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<string[]>(() => {
      const saved = localStorage.getItem('saved_profiles');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const savedSession = localStorage.getItem('active_session');
    if (savedSession) {
        setAccount(savedSession);
    }
  }, []);

  useEffect(() => {
      localStorage.setItem('saved_profiles', JSON.stringify(savedProfiles));
  }, [savedProfiles]);

  const handleLogin = (id: string) => {
      setAccount(id);
      localStorage.setItem('active_session', id);
      
      if (!savedProfiles.includes(id)) {
          setSavedProfiles([...savedProfiles, id]);
      }
      setIsAuthOpen(false);
  };

  const handleDeleteProfile = (id: string) => {
      const newProfiles = savedProfiles.filter(p => p !== id);
      setSavedProfiles(newProfiles);
      localStorage.setItem('saved_profiles', JSON.stringify(newProfiles));
  };

  const handleLogout = () => {
    setAccount(null);
    localStorage.removeItem('active_session');
  };

  return (
    <Dashboard 
        key={account || 'guest'} 
        account={account} 
        onLoginClick={() => setIsAuthOpen(true)} 
        onLogout={handleLogout}
        isAuthOpen={isAuthOpen}
        setIsAuthOpen={setIsAuthOpen}
        onLoginSuccess={handleLogin}
        savedProfiles={savedProfiles}
        onDeleteProfile={handleDeleteProfile}
    />
  );
}

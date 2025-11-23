import React, { useState, useEffect, useMemo, useRef } from 'react';
import { INITIAL_SUPPLIED, INITIAL_BORROWED, INITIAL_RISK_PARAMS, PRESET_ASSETS, SCOTT_DEFAULTS } from './constants';
import { Position, RiskParameters, SimulationState, AccountHealth, MarketContext } from './types';
import { SummaryCard } from './components/SummaryCard';
import { PortfolioTable } from './components/PortfolioTable';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { HealthChart, CompositionChart } from './components/Charts';
import { MarketPriceChart } from './components/MarketPriceChart';
import { MarketAgent } from './components/MarketAgent';
import { FearGreedIndex } from './components/FearGreedIndex';
import { Header } from './components/Header';
import { SettingsDialog } from './components/SettingsDialog';
import { AuthModal } from './components/AuthModal';
import { BackgroundOrbs } from './components/BackgroundOrbs';
import { fetchTokenPrices } from './priceService';
import { PenLine, Trash2, GripHorizontal } from 'lucide-react';

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

type WidgetId = 'simulator' | 'agent' | 'market' | 'liqChart' | 'compChart' | 'feargreed';

// Helper component for Drag-and-Drop
const DraggableWidget: React.FC<{
    id: WidgetId;
    index: number;
    moveWidget: (dragIndex: number, hoverIndex: number) => void;
    children: React.ReactNode;
    isDragging: boolean;
    onDragStart: (index: number) => void;
    onDragEnd: () => void;
}> = ({ id, index, moveWidget, children, isDragging, onDragStart, onDragEnd }) => {
    const ref = useRef<HTMLDivElement>(null);

    const handleDragStart = (e: React.DragEvent) => {
        // CRITICAL FIX: Prevent drag if user is interacting with Inputs (Sliders) or Buttons
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('input') || target.closest('button');
        
        if (isInput) {
            e.preventDefault();
            return;
        }

        onDragStart(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault(); 
        moveWidget(parseInt(e.dataTransfer.getData('text/plain') || index.toString()), index);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div
            ref={ref}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={onDragEnd}
            className={`transition-all duration-300 ease-in-out ${isDragging ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'} group relative`}
        >
             {/* Hover Handle */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1.5 bg-zinc-800/90 rounded-full backdrop-blur text-zinc-400 hover:text-white border border-zinc-700 shadow-lg pointer-events-none">
                <GripHorizontal size={20} />
            </div>
            {children}
        </div>
    );
};


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

  // AI Agent Context State
  const [agentContext, setAgentContext] = useState<MarketContext[]>(() => {
      const saved = localStorage.getItem(getStorageKey('agentContext'));
      return saved ? JSON.parse(saved) : [];
  });

  // Widget Visibility & Order State
  const [showSimulator, setShowSimulator] = useState(true);
  const [showLiqChart, setShowLiqChart] = useState(true);
  const [showCompChart, setShowCompChart] = useState(true);
  const [showMarket, setShowMarket] = useState(true);
  const [showAgent, setShowAgent] = useState(true);
  const [showFearGreed, setShowFearGreed] = useState(true);

  // Default order
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
      const saved = localStorage.getItem(getStorageKey('widgetOrder'));
      // Migrate old order if needed
      if (saved) {
          let parsed = JSON.parse(saved);
          if (parsed.includes('charts')) {
              parsed = parsed.filter((id: string) => id !== 'charts');
              parsed.push('liqChart', 'compChart');
          }
          return parsed;
      }
      return ['simulator', 'agent', 'feargreed', 'market', 'liqChart', 'compChart'];
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Drag State
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(getStorageKey('supplied'), JSON.stringify(supplied));
    localStorage.setItem(getStorageKey('borrowed'), JSON.stringify(borrowed));
    localStorage.setItem(getStorageKey('riskParams'), JSON.stringify(riskParams));
    localStorage.setItem(getStorageKey('isolatedMarkets'), JSON.stringify(isolatedMarkets));
    localStorage.setItem(getStorageKey('widgetOrder'), JSON.stringify(widgetOrder));
    localStorage.setItem(getStorageKey('agentContext'), JSON.stringify(agentContext));
  }, [supplied, borrowed, riskParams, isolatedMarkets, widgetOrder, agentContext, account]);

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
      // ... (Add default positions logic same as before)
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

  const handleAddCore = () => {
      const newGroupId = `core-${Date.now()}`;
      const newMarket = { id: newGroupId, name: 'Secondary Core Market' };
      setIsolatedMarkets([...isolatedMarkets, newMarket]);

      const ethPreset = PRESET_ASSETS.find(a => a.symbol === 'ETH')!;
      const usdcPreset = PRESET_ASSETS.find(a => a.symbol === 'USDC')!;
      const aeroPreset = PRESET_ASSETS.find(a => a.symbol === 'AERO');
      const ethPrice = getLatestPrice('ETH');
      const usdcPrice = getLatestPrice('USDC');
      const aeroPrice = getLatestPrice('AERO');

      const newSupply1: Position = {
          id: `core-sup-1-${Date.now()}`,
          symbol: 'ETH',
          amount: 10,
          basePrice: ethPrice,
          collateralFactor: ethPreset.cf,
          isCollateral: true,
          isStable: ethPreset.stable,
          type: 'supply',
          marketType: 'core',
          isolationGroup: newGroupId
      };

      const newSupply2: Position = {
          id: `core-sup-2-${Date.now()}`,
          symbol: 'AERO',
          amount: 5000,
          basePrice: aeroPrice,
          collateralFactor: aeroPreset?.cf || 0.6,
          isCollateral: true,
          isStable: aeroPreset?.stable || false,
          type: 'supply',
          marketType: 'core',
          isolationGroup: newGroupId
      };

      const newBorrow: Position = {
          id: `core-bor-${Date.now()}`,
          symbol: 'USDC',
          amount: 10000,
          basePrice: usdcPrice,
          collateralFactor: 0,
          isCollateral: false,
          isStable: usdcPreset.stable,
          type: 'borrow',
          marketType: 'core',
          isolationGroup: newGroupId
      };

      setSupplied(prev => [...prev, newSupply1, newSupply2]);
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

  // --- Drag and Drop Handlers ---
  const onDragStart = (index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
  };

  const onDragEnter = (index: number) => {
    dragOverItem.current = index;
    const dragIdx = dragItem.current;
    if (dragIdx === null || dragIdx === index) return;
    const newOrder = [...widgetOrder];
    const draggedItemContent = newOrder[dragIdx];
    newOrder.splice(dragIdx, 1);
    newOrder.splice(index, 0, draggedItemContent);
    dragItem.current = index;
    setWidgetOrder(newOrder);
  };

  const onDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
  };

  // --- Export / Import ---
  const handleExportData = () => {
      const data = {
          supplied, borrowed, riskParams, isolatedMarkets, widgetOrder, agentContext
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
          if (data.widgetOrder) setWidgetOrder(data.widgetOrder);
          if (data.agentContext) setAgentContext(data.agentContext);
      } catch (e) {
          console.error("Import Failed", e);
          throw e;
      }
  };

  // --- Core Logic ---
  const getSimulatedPrice = (pos: Position) => {
    let multiplier = 1;
    if (!pos.isStable) multiplier *= (1 + simulation.globalShock);
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

  // --- Widget Render Map ---
  const renderWidget = (id: WidgetId) => {
      switch (id) {
          case 'simulator':
              return showSimulator ? (
                  <ScenarioSimulator 
                    simulation={simulation}
                    onUpdate={setSimulation}
                    positions={supplied.concat(borrowed)}
                    isolatedMarkets={isolatedMarkets}
                  />
              ) : null;
          case 'agent':
              return showAgent ? (
                  <MarketAgent 
                      positions={supplied.concat(borrowed)} 
                      contextItems={agentContext}
                  />
              ) : null;
          case 'market':
              return showMarket ? <MarketPriceChart /> : null;
          case 'feargreed':
              return showFearGreed ? <FearGreedIndex /> : null;
          case 'liqChart':
              return showLiqChart ? (
                <HealthChart 
                    currentPositions={processedSupplied.concat(processedBorrowed)}
                    health={coreHealth}
                    riskParams={riskParams}
                />
              ) : null;
          case 'compChart':
              return showCompChart ? (
                <CompositionChart supplies={processedSupplied} borrows={processedBorrowed} />
              ) : null;
          default:
              return null;
      }
  };

  return (
    <div className="min-h-screen pb-20 relative text-zinc-100 font-sans selection:bg-indigo-500/30">
      <BackgroundOrbs />
      
      <Header 
        onRefresh={handleRefreshPrices}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isRefreshing={isRefreshing}
        onAddIsolated={handleAddIsolated}
        onAddCore={handleAddCore}
        account={account}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        showSimulator={showSimulator}
        setShowSimulator={setShowSimulator}
        showLiqChart={showLiqChart}
        setShowLiqChart={setShowLiqChart}
        showCompChart={showCompChart}
        setShowCompChart={setShowCompChart}
        showMarket={showMarket}
        setShowMarket={setShowMarket}
        showAgent={showAgent}
        setShowAgent={setShowAgent}
        showFearGreed={showFearGreed}
        setShowFearGreed={setShowFearGreed}
      />

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 pt-8 grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-10">
        <div className="xl:col-span-7 space-y-6">
            {/* CORE MARKET BLOCK */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 relative shadow-xl">
                <SummaryCard health={coreHealth} title="Your Portfolio" variant="default" />
                <div className="space-y-6 mt-6">
                    <PortfolioTable 
                        title="Supplied Assets" 
                        positions={processedSupplied.filter(p => p.type === 'supply' && (p.isolationGroup || 'core') === 'core')} 
                        type="supply" 
                        group="core"
                        allPositions={supplied}
                        setAllPositions={setSupplied}
                        getPrice={getLatestPrice}
                    />
                    <PortfolioTable 
                        title="Borrowed Assets" 
                        positions={processedBorrowed.filter(p => p.type === 'borrow' && (p.isolationGroup || 'core') === 'core')} 
                        type="borrow" 
                        group="core"
                        allPositions={borrowed}
                        setAllPositions={setBorrowed}
                        getPrice={getLatestPrice}
                    />
                </div>
            </div>

            {/* ISOLATED MARKETS BLOCKS */}
            {isolatedMarkets.map(market => {
                const health = healthGroups.find(h => h.groupName === market.id) || { ...coreHealth, healthFactor: Infinity, groupName: market.id, totalSupplyValue: 0, totalDebtValue: 0, totalCollateralValue: 0 };
                return (
                    <div key={market.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 relative shadow-xl">
                        <div className="absolute top-4 right-4 z-10">
                            <button 
                                onClick={() => handleRemoveIsolated(market.id)}
                                className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Remove Market"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400 border border-indigo-500/20">
                                <PenLine size={18} />
                            </div>
                            <input 
                                type="text"
                                value={market.name}
                                onChange={(e) => handleRenameIsolated(market.id, e.target.value)}
                                className="bg-transparent text-2xl font-bold text-white outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2 -ml-2 w-full max-w-md"
                            />
                        </div>

                        <SummaryCard health={health} title={market.name} variant="default" />
                        
                        <div className="space-y-6 mt-6">
                            <PortfolioTable 
                                title="Supplied Assets" 
                                positions={processedSupplied.filter(p => p.type === 'supply' && p.isolationGroup === market.id)} 
                                type="supply" 
                                group={market.id}
                                allPositions={supplied}
                                setAllPositions={setSupplied}
                                getPrice={getLatestPrice}
                            />
                            <PortfolioTable 
                                title="Borrowed Assets" 
                                positions={processedBorrowed.filter(p => p.type === 'borrow' && p.isolationGroup === market.id)} 
                                type="borrow" 
                                group={market.id}
                                allPositions={borrowed}
                                setAllPositions={setBorrowed}
                                getPrice={getLatestPrice}
                            />
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="xl:col-span-5 space-y-6">
            {widgetOrder.map((widgetId, index) => {
                const content = renderWidget(widgetId);
                if (!content) return null;
                
                return (
                    <div 
                        key={widgetId}
                        draggable
                        onDragStart={() => onDragStart(index)}
                        onDragEnter={() => onDragEnter(index)}
                        onDragEnd={onDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className={`transition-all duration-300 ease-in-out group relative ${draggingIndex === index ? 'opacity-40 scale-[0.98]' : 'opacity-100 scale-100'}`}
                    >
                         <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1.5 bg-zinc-800/90 rounded-full backdrop-blur text-zinc-400 hover:text-white border border-zinc-700 shadow-lg pointer-events-none">
                            <GripHorizontal size={20} />
                        </div>
                        {content}
                    </div>
                );
            })}
        </div>
      </main>

      <SettingsDialog 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        riskParams={riskParams}
        onRiskChange={setRiskParams}
        positions={supplied}
        onPositionUpdate={setSupplied}
        agentContext={agentContext}
        onContextUpdate={setAgentContext}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={onLoginSuccess}
        savedProfiles={savedProfiles}
        onDeleteProfile={onDeleteProfile}
        onImportData={handleImportData}
        currentDataExport={handleExportData}
      />
    </div>
  );
};

// --- Wrapper for Auth Context ---
const App: React.FC = () => {
    const [account, setAccount] = useState<string | null>(() => {
        return sessionStorage.getItem('active_account');
    });
    const [savedProfiles, setSavedProfiles] = useState<string[]>(() => {
        const saved = localStorage.getItem('saved_profiles_list');
        return saved ? JSON.parse(saved) : [];
    });
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    const handleLogin = (id: string) => {
        const keyPrefix = `${id}_`;
        if (id === 'User:Scott321') {
             const combinedSupplied = [...SCOTT_DEFAULTS.coreSupplied, ...SCOTT_DEFAULTS.isoSupplied];
             const combinedBorrowed = [...SCOTT_DEFAULTS.coreBorrowed, ...SCOTT_DEFAULTS.isoBorrowed];
             localStorage.setItem(`${keyPrefix}supplied`, JSON.stringify(combinedSupplied));
             localStorage.setItem(`${keyPrefix}borrowed`, JSON.stringify(combinedBorrowed));
             localStorage.setItem(`${keyPrefix}riskParams`, JSON.stringify(INITIAL_RISK_PARAMS));
             localStorage.setItem(`${keyPrefix}isolatedMarkets`, JSON.stringify(SCOTT_DEFAULTS.isolatedMarkets));
        }
        setAccount(id);
        sessionStorage.setItem('active_account', id);
        if (!savedProfiles.includes(id)) {
            const newProfiles = [...savedProfiles, id];
            setSavedProfiles(newProfiles);
            localStorage.setItem('saved_profiles_list', JSON.stringify(newProfiles));
        }
    };

    const handleLogout = () => {
        setAccount(null);
        sessionStorage.removeItem('active_account');
    };

    const handleDeleteProfile = (id: string) => {
        const newProfiles = savedProfiles.filter(p => p !== id);
        setSavedProfiles(newProfiles);
        localStorage.setItem('saved_profiles_list', JSON.stringify(newProfiles));
        if (account === id) handleLogout();
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
};

export default App;
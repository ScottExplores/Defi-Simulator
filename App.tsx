import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_SUPPLIED, INITIAL_BORROWED, INITIAL_RISK_PARAMS } from './constants';
import { Position, RiskParameters, SimulationState, LiquidationScenario, AccountHealth } from './types';
import { SummaryCard } from './components/SummaryCard';
import { PortfolioTable } from './components/PortfolioTable';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { LiquidationCard } from './components/LiquidationCard';
import { HealthChart, CompositionChart } from './components/Charts';
import { Header } from './components/Header';
import { SettingsDialog } from './components/SettingsDialog';
import { fetchTokenPrices } from './priceService';

function App() {
  // --- State ---
  const [supplied, setSupplied] = useState<Position[]>(() => {
    const saved = localStorage.getItem('supplied');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIED;
  });
  const [borrowed, setBorrowed] = useState<Position[]>(() => {
    const saved = localStorage.getItem('borrowed');
    return saved ? JSON.parse(saved) : INITIAL_BORROWED;
  });
  const [riskParams, setRiskParams] = useState<RiskParameters>(() => {
    const saved = localStorage.getItem('riskParams');
    return saved ? JSON.parse(saved) : INITIAL_RISK_PARAMS;
  });
  const [simulation, setSimulation] = useState<SimulationState>({
    globalShock: 0,
    assetShocks: {},
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('supplied', JSON.stringify(supplied));
    localStorage.setItem('borrowed', JSON.stringify(borrowed));
    localStorage.setItem('riskParams', JSON.stringify(riskParams));
  }, [supplied, borrowed, riskParams]);

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

  // --- Core Logic ---
  
  const getSimulatedPrice = (pos: Position) => {
    let multiplier = 1;
    if (!pos.isStable) {
        multiplier *= (1 + simulation.globalShock);
    }
    
    const assetShock = simulation.assetShocks[pos.id] || 0;
    multiplier *= (1 + assetShock);
    
    return Math.max(0, pos.basePrice * multiplier);
  };

  // Compute Health for ALL groups (Core + Isolated)
  const { healthGroups, processedSupplied, processedBorrowed } = useMemo(() => {
    
    // 1. Pre-process all positions with simulated prices
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

    // 2. Identify all unique groups
    const allGroups = new Set<string>();
    [...pSupplied, ...pBorrowed].forEach(p => {
        allGroups.add(p.isolationGroup || 'core');
    });
    if (allGroups.size === 0) allGroups.add('core');

    const healthResults: AccountHealth[] = [];

    // 3. Calculate health per group
    allGroups.forEach(group => {
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
  }, [supplied, borrowed, simulation, riskParams]);

  // Extract Core Health for main display and charts
  const coreHealth = healthGroups.find(h => h.groupName === 'core') || {
      groupName: 'core',
      totalSupplyValue: 0,
      totalCollateralValue: 0,
      totalDebtValue: 0,
      healthFactor: Infinity,
      liquidationThreshold: 1.0,
      loanToValue: 0
  };

  // 3. Liquidation Simulation (Focus on Core for now in detail view)
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
          
          seizedBreakdown.push({
              symbol: pos.symbol,
              amount: seizeAmount,
              valueUSD: seizeValue
          });
          
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

      return {
          maxRepayAmount,
          seizedCollateralUSD: seizeTarget,
          postLiquidationHealth: postHealth,
          seizedBreakdown
      };
  }, [coreHealth, processedSupplied, riskParams]);


  return (
    <div className="min-h-screen pb-20 bg-black text-zinc-100 font-sans selection:bg-blue-500/30">
      
      <Header 
        onRefresh={handleRefreshPrices} 
        isRefreshing={isRefreshing} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="max-w-[1200px] mx-auto px-6 py-10">
        
        {/* Summary Sections */}
        <div className="mb-10">
             {/* Core Market */}
            <SummaryCard health={coreHealth} title="Your Portfolio" />

            {/* Isolated Markets */}
            {healthGroups.filter(g => g.groupName !== 'core').map(isoHealth => (
                <SummaryCard 
                    key={isoHealth.groupName} 
                    health={isoHealth} 
                    title={isoHealth.groupName} 
                    variant="compact" 
                />
            ))}
        </div>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Portfolio Editing */}
          <div className="lg:col-span-7 space-y-10">
              <PortfolioTable 
                  title="Supplied Assets" 
                  positions={supplied} 
                  onUpdate={setSupplied} 
                  type="supply" 
              />
              <PortfolioTable 
                  title="Borrowed Assets" 
                  positions={borrowed} 
                  onUpdate={setBorrowed} 
                  type="borrow" 
              />
          </div>

          {/* Right Column: Analysis & Simulation (Focuses on Core) */}
          <div className="lg:col-span-5 space-y-8">
              
              <ScenarioSimulator 
                  simulation={simulation} 
                  onUpdate={setSimulation}
                  positions={[...supplied, ...borrowed]} 
              />

              <LiquidationCard 
                  scenario={liquidationScenario} 
                  health={coreHealth} 
                  isLiquidatable={coreHealth.healthFactor < 1.0} 
              />

              <div className="space-y-6">
                   <HealthChart 
                        currentPositions={processedSupplied.filter(p => (p.isolationGroup || 'core') === 'core')} 
                        health={coreHealth} 
                        riskParams={riskParams} 
                   />
                   <CompositionChart 
                        supplies={processedSupplied.filter(p => (p.isolationGroup || 'core') === 'core')} 
                        borrows={processedBorrowed.filter(p => (p.isolationGroup || 'core') === 'core')} 
                   />
              </div>

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

    </div>
  );
}

export default App;
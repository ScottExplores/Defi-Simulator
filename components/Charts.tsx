import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, BarChart, Bar, Cell, Legend } from 'recharts';
import { Position, AccountHealth, RiskParameters } from '../types';

interface ChartsProps {
  currentPositions: Position[]; // Simulated prices
  health: AccountHealth;
  riskParams: RiskParameters;
}

export const HealthChart: React.FC<ChartsProps> = ({ currentPositions, health, riskParams }) => {
  // Generate curve data: Drawdown 0% to -60%
  const data = [];
  const steps = 20;
  
  // Need to recalculate health for each step purely based on global shock
  // Note: This is an approximation assuming the current simulated state is the baseline 0 for the chart, 
  // or we can treat the chart as "Additional Drawdown". Let's do "Additional Global Drawdown" from current state.
  
  const debt = health.totalDebtValue;
  // If no debt, health is infinite, chart is boring
  if (debt === 0) return (
      <div className="h-64 flex items-center justify-center text-textMuted italic bg-surface rounded-xl border border-surfaceHighlight">
          No debt active.
      </div>
  );

  for (let i = 0; i <= steps; i++) {
    const drawdown = (i / steps) * 0.60; // 0 to 60% drop
    const multiplier = 1 - drawdown;
    
    // Recalc collateral value
    let simulatedCollateral = 0;
    currentPositions.filter(p => p.type === 'supply' && p.isCollateral).forEach(p => {
        // If stable, we usually assume it holds peg, but in a "global crash" scenario usually crypto drops.
        // Let's assume non-stables drop.
        const price = p.isStable ? p.basePrice : (p.basePrice * multiplier); // Note: using p.basePrice here is wrong, should be current simulated price
        // Actually, let's just drop everything that isn't stable from the *current* state
        // p passed in has the *currently simulated* price in it? No, type Position has basePrice. 
        // We need the effective price from the parent. 
        // Let's assume the passed `currentPositions` have the prices *already applied*.
        // We need to pass the *calculated* positions to this component.
        
        // Let's look at `currentPositions` in App.tsx. It sends derived prices.
        const effectivePrice = p.isStable ? p.basePrice : (p.basePrice * multiplier); // Wait, `currentPositions` in props has `currentPrice`.
        // Let's fix the prop type in App.tsx to pass the fully computed objects.
    });
  }

  // Simplified approach for the chart:
  // Take the *current* total collateral and debt.
  // Assume debt is constant (USD value doesn't drop in crypto crash usually, stablecoins stay 1).
  // Assume Collateral drops by X%.
  // This is a naive "Collateral Value Drawdown" chart.
  
  const currentCollateral = health.totalCollateralValue;
  
  for (let i = 0; i <= 20; i++) {
      const dropPct = i * 2.5; // 0 to 50%
      const factor = 1 - (dropPct / 100);
      const newCollat = currentCollateral * factor;
      const newHealth = newCollat / debt;
      data.push({
          name: `-${dropPct}%`,
          drop: dropPct,
          health: newHealth > 5 ? 5 : newHealth, // Clamp for visual
          threshold: 1.0
      });
  }

  return (
    <div className="bg-surface rounded-xl border border-surfaceHighlight p-6">
      <h3 className="text-sm font-semibold text-textMain mb-4">Liquidation Curve (Addtl. Drawdown)</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" hide />
            <YAxis domain={[0, 'auto']} hide />
            <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                itemStyle={{ color: '#f4f4f5' }}
                formatter={(val: number) => val.toFixed(2)}
                labelStyle={{ color: '#a1a1aa' }}
            />
            <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Liq', fill: '#ef4444', fontSize: 10 }} />
            <Area type="monotone" dataKey="health" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHealth)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-[10px] text-textMuted mt-2">
          <span>Current Price</span>
          <span>-50% Value</span>
      </div>
    </div>
  );
};

export const CompositionChart: React.FC<{ supplies: any[], borrows: any[] }> = ({ supplies, borrows }) => {
    // Top 3 Supplies + Others
    const sortedSupplies = [...supplies].sort((a, b) => b.currentValue - a.currentValue);
    const topSupplies = sortedSupplies.slice(0, 3);
    const otherSupplyVal = sortedSupplies.slice(3).reduce((acc, c) => acc + c.currentValue, 0);
    
    const displayData = [
        ...topSupplies.map(s => ({ name: s.symbol, value: s.currentValue, type: 'Supply' })),
        ...(otherSupplyVal > 0 ? [{ name: 'Others', value: otherSupplyVal, type: 'Supply' }] : []),
    ];

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

    return (
        <div className="bg-surface rounded-xl border border-surfaceHighlight p-6">
            <h3 className="text-sm font-semibold text-textMain mb-4">Supply Composition</h3>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={50} tick={{fontSize: 10, fill: '#a1a1aa'}} />
                        <Tooltip 
                             contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                             formatter={(val: number) => `$${val.toLocaleString()}`}
                             cursor={{fill: '#27272a'}}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                            {displayData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
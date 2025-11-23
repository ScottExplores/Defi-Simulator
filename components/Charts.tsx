import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, BarChart, Bar, Cell, ComposedChart, CartesianGrid } from 'recharts';
import { Position, AccountHealth, RiskParameters } from '../types';

interface ChartsProps {
  currentPositions: Position[];
  health: AccountHealth;
  riskParams: RiskParameters;
}

export const HealthChart: React.FC<ChartsProps> = ({ health }) => {
  const debt = health.totalDebtValue;
  const collateral = health.totalCollateralValue;

  // 1. Handle "No Debt" case
  if (debt === 0) return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="h-[340px] flex flex-col items-center justify-center text-textMuted italic text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </div>
            <span className="text-emerald-400 font-bold text-xl mb-1">No Liquidation Risk</span>
            <span className="text-sm text-zinc-500">You have no active debt positions.</span>
        </div>
      </div>
  );

  const currentHealth = health.healthFactor;
  
  // 2. Calculate exact drop % required to hit HF = 1.0
  // Formula: HF_new = (Collateral * (1 - drop)) / Debt = 1
  // => 1 - drop = Debt / Collateral
  // => drop = 1 - (1 / currentHealth)
  let dropToLiq = 0;
  if (currentHealth > 1) {
      dropToLiq = (1 - (1 / currentHealth)) * 100;
  } else {
      dropToLiq = 0; // Already liquidated
  }

  // 3. Generate Data Points for the Chart
  // We want to show a range that includes the liquidation point plus some buffer.
  // Default to 50% drop, but extend if the portfolio is super safe (e.g. needs 80% drop).
  const maxAxis = Math.max(50, Math.ceil(dropToLiq / 10) * 10 + 10);
  const data = [];
  const steps = 20; // Number of points on graph
  
  for (let i = 0; i <= steps; i++) {
      const dropPct = (i / steps) * maxAxis;
      const factor = 1 - (dropPct / 100);
      // HF = (Collateral * factor) / Debt
      const simHealth = (collateral * factor) / debt;
      
      data.push({
          drop: dropPct,
          health: Math.max(0, simHealth),
          threshold: 1.0
      });
  }

  const isLiquidated = currentHealth < 1;
  const dangerZone = currentHealth < 1.1;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        {/* Header: The "At A Glance" Metric */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Liquidation Tolerance</h3>
                <div className="flex items-center gap-3">
                    {isLiquidated ? (
                        <span className="text-3xl font-bold text-danger animate-pulse">LIQUIDATING</span>
                    ) : (
                        <>
                            <span className={`text-4xl font-bold font-mono ${dropToLiq < 10 ? 'text-danger' : dropToLiq < 25 ? 'text-warning' : 'text-emerald-400'}`}>
                                -{dropToLiq.toFixed(1)}%
                            </span>
                            <div className="flex flex-col justify-center">
                                <span className="text-sm text-textMain font-medium">Market Drop</span>
                                <span className="text-xs text-textMuted">until liquidation</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* The Chart */}
        <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={dangerZone ? '#ef4444' : '#3b82f6'} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={dangerZone ? '#ef4444' : '#3b82f6'} stopOpacity={0}/>
                </linearGradient>
                </defs>
                
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                
                <XAxis 
                    dataKey="drop" 
                    type="number"
                    domain={[0, maxAxis]}
                    tick={{ fill: '#71717a', fontSize: 10 }} 
                    tickFormatter={(val) => `-${Math.round(val)}%`}
                    axisLine={{ stroke: '#27272a' }}
                    tickLine={false}
                />
                
                <YAxis 
                    dataKey="health"
                    hide={false} 
                    tick={{ fill: '#71717a', fontSize: 10 }}
                    domain={[0, (data[0].health * 1.1)]}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                />
                
                <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: number) => [val.toFixed(2), "Health Factor"]}
                    labelFormatter={(val) => `Market Drop: -${Number(val).toFixed(1)}%`}
                    cursor={{ stroke: '#52525b', strokeWidth: 1 }}
                />
                
                <ReferenceLine 
                    y={1} 
                    stroke="#ef4444" 
                    strokeWidth={1} 
                    strokeDasharray="4 4" 
                    label={{ value: 'Liquidation (1.0)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight', dy: -10 }} 
                />
                
                {!isLiquidated && (
                    <ReferenceLine 
                        x={dropToLiq} 
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        label={{ value: 'TRIGGER', fill: '#f59e0b', fontSize: 10, position: 'top' }} 
                    />
                )}

                <Area 
                    type="monotone" 
                    dataKey="health" 
                    name="Health Factor"
                    stroke={dangerZone ? '#ef4444' : '#3b82f6'} 
                    fill="url(#colorHealth)" 
                    strokeWidth={2} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
            </ComposedChart>
            </ResponsiveContainer>
        </div>
        
        <p className="text-[10px] text-zinc-500 mt-4 text-center">
            Scenario assumes a uniform price drop across all collateral assets while debt value remains constant.
        </p>
    </div>
  );
};

export const CompositionChart: React.FC<{ supplies: any[], borrows: any[] }> = ({ supplies, borrows }) => {
    // Sort by value to find top assets
    const sortedSupplies = [...supplies].sort((a, b) => b.currentValue - a.currentValue);
    const topSupplies = sortedSupplies.slice(4);
    const otherSupplyVal = sortedSupplies.slice(4).reduce((acc, c) => acc + c.currentValue, 0);
    
    // Actually show top 4
    const finalTopSupplies = sortedSupplies.slice(0, 4);
    
    const displayData = [
        ...finalTopSupplies.map(s => ({ name: s.symbol, value: s.currentValue })),
        ...(otherSupplyVal > 0 ? [{ name: 'Others', value: otherSupplyVal }] : []),
    ];

    const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#64748b'];

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-6">Collateral Composition</h3>
            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={60} 
                            tick={{fontSize: 11, fill: '#e4e4e7', fontWeight: 500}} 
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip 
                            cursor={{fill: '#27272a', radius: 4}}
                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', fontSize: '12px', borderRadius: '8px' }}
                            formatter={(val: number) => `$${val.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
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
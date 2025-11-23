import React from 'react';
import { SimulationState, Position } from '../types';
import { RefreshCw, PlayCircle } from 'lucide-react';
import { TOKEN_LOGOS } from '../constants';

interface ScenarioSimulatorProps {
  simulation: SimulationState;
  onUpdate: (sim: SimulationState) => void;
  positions: Position[];
  isolatedMarkets?: { id: string; name: string }[];
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ simulation, onUpdate, positions, isolatedMarkets = [] }) => {
  
  const handleGlobalChange = (val: number) => {
    onUpdate({ ...simulation, globalShock: val });
  };

  // Update shocks using Composite Key: "Group:Symbol"
  const handleAssetChange = (group: string, symbol: string, val: number) => {
    const compositeKey = `${group}:${symbol}`;
    onUpdate({ 
      ...simulation, 
      assetShocks: { ...simulation.assetShocks, [compositeKey]: val } 
    });
  };

  const resetSim = () => {
    onUpdate({ globalShock: 0, assetShocks: {} });
  };

  const setGlobalPreset = (val: number) => {
    handleGlobalChange(val);
  };

  const formatPrice = (val: number) => {
    return '$' + val.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 6 
    });
  };

  // Get all unique groups present in the positions, plus Core
  const groups = ['core', ...isolatedMarkets.map(m => m.id)];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/30">
                        <PlayCircle className="text-indigo-400 w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Price Simulation</h3>
            </div>
            <button 
                onClick={resetSim}
                className="text-sm flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 px-3 py-1.5 rounded-full border border-zinc-700/50 hover:bg-zinc-700"
            >
                <RefreshCw size={14} /> Reset
            </button>
        </div>

        <div className="mb-10">
            <label className="block text-lg font-medium text-textMain mb-4 flex justify-between">
                <span>Global Market Shock</span>
                <span className={`font-mono font-bold ${simulation.globalShock < 0 ? 'text-danger' : 'text-success'}`}>
                    {simulation.globalShock > 0 ? '+' : ''}{(simulation.globalShock * 100).toFixed(0)}%
                </span>
            </label>
            <input
                type="range"
                min="-0.95"
                max="1.00"
                step="0.01"
                value={simulation.globalShock}
                onChange={(e) => handleGlobalChange(parseFloat(e.target.value))}
                className="w-full h-3 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-4"
            />
            <div className="flex gap-3 justify-between">
                {[-0.1, -0.25, -0.5, -0.75].map(val => (
                    <button
                        key={val}
                        onClick={() => setGlobalPreset(val)}
                        className="flex-1 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 text-zinc-300 transition-colors font-medium"
                    >
                        {val * 100}%
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-6">
            {groups.map(groupId => {
                // Filter positions for this group
                const groupPositions = positions.filter(p => (p.isolationGroup || 'core') === groupId);
                if (groupPositions.length === 0) return null;

                // Dedup assets in this group
                const uniqueAssets = Array.from(new Set(groupPositions.map(p => p.symbol)))
                    .map(symbol => groupPositions.find(p => p.symbol === symbol)!)
                    .filter(a => !a.isStable)
                    .sort((a, b) => b.basePrice - a.basePrice);

                if (uniqueAssets.length === 0) return null;

                const groupName = groupId === 'core' ? 'Core Market' : isolatedMarkets.find(m => m.id === groupId)?.name || 'Isolated Market';

                return (
                    <div key={groupId} className="border-t border-zinc-800 pt-5 first:border-0 first:pt-0">
                        <h4 className="text-sm uppercase text-indigo-400 font-bold mb-4 tracking-wider flex items-center gap-2">
                            {groupName}
                            {groupId !== 'core' && <span className="text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-300 border border-indigo-500/20">Isolated</span>}
                        </h4>
                        
                        <div className="space-y-4">
                            {uniqueAssets.map(asset => {
                                const compositeKey = `${groupId}:${asset.symbol}`;
                                const currentShock = simulation.assetShocks[compositeKey] || 0;
                                const baseP = asset.basePrice;
                                const globalMult = 1 + simulation.globalShock;
                                const assetMult = 1 + currentShock;
                                const finalP = baseP * globalMult * assetMult;

                                return (
                                    <div key={compositeKey} className="bg-zinc-950/60 p-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors shadow-inner">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-3">
                                                {TOKEN_LOGOS[asset.symbol] ? (
                                                    <img src={TOKEN_LOGOS[asset.symbol]} alt={asset.symbol} className="w-6 h-6 rounded-full" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-zinc-800"></div>
                                                )}
                                                <span className="font-bold text-textMain text-lg">{asset.symbol}</span>
                                            </div>
                                            <div className="flex gap-2 items-center text-sm md:text-base">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-zinc-500 text-[10px] uppercase font-medium">Simulated Price</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-zinc-500 line-through decoration-zinc-600/50">{formatPrice(baseP)}</span>
                                                        <span className="text-zinc-600 text-xs">→</span>
                                                        <span className="text-white font-bold font-mono">{formatPrice(finalP)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range"
                                                min="-0.95"
                                                max="1.00"
                                                step="0.05"
                                                value={currentShock}
                                                onChange={(e) => handleAssetChange(groupId, asset.symbol, parseFloat(e.target.value))}
                                                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                            <span className={`text-base w-14 text-right font-mono ${currentShock !== 0 ? 'text-indigo-400' : 'text-zinc-500'}`}>
                                                {currentShock > 0 ? '+' : ''}{(currentShock * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {positions.filter(p => !p.isStable).length === 0 && (
                <p className="text-base text-textMuted italic">Add non-stable assets to enable individual overrides.</p>
            )}
        </div>
    </div>
  );
};
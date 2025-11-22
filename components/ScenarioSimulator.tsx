import React from 'react';
import { SimulationState, Position } from '../types';
import { RefreshCw, PlayCircle } from 'lucide-react';

interface ScenarioSimulatorProps {
  simulation: SimulationState;
  onUpdate: (sim: SimulationState) => void;
  positions: Position[];
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ simulation, onUpdate, positions }) => {
  
  const handleGlobalChange = (val: number) => {
    onUpdate({ ...simulation, globalShock: val });
  };

  const handleAssetChange = (id: string, val: number) => {
    onUpdate({ 
      ...simulation, 
      assetShocks: { ...simulation.assetShocks, [id]: val } 
    });
  };

  const resetSim = () => {
    onUpdate({ globalShock: 0, assetShocks: {} });
  };

  const setGlobalPreset = (val: number) => {
    handleGlobalChange(val);
  };

  const formatPrice = (val: number) => {
    // Use toLocaleString to automatically drop trailing zeros while keeping precision for small numbers
    return '$' + val.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 6 
    });
  };

  // Dedup assets for individual sliders
  const uniqueAssets = Array.from(new Set(positions.map(p => p.symbol)))
    .map(symbol => positions.find(p => p.symbol === symbol)!);

  return (
    <div className="bg-surface rounded-xl border border-surfaceHighlight p-6">
       <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            <PlayCircle className="text-primary w-7 h-7" />
            <h3 className="text-xl font-semibold text-textMain">Price Simulation</h3>
        </div>
        <button 
            onClick={resetSim}
            className="text-base flex items-center gap-1.5 text-textMuted hover:text-primary transition-colors"
        >
            <RefreshCw size={16} /> Reset
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
            className="w-full h-3 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-primary mb-4"
        />
        <div className="flex gap-3 justify-between">
            {[-0.1, -0.25, -0.5, -0.75].map(val => (
                <button
                    key={val}
                    onClick={() => setGlobalPreset(val)}
                    className="flex-1 py-2 text-base bg-surfaceHighlight hover:bg-zinc-700 rounded text-textMuted transition-colors font-medium"
                >
                    {val * 100}%
                </button>
            ))}
        </div>
      </div>

      <div className="space-y-5">
        <h4 className="text-base uppercase text-textMuted font-semibold">Individual Asset Override</h4>
        {uniqueAssets.filter(a => !a.isStable).map(asset => {
            const currentShock = simulation.assetShocks[asset.id] || 0;
            // Effective price calc for display
            const baseP = asset.basePrice;
            const globalMult = 1 + simulation.globalShock;
            const assetMult = 1 + currentShock;
            const finalP = baseP * globalMult * assetMult;

            return (
                <div key={asset.id} className="bg-zinc-950/30 p-5 rounded-lg border border-zinc-800/50">
                    <div className="flex justify-between text-base mb-3">
                        <span className="font-bold text-textMain">{asset.symbol}</span>
                        <div className="flex gap-4">
                            <span className="text-textMuted line-through">{formatPrice(baseP)}</span>
                            <span className="text-textMain font-mono">{formatPrice(finalP)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="-0.95"
                            max="1.00"
                            step="0.05"
                            value={currentShock}
                            onChange={(e) => handleAssetChange(asset.id, parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <span className={`text-base w-14 text-right font-mono ${currentShock !== 0 ? 'text-indigo-400' : 'text-textMuted'}`}>
                            {currentShock > 0 ? '+' : ''}{(currentShock * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            );
        })}
        {uniqueAssets.filter(a => !a.isStable).length === 0 && (
             <p className="text-base text-textMuted italic">Add non-stable assets to enable individual overrides.</p>
        )}
      </div>
    </div>
  );
};
import React from 'react';
import { RiskParameters, Position } from '../types';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';
import { INITIAL_RISK_PARAMS } from '../constants';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  riskParams: RiskParameters;
  onRiskChange: (params: RiskParameters) => void;
  positions: Position[];
  onPositionUpdate: (updated: Position[]) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
    isOpen, onClose, riskParams, onRiskChange, positions, onPositionUpdate 
}) => {
  if (!isOpen) return null;

  const handleRiskChange = (field: keyof RiskParameters, value: number) => {
    onRiskChange({ ...riskParams, [field]: value });
  };

  const handleAssetCFChange = (id: string, val: number) => {
      onPositionUpdate(positions.map(p => p.id === id ? { ...p, collateralFactor: val / 100 } : p));
  };

  const supplyPositions = positions.filter(p => p.type === 'supply');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">Simulation Settings</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
                <X size={24} />
            </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Section 1: Global Risk Params */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-zinc-200 flex items-center gap-2">
                        Global Risk Parameters
                        <AlertTriangle size={16} className="text-amber-500" />
                    </h3>
                    <button 
                        onClick={() => onRiskChange(INITIAL_RISK_PARAMS)}
                        className="text-sm text-zinc-500 hover:text-primary flex items-center gap-1"
                    >
                        <RotateCcw size={14} /> Reset Default
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/30 p-5 rounded-xl border border-zinc-800/50">
                    <div>
                        <label className="flex justify-between text-sm text-zinc-400 mb-2">
                            Close Factor
                            <span className="text-white font-mono">{(riskParams.closeFactor * 100).toFixed(0)}%</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={riskParams.closeFactor}
                            onChange={(e) => handleRiskChange('closeFactor', parseFloat(e.target.value))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                    <div>
                        <label className="flex justify-between text-sm text-zinc-400 mb-2">
                            Liquidation Incentive
                            <span className="text-white font-mono">{(riskParams.liquidationIncentive).toFixed(2)}x</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="1.2"
                            step="0.005"
                            value={riskParams.liquidationIncentive}
                            onChange={(e) => handleRiskChange('liquidationIncentive', parseFloat(e.target.value))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Collateral Factors */}
            <div>
                <h3 className="text-lg font-medium text-zinc-200 mb-4">Asset Collateral Factors</h3>
                <p className="text-sm text-zinc-500 mb-4">
                    Adjust the maximum loan-to-value ratio for each supplied asset. 
                    Higher values increase borrow power but also liquidation risk.
                </p>

                <div className="space-y-3">
                    {supplyPositions.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-white w-16">{p.symbol}</span>
                                {p.isCollateral ? (
                                    <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">Enabled</span>
                                ) : (
                                    <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">Disabled</span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 flex-1 justify-end max-w-[300px]">
                                <input
                                    type="range"
                                    min="0"
                                    max="0.95"
                                    step="0.01"
                                    disabled={!p.isCollateral}
                                    value={p.collateralFactor}
                                    onChange={(e) => handleAssetCFChange(p.id, parseFloat(e.target.value))}
                                    className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500 ${!p.isCollateral ? 'bg-zinc-800 accent-zinc-600' : 'bg-zinc-700'}`}
                                />
                                <span className={`font-mono w-12 text-right ${!p.isCollateral ? 'text-zinc-600' : 'text-indigo-400'}`}>
                                    {(p.collateralFactor * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    ))}
                    {supplyPositions.length === 0 && (
                        <p className="text-center text-zinc-500 italic py-4">No supplied assets to configure.</p>
                    )}
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};
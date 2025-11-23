import React, { useState, useRef } from 'react';
import { RiskParameters, Position, MarketContext } from '../types';
import { X, RotateCcw, AlertTriangle, Bot, Lock, Unlock, Send, Image as ImageIcon, Trash2 } from 'lucide-react';
import { INITIAL_RISK_PARAMS, PRESET_ASSETS } from '../constants';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  riskParams: RiskParameters;
  onRiskChange: (params: RiskParameters) => void;
  positions: Position[];
  onPositionUpdate: (updated: Position[]) => void;
  agentContext: MarketContext[];
  onContextUpdate: (ctx: MarketContext[]) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
    isOpen, onClose, riskParams, onRiskChange, positions, onPositionUpdate, agentContext, onContextUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'ai'>('simulation');
  
  // AI State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [newText, setNewText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // -- Handlers --
  const handleRiskChange = (field: keyof RiskParameters, value: number) => {
    onRiskChange({ ...riskParams, [field]: value });
  };

  const handleAssetCFChange = (id: string, val: number) => {
      onPositionUpdate(positions.map(p => p.id === id ? { ...p, collateralFactor: val } : p));
  };

  const handleResetCFs = () => {
      const updated = positions.map(p => {
          const preset = PRESET_ASSETS.find(a => a.symbol === p.symbol);
          return preset ? { ...p, collateralFactor: preset.cf } : p;
      });
      onPositionUpdate(updated);
  };
  
  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordInput === 'Scott321') {
          setIsAuthenticated(true);
          setPasswordInput('');
      } else {
          alert("Incorrect Password");
      }
  };

  const addTextContext = () => {
      if (!newText.trim()) return;
      const newItem: MarketContext = {
          id: Date.now().toString(),
          type: 'text',
          content: newText,
          timestamp: Date.now()
      };
      onContextUpdate([newItem, ...agentContext]);
      setNewText('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1]; 
          const newItem: MarketContext = {
              id: Date.now().toString(),
              type: 'image',
              content: base64Data,
              timestamp: Date.now()
          };
          onContextUpdate([newItem, ...agentContext]);
      };
      reader.readAsDataURL(file);
  };

  const removeContext = (id: string) => {
      onContextUpdate(agentContext.filter(i => i.id !== id));
  };

  const supplyPositions = positions.filter(p => p.type === 'supply');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-zinc-900 w-full max-w-2xl rounded-2xl border border-zinc-800 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
                <X size={24} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
            <button 
                onClick={() => setActiveTab('simulation')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'simulation' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
                Simulation
            </button>
            <button 
                onClick={() => setActiveTab('ai')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ai' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
                AI Intelligence
            </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* SIMULATION SETTINGS */}
            {activeTab === 'simulation' && (
                <>
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

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-zinc-200">Asset Collateral Factors</h3>
                            <button 
                                onClick={handleResetCFs}
                                className="text-sm text-zinc-500 hover:text-primary flex items-center gap-1"
                            >
                                <RotateCcw size={14} /> Reset Default
                            </button>
                        </div>
                        <p className="text-sm text-zinc-500 mb-4">
                            Adjust the maximum loan-to-value ratio for each supplied asset.
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
                        </div>
                    </div>
                </>
            )}

            {/* AI INTELLIGENCE */}
            {activeTab === 'ai' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-600/20 rounded-lg border border-indigo-500/50">
                            <Bot className="text-indigo-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">DeWell Analyst Feed</h3>
                            <p className="text-sm text-zinc-500">Provide insider context (emails, tweets) to influence the AI analysis.</p>
                        </div>
                    </div>

                    {!isAuthenticated ? (
                        <div className="bg-zinc-950 p-8 rounded-xl border border-zinc-800 text-center space-y-4">
                            <Lock size={32} className="mx-auto text-zinc-600" />
                            <h4 className="text-zinc-300 font-medium">Restricted Access</h4>
                            <p className="text-zinc-500 text-sm">Please authenticate to modify intelligence data.</p>
                            <form onSubmit={handleLogin} className="flex gap-2 justify-center mt-4">
                                <input 
                                    type="password" 
                                    value={passwordInput}
                                    onChange={e => setPasswordInput(e.target.value)}
                                    placeholder="Enter Password"
                                    className="bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none w-48"
                                />
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold">
                                    Unlock
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={newText}
                                    onChange={e => setNewText(e.target.value)}
                                    placeholder="Paste tweet / email / alpha..."
                                    className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                    onKeyDown={e => e.key === 'Enter' && addTextContext()}
                                />
                                <button onClick={addTextContext} className="px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 border border-zinc-700">
                                    <Send size={16} />
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 border border-zinc-700">
                                    <ImageIcon size={16} />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </div>

                            <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-2 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
                                {agentContext.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
                                        <Bot size={32} className="mb-2" />
                                        <p className="text-sm">No intelligence data added.</p>
                                    </div>
                                )}
                                {agentContext.map(item => (
                                    <div key={item.id} className="flex items-start gap-3 p-3 bg-zinc-900 mb-2 rounded-lg border border-zinc-800">
                                        <div className="mt-1 text-zinc-500">
                                            {item.type === 'text' ? <Bot size={16} /> : <ImageIcon size={16} />}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            {item.type === 'text' ? (
                                                <p className="text-sm text-zinc-300 break-words">{item.content}</p>
                                            ) : (
                                                <div className="h-20 w-20 rounded bg-zinc-800 overflow-hidden">
                                                    <img src={`data:image/png;base64,${item.content}`} alt="Context" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <span className="text-[10px] text-zinc-600 mt-1 block">{new Date(item.timestamp).toLocaleString()}</span>
                                        </div>
                                        <button onClick={() => removeContext(item.id)} className="text-zinc-600 hover:text-red-400 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
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
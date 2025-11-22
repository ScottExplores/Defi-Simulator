import React, { useState, useRef, useEffect } from 'react';
import { Position } from '../types';
import { PRESET_ASSETS, TOKEN_LOGOS } from '../constants';
import { Trash2, Plus, ChevronDown, Search } from 'lucide-react';

interface PortfolioTableProps {
  title: string;
  positions: Position[]; // Current filtered list
  type: 'supply' | 'borrow';
  group: string; // 'core' or isoId
  allPositions: Position[]; // Global state for updating
  setAllPositions: (pos: Position[]) => void;
  getPrice: (symbol: string) => number;
}

const FallbackLogo: React.FC<{ symbol: string }> = ({ symbol }) => (
    <div className="w-8 h-8 rounded-full bg-surfaceHighlight flex items-center justify-center text-[10px] font-bold text-textMuted border border-surfaceHighlight">
        {symbol.slice(0, 3)}
    </div>
);

// Custom Input Component to handle Commas
const FormattedNumberInput: React.FC<{ 
    value: number; 
    onChange: (val: number) => void; 
    className?: string;
    placeholder?: string; 
}> = ({ value, onChange, className, placeholder }) => {
    const [localVal, setLocalVal] = useState('');

    // Helper to add commas
    const format = (num: number | string) => {
        if (num === '' || num === 0 || num === undefined) return '';
        const parts = num.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    };

    // Sync local state with prop value when not editing or on mount
    useEffect(() => {
        setLocalVal(format(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Allow digits, commas, dots
        if (!/^[0-9.,]*$/.test(raw)) return;

        setLocalVal(raw);

        const clean = raw.replace(/,/g, '');
        const parsed = parseFloat(clean);
        
        if (!isNaN(parsed)) {
            onChange(parsed);
        } else {
            onChange(0);
        }
    };

    const handleBlur = () => {
        setLocalVal(format(value));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    return (
        <input
            type="text"
            value={localVal}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className={className}
            placeholder={placeholder}
        />
    );
};

export const PortfolioTable: React.FC<PortfolioTableProps> = ({ title, positions, type, group, allPositions, setAllPositions, getPrice }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = (preset?: typeof PRESET_ASSETS[0]) => {
    const price = preset ? getPrice(preset.symbol) : 0;
    const newPos: Position = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: preset ? preset.symbol : 'ASSET',
      amount: 0,
      basePrice: price,
      collateralFactor: preset ? preset.cf : (type === 'supply' ? 0.70 : 0),
      isCollateral: type === 'supply',
      isStable: preset ? preset.stable : false,
      type: type,
      marketType: group === 'core' ? 'core' : 'isolated',
      isolationGroup: group
    };
    setAllPositions([...allPositions, newPos]);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleRemove = (id: string) => {
    setAllPositions(allPositions.filter((p) => p.id !== id));
  };

  const handleChange = (id: string, field: keyof Position, value: any) => {
    setAllPositions(allPositions.map((p) => {
      if (p.id !== id) return p;
      return { ...p, [field]: value };
    }));
  };
  
  const filteredPresets = PRESET_ASSETS.filter(asset => 
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-surface rounded-xl border border-surfaceHighlight overflow-visible shadow-sm">
      <div className="px-5 py-4 border-b border-surfaceHighlight flex justify-between items-center bg-surfaceHighlight/20">
        <h2 className="text-base font-semibold text-textMain uppercase tracking-wide">{title}</h2>
        
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors font-medium border border-primary/20"
            >
                <Plus size={16} /> Add Asset <ChevronDown size={14} />
            </button>
            
            {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-surface border border-surfaceHighlight rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-surfaceHighlight sticky top-0 bg-surface z-10">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Search asset..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-surfaceHighlight text-base text-textMain pl-10 pr-3 py-2 rounded outline-none focus:ring-1 ring-primary/50"
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        <button 
                             onClick={() => handleAdd()} 
                             className="w-full text-left px-5 py-3 text-sm text-textMuted hover:bg-surfaceHighlight hover:text-primary transition-colors border-b border-surfaceHighlight/50"
                        >
                             + Empty Custom Asset
                        </button>
                        {filteredPresets.map(asset => (
                            <button
                                key={asset.symbol}
                                onClick={() => handleAdd(asset)}
                                className="w-full text-left px-5 py-2.5 text-base text-textMain hover:bg-surfaceHighlight transition-colors flex justify-between items-center"
                            >
                                <div className="flex items-center gap-3">
                                    {TOKEN_LOGOS[asset.symbol] ? (
                                        <img src={TOKEN_LOGOS[asset.symbol]} alt={asset.symbol} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-surfaceHighlight border border-zinc-700"></div>
                                    )}
                                    <span className="font-medium">{asset.symbol}</span>
                                </div>
                                {type === 'supply' && <span className="text-textMuted text-xs">CF: {(asset.cf * 100).toFixed(0)}%</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="text-xs text-textMuted uppercase bg-surfaceHighlight/30 tracking-wider">
            <tr>
              <th className="px-4 py-3 w-48 font-medium">Asset</th>
              <th className="px-4 py-3 text-right w-36 font-medium">Qty</th>
              <th className="px-4 py-3 text-right w-36 font-medium">Price</th>
              {type === 'supply' && (
                <th className="px-2 py-3 text-center w-16 font-medium" title="Enable Collateral">Collat.</th>
              )}
              <th className="px-4 py-3 text-right font-medium">Value</th>
              <th className="px-2 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surfaceHighlight/50">
            {positions.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-textMuted italic text-sm">
                        No assets. Click "Add Asset" to begin.
                    </td>
                </tr>
            )}
            {positions.map((pos) => {
              const value = pos.amount * pos.basePrice;
              return (
                <tr key={pos.id} className="hover:bg-surfaceHighlight/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                         {TOKEN_LOGOS[pos.symbol] || TOKEN_LOGOS[Object.keys(TOKEN_LOGOS).find(k => pos.symbol.includes(k)) || ''] ? (
                             <img 
                                src={TOKEN_LOGOS[pos.symbol] || TOKEN_LOGOS[Object.keys(TOKEN_LOGOS).find(k => pos.symbol.includes(k)) || '']} 
                                alt={pos.symbol} 
                                className="w-8 h-8 rounded-full bg-white/5 object-cover"
                             />
                         ) : (
                            <FallbackLogo symbol={pos.symbol} />
                         )}
                         <input
                            type="text"
                            value={pos.symbol}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleChange(pos.id, 'symbol', e.target.value)}
                            className="bg-transparent border-none outline-none w-24 text-textMain font-bold text-lg p-0 focus:ring-0"
                        />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                     <FormattedNumberInput
                        value={pos.amount}
                        onChange={(val) => handleChange(pos.id, 'amount', val)}
                        className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-primary outline-none text-textMain text-base font-mono text-right w-32 p-0 focus:ring-0"
                        placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                         <div className="flex items-center justify-end gap-1">
                            <span className="text-textMuted text-sm">$</span>
                            <FormattedNumberInput
                                value={pos.basePrice}
                                onChange={(val) => handleChange(pos.id, 'basePrice', val)}
                                className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-primary outline-none text-textMain text-base font-mono text-right w-24 p-0 focus:ring-0"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                  </td>
                  
                  {type === 'supply' && (
                    <td className="px-2 py-3 text-center">
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={pos.isCollateral} 
                            onChange={(e) => handleChange(pos.id, 'isCollateral', e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                        </label>
                    </td>
                  )}

                  <td className="px-4 py-3 text-right font-mono text-textMain text-lg">
                    ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button
                      onClick={() => handleRemove(pos.id)}
                      className="text-zinc-600 hover:text-red-500 p-2 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
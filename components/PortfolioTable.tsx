import React, { useState, useRef, useEffect } from 'react';
import { Position } from '../types';
import { PRESET_ASSETS } from '../constants';
import { Trash2, Plus, ChevronDown, Search, Settings2, Check } from 'lucide-react';

interface PortfolioTableProps {
  title: string;
  positions: Position[];
  onUpdate: (updated: Position[]) => void;
  type: 'supply' | 'borrow';
}

const TOKEN_LOGOS: Record<string, string> = {
    'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    'WETH': 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
    'USDC': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    'AERO': 'https://moonwell.fi/_next/static/media/aero.ab774409.svg',
    'WELL': 'https://assets.coingecko.com/coins/images/17570/small/moonwell.png',
    'VIRTUAL': 'https://assets.coingecko.com/coins/images/33276/small/virtual.png',
    'cbBTC': 'https://assets.coingecko.com/coins/images/39653/small/cbBTC.png',
    'cbETH': 'https://assets.coingecko.com/coins/images/26998/small/cbETH.png',
    'cbXRP': 'https://assets.coingecko.com/coins/images/53165/small/cbXRP.png',
    'DAI': 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
    'USDbC': 'https://assets.coingecko.com/coins/images/31166/small/USDbC.png',
    'USDS': 'https://assets.coingecko.com/coins/images/39652/small/sUSDS.png',
    'EURC': 'https://assets.coingecko.com/coins/images/26027/small/EURC.png',
    'wstETH': 'https://assets.coingecko.com/coins/images/12467/small/wstETH.png',
    'rETH': 'https://assets.coingecko.com/coins/images/20764/small/reth.png',
    'weETH': 'https://assets.coingecko.com/coins/images/33063/small/weETH.png',
    'wrsETH': 'https://assets.coingecko.com/coins/images/35315/small/wrsETH.png',
    'tBTC': 'https://assets.coingecko.com/coins/images/11224/small/tBTC.png',
    'LBTC': 'https://assets.coingecko.com/coins/images/39454/small/LBTC.png',
    'MORPHO': 'https://assets.coingecko.com/coins/images/20000/small/morpho.png',
    'MAMO': 'https://assets.coingecko.com/coins/images/36527/small/matr1x-fire.png',
};

const FallbackLogo: React.FC<{ symbol: string }> = ({ symbol }) => (
    <div className="w-8 h-8 rounded-full bg-surfaceHighlight flex items-center justify-center text-[10px] font-bold text-textMuted border border-surfaceHighlight">
        {symbol.slice(0, 3)}
    </div>
);

export const PortfolioTable: React.FC<PortfolioTableProps> = ({ title, positions, onUpdate, type }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [openMarketMenuId, setOpenMarketMenuId] = useState<string | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      // Close market menu if clicking outside
      if (openMarketMenuId && !(event.target as Element).closest('.market-menu-container')) {
          setOpenMarketMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMarketMenuId]);

  const handleAdd = (preset?: typeof PRESET_ASSETS[0]) => {
    const newPos: Position = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: preset ? preset.symbol : 'ASSET',
      amount: 0,
      basePrice: preset ? preset.price : 0,
      collateralFactor: preset ? preset.cf : (type === 'supply' ? 0.70 : 0),
      isCollateral: type === 'supply',
      isStable: preset ? preset.stable : false,
      type: type,
      marketType: 'core',
      isolationGroup: 'core'
    };
    onUpdate([...positions, newPos]);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  const handleRemove = (id: string) => {
    onUpdate(positions.filter((p) => p.id !== id));
  };

  const handleChange = (id: string, field: keyof Position, value: any) => {
    onUpdate(positions.map((p) => {
      if (p.id !== id) return p;
      return { ...p, [field]: value };
    }));
  };
  
  const handleMarketChange = (id: string, group: string) => {
      onUpdate(positions.map((p) => {
          if (p.id !== id) return p;
          const isCore = group === 'core';
          return { 
              ...p, 
              marketType: isCore ? 'core' : 'isolated',
              isolationGroup: group
          };
      }));
      setOpenMarketMenuId(null);
  };

  const filteredPresets = PRESET_ASSETS.filter(asset => 
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-surface rounded-xl border border-surfaceHighlight overflow-visible">
      <div className="px-5 py-4 border-b border-surfaceHighlight flex justify-between items-center bg-surfaceHighlight/30">
        <h2 className="text-xl font-semibold text-textMain">{title}</h2>
        
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-base bg-primary/20 text-primary hover:bg-primary/30 hover:text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
                <Plus size={18} /> Add Asset <ChevronDown size={18} />
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
                                className="w-full bg-surfaceHighlight text-base text-textMain pl-10 pr-3 py-2.5 rounded outline-none focus:ring-1 ring-primary/50"
                            />
                        </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                        <button 
                             onClick={() => handleAdd()} 
                             className="w-full text-left px-5 py-3.5 text-base text-textMuted hover:bg-surfaceHighlight hover:text-primary transition-colors border-b border-surfaceHighlight/50"
                        >
                             + Empty Custom Asset
                        </button>
                        {filteredPresets.map(asset => (
                            <button
                                key={asset.symbol}
                                onClick={() => handleAdd(asset)}
                                className="w-full text-left px-5 py-3 text-base text-textMain hover:bg-surfaceHighlight transition-colors flex justify-between items-center"
                            >
                                <div className="flex items-center gap-3">
                                    {TOKEN_LOGOS[asset.symbol] ? (
                                        <img src={TOKEN_LOGOS[asset.symbol]} alt={asset.symbol} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-surfaceHighlight border border-zinc-700"></div>
                                    )}
                                    <span className="font-bold">{asset.symbol}</span>
                                </div>
                                {type === 'supply' && <span className="text-textMuted text-sm">CF: {(asset.cf * 100).toFixed(0)}%</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead className="text-sm text-textMuted uppercase bg-surfaceHighlight/50 tracking-wider">
            <tr>
              <th className="px-4 py-4 w-48">Asset</th>
              <th className="px-4 py-4 text-right w-36">Qty</th>
              <th className="px-4 py-4 text-right w-36">Price</th>
              {type === 'supply' && (
                <th className="px-2 py-4 text-center w-20" title="Enable Collateral">Collateral</th>
              )}
              <th className="px-4 py-4 text-right">Value</th>
              <th className="px-2 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surfaceHighlight">
            {positions.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-textMuted italic text-base">
                        No assets. Click "Add Asset" to begin.
                    </td>
                </tr>
            )}
            {positions.map((pos) => {
              const value = pos.amount * pos.basePrice;
              const isMenuOpen = openMarketMenuId === pos.id;
              const displayGroup = pos.isolationGroup === 'core' ? 'Core' : pos.isolationGroup;
              
              return (
                <tr key={pos.id} className="hover:bg-surfaceHighlight/30 transition-colors group relative">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-3">
                         {TOKEN_LOGOS[pos.symbol] || TOKEN_LOGOS[Object.keys(TOKEN_LOGOS).find(k => pos.symbol.includes(k)) || ''] ? (
                             <img 
                                src={TOKEN_LOGOS[pos.symbol] || TOKEN_LOGOS[Object.keys(TOKEN_LOGOS).find(k => pos.symbol.includes(k)) || '']} 
                                alt={pos.symbol} 
                                className="w-8 h-8 rounded-full bg-white/5 object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                             />
                         ) : (
                            <FallbackLogo symbol={pos.symbol} />
                         )}
                         <div className="flex flex-col relative market-menu-container">
                             <input
                                type="text"
                                value={pos.symbol}
                                onChange={(e) => handleChange(pos.id, 'symbol', e.target.value)}
                                className="bg-transparent border-none outline-none w-24 text-textMain font-bold text-lg p-0 focus:ring-0"
                            />
                            {/* Market Toggle Badge */}
                            <button 
                                onClick={() => setOpenMarketMenuId(isMenuOpen ? null : pos.id)}
                                className={`text-xs px-1.5 py-0.5 rounded w-fit flex items-center gap-1 transition-colors ${
                                    pos.marketType === 'core' 
                                    ? 'bg-zinc-800 text-textMuted hover:bg-zinc-700 hover:text-white' 
                                    : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200'
                                }`}
                            >
                                {displayGroup} <Settings2 size={10} />
                            </button>

                            {/* Dropdown Menu for Market Selection */}
                            {isMenuOpen && (
                                <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-surfaceHighlight rounded-lg shadow-xl z-[60] overflow-hidden flex flex-col">
                                    <div className="px-3 py-2 text-xs text-textMuted uppercase font-bold bg-surfaceHighlight/50">
                                        Select Market
                                    </div>
                                    <button 
                                        onClick={() => handleMarketChange(pos.id, 'core')}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-surfaceHighlight flex items-center justify-between"
                                    >
                                        <span className="text-white">Core</span>
                                        {pos.isolationGroup === 'core' && <Check size={14} className="text-primary" />}
                                    </button>
                                    
                                    <div className="px-3 py-2 text-xs text-textMuted uppercase font-bold bg-surfaceHighlight/50 border-t border-surfaceHighlight">
                                        Isolated Pairs
                                    </div>
                                    {['Iso Pair 1', 'Iso Pair 2', 'Iso Pair 3'].map(iso => (
                                        <button 
                                            key={iso}
                                            onClick={() => handleMarketChange(pos.id, iso)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-surfaceHighlight flex items-center justify-between text-indigo-300"
                                        >
                                            <span>{iso}</span>
                                            {pos.isolationGroup === iso && <Check size={14} className="text-indigo-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                         </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right align-top pt-4">
                     <input
                        type="number"
                        min="0"
                        value={pos.amount}
                        onChange={(e) => handleChange(pos.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-primary outline-none text-textMain text-base font-mono text-right w-32 p-0"
                        placeholder="0.00"
                    />
                  </td>
                  <td className="px-4 py-3 text-right align-top pt-4">
                    <div className="flex flex-col items-end">
                         <div className="flex items-center justify-end gap-1">
                            <span className="text-textMuted text-sm">$</span>
                            <input
                                type="number"
                                min="0"
                                value={pos.basePrice}
                                onChange={(e) => handleChange(pos.id, 'basePrice', parseFloat(e.target.value) || 0)}
                                className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-primary outline-none text-textMain text-base font-mono text-right w-28 p-0"
                                placeholder="0.00"
                            />
                        </div>
                        <span className="text-xs text-textMuted mt-1">Oracle Price</span>
                    </div>
                  </td>
                  
                  {type === 'supply' && (
                    <td className="px-2 py-3 text-center align-top pt-4">
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={pos.isCollateral} 
                            onChange={(e) => handleChange(pos.id, 'isCollateral', e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success"></div>
                        </label>
                    </td>
                  )}

                  <td className="px-4 py-3 text-right font-mono text-textMain text-lg align-top pt-3">
                    ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-2 py-3 text-right align-top pt-3">
                    <button
                      onClick={() => handleRemove(pos.id)}
                      className="text-zinc-600 hover:text-danger p-2 rounded transition-colors opacity-0 group-hover:opacity-100"
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
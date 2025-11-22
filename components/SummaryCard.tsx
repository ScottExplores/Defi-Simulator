import React, { useState } from 'react';
import { AccountHealth } from '../types';
import { Info, ChevronDown } from 'lucide-react';

interface SummaryCardProps {
  health: AccountHealth;
  title?: string;
  variant?: 'default' | 'compact';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ health, title = "Your Portfolio", variant = 'default' }) => {
  const [showHealthFactor, setShowHealthFactor] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);

  // Calculations
  const creditLimit = health.totalCollateralValue;
  const totalBorrowed = health.totalDebtValue;
  const creditRemaining = Math.max(0, creditLimit - totalBorrowed);
  
  const creditUsagePct = creditLimit > 0 ? (totalBorrowed / creditLimit) * 100 : 0;
  const creditRemainingPct = 100 - creditUsagePct;

  let barColor = 'bg-emerald-500';
  let barColorBg = 'bg-emerald-900/20';
  if (creditRemainingPct < 25) {
      barColor = 'bg-red-500';
      barColorBg = 'bg-red-900/20';
  } else if (creditRemainingPct < 50) {
      barColor = 'bg-orange-500';
      barColorBg = 'bg-orange-900/20';
  }

  const barWidth = Math.max(0, Math.min(100, creditRemainingPct));

  if (variant === 'compact') {
      return (
        <div className="w-full mb-6 border border-indigo-900/30 bg-indigo-950/10 rounded-xl p-6">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium text-indigo-200">{title}</h3>
                <span className="text-sm px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded">Isolated Market</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                 <div>
                    <div className="text-xs font-medium text-zinc-500 uppercase">Supplied</div>
                    <div className="text-lg font-medium text-white">{formatCurrency(health.totalSupplyValue)}</div>
                 </div>
                 <div>
                    <div className="text-xs font-medium text-zinc-500 uppercase">Borrowed</div>
                    <div className="text-lg font-medium text-white">{formatCurrency(health.totalDebtValue)}</div>
                 </div>
                 <div>
                    <div className="text-xs font-medium text-zinc-500 uppercase">Credit Limit</div>
                    <div className="text-lg font-medium text-white">{formatCurrency(creditLimit)}</div>
                 </div>
                 <div>
                     <div className="text-xs font-medium text-zinc-500 uppercase">Health</div>
                     <div className={`text-lg font-mono font-bold ${health.healthFactor < 1.1 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {health.healthFactor > 100 ? '∞' : health.healthFactor.toFixed(2)}
                     </div>
                 </div>
            </div>
            {/* Mini Progress */}
            <div className={`w-full h-1.5 rounded-full ${barColorBg} overflow-hidden`}>
                <div 
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${barWidth}%` }}
                ></div>
            </div>
        </div>
      );
  }

  return (
    <div className="w-full mb-8">
        {/* Header Row */}
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-normal text-white tracking-tight">{title}</h2>
            
            <button className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-800 transition-colors">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <span>Base</span>
                <ChevronDown size={14} className="text-zinc-500" />
            </button>
        </div>

        {/* Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-8 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
                <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1">Total Supplied</div>
                    <div className="text-2xl md:text-3xl font-medium text-white tracking-tight">
                        {formatCurrency(health.totalSupplyValue)}
                    </div>
                </div>
                <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1">Total Borrowed</div>
                    <div className="text-2xl md:text-3xl font-medium text-white tracking-tight">
                        {formatCurrency(health.totalDebtValue)}
                    </div>
                </div>
                <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1">Credit Limit</div>
                    <div className="text-2xl md:text-3xl font-medium text-white tracking-tight">
                        {formatCurrency(creditLimit)}
                    </div>
                </div>
                <div>
                    <div className="text-sm font-medium text-zinc-500 mb-1">Credit Remaining</div>
                    <div className="text-2xl md:text-3xl font-medium text-white tracking-tight">
                        {formatCurrency(creditRemaining)}
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            <div>
                <div 
                    className="flex items-center gap-2 mb-2 cursor-pointer group w-fit"
                    onClick={() => setShowHealthFactor(!showHealthFactor)}
                >
                    <Info size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                    <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition-colors select-none">
                        {showHealthFactor ? 'Health Factor' : 'Credit Remaining'}: 
                        <span className={`ml-1 ${creditRemainingPct < 25 ? 'text-red-400' : 'text-orange-400'}`}>
                            {showHealthFactor 
                                ? (health.healthFactor > 100 ? '∞' : health.healthFactor.toFixed(2))
                                : `${creditRemainingPct.toFixed(1)}%`
                            }
                        </span>
                    </span>
                </div>
                
                <div className={`w-full h-3 rounded-full ${barColorBg} overflow-hidden`}>
                    <div 
                        className={`h-full rounded-full ${barColor} transition-all duration-500 ease-out shadow-[0_0_10px_rgba(249,115,22,0.3)]`}
                        style={{ width: `${barWidth}%` }}
                    ></div>
                </div>
            </div>
        </div>
    </div>
  );
};
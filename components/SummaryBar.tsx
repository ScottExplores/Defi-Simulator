import React from 'react';
import { AccountHealth } from '../types';
import { AlertTriangle, ShieldCheck, Skull } from 'lucide-react';

interface SummaryBarProps {
  health: AccountHealth;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({ health }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  let healthColor = 'text-success';
  let healthIcon = <ShieldCheck className="w-7 h-7 mr-2" />;
  let healthStatus = 'Safe';
  let progressBarColor = 'bg-success';

  if (health.healthFactor < 1.0) {
    healthColor = 'text-danger';
    healthIcon = <Skull className="w-7 h-7 mr-2" />;
    healthStatus = 'Liquidatable';
    progressBarColor = 'bg-danger';
  } else if (health.healthFactor < 1.15) {
    healthColor = 'text-danger';
    healthIcon = <AlertTriangle className="w-7 h-7 mr-2" />;
    healthStatus = 'Danger';
    progressBarColor = 'bg-danger';
  } else if (health.healthFactor < 1.5) {
    healthColor = 'text-warning';
    healthIcon = <AlertTriangle className="w-7 h-7 mr-2" />;
    healthStatus = 'Risk';
    progressBarColor = 'bg-warning';
  }

  // Calculate progress for the bar (clamped 0 to 100)
  // Visualize Debt / BorrowPower. If Debt > BP, it's 100% full (and overflowing conceptually)
  const utilization = health.totalCollateralValue > 0 
    ? (health.totalDebtValue / health.totalCollateralValue) * 100 
    : 0;

  return (
    <div className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-surfaceHighlight shadow-lg px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full md:w-auto">
          <div>
            <div className="text-sm text-textMuted uppercase tracking-wider mb-1.5">Total Supplied</div>
            <div className="text-3xl font-bold text-textMain">{formatCurrency(health.totalSupplyValue)}</div>
          </div>
          <div>
            <div className="text-sm text-textMuted uppercase tracking-wider mb-1.5">Total Borrowed</div>
            <div className="text-3xl font-bold text-textMain">{formatCurrency(health.totalDebtValue)}</div>
          </div>
          <div>
            <div className="text-sm text-textMuted uppercase tracking-wider mb-1.5">Borrow Power</div>
            <div className="text-3xl font-bold text-textMain">{formatCurrency(health.totalCollateralValue)}</div>
          </div>
          <div>
            <div className="text-sm text-textMuted uppercase tracking-wider mb-1.5">Remaining Credit</div>
            <div className="text-3xl font-bold text-textMain">
              {formatCurrency(Math.max(0, health.totalCollateralValue - health.totalDebtValue))}
            </div>
          </div>
        </div>

        {/* Health Indicator */}
        <div className="flex flex-col min-w-[280px]">
          <div className="flex justify-between items-end mb-2">
            <span className="text-base text-textMuted uppercase">Health Factor</span>
            <div className={`flex items-center font-mono font-bold text-4xl ${healthColor}`}>
              {healthIcon}
              {health.healthFactor > 100 ? '∞' : health.healthFactor.toFixed(2)}
            </div>
          </div>
          <div className="w-full bg-surfaceHighlight rounded-full h-5 overflow-hidden relative border border-surfaceHighlight">
            <div 
              className={`h-full transition-all duration-300 ${progressBarColor}`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
             <span className="text-xs text-textMuted">0%</span>
             <span className={`text-xs font-bold ${healthColor} uppercase tracking-wider`}>{healthStatus}</span>
             <span className="text-xs text-textMuted">100% Util</span>
          </div>
        </div>

      </div>
    </div>
  );
};
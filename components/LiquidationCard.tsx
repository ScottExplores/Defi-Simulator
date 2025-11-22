import React from 'react';
import { LiquidationScenario, AccountHealth } from '../types';
import { AlertOctagon, ArrowRight } from 'lucide-react';

interface LiquidationCardProps {
  scenario: LiquidationScenario | null;
  health: AccountHealth;
  isLiquidatable: boolean;
}

export const LiquidationCard: React.FC<LiquidationCardProps> = ({ scenario, health, isLiquidatable }) => {
  const formatTokenAmount = (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });

  if (!scenario) return null;

  // Render a "safe" state or "at risk" state differently if not actually liquidatable
  if (!isLiquidatable) {
     return (
        <div className="bg-surface rounded-xl border border-surfaceHighlight p-6 h-full flex flex-col justify-center items-center text-center opacity-60 min-h-[300px]">
            <div className="bg-success/10 p-5 rounded-full mb-4">
                <ShieldIcon className="text-success w-10 h-10" />
            </div>
            <h3 className="text-2xl font-semibold text-textMain">Account Safe</h3>
            <p className="text-lg text-textMuted mt-3">
                Current Health Factor: <span className="text-success font-mono font-bold">{health.healthFactor.toFixed(2)}</span>
            </p>
            <p className="text-base text-textMuted mt-2">Liquidation occurs when Health Factor &lt; 1.0</p>
        </div>
     );
  }

  return (
    <div className="bg-danger/5 rounded-xl border border-danger/30 p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-danger"></div>
      
      <div className="flex items-start gap-4 mb-8">
        <AlertOctagon className="text-danger w-9 h-9 shrink-0 mt-1" />
        <div>
            <h3 className="text-2xl font-bold text-textMain">Liquidation Triggered</h3>
            <p className="text-lg text-textMuted mt-1">
                This account is eligible for liquidation. Below is a simulation of a single close-factor repayment.
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface p-5 rounded-lg border border-surfaceHighlight">
            <span className="text-base uppercase text-textMuted font-medium">Max Debt Repaid</span>
            <div className="text-3xl font-bold text-textMain font-mono mt-1">
                ${scenario.maxRepayAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-surfaceHighlight">
            <span className="text-base uppercase text-textMuted font-medium">Collateral Seized</span>
            <div className="text-3xl font-bold text-danger font-mono mt-1">
                ${scenario.seizedCollateralUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center text-lg mb-3">
            <span className="text-textMuted font-medium">Health Impact</span>
            <div className="flex items-center gap-3 font-mono font-bold text-xl">
                <span className="text-danger">{health.healthFactor.toFixed(2)}</span>
                <ArrowRight size={24} className="text-textMuted" />
                <span className={scenario.postLiquidationHealth >= 1 ? 'text-success' : 'text-warning'}>
                    {scenario.postLiquidationHealth.toFixed(2)}
                </span>
            </div>
        </div>
        <div className="w-full bg-zinc-800 h-4 rounded-full overflow-hidden">
            <div 
                className="bg-danger h-full" 
                style={{ width: `${Math.min(100, health.healthFactor * 50)}%` }}
            ></div>
        </div>
      </div>

      <div>
        <h4 className="text-sm uppercase text-textMuted font-bold mb-4 border-b border-surfaceHighlight pb-3">Seized Assets (Estimated)</h4>
        <div className="space-y-3">
            {scenario.seizedBreakdown.map((item) => (
                <div key={item.symbol} className="flex justify-between text-base md:text-lg">
                    <span className="text-textMain">{formatTokenAmount(item.amount)} <span className="text-textMuted">{item.symbol}</span></span>
                    <span className="font-mono text-danger">-${item.valueUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
            ))}
            {scenario.seizedBreakdown.length === 0 && (
                <p className="text-base text-textMuted italic">Insufficient collateral to seize.</p>
            )}
        </div>
      </div>
    </div>
  );
};

const ShieldIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);
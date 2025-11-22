import React from 'react';
import { RiskParameters } from '../types';
import { RotateCcw } from 'lucide-react';
import { INITIAL_RISK_PARAMS } from '../constants';

interface RiskControlsProps {
  params: RiskParameters;
  onChange: (params: RiskParameters) => void;
}

export const RiskControls: React.FC<RiskControlsProps> = ({ params, onChange }) => {
  const handleChange = (field: keyof RiskParameters, value: number) => {
    onChange({ ...params, [field]: value });
  };

  return (
    <div className="bg-surface rounded-xl border border-surfaceHighlight p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-textMain">Risk Parameters</h3>
        <button 
            onClick={() => onChange(INITIAL_RISK_PARAMS)}
            className="text-base flex items-center gap-1.5 text-textMuted hover:text-primary transition-colors"
        >
            <RotateCcw size={16} /> Reset
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <label className="block text-base uppercase text-textMuted mb-4 flex justify-between font-medium">
            <span>Close Factor</span>
            <span className="text-textMain font-mono">{(params.closeFactor * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={params.closeFactor}
            onChange={(e) => handleChange('closeFactor', parseFloat(e.target.value))}
            className="w-full h-2.5 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <p className="text-sm text-textMuted mt-3">
            Max % of a borrower's liquidatable debt that can be repaid in a single transaction.
          </p>
        </div>

        <div>
          <label className="block text-base uppercase text-textMuted mb-4 flex justify-between font-medium">
            <span>Liquidation Incentive</span>
            <span className="text-textMain font-mono">{(params.liquidationIncentive).toFixed(2)}x</span>
          </label>
          <input
            type="range"
            min="1"
            max="1.2"
            step="0.005"
            value={params.liquidationIncentive}
            onChange={(e) => handleChange('liquidationIncentive', parseFloat(e.target.value))}
            className="w-full h-2.5 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <p className="text-sm text-textMuted mt-3">
            Bonus collateral (penalty) paid to liquidators. 1.08 = 8% bonus.
          </p>
        </div>
      </div>
    </div>
  );
};
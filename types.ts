
export interface RiskParameters {
  closeFactor: number; // 0 to 1
  liquidationIncentive: number; // e.g., 1.08 for 8%
}

export interface Position {
  id: string;
  symbol: string;
  amount: number;
  basePrice: number; // The reference price before shock
  collateralFactor: number; // 0 to 1
  isCollateral: boolean;
  isStable: boolean; // If true, price shocks don't affect it by default
  type: 'supply' | 'borrow';
  marketType: 'core' | 'isolated';
  isolationGroup?: string; // e.g., "Iso Pair 1", "Iso Pair 2"
}

export interface SimulationState {
  globalShock: number; // Percentage, e.g., -0.10 for -10%
  assetShocks: Record<string, number>; // ID -> Percentage
}

export interface AccountHealth {
  groupName: string;
  totalSupplyValue: number;
  totalCollateralValue: number; // Borrow capacity
  totalDebtValue: number;
  healthFactor: number; // (Collateral / Debt)
  liquidationThreshold: number; // 1.0 usually
  loanToValue: number; // Debt / Supply
}

export interface SimulationResult {
  simulatedPositions: Array<Position & { currentPrice: number; currentValue: number; currentBorrowPower: number }>;
  health: AccountHealth;
  liquidationScenario: LiquidationScenario | null;
}

export interface LiquidationScenario {
  maxRepayAmount: number; // USD value
  seizedCollateralUSD: number;
  postLiquidationHealth: number;
  seizedBreakdown: Array<{ symbol: string; amount: number; valueUSD: number }>;
}

export interface MarketContext {
  id: string;
  type: 'text' | 'image';
  content: string;
  timestamp: number;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
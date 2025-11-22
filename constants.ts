import { Position, RiskParameters } from './types';

export const INITIAL_RISK_PARAMS: RiskParameters = {
  closeFactor: 0.5,
  liquidationIncentive: 1.08,
};

export const INITIAL_SUPPLIED: Position[] = [
  {
    id: 'eth-supply',
    symbol: 'ETH',
    amount: 17.18,
    basePrice: 2700,
    collateralFactor: 0.84,
    isCollateral: true,
    isStable: false,
    type: 'supply',
    marketType: 'core',
    isolationGroup: 'core'
  },
  {
    id: 'aero-supply',
    symbol: 'AERO',
    amount: 49341.72,
    basePrice: 0.66,
    collateralFactor: 0.65,
    isCollateral: true,
    isStable: false,
    type: 'supply',
    marketType: 'core',
    isolationGroup: 'core'
  },
  {
    id: 'cbxrp-supply',
    symbol: 'cbXRP',
    amount: 10021.31,
    basePrice: 1.93,
    collateralFactor: 0.74,
    isCollateral: true,
    isStable: false,
    type: 'supply',
    marketType: 'core',
    isolationGroup: 'core'
  },
  {
    id: 'mamo-supply',
    symbol: 'MAMO',
    amount: 547959.27,
    basePrice: 0.022, 
    collateralFactor: 0.50,
    isCollateral: true,
    isStable: false,
    type: 'supply',
    marketType: 'core',
    isolationGroup: 'core'
  },
  {
    id: 'well-supply',
    symbol: 'WELL',
    amount: 1000933.38,
    basePrice: 0.008,
    collateralFactor: 0.65,
    isCollateral: true,
    isStable: false,
    type: 'supply',
    marketType: 'core',
    isolationGroup: 'core'
  },
  {
    id: 'virtual-supply',
    symbol: 'VIRTUAL',
    amount: 5269.03,
    basePrice: 0.90,
    collateralFactor: 0.65,
    isCollateral: true,
    isStable: false,
    type: 'supply',
    marketType: 'core',
    isolationGroup: 'core'
  },
];

export const INITIAL_BORROWED: Position[] = [
  {
    id: 'usdc-borrow',
    symbol: 'USDC',
    amount: 52068.17,
    basePrice: 1.0,
    collateralFactor: 0, // Not relevant for borrow
    isCollateral: false,
    isStable: true,
    type: 'borrow',
    marketType: 'core',
    isolationGroup: 'core'
  },
];

// Based on the provided image
export const PRESET_ASSETS = [
  { symbol: 'USDC', price: 1.0, cf: 0.88, stable: true },
  { symbol: 'ETH', price: 2700, cf: 0.84, stable: false },
  { symbol: 'cbBTC', price: 95000, cf: 0.85, stable: false },
  { symbol: 'cbETH', price: 2800, cf: 0.81, stable: false },
  { symbol: 'USDS', price: 1.0, cf: 0.83, stable: true },
  { symbol: 'EURC', price: 1.05, cf: 0.83, stable: true },
  { symbol: 'DAI', price: 1.0, cf: 0.50, stable: true },
  { symbol: 'USDbC', price: 1.0, cf: 0.69, stable: true },
  { symbol: 'wstETH', price: 3000, cf: 0.81, stable: false },
  { symbol: 'rETH', price: 2900, cf: 0.78, stable: false },
  { symbol: 'weETH', price: 2900, cf: 0.75, stable: false },
  { symbol: 'wrsETH', price: 2900, cf: 0.74, stable: false },
  { symbol: 'tBTC', price: 95000, cf: 0.85, stable: false },
  { symbol: 'LBTC', price: 95000, cf: 0.85, stable: false },
  { symbol: 'AERO', price: 0.66, cf: 0.65, stable: false },
  { symbol: 'WELL', price: 0.008, cf: 0.65, stable: false },
  { symbol: 'VIRTUAL', price: 0.90, cf: 0.65, stable: false },
  { symbol: 'MORPHO', price: 1.50, cf: 0.65, stable: false },
  { symbol: 'cbXRP', price: 1.93, cf: 0.74, stable: false },
  { symbol: 'MAMO', price: 0.022, cf: 0.50, stable: false },
];
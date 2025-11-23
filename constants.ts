
import { Position, RiskParameters } from './types';

export const INITIAL_RISK_PARAMS: RiskParameters = {
  closeFactor: 0.5,
  liquidationIncentive: 1.08,
};

export const TOKEN_LOGOS: Record<string, string> = {
    'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    'WETH': 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
    'USDC': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    'USDT': 'https://app.aave.com/icons/tokens/usdt.svg',
    'AERO': 'https://moonwell.fi/_next/static/media/aero.ab774409.svg',
    'WELL': 'https://moonwell.fi/_next/static/media/well.2843938f.svg',
    'VIRTUAL': 'https://moonwell.fi/_next/static/media/virtual.0d34f704.svg',
    'cbBTC': 'https://moonwell.fi/_next/static/media/cbbtc.8571cf30.svg',
    'cbETH': 'https://assets.coingecko.com/coins/images/26998/small/cbETH.png',
    'cbXRP': 'https://moonwell.fi/_next/static/media/cbxrp.4520ec4b.svg',
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
    'MAMO': 'https://moonwell.fi/_next/static/media/mamo.47bca24e.svg',
    'LINK': 'https://app.aave.com/icons/tokens/link.svg',
};

// --- GUEST DEFAULTS (Simple) ---
export const INITIAL_SUPPLIED: Position[] = [
  {
    id: 'eth-supply-guest',
    symbol: 'ETH',
    amount: 5.0,
    basePrice: 2700,
    collateralFactor: 0.84,
    isCollateral: true,
    isStable: false,
    type: 'supply',
    marketType: 'core',
    isolationGroup: 'core'
  },
  {
    id: 'cbbtc-supply-guest',
    symbol: 'cbBTC',
    amount: 0.1,
    basePrice: 95000,
    collateralFactor: 0.85,
    isCollateral: true,
    isStable: false,
    type: 'supply',
    marketType: 'core',
    isolationGroup: 'core'
  }
];

export const INITIAL_BORROWED: Position[] = [
  {
    id: 'usdc-borrow-guest',
    symbol: 'USDC',
    amount: 5000,
    basePrice: 1.0,
    collateralFactor: 0,
    isCollateral: false,
    isStable: true,
    type: 'borrow',
    marketType: 'core',
    isolationGroup: 'core'
  },
];

// --- SCOTT'S FULL PORTFOLIO DEFAULTS ---
const SCOTT_CORE_SUPPLIED: Position[] = [
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
  }
];

const SCOTT_CORE_BORROWED: Position[] = [
  {
    id: 'usdc-borrow',
    symbol: 'USDC',
    amount: 52068.17,
    basePrice: 1.0,
    collateralFactor: 0,
    isCollateral: false,
    isStable: true,
    type: 'borrow',
    marketType: 'core',
    isolationGroup: 'core'
  },
];

export const SCOTT_DEFAULTS = {
    // Full Core Portfolio
    coreSupplied: SCOTT_CORE_SUPPLIED,
    coreBorrowed: SCOTT_CORE_BORROWED,
    
    // Isolated Market
    isolatedMarkets: [{ id: 'iso-scott-demo', name: 'Scott\'s Iso Market' }],
    isoSupplied: [
        {
            id: 'iso-scott-link-supply',
            symbol: 'LINK',
            amount: 1868.56,
            basePrice: 12.51,
            collateralFactor: 0.71,
            isCollateral: true,
            isStable: false,
            type: 'supply',
            marketType: 'isolated',
            isolationGroup: 'iso-scott-demo'
        },
        {
            id: 'iso-scott-eth-supply',
            symbol: 'ETH',
            amount: 4.079,
            basePrice: 2824.54,
            collateralFactor: 0.84,
            isCollateral: true,
            isStable: false,
            type: 'supply',
            marketType: 'isolated',
            isolationGroup: 'iso-scott-demo'
        }
    ],
    isoBorrowed: [
        {
            id: 'iso-scott-bor-usdc',
            symbol: 'USDC',
            amount: 6331,
            basePrice: 1.0,
            collateralFactor: 0,
            isCollateral: false,
            isStable: true,
            type: 'borrow',
            marketType: 'isolated',
            isolationGroup: 'iso-scott-demo'
        },
        {
            id: 'iso-scott-bor-usdt',
            symbol: 'USDT',
            amount: 12337,
            basePrice: 1.0,
            collateralFactor: 0,
            isCollateral: false,
            isStable: true,
            type: 'borrow',
            marketType: 'isolated',
            isolationGroup: 'iso-scott-demo'
        }
    ]
};

// Based on the provided image
export const PRESET_ASSETS = [
  { symbol: 'USDC', price: 1.0, cf: 0.88, stable: true },
  { symbol: 'USDT', price: 1.0, cf: 0.75, stable: true },
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
  { symbol: 'LINK', price: 15.00, cf: 0.71, stable: false },
];

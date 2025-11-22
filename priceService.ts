const SYMBOL_MAP: Record<string, string> = {
  'ETH': 'ethereum',
  'WETH': 'ethereum',
  'BTC': 'bitcoin',
  'WBTC': 'wrapped-bitcoin',
  'cbBTC': 'coinbase-wrapped-btc',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'DAI': 'dai',
  'USDS': 'usds', 
  'USDbC': 'bridged-usd-coin-base',
  'EURC': 'euro-coin',
  'AERO': 'aerodrome-finance',
  'WELL': 'moonwell-artemis',
  'VIRTUAL': 'virtual-protocol',
  'cbETH': 'coinbase-wrapped-staked-eth',
  'wstETH': 'wrapped-staked-eth',
  'rETH': 'rocket-pool-eth',
  'weETH': 'ether-fi-staked-eth',
  'wrsETH': 'kelp-dao-restaked-eth',
  'tBTC': 'tbtc',
  'LBTC': 'lombard-staked-btc',
  'MORPHO': 'morpho-network',
  'cbXRP': 'ripple', // Proxy if specific base asset not found
  'OP': 'optimism',
  'ARB': 'arbitrum',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'SOL': 'solana',
  'DEGEN': 'degen-base',
  'BRETT': 'brett-based',
  'MOG': 'mog-coin',
  'MAMO': 'mamo' // Placeholder, might not exist on public api yet
};

export async function fetchTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  const ids = new Set<string>();
  const idToSymbol: Record<string, string[]> = {};

  // Map symbols to IDs
  symbols.forEach(sym => {
      const s = sym.toUpperCase();
      // Handle direct matches or common variations (case insensitive lookup for map keys?)
      // Actually keys are mostly uppercase in map
      let id = SYMBOL_MAP[s];
      
      // Try to find case-insensitive match if direct failed
      if (!id) {
          const foundKey = Object.keys(SYMBOL_MAP).find(k => k.toUpperCase() === s);
          if (foundKey) id = SYMBOL_MAP[foundKey];
      }

      if (id) {
          ids.add(id);
          if (!idToSymbol[id]) idToSymbol[id] = [];
          idToSymbol[id].push(s);
      }
  });

  if (ids.size === 0) return {};

  const idString = Array.from(ids).join(',');
  // CoinGecko free tier allows public access
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idString}&vs_currencies=usd`;

  try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch prices');
      const data = await response.json();
      
      // data format: { "ethereum": { "usd": 3500 }, ... }
      
      const priceMap: Record<string, number> = {};
      
      Object.keys(data).forEach(id => {
          const usdPrice = data[id].usd;
          const symbolsForId = idToSymbol[id];
          if (symbolsForId && usdPrice) {
              symbolsForId.forEach(sym => {
                  priceMap[sym] = usdPrice;
              });
          }
      });
      
      return priceMap;
  } catch (error) {
      console.error("Price fetch error:", error);
      return {};
  }
}
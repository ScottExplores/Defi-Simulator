import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fetchHistoricalData, ChartDataPoint } from '../priceService';
import { TrendingUp, Loader2 } from 'lucide-react';

export const MarketPriceChart: React.FC = () => {
  const [asset, setAsset] = useState<'bitcoin' | 'ethereum'>('bitcoin');
  const [timeframe, setTimeframe] = useState<number>(1); // Days: 1, 7, 30, 365
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        setError(false);
        const points = await fetchHistoricalData(asset, timeframe);
        if (points.length > 0) {
            setData(points);
        } else {
            setError(true);
        }
        setIsLoading(false);
    };
    loadData();
  }, [asset, timeframe]);

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    if (timeframe === 1) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;
  const startPrice = data.length > 0 ? data[0].price : 0;
  const change = currentPrice - startPrice;
  const changePct = startPrice > 0 ? (change / startPrice) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-inner">
                    <img 
                        src={asset === 'bitcoin' ? "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" : "https://assets.coingecko.com/coins/images/279/small/ethereum.png"} 
                        alt={asset}
                        className="w-6 h-6"
                    />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-textMain capitalize">{asset} Price</h3>
                    {!isLoading && data.length > 0 && (
                        <div className={`text-xs font-mono font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                            {isPositive ? '+' : ''}{changePct.toFixed(2)}% ({timeframe === 1 ? '24H' : timeframe === 7 ? '7D' : timeframe === 30 ? '30D' : '1Y'})
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 shadow-inner">
                <button 
                    onClick={() => setAsset('bitcoin')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${asset === 'bitcoin' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    BTC
                </button>
                <button 
                    onClick={() => setAsset('ethereum')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${asset === 'ethereum' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    ETH
                </button>
            </div>
        </div>

        <div className="flex gap-2 mb-4">
            {[1, 7, 30, 365].map(days => (
                <button
                    key={days}
                    onClick={() => setTimeframe(days)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all ${
                        timeframe === days 
                        ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm' 
                        : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                    }`}
                >
                    {days === 1 ? '1D' : days === 7 ? '1W' : days === 30 ? '1M' : '1Y'}
                </button>
            ))}
        </div>

        <div className="h-[200px] w-full relative">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm z-10 rounded-xl">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                </div>
            )}
            
            {error && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center text-textMuted text-sm">
                    Failed to load data
                </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatXAxis}
                    tick={{ fontSize: 10, fill: '#71717a' }}
                    minTickGap={30}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: '#71717a' }}
                    tickFormatter={(val) => `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    width={50}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px', fontSize: '12px' }}
                    labelFormatter={(label) => new Date(label).toLocaleString()}
                    formatter={(val: number) => [`$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Price']}
                />
                <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={isPositive ? '#10b981' : '#ef4444'} 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4 }}
                />
            </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};
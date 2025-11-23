import React, { useEffect, useState } from 'react';
import { fetchFearAndGreed, FearGreedData } from '../priceService';
import { Loader2 } from 'lucide-react';

export const FearGreedIndex: React.FC = () => {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFearAndGreed().then(result => {
        setData(result);
        setLoading(false);
    });
  }, []);

  if (loading) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg h-[150px] flex items-center justify-center">
            <Loader2 className="animate-spin text-zinc-500" size={24} />
        </div>
      );
  }

  if (!data) return null;

  const value = parseInt(data.value);
  
  // Color logic
  let colorHex = '#eab308'; // yellow
  let textClass = 'text-yellow-500';
  if (value < 25) { colorHex = '#ef4444'; textClass = 'text-red-500'; } // Extreme Fear
  else if (value < 45) { colorHex = '#f97316'; textClass = 'text-orange-500'; } // Fear
  else if (value < 55) { colorHex = '#eab308'; textClass = 'text-yellow-500'; } // Neutral
  else if (value < 75) { colorHex = '#10b981'; textClass = 'text-emerald-500'; } // Greed
  else { colorHex = '#22c55e'; textClass = 'text-green-500'; } // Extreme Greed

  // Gauge Calculation
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // We want a semi-circle (50% of circle)
  const strokeDasharray = `${circumference} ${circumference}`;
  // Offset to show only half. 
  // Full circle = 0 offset. Empty = circumference. Half = circumference / 2.
  // We map 0-100 value to the semi-circle.
  // Value 0 => offset = circumference (empty) ? No, semi-circle logic is tricky with stroke-dashoffset on pure circles.
  // Better approach: Rotate a defined arc.
  
  // Simple Arc Path approach
  const startAngle = -180;
  const endAngle = 0;
  const angle = startAngle + (value / 100) * 180;
  
  // Convert polar to cartesian
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: cx + (r * Math.cos(angleInRadians)),
      y: cy + (r * Math.sin(angleInRadians))
    };
  };

  const needle = polarToCartesian(64, 64, 45, angle);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg overflow-hidden flex flex-row items-center gap-6 h-[140px]">
        
        {/* Left: Gauge */}
        <div className="relative w-32 h-20 shrink-0 mt-4">
             <svg viewBox="0 0 128 70" className="w-full h-full overflow-visible">
                {/* Background Arc */}
                <path d="M 14 64 A 50 50 0 0 1 114 64" fill="none" stroke="#27272a" strokeWidth="12" strokeLinecap="round" />
                
                {/* Active Arc (Colored) */}
                {/* We cheat slightly by using stroke-dasharray on the same path */}
                <path 
                    d="M 14 64 A 50 50 0 0 1 114 64" 
                    fill="none" 
                    stroke={colorHex} 
                    strokeWidth="12" 
                    strokeLinecap="round"
                    strokeDasharray={`${(value / 100) * 157} 157`} // 157 is approx length of arc radius 50
                    className="transition-all duration-1000 ease-out"
                />

                {/* Needle */}
                <line x1="64" y1="64" x2={needle.x} y2={needle.y} stroke="white" strokeWidth="2" />
                <circle cx="64" cy="64" r="4" fill="white" />
             </svg>
        </div>

        {/* Right: Big Number & Text */}
        <div className="flex flex-col justify-center">
            {/* The detached "Popping" number */}
            <div 
                className={`text-5xl font-black ${textClass} leading-none tracking-tighter drop-shadow-2xl`}
                style={{ textShadow: `0 4px 10px ${colorHex}40` }}
            >
                {value}
            </div>
            
            <div className="mt-1">
                <span className={`text-sm font-bold text-white uppercase tracking-wider`}>
                    {data.value_classification}
                </span>
                <p className="text-[10px] text-zinc-500 leading-tight">
                    Crypto Sentiment Index
                </p>
            </div>
        </div>
    </div>
  );
};
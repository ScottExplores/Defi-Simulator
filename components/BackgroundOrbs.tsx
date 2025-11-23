
import React from 'react';

export const BackgroundOrbs: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-zinc-950">
      {/* Orb 1: Blue - More distinct */}
      <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[60px] animate-float1 mix-blend-screen opacity-60"></div>

      {/* Orb 2: Indigo - More distinct */}
      <div className="absolute top-[10%] right-[10%] w-[250px] h-[250px] bg-indigo-600/20 rounded-full blur-[50px] animate-float2 mix-blend-screen opacity-50"></div>

      {/* Orb 3: Deep Blue - More distinct */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-800/15 rounded-full blur-[70px] animate-float3 mix-blend-screen opacity-40"></div>
    </div>
  );
};

import React from 'react';

export const BackgroundOrbs: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep dark background base */}
      <div className="absolute inset-0 bg-zinc-950"></div>

      {/* 
         Orbs: Using darker shades of the layout blue (blue-800/900, indigo-900) 
         with varied positioning to keep them "nearby" but subtle.
      */}

      {/* Top Left - Main Glow */}
      <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-blue-900/40 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-blob"></div>

      {/* Top Right - Secondary Indigo */}
      <div className="absolute top-0 -right-32 w-[500px] h-[500px] bg-indigo-950/50 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>

      {/* Bottom Left - Deep Blue */}
      <div className="absolute -bottom-32 left-10 w-[600px] h-[600px] bg-blue-950/40 rounded-full mix-blend-screen filter blur-[110px] opacity-50 animate-blob animation-delay-4000"></div>
      
      {/* Center/Right - Accent */}
      <div className="absolute top-1/3 right-[10%] w-[400px] h-[400px] bg-blue-800/20 rounded-full mix-blend-screen filter blur-[90px] opacity-30 animate-blob animation-delay-6000"></div>
    </div>
  );
};
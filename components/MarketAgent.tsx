import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Bot, RefreshCw, Loader2 } from 'lucide-react';
import { Position, MarketContext } from '../types';

interface MarketAgentProps {
  positions: Position[];
  contextItems: MarketContext[];
}

export const MarketAgent: React.FC<MarketAgentProps> = ({ positions, contextItems }) => {
  const [analysis, setAnalysis] = useState<string>(() => {
      return localStorage.getItem('dewell_agent_analysis') || "Click analyze to generate market outlook based on your portfolio and fed intelligence.";
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  useEffect(() => {
      localStorage.setItem('dewell_agent_analysis', analysis);
  }, [analysis]);

  const runAnalysis = async () => {
      setIsAnalyzing(true);
      try {
          // 1. Gather Market Data
          const distinctAssets = Array.from(new Set(positions.map(p => p.symbol)));
          const priceData = distinctAssets.map(sym => {
              const pos = positions.find(p => p.symbol === sym);
              return `${sym}: $${pos?.basePrice.toFixed(2)}`;
          }).join(', ');

          // 2. Prepare Prompt
          const textContexts = contextItems.filter(i => i.type === 'text').map(i => i.content).join('\n---\n');
          const imageContexts = contextItems.filter(i => i.type === 'image');

          const prompt = `
            You are an expert Crypto Market Analyst AI for the DeWell Dashboard.
            
            CURRENT PORTFOLIO PRICES:
            ${priceData}

            INSIDER INTELLIGENCE (Emails/Tweets/Notes):
            ${textContexts || "No specific insider info provided."}

            TASK:
            Provide a concise market analysis consisting of exactly these three sections:
            
            1. **Past Week/Month Sentiment**: Based on the context and prices, was the trend bullish or bearish?
            2. **Future Direction**: Where is the market heading next? (Short/Medium term prediction).
            3. **Key Risks/Opportunities**: One sentence summary.
            
            Keep it professional, direct, and under 150 words.
          `;

          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          let response;
          if (imageContexts.length > 0) {
               const parts: any[] = [{ text: prompt }];
               imageContexts.forEach(img => {
                   parts.push({
                       inlineData: {
                           mimeType: 'image/png', 
                           data: img.content
                       }
                   });
               });
               
               response = await ai.models.generateContent({
                   model: 'gemini-2.5-flash',
                   contents: { parts }
               });
          } else {
               response = await ai.models.generateContent({
                   model: 'gemini-2.5-flash',
                   contents: prompt
               });
          }

          const text = response.text;
          if (text) {
              setAnalysis(text);
          }

      } catch (e) {
          console.error("Agent Error", e);
          setAnalysis("Failed to generate analysis. Please check API Key or connection.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-xl">
        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center border border-indigo-500/50">
                    <Bot className="text-indigo-400" size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-indigo-100 text-sm">DeWell Analyst</h3>
                    <p className="text-[10px] text-zinc-500">{contextItems.length} sources active</p>
                </div>
            </div>
            <button 
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 shadow-lg shadow-indigo-900/20 transition-all"
            >
                {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                {isAnalyzing ? 'Thinking...' : 'Analyze'}
            </button>
        </div>

        <div className="p-5">
            <div className="prose prose-invert prose-sm max-w-none">
                {analysis.split('\n').map((line, i) => (
                    <p key={i} className={`mb-2 leading-relaxed ${line.trim().startsWith('**') ? 'font-bold text-indigo-200 mt-3' : 'text-zinc-300 text-xs'}`}>
                        {line.replace(/\*\*/g, '')}
                    </p>
                ))}
            </div>
            <div className="mt-4 text-[10px] text-zinc-600 text-right border-t border-zinc-800/50 pt-2 flex justify-between">
                <span>Data Sources: Portfolio + Settings Context</span>
                <span>Gemini 2.5 Flash</span>
            </div>
        </div>
    </div>
  );
};
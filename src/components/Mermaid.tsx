import React, { useState, useEffect } from 'react';
import { AlertCircle, Maximize2, X } from 'lucide-react';
import { MERMAID_CDN } from '../types';

declare global {
  interface Window {
    mermaid: any;
  }
}

interface MermaidProps {
  chart: string;
  title: string;
}

export default function Mermaid({ chart, title }: MermaidProps) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!window.mermaid) {
      const script = document.createElement("script");
      script.src = MERMAID_CDN;
      script.async = true;
      script.onload = () => {
        window.mermaid.initialize({ 
          startOnLoad: false, 
          theme: 'neutral', 
          securityLevel: 'loose', 
          fontFamily: 'JetBrains Mono, monospace'
        });
      };
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!chart || !window.mermaid) return;
      setError(false);
      try {
        let cleanChart = chart.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        
        if (!cleanChart.match(/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)/)) {
          cleanChart = `graph TD\n${cleanChart}`;
        }

        cleanChart = cleanChart.replace(/\[([^\]]*)\(([^)]*)\)([^\]]*)\]/g, '["$1 $2 $3"]');
        cleanChart = cleanChart.replace(/\(([^)]*)\(([^)]*)\)([^)]*)\)/g, '("$1 $2 $3")');
        
        const id = `mermaid-canvas-${Math.random().toString(36).substring(2, 11)}`;
        const { svg: renderedSvg } = await window.mermaid.render(id, cleanChart);
        if (isMounted) setSvg(renderedSvg);
      } catch (err) {
        console.error("Mermaid Error:", err);
        if (isMounted) setError(true);
      }
    };
    renderDiagram();
    return () => { isMounted = false; };
  }, [chart]);

  return (
    <div className="relative w-full h-full group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
      {error ? (
        <div className="flex flex-col items-center justify-center p-6 text-slate-300">
          <AlertCircle size={20} className="mb-2" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Logic Parse Error</span>
          <p className="text-[8px] text-slate-400 mt-2 font-mono">Check Mermaid Syntax</p>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-6 transition-all duration-700 hover:scale-[1.02] mermaid" dangerouslySetInnerHTML={{ __html: svg }} />
      )}
      <button onClick={() => setIsFullScreen(true)} className="absolute top-3 right-3 p-1.5 bg-white border border-slate-200 rounded text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
        <Maximize2 size={14} />
      </button>
      {isFullScreen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-500 text-xs uppercase tracking-[0.2em]">{title}</h3>
            <button onClick={() => setIsFullScreen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"><X size={20} /></button>
          </div>
          <div className="flex-1 w-full overflow-auto flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-8 mermaid" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      )}
    </div>
  );
}

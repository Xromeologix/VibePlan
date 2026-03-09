import React, { useState } from 'react';
import { Loader2, Sparkles, Target } from 'lucide-react';
import { callGemini } from '../services/gemini';
import { Idea, Space, ProgressData } from '../types';

interface ProgressPulseProps {
  activeSpace: Space;
  selectedFeature: Idea;
  onUpdate: (progressData: ProgressData) => void;
  onCancel: () => void;
}

export default function ProgressPulse({ activeSpace, selectedFeature, onUpdate, onCancel }: ProgressPulseProps) {
  const [implemented, setImplemented] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeProgress = async () => {
    setAnalyzing(true);
    const featureContext = `
      VIBE TITLE: ${selectedFeature.title}
      REQUIREMENT: ${selectedFeature.summary}
      TOPOLOGY: ${selectedFeature.mermaid}
    `;
    
    const systemPrompt = `
      Compare actual implementation against the specific Vibe Requirement and Topology. 
      VIBE CONTEXT: ${featureContext}. 
      
      User Input: "${implemented}"
      
      Return JSON: { 
        "percentage": number (0-100), 
        "summary": "brief summary of what is finished vs missing", 
        "missing": ["feature sub-task 1", "feature sub-task 2"] 
      }. 
      
      Be a rigorous code reviewer. If they only did the UI but not logic, give them 40-50%.
      Ensure response is valid JSON.
    `;
    
    try {
      const data = await callGemini(`I have implemented for ${selectedFeature.title}: ${implemented}`, systemPrompt);
      onUpdate(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="text-center">
         <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-100"><Target size={28} /></div>
         <h2 className="text-2xl font-bold tracking-tight">Feature Implementation Pulse</h2>
         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">Gauging: {selectedFeature.title}</p>
      </header>
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 space-y-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Target Logic</span>
          <p className="text-xs text-slate-600 line-clamp-2">{selectedFeature.summary}</p>
        </div>
        <textarea 
          autoFocus 
          className="w-full h-48 p-5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none transition-all" 
          placeholder="Describe your progress for THIS vibe specifically (code written, components created, logic handled)..." 
          value={implemented} 
          onChange={(e) => setImplemented(e.target.value)} 
        />
        <div className="pt-4 flex gap-3">
          <button disabled={!implemented || analyzing} onClick={analyzeProgress} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {analyzing ? 'Evaluating Implementation...' : 'Update Implementation State'}
          </button>
          <button onClick={onCancel} className="px-6 py-4 bg-white text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-slate-200">Cancel</button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { callGemini } from '../services/gemini';
import Mermaid from './Mermaid';
import { Idea, Space } from '../types';

interface NewIdeaWorkflowProps {
  project: Space;
  onSave: (idea: Idea) => void;
  onCancel: () => void;
}

export default function NewIdeaWorkflow({ project, onSave, onCancel }: NewIdeaWorkflowProps) {
  const [vibe, setVibe] = useState("");
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const architect = async () => {
    setLoading(true);
    const systemPrompt = `Analyze technical requirement (Vibe): "${vibe}". Return JSON: { "title": "...", "summary": "...", "mermaid": "graph TD\\n  A[Start] --> B[...]" }. Avoid parentheses in Mermaid node labels (e.g. use quotes or strip them). Ensure valid JSON.`;
    try {
      const data = await callGemini(vibe, systemPrompt);
      setDraft(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (draft) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <header className="text-center"><h2 className="text-3xl font-bold tracking-tight text-slate-900">Topology Preview</h2></header>
        <div className="bg-white rounded-2xl border border-slate-200 p-10 space-y-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-slate-900">{draft.title}</h3>
            <p className="text-slate-500 leading-relaxed text-sm font-medium">{draft.summary}</p>
          </div>
          <div className="h-72"><Mermaid chart={draft.mermaid} title={draft.title} /></div>
          <div className="grid grid-cols-2 gap-3 pt-6">
            <button onClick={() => onSave({ ...draft, id: Date.now(), createdAt: new Date().toISOString(), type: 'Module' })} className="py-4 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em]">Commit to Environment</button>
            <button onClick={() => setDraft(null)} className="py-4 bg-white border border-slate-200 text-slate-400 rounded-xl font-bold text-[10px] uppercase tracking-widest">Reconfigure Vibe</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-400">
      <header className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Logic Ingest</h2>
        <p className="text-[9px] text-purple-500 font-bold uppercase tracking-[0.4em] mt-2">Requirement Stream Synthesis</p>
      </header>
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20 transition duration-1000"></div>
        <textarea autoFocus className="relative w-full h-80 p-8 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none text-base font-medium bg-white leading-relaxed" placeholder="Describe the vibe of this feature..." value={vibe} onChange={e => setVibe(e.target.value)} />
        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-20">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <span className="font-bold text-[9px] uppercase tracking-[0.3em] text-indigo-600 animate-pulse">Synthesizing Topology...</span>
          </div>
        )}
      </div>
      <button onClick={architect} disabled={!vibe || loading} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-[1.01] transition-all">Generate Architecture</button>
      <button onClick={onCancel} className="w-full text-center text-slate-400 font-bold text-[9px] uppercase tracking-widest hover:text-rose-500">Discard Sequence</button>
    </div>
  );
}

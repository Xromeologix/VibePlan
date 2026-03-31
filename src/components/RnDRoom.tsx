import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  FlaskConical,
  Shuffle,
  ChevronRight,
  X,
  Clipboard,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Telescope,
  RefreshCw,
  Brain,
  BarChart3,
  Layers,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Mermaid from './Mermaid';
import { callGemini } from '../services/gemini';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResearchType = 'expansion' | 'alternatives';

export interface AgentCard {
  id: string;
  agentName: string;
  agentPersona: string;
  rawPaste: string;
  verdict: string;
  bullets: string[];
  confidence: number;
  mermaid?: string;
  createdAt: string;
}

export interface ResearchThread {
  id: string;
  type: ResearchType;
  title: string;
  situation: string;
  desiredOutcome: string;
  constraints: string;
  status: 'open' | 'concluded';
  agents: AgentCard[];
  synthesis?: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const typeConfig = {
  expansion: {
    label: 'Expansion',
    icon: Telescope,
    color: '#4F8EF7',
    glow: 'rgba(79,142,247,0.15)',
    border: 'rgba(79,142,247,0.30)',
    description: 'Discover new ideas, tools, and possibilities',
  },
  alternatives: {
    label: 'Alternatives',
    icon: RefreshCw,
    color: '#22C9A8',
    glow: 'rgba(34,201,168,0.15)',
    border: 'rgba(34,201,168,0.30)',
    description: 'Find replacements for what you already use',
  },
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 75 ? '#22C9A8' : value >= 50 ? '#F0B33E' : '#F05A3E';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>{value}%</span>
    </div>
  );
}

// ─── Agent Card Display ───────────────────────────────────────────────────────

const AgentCardDisplay: React.FC<{ card: AgentCard }> = ({ card }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <Brain size={16} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{card.agentPersona || 'Expert Agent'}</p>
            <h4 className="font-bold text-sm truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{card.agentName}</h4>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Verdict */}
      <div className="px-5 pb-4">
        <p className="text-xs font-semibold italic" style={{ color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-primary)', paddingLeft: '10px' }}>
          "{card.verdict}"
        </p>
      </div>

      {/* Confidence */}
      <div className="px-5 pb-4 space-y-1">
        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Confidence</p>
        <ConfidenceBar value={card.confidence} />
      </div>

      {/* Bullets */}
      <div className="px-5 pb-4 space-y-1.5">
        {card.bullets.map((b, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent-primary)' }} />
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b}</p>
          </div>
        ))}
      </div>

      {/* Expanded: Mermaid */}
      <AnimatePresence>
        {expanded && card.mermaid && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-5 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)', height: 280 }}>
              <Mermaid chart={card.mermaid} title={card.agentName} />
            </div>
          </motion.div>
        )}
        {expanded && !card.mermaid && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-5 p-4 rounded-xl text-center" style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-strong)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>No diagram generated for this agent</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Consult Panel ────────────────────────────────────────────────────────────

function ConsultPanel({ onClose, onAdd }: { onClose: () => void; onAdd: (card: AgentCard) => void }) {
  const [agentName, setAgentName] = useState('');
  const [agentPersona, setAgentPersona] = useState('');
  const [rawPaste, setRawPaste] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    if (!agentName.trim() || !rawPaste.trim()) return;
    setIsConverting(true);

    try {
      const prompt = `You are processing an AI agent's response for a product R&D tool. Extract and structure the following raw AI response into a JSON object.

Raw response from "${agentName}" (Persona: "${agentPersona || 'Expert'}"):
"""
${rawPaste}
"""

Return ONLY valid JSON with this exact structure:
{
  "verdict": "A single punchy headline sentence summarising the agent's main take (max 20 words)",
  "bullets": ["key point 1", "key point 2", "key point 3", "key point 4"],
  "confidence": <a number 0-100 representing how confident/strong the agent's recommendation is based on the language used>,
  "mermaid": "<optional mermaid diagram string if the content lends itself to a diagram, or null>"
}`;

      const data = await callGemini(prompt, 'You are a structured data extraction assistant. Return only valid JSON, no markdown, no explanation.');

      const card: AgentCard = {
        id: Date.now().toString(),
        agentName: agentName.trim(),
        agentPersona: agentPersona.trim() || 'Expert Agent',
        rawPaste,
        verdict: data.verdict || 'No verdict extracted.',
        bullets: Array.isArray(data.bullets) ? data.bullets : [],
        confidence: typeof data.confidence === 'number' ? data.confidence : 70,
        mermaid: data.mermaid || undefined,
        createdAt: new Date().toISOString(),
      };

      onAdd(card);
      onClose();
    } catch (e) {
      console.error('Failed to convert agent response:', e);
      alert('Failed to convert. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed inset-y-0 right-0 w-full max-w-md z-50 flex flex-col"
      style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-default)', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}
    >
      <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <div>
          <h3 className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Consult an Expert</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>Paste & Convert</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Agent Name *</label>
          <input
            value={agentName}
            onChange={e => setAgentName(e.target.value)}
            placeholder="e.g. ChatGPT, Gemini, Perplexity..."
            className="input-base w-full p-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Persona / Role (optional)</label>
          <input
            value={agentPersona}
            onChange={e => setAgentPersona(e.target.value)}
            placeholder="e.g. Devil's Advocate, Tech Lead, Strategist..."
            className="input-base w-full p-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Paste Response *</label>
          <textarea
            value={rawPaste}
            onChange={e => setRawPaste(e.target.value)}
            placeholder="Paste the AI's full response here..."
            className="input-base w-full p-3 text-xs resize-none"
            rows={12}
          />
        </div>
      </div>

      <div className="p-6" style={{ borderTop: '1px solid var(--border-default)' }}>
        <button
          onClick={handleConvert}
          disabled={isConverting || !agentName.trim() || !rawPaste.trim()}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConverting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {isConverting ? 'Converting...' : 'Convert to Agent Card'}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Thread View ──────────────────────────────────────────────────────────────

function ThreadView({
  thread,
  onBack,
  onAddAgent,
  onSynthesize,
}: {
  thread: ResearchThread;
  onBack: () => void;
  onAddAgent: (card: AgentCard) => void;
  onSynthesize: () => void;
}) {
  const [showConsult, setShowConsult] = useState(false);
  const cfg = typeConfig[thread.type];
  const TypeIcon = cfg.icon;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to R&D Room
        </button>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest"
            style={{ background: cfg.glow, color: cfg.color, border: `1px solid ${cfg.border}` }}
          >
            {cfg.label}
          </span>
          <span
            className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest"
            style={{ background: thread.status === 'open' ? 'rgba(34,201,168,0.12)' : 'var(--bg-elevated)', color: thread.status === 'open' ? '#22C9A8' : 'var(--text-muted)', border: '1px solid currentColor' }}
          >
            {thread.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Brief */}
        <div className="col-span-12 md:col-span-4 space-y-4">
          <div className="p-6 rounded-2xl space-y-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: cfg.glow, border: `1px solid ${cfg.border}` }}>
                <TypeIcon size={18} style={{ color: cfg.color }} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Research Brief</p>
                <h2 className="font-bold text-base leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{thread.title}</h2>
              </div>
            </div>

            <div className="space-y-4 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Situation</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{thread.situation}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Desired Outcome</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{thread.desiredOutcome}</p>
              </div>
              {thread.constraints && (
                <div className="space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Constraints</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{thread.constraints}</p>
                </div>
              )}
            </div>
          </div>

          {/* Synthesis */}
          {thread.synthesis ? (
            <div className="p-6 rounded-2xl space-y-3" style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-glow-strong)' }}>
              <div className="flex items-center gap-2">
                <Zap size={14} style={{ color: 'var(--accent-primary)' }} />
                <p className="text-[9px] font-bold uppercase tracking-widest brand-gradient-text">Synthesis</p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{thread.synthesis}</p>
            </div>
          ) : thread.agents.length >= 2 ? (
            <button
              onClick={onSynthesize}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              Synthesise All Agents
            </button>
          ) : null}
        </div>

        {/* Right: Evidence Board */}
        <div className="col-span-12 md:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Evidence Board</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{thread.agents.length} Agent{thread.agents.length !== 1 ? 's' : ''} Consulted</p>
            </div>
            <button
              onClick={() => setShowConsult(true)}
              className="btn-primary flex items-center gap-2 px-4 py-2"
            >
              <Plus size={13} />
              Consult Expert
            </button>
          </div>

          {thread.agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl space-y-3" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-strong)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                <Brain size={22} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>No agents consulted yet</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Paste a response from any AI to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {thread.agents.map((card) => (
                  <AgentCardDisplay key={card.id} card={card} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Consult panel */}
      <AnimatePresence>
        {showConsult && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowConsult(false)}
            />
            <ConsultPanel
              onClose={() => setShowConsult(false)}
              onAdd={(card) => {
                onAddAgent(card);
                setShowConsult(false);
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── New Thread Modal ─────────────────────────────────────────────────────────

function NewThreadModal({ onClose, onCreate }: { onClose: () => void; onCreate: (t: ResearchThread) => void }) {
  const [step, setStep] = useState<'type' | 'spec'>('type');
  const [selectedType, setSelectedType] = useState<ResearchType | null>(null);
  const [title, setTitle] = useState('');
  const [situation, setSituation] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [constraints, setConstraints] = useState('');

  const handleCreate = () => {
    if (!selectedType || !title.trim() || !situation.trim() || !desiredOutcome.trim()) return;
    const thread: ResearchThread = {
      id: Date.now().toString(),
      type: selectedType,
      title: title.trim(),
      situation: situation.trim(),
      desiredOutcome: desiredOutcome.trim(),
      constraints: constraints.trim(),
      status: 'open',
      agents: [],
      createdAt: new Date().toISOString(),
    };
    onCreate(thread);
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <div>
              <h3 className="font-bold text-base" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>New Research Thread</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {step === 'type' ? 'Step 1 — Choose Research Type' : 'Step 2 — Define the Brief'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 'type' && (
                <motion.div key="type" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                  {(Object.entries(typeConfig) as [ResearchType, typeof typeConfig.expansion][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const isSelected = selectedType === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedType(key)}
                        className="w-full flex items-center gap-4 p-5 rounded-2xl transition-all text-left"
                        style={{
                          background: isSelected ? cfg.glow : 'var(--bg-elevated)',
                          border: `1px solid ${isSelected ? cfg.border : 'var(--border-default)'}`,
                          transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                        }}
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.glow, border: `1px solid ${cfg.border}` }}>
                          <Icon size={22} style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{cfg.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{cfg.description}</p>
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="ml-auto shrink-0" style={{ color: cfg.color }} />}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => selectedType && setStep('spec')}
                    disabled={!selectedType}
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue <ChevronRight size={14} />
                  </button>
                </motion.div>
              )}

              {step === 'spec' && (
                <motion.div key="spec" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Research Title *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Backend alternatives to Cloud Run" className="input-base w-full p-3 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>What's the situation? *</label>
                    <textarea value={situation} onChange={e => setSituation(e.target.value)} placeholder="Briefly describe what you're dealing with..." className="input-base w-full p-3 text-xs resize-none" rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>What are you hoping to find? *</label>
                    <textarea value={desiredOutcome} onChange={e => setDesiredOutcome(e.target.value)} placeholder="Your ideal outcome from this research..." className="input-base w-full p-3 text-xs resize-none" rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Constraints (optional)</label>
                    <input value={constraints} onChange={e => setConstraints(e.target.value)} placeholder="Budget, stack, timeline..." className="input-base w-full p-3 text-sm" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setStep('type')} className="btn-ghost px-5 py-3">Back</button>
                    <button
                      onClick={handleCreate}
                      disabled={!title.trim() || !situation.trim() || !desiredOutcome.trim()}
                      className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FlaskConical size={14} /> Open Research Thread
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main RnD Room ────────────────────────────────────────────────────────────

export default function RnDRoom({ onBack }: { onBack: () => void }) {
  const [threads, setThreads] = useState<ResearchThread[]>([]);
  const [activeThread, setActiveThread] = useState<ResearchThread | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleCreateThread = (thread: ResearchThread) => {
    setThreads(prev => [thread, ...prev]);
    setActiveThread(thread);
  };

  const handleAddAgent = (card: AgentCard) => {
    if (!activeThread) return;
    const updated = { ...activeThread, agents: [...activeThread.agents, card] };
    setActiveThread(updated);
    setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleSynthesize = async () => {
    if (!activeThread || activeThread.agents.length < 2) return;
    setIsSynthesizing(true);
    try {
      const agentSummaries = activeThread.agents.map(a =>
        `Agent: ${a.agentName} (${a.agentPersona})\nVerdict: ${a.verdict}\nKey Points: ${a.bullets.join(', ')}\nConfidence: ${a.confidence}%`
      ).join('\n\n---\n\n');

      const prompt = `You are synthesising multiple AI agent responses for a research thread titled "${activeThread.title}".

The research brief:
- Situation: ${activeThread.situation}
- Desired Outcome: ${activeThread.desiredOutcome}
${activeThread.constraints ? `- Constraints: ${activeThread.constraints}` : ''}

Agent responses:
${agentSummaries}

Write a concise synthesis (3-5 sentences) that:
1. Identifies where agents agree or diverge
2. Highlights the strongest recommendation
3. Gives a clear actionable conclusion

Return ONLY valid JSON: { "synthesis": "your synthesis text here" }`;

      const raw = await callGemini(prompt, 'You are a senior research analyst. Be direct and actionable. Return only valid JSON.');
      const synthesis = raw?.synthesis || 'Synthesis could not be generated.';

      const updated = { ...activeThread, synthesis, status: 'concluded' as const };
      setActiveThread(updated);
      setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (e) {
      console.error('Synthesis failed:', e);
      alert('Synthesis failed. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Thread list view
  if (!activeThread) {
    return (
      <div className="space-y-8 animate-in fade-in duration-400">
        {/* Header */}
        <div className="flex items-end justify-between pb-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(79,142,247,0.15), rgba(34,201,168,0.15))', border: '1px solid rgba(79,142,247,0.25)' }}>
              <FlaskConical size={22} style={{ color: '#4F8EF7' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>R&D Room</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] mt-0.5" style={{ color: 'var(--text-muted)' }}>Investigate · Explore · Decide</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary flex items-center gap-2 px-5 py-2.5"
          >
            <Plus size={14} /> New Research
          </button>
        </div>

        {/* Stats row */}
        {threads.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Threads', value: threads.length, icon: Layers },
              { label: 'Agents Consulted', value: threads.reduce((a, t) => a + t.agents.length, 0), icon: Brain },
              { label: 'Concluded', value: threads.filter(t => t.status === 'concluded').length, icon: CheckCircle2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="p-5 rounded-2xl flex items-center gap-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                  <Icon size={16} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <div>
                  <p className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Thread list */}
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-card)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(79,142,247,0.12), rgba(34,201,168,0.12))', border: '1px solid rgba(79,142,247,0.20)' }}>
              <FlaskConical size={28} style={{ color: '#4F8EF7' }} />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>No research threads yet</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Start a new thread to investigate a problem or explore alternatives</p>
            </div>
            <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5 mt-2">
              <Plus size={14} /> Open First Thread
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {threads.map((thread) => {
                const cfg = typeConfig[thread.type];
                const TypeIcon = cfg.icon;
                return (
                  <motion.button
                    key={thread.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setActiveThread(thread)}
                    className="w-full flex items-center gap-5 p-5 rounded-2xl transition-all text-left group card card-interactive"
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.glow, border: `1px solid ${cfg.border}` }}>
                      <TypeIcon size={18} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>·</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: thread.status === 'open' ? '#22C9A8' : 'var(--text-muted)' }}>{thread.status}</span>
                      </div>
                      <h3 className="font-bold text-sm truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{thread.title}</h3>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{thread.situation}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{thread.agents.length}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Agents</p>
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* New thread modal */}
        <AnimatePresence>
          {showNewModal && (
            <NewThreadModal
              onClose={() => setShowNewModal(false)}
              onCreate={handleCreateThread}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Active thread view
  return (
    <div className="animate-in fade-in duration-400">
      {isSynthesizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Synthesising agents...</p>
          </div>
        </div>
      )}
      <ThreadView
        thread={activeThread}
        onBack={() => setActiveThread(null)}
        onAddAgent={handleAddAgent}
        onSynthesize={handleSynthesize}
      />
    </div>
  );
}

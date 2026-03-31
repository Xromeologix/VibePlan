import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Clock, 
  Database,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  ArrowLeft,
  Zap,
  Activity,
  AlertCircle,
  Download,
  Upload,
  Loader2,
  Sparkles,
  Rocket,
  ShieldAlert,
  X,
  Globe,
  Trash2,
  Archive,
  ChevronRight,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Space, Idea, Credits, ACCENT_COLORS } from './types';
import Mermaid from './components/Mermaid';
import ProgressPulse from './components/ProgressPulse';
import NewIdeaWorkflow from './components/NewIdeaWorkflow';
import FeatureSwiper from './components/FeatureSwiper';
import BlurtMode from './components/BlurtMode';
import VibePlanIcon from './components/VibePlanIcon';
import ThemeToggle, { useTheme } from './components/ThemeToggle';
import { generateIcon, callGemini } from './services/gemini';

interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture: string;
  credits_used: number;
  monthly_limit: number;
}

const API_BASE = window.location.origin.includes('pages.dev') 
  ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
  : '';

export default function App() {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [view, setView] = useState('projects'); 
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Idea | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);
  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const [iconStyle, setIconStyle] = useState('');
  const [expansionTarget, setExpansionTarget] = useState<Idea | null>(null);
  const [pulseInput, setPulseInput] = useState('');
  const [isAnalyzingPulse, setIsAnalyzingPulse] = useState(false);
  const [isBlurtModeOpen, setIsBlurtModeOpen] = useState(false);
  
  const [credits, setCredits] = useState<Credits>({
    monthlyLimit: 100,
    usedThisMonth: 0,
    resetDay: 1,
    dailyAllowance: 10
  });

  const [resetTimer, setResetTimer] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSpaces();
    }
  }, [user]);

  const handleBlurtComplete = async (result: any) => {
    if (!result || !result.type || !result.data) return;
    
    if (result.type === 'space') {
      const newSpace = {
        name: result.data.name || 'New Blurted Space',
        platform: result.data.platform || 'Custom',
        color: result.data.color || 'Indigo',
        icon: '🚀',
        archived: false,
        lastUpdated: new Date().toISOString()
      };
      
      try {
        const res = await fetch(`${API_BASE}/api/spaces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSpace),
          credentials: 'include'
        });
        if (res.ok) {
          await fetchSpaces();
          // Optionally, find the new space and set it as active
          // For now, just go to projects view
          setView('projects');
        }
      } catch (error) {
        console.error('Failed to create blurted space:', error);
      }
    } else if (result.type === 'idea') {
      // If we are in a space, add it to the active space
      if (activeSpace) {
        const newIdea = {
          title: result.data.title || 'New Blurted Vibe',
          summary: result.data.summary || '',
          mermaid: result.data.mermaid || 'graph TD\nA-->B',
          type: result.data.type || 'Module',
          createdAt: new Date().toISOString(),
          progress: undefined,
          personas: result.data.personas
        };
        
        try {
          const res = await fetch(`${API_BASE}/api/spaces/${activeSpace.id}/ideas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newIdea),
            credentials: 'include'
          });
          if (res.ok) {
            await fetchSpaces();
            // Update active space to reflect new idea
            const updatedSpaces = await (await fetch(`${API_BASE}/api/spaces`, { credentials: 'include' })).json();
            const updatedActive = updatedSpaces.find((s: Space) => s.id === activeSpace.id);
            if (updatedActive) setActiveSpace(updatedActive);
          }
        } catch (error) {
          console.error('Failed to create blurted idea:', error);
        }
      } else {
        alert("You blurted a feature, but you aren't in a workspace! Open a workspace first to add features to it.");
      }
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setCredits(prev => ({
          ...prev,
          monthlyLimit: userData.monthly_limit,
          usedThisMonth: userData.credits_used
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSpaces = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/spaces`, { credentials: 'include' });
      if (res.ok) {
        const spacesData = await res.json();
        setSpaces(spacesData);
      }
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
    }
  };

  const handleLogin = async () => {
    const authWindow = window.open('about:blank', 'oauth_popup', 'width=600,height=700');
    
    if (!authWindow) {
      alert('Please allow popups for this site to connect your account.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/url`, { credentials: 'include' });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Failed to generate login URL. Please check your settings.');
        authWindow.close();
        return;
      }

      authWindow.location.href = data.url;
    } catch (error) {
      console.error('Login error:', error);
      alert(`Network error during login. Make sure the backend is running at the correct URL. Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      authWindow.close();
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body = authMode === 'signup' ? { email, password, name } : { email, password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data);
        setCredits(prev => ({
          ...prev,
          monthlyLimit: data.monthly_limit,
          usedThisMonth: data.credits_used
        }));
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError('Network error. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { 
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      setSpaces([]);
      setView('projects');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleArchiveSpace = async (space: Space) => {
    try {
      const updatedArchived = !space.archived;
      const res = await fetch(`${API_BASE}/api/spaces/${space.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: space.name, 
          icon: space.icon, 
          archived: updatedArchived, 
          lastUpdated: new Date().toISOString() 
        }),
        credentials: 'include'
      });

      if (res.ok) {
        setSpaces(spaces.map(s => s.id === space.id ? { ...s, archived: updatedArchived } : s));
      }
    } catch (error) {
      console.error('Archive error:', error);
    }
  };

  const handleDeleteSpace = async (spaceId: number) => {
    if (!confirm('Are you sure you want to permanently delete this workspace and all its vibes?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/spaces/${spaceId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        setSpaces(spaces.filter(s => s.id !== spaceId));
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Allow messages from the same origin to support custom domains/Cloudflare
      const origin = event.origin;
      const isAllowedOrigin = 
        origin === window.location.origin || 
        origin.endsWith('.run.app') || 
        origin.includes('localhost');

      if (!isAllowedOrigin) return;

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchUser();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const reset = new Date();
      reset.setUTCHours(24, 0, 0, 0);
      const diff = reset.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setResetTimer(`${h}H ${m}M`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const useCredit = async () => {
    if (credits.usedThisMonth >= credits.monthlyLimit) return false;
    const newUsed = credits.usedThisMonth + 1;
    setCredits(prev => ({ ...prev, usedThisMonth: newUsed }));
    
    try {
      await fetch(`${API_BASE}/api/user/credits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits_used: newUsed }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Failed to update credits:', error);
    }
    return true;
  };

  const handleAnalyzePulse = async () => {
    if (!pulseInput.trim() || !activeSpace) return;
    setIsAnalyzingPulse(true);
    
    try {
      const prompt = `The user is building a project called "${activeSpace.name}" (${activeSpace.platform}). 
      They just reported this progress: "${pulseInput}".
      Based on their existing features: ${activeSpace.ideas.map(i => i.title).join(', ')}.
      Analyze their progress and return a JSON object with a brief encouraging summary and an estimated overall completion percentage.
      Return ONLY valid JSON: { "summary": "...", "percentage": 45 }`;
      
      const data = await callGemini(prompt, "You are an expert technical project manager and agile coach.");
      
      // We could save this to the space, but for now let's just show an alert or update a local state.
      // To make it simple, we'll just alert the user with the AI's response.
      alert(`Project Pulse Analysis:\n\n${data.summary}\n\nEstimated Completion: ${data.percentage}%`);
      setPulseInput('');
    } catch (error) {
      console.error("Failed to analyze pulse:", error);
      alert("Failed to analyze progress. Please try again.");
    } finally {
      setIsAnalyzingPulse(false);
    }
  };

  const handleExport = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `vibeplan_spaces_${dateStr}_${timeStr}.json`;

    const data = JSON.stringify({ spaces, credits, exportDate: now.toISOString(), version: "1.4" }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('processing');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.spaces) {
          setSpaces(json.spaces);
          if (json.credits) setCredits(prev => ({ ...prev, ...json.credits }));
          setImportStatus('success');
          setTimeout(() => { setImportStatus(null); setView('projects'); }, 1500);
        } else throw new Error("Invalid structure");
      } catch (err) { 
        setImportStatus('error');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setGeneratedIcon(base64);
    };
    reader.readAsDataURL(file);
  };

  const activeColor = (space: Space | null) => ACCENT_COLORS.find(c => c.name === space?.color) || ACCENT_COLORS[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-base)' }}>
        <VibePlanIcon size={56} variant={isDark ? 'dark' : 'light'} />
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <nav className="sticky top-0 z-50 px-8 py-4 flex justify-between items-center transition-all" style={{ background: 'var(--bg-overlay)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', borderBottom: '1px solid var(--border-subtle)', boxShadow: '0 1px 0 var(--border-subtle)' }}>
        <div className="flex items-center gap-6">
          <div onClick={() => setView('projects')} className="flex items-center gap-3 cursor-pointer group">
            <div className="group-hover:scale-105 transition-all duration-300">
              <VibePlanIcon size={40} variant={isDark ? 'dark' : 'light'} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>VibePlan</span>
              <span className="text-[10px] font-bold uppercase tracking-widest mt-1 brand-gradient-text">Version 1.4</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          <button 
            onClick={() => setIsBlurtModeOpen(true)} 
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <Mic size={14} />
            <span>Blurt</span>
          </button>
          <button 
            onClick={() => setView('vault')} 
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300"
            style={view === 'vault' ? {
              background: 'var(--brand-gradient)',
              color: 'white',
              boxShadow: 'var(--shadow-brand)',
            } : {
              background: 'var(--bg-elevated)',
              color: 'var(--text-tertiary)',
              border: '1px solid var(--border-default)',
            }}
          >
            <Database size={14} />
            <span>Data Vault</span>
          </button>
        </div>
      </nav>

      <main className="px-6 py-12 max-w-6xl mx-auto">
        {view === 'projects' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-end pb-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Workspaces</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] mt-1" style={{ color: 'var(--text-muted)' }}>Environment Selection</p>
              </div>
              <button onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest transition-colors" style={{ color: 'var(--text-muted)' }}>
                {showArchived ? <Eye size={12} className="text-teal-500"/> : <EyeOff size={12}/>} {showArchived ? 'Active Spaces' : 'Archived Spaces'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <button onClick={() => setView('new_project')} className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border border-dashed transition-all group h-[120px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--accent-glow)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}><Plus size={20} /></div>
                <span className="font-bold text-[10px] uppercase tracking-[0.2em]">New Space</span>
              </button>
              
              <AnimatePresence mode="popLayout">
                {spaces.filter(p => showArchived ? p.archived : !p.archived).map((p) => {
                  const colorSet = activeColor(p);
                  return (
                    <motion.div 
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative h-[120px] group"
                    >
                      {/* Action Layer (Behind) */}
                      <div className="absolute inset-0 flex justify-end overflow-hidden rounded-2xl">
                        <div className="flex h-full">
                          <button 
                            onClick={() => { setEditingSpace(p); setView('edit_space'); }}
                            className="w-16 h-full text-white flex flex-col items-center justify-center gap-1 transition-colors" style={{ background: 'var(--accent-primary)' }}
                          >
                            <Edit2 size={18} />
                            <span className="text-[8px] font-bold uppercase">Edit</span>
                          </button>
                          <button 
                            onClick={() => handleArchiveSpace(p)}
                            className="w-16 h-full bg-amber-500 text-white flex flex-col items-center justify-center gap-1 hover:bg-amber-600 transition-colors"
                          >
                            <Archive size={18} />
                            <span className="text-[8px] font-bold uppercase">{p.archived ? 'Unarchive' : 'Archive'}</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteSpace(p.id)}
                            className="w-16 h-full bg-rose-500 text-white flex flex-col items-center justify-center gap-1 hover:bg-rose-600 transition-colors"
                          >
                            <Trash2 size={18} />
                            <span className="text-[8px] font-bold uppercase">Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Foreground Card */}
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: -192, right: 0 }}
                        dragElastic={0.1}
                        whileTap={{ cursor: "grabbing" }}
                        className="absolute inset-0 rounded-2xl transition-colors z-10 cursor-grab flex" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                      >
                        <div className="flex-1 flex h-full">
                          {/* Main Clickable Area: Roadmap */}
                          <div 
                            onClick={() => { setActiveSpace(p); setView('roadmap'); }} 
                            className="flex-1 p-5 flex items-center gap-4"
                          >
                            <div className={`w-12 h-12 rounded-xl ${colorSet.light} flex items-center justify-center border border-slate-100 text-2xl overflow-hidden shrink-0`}>
                              {p.icon.startsWith('data:') ? (
                                <img src={p.icon} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                p.icon
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-bold truncate transition-colors" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{p.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] font-bold ${colorSet.text} uppercase tracking-tighter ${colorSet.light} px-1.5 py-0.5 rounded`}>{p.platform}</span>
                                <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{p.ideas.length} Vibes</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {view === 'roadmap' && activeSpace && (
          <div className="space-y-6 animate-in fade-in duration-400">
            <div className="flex items-center justify-between">
              <button onClick={() => setView('projects')} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                <ArrowLeft size={16} /> Exit Workspace
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => { setEditingSpace(activeSpace); setView('edit_space'); }} className="btn-ghost flex items-center gap-3 px-5 py-2.5">
                  <Edit2 size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Edit Space</span>
                </button>
                <button onClick={() => { setExpansionTarget(null); setView('swipe_suggestions'); }} className="btn-ghost flex items-center gap-3 px-5 py-2.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Discover</span>
                </button>
                <button onClick={() => setView('new_idea')} className="btn-primary flex items-center gap-3 px-5 py-2.5">
                  <Zap size={14} className="fill-white/20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Log Vibe</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-4 space-y-4">
                <header className="p-8 rounded-2xl relative overflow-hidden card">
                   <div className={`absolute top-0 right-0 w-32 h-32 ${activeColor(activeSpace).light} rounded-full -mr-16 -mt-16 opacity-50`} />
                    <div className="relative z-10">
                      <div className="text-4xl mb-4 p-2 inline-block rounded-xl overflow-hidden w-16 h-16 flex items-center justify-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                        {activeSpace.icon.startsWith('data:') ? (
                          <img src={activeSpace.icon} alt={activeSpace.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          activeSpace.icon
                        )}
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{activeSpace.name}</h2>
                      <p className={`text-[10px] ${activeColor(activeSpace).text} font-bold uppercase tracking-widest mt-1`}>Network: {activeSpace.platform}</p>
                      
                      <div className="mt-8 pt-6 grid grid-cols-2 gap-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Vibes</span>
                            <span className={`text-2xl font-bold font-mono ${activeColor(activeSpace).text}`}>{activeSpace.ideas.length}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Status</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-1 rounded inline-block mt-1" style={{ background: 'rgba(20,180,120,0.12)', color: '#14b478' }}>Stable</span>
                          </div>
                      </div>
                   </div>
                </header>

                <div className="p-6 rounded-2xl card">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Activity size={14} style={{ color: 'var(--accent-primary)' }} />
                    Project Pulse
                  </h3>
                  <div className="space-y-3">
                    <textarea 
                      value={pulseInput}
                      onChange={(e) => setPulseInput(e.target.value)}
                      placeholder="What did you build today?"
                      className="input-base w-full h-24 p-3 text-xs resize-none"
                    />
                    <button 
                      onClick={handleAnalyzePulse}
                      disabled={isAnalyzingPulse || !pulseInput.trim()}
                      className="btn-primary w-full py-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzingPulse ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} 
                      {isAnalyzingPulse ? 'Analyzing...' : 'Analyze Progress'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-span-12 md:col-span-8 space-y-4">
                {activeSpace.ideas.map((idea) => (
                  <div key={idea.id} className="group p-6 rounded-2xl card card-interactive transition-all cursor-pointer relative">
                    <div onClick={() => { setSelectedFeature(idea); setView('detail'); }}>
                      <div className="flex justify-between items-start mb-4">
                        <span className="badge-brand">{idea.type}</span>
                        <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>REF_{idea.id.toString().slice(-4)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold transition-colors" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{idea.title}</h3>
                          <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{idea.summary}</p>
                        </div>
                        {idea.progress && (
                          <div className="ml-4 flex flex-col items-end">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="progress-track w-16 h-1.5">
                                <div className="progress-fill h-full" style={{ width: `${idea.progress.percentage}%` }} />
                              </div>
                              <span className="text-[10px] font-mono font-bold brand-gradient-text">{idea.progress.percentage}%</span>
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Implemented</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setExpansionTarget(idea); 
                        setView('swipe_suggestions'); 
                      }} 
                      className="absolute top-4 right-4 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
                    >
                      <Sparkles size={12} className="text-amber-400" />
                      <span className="text-[8px] font-bold uppercase tracking-widest">Scan Vibe</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'progress_pulse' && selectedFeature && activeSpace && (
          <ProgressPulse 
            activeSpace={activeSpace}
            selectedFeature={selectedFeature}
            onUpdate={async (progressData) => {
              if (await useCredit()) {
                try {
                  await fetch(`${API_BASE}/api/ideas/${selectedFeature.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ progress: progressData }),
                    credentials: 'include'
                  });
                  
                  const updatedIdeas = activeSpace.ideas.map(i => i.id === selectedFeature.id ? { ...i, progress: progressData } : i);
                  const updatedSpaces = spaces.map(s => s.id === activeSpace.id ? { ...s, ideas: updatedIdeas } : s);
                  setSpaces(updatedSpaces);
                  setActiveSpace(updatedSpaces.find(s => s.id === activeSpace.id) || null);
                  setSelectedFeature(updatedIdeas.find(i => i.id === selectedFeature.id) || null);
                  setView('detail');
                } catch (error) {
                  console.error('Failed to update idea progress:', error);
                }
              }
            }}
            onCancel={() => setView('detail')}
          />
        )}

        {view === 'detail' && selectedFeature && activeSpace && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-400">
            <div className="flex items-center justify-between">
              <button onClick={() => setView('roadmap')} className="flex items-center gap-2 transition-all" style={{ color: 'var(--text-tertiary)' }}><ArrowLeft size={16}/> <span className="text-[10px] font-bold uppercase tracking-widest">Back to Space</span></button>
              <div className="flex items-center gap-3">
                <button onClick={() => { setExpansionTarget(selectedFeature); setView('swipe_suggestions'); }} className="btn-ghost flex items-center gap-3 px-5 py-2.5">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Scan Vibe</span>
                </button>
                <button onClick={() => setView('progress_pulse')} className="btn-ghost flex items-center gap-3 px-5 py-2.5">
                  <Activity size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Check Progress</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-8">
              <header className="pb-6 flex justify-between items-end" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <div>
                  <span className={`px-2 py-0.5 ${activeColor(activeSpace).bg} text-white rounded text-[9px] font-bold uppercase tracking-widest shadow-sm`}>{selectedFeature.type}</span>
                  <h2 className="text-4xl font-bold tracking-tight leading-none mt-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{selectedFeature.title}</h2>
                </div>
                {selectedFeature.progress && (
                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <div className="progress-track w-32 h-2">
                        <div className="progress-fill h-full" style={{ width: `${selectedFeature.progress.percentage}%` }} />
                      </div>
                      <span className="text-2xl font-mono font-bold brand-gradient-text">{selectedFeature.progress.percentage}%</span>
                    </div>
                    <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>Implementation Status</p>
                  </div>
                )}
              </header>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 space-y-6">
                  <div className="p-8 rounded-2xl card text-base leading-relaxed font-medium" style={{ color: 'var(--text-secondary)', borderLeft: '4px solid var(--accent-primary)' }}>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Requirement Vibe</h4>
                    {selectedFeature.summary}
                  </div>
                  
                  {selectedFeature.progress && (
                    <div className="p-8 rounded-2xl space-y-4" style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-glow-strong)' }}>
                       <h4 className="text-[10px] font-bold uppercase tracking-widest brand-gradient-text">Implementation Review</h4>
                       <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>"{selectedFeature.progress.summary}"</p>
                       {selectedFeature.progress.missing && selectedFeature.progress.missing.length > 0 && (
                         <div className="space-y-2">
                            <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Missing Blocks:</span>
                            <div className="flex flex-wrap gap-2">
                              {selectedFeature.progress.missing.map((m, i) => (
                                <span key={i} className="px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: '#f43f5e' }}>
                                  <AlertCircle size={10} /> {m}
                                </span>
                              ))}
                            </div>
                         </div>
                       )}
                    </div>
                  )}
                </div>
                <div className="md:col-span-5 h-[500px] shadow-lg shadow-slate-100 rounded-2xl">
                  <Mermaid chart={selectedFeature.mermaid} title={selectedFeature.title} />
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'vault' && (
          <div className="max-w-xl mx-auto space-y-12 animate-in fade-in duration-500 text-center">
            <header className="space-y-2">
               <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--brand-gradient-soft)', color: 'var(--accent-primary)'  }}><Database size={32} /></div>
               <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>System Data Terminal</h2>
               <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Portable Space Serialization</p>
            </header>
            <div className="grid grid-cols-1 gap-4 text-left">
              <button onClick={handleExport} className="group w-full flex items-center justify-between p-6 rounded-2xl card card-interactive transition-all">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform brand-gradient-text">Export Space Map</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Save current spaces with timestamp</span>
                </div>
                <Download size={20} style={{ color: 'var(--text-muted)' }} />
              </button>
              <label className="group w-full flex items-center justify-between p-6 rounded-2xl card card-interactive transition-all cursor-pointer">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-teal-600 group-hover:translate-x-1 transition-transform">
                    {importStatus === 'processing' ? 'Processing...' : importStatus === 'success' ? 'Data Ingested' : importStatus === 'error' ? 'Format Violation' : 'Ingest Space Map'}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Restore architecture from JSON payload</span>
                </div>
                {importStatus === 'processing' ? <Loader2 size={20} className="animate-spin text-teal-500" /> : importStatus === 'success' ? <Sparkles size={20} className="text-teal-500" /> : importStatus === 'error' ? <AlertCircle size={20} className="text-rose-500" /> : <Upload size={20} className="text-slate-300 group-hover:text-teal-600 transition-colors" />}
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleImport} accept=".json" />
              </label>
            </div>
          </div>
        )}

        {view === 'swipe_suggestions' && activeSpace && (
          <FeatureSwiper 
            space={activeSpace}
            baseIdea={expansionTarget || undefined}
            onAccept={async (idea) => {
              if (await useCredit()) {
                try {
                  const res = await fetch(`${API_BASE}/api/spaces/${activeSpace.id}/ideas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...idea, createdAt: new Date().toISOString() }),
                    credentials: 'include'
                  });
                  const { id } = await res.json();
                  const newIdea = { ...idea, id, createdAt: new Date().toISOString() };
                  
                  const updated = spaces.map(p => p.id === activeSpace.id ? { ...p, lastUpdated: new Date().toISOString(), ideas: [newIdea, ...p.ideas] } : p);
                  setSpaces(updated);
                  setActiveSpace(updated.find(p => p.id === activeSpace.id) || null);
                } catch (error) {
                  console.error('Failed to save idea:', error);
                }
              }
            }}
            onCancel={() => setView('roadmap')}
          />
        )}

        {view === 'new_idea' && activeSpace && <NewIdeaWorkflow project={activeSpace} onSave={async (idea) => {
          if (await useCredit()) {
            try {
              const res = await fetch(`${API_BASE}/api/spaces/${activeSpace.id}/ideas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(idea),
                credentials: 'include'
              });
              const { id } = await res.json();
              const newIdea = { ...idea, id };
              
              const updated = spaces.map(p => p.id === activeSpace.id ? { ...p, lastUpdated: new Date().toISOString(), ideas: [newIdea, ...p.ideas] } : p);
              setSpaces(updated);
              setActiveSpace(updated.find(p => p.id === activeSpace.id) || null);
              setView('roadmap');
            } catch (error) {
              console.error('Failed to save idea:', error);
            }
          }
        }} onCancel={() => setView('roadmap')} />}

        {view === 'edit_space' && editingSpace && (
           <div className="max-w-xl mx-auto space-y-8 animate-in zoom-in-95 duration-400">
              <header className="pb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Configure Space</h2>
                <p className="font-bold uppercase text-[9px] tracking-widest brand-gradient-text">Update System Parameters</p>
              </header>
              <div className="p-8 space-y-8 card">
                 <div className="flex gap-6">
                    <div className="w-24 space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>Icon</label>
                      <div className="relative group/icon">
                        <div className="w-full h-20 rounded-xl flex items-center justify-center text-3xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                          {generatedIcon || (editingSpace.icon.startsWith('data:') ? editingSpace.icon : null) ? (
                            <img src={generatedIcon || editingSpace.icon} alt="Space Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <input id="edit-icon" maxLength={2} className="w-full h-full bg-transparent text-center focus:outline-none" defaultValue={editingSpace.icon} />
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 flex gap-1">
                          <label className="p-1.5 bg-teal-600 text-white rounded-lg shadow-lg hover:scale-110 transition-all cursor-pointer">
                            <Upload size={12} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleIconUpload} />
                          </label>
                          <button 
                            onClick={async () => {
                              const nameInput = document.getElementById('edit-name') as HTMLInputElement;
                              setIsGeneratingIcon(true);
                              try {
                                const icon = await generateIcon(nameInput.value, iconStyle);
                                setGeneratedIcon(icon);
                              } catch (e) {
                                alert("Failed to generate icon");
                              } finally {
                                setIsGeneratingIcon(false);
                              }
                            }}
                            disabled={isGeneratingIcon}
                            className="p-1.5 text-white rounded-lg hover:scale-110 transition-all disabled:opacity-50 disabled:scale-100" style={{ background: 'var(--accent-primary)' }}
                          >
                            {isGeneratingIcon ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          </button>
                        </div>
                        {(generatedIcon || editingSpace.icon.startsWith('data:')) && (
                          <button 
                            onClick={() => {
                              setGeneratedIcon(null);
                              if (editingSpace.icon.startsWith('data:')) {
                                setEditingSpace({...editingSpace, icon: '🛠️'});
                              }
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-md hover:scale-110 transition-all"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>Namespace</label>
                      <input id="edit-name" className="input-base w-full p-3 text-sm font-bold" defaultValue={editingSpace.name} />
                    </div>
                 </div>
                 <div className="flex gap-6 mt-6">
                    <div className="flex-1 space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>Platform</label>
                      <input id="edit-platform" className="input-base w-full p-3 text-sm font-bold" defaultValue={editingSpace.platform} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>Accent Color</label>
                      <select id="edit-color" className="input-base w-full p-3 text-sm font-bold" defaultValue={editingSpace.color}>
                        {ACCENT_COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>Icon Style / Specification (Optional)</label>
                    <textarea 
                      value={iconStyle}
                      onChange={(e) => setIconStyle(e.target.value)}
                      placeholder="e.g. Cyberpunk style, neon colors, minimalist line art..."
                      className="input-base w-full p-3 text-xs min-h-[60px]"
                    />
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button onClick={async () => {
                       const nameInput = document.getElementById('edit-name') as HTMLInputElement;
                       const iconInput = document.getElementById('edit-icon') as HTMLInputElement;
                       const platformInput = document.getElementById('edit-platform') as HTMLInputElement;
                       const colorInput = document.getElementById('edit-color') as HTMLSelectElement;
                       
                       const name = nameInput.value;
                       const platform = platformInput.value;
                       const color = colorInput.value;
                       const icon = generatedIcon || (editingSpace.icon.startsWith('data:') ? editingSpace.icon : (iconInput?.value || '🛠️'));
                       
                       try {
                         const res = await fetch(`${API_BASE}/api/spaces/${editingSpace.id}`, {
                           method: 'PUT',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ name, icon, platform, color, archived: editingSpace.archived, lastUpdated: new Date().toISOString() }),
                           credentials: 'include'
                         });
                         
                         if (!res.ok) {
                           let errorMessage = 'Failed to update space';
                           try {
                             const errorData = await res.json();
                             errorMessage = errorData.error || errorMessage;
                           } catch (e) {
                             errorMessage = await res.text() || res.statusText || errorMessage;
                           }
                           throw new Error(errorMessage);
                         }
                         
                         setSpaces(spaces.map(s => s.id === editingSpace.id ? { ...s, name, icon, platform, color } : s));
                         setGeneratedIcon(null);
                         setIconStyle('');
                         setView('projects');
                       } catch (error) {
                         console.error('Failed to update space:', error);
                         alert(`Failed to update space: ${error instanceof Error ? error.message : 'Unknown error'}`);
                       }
                    }} className="btn-primary flex-1 py-4">Commit Changes</button>
                    <button onClick={() => { setGeneratedIcon(null); setIconStyle(''); setView('projects'); }} className="btn-ghost px-6 py-4">Cancel</button>
                 </div>
              </div>
           </div>
        )}

        {view === 'new_project' && (
          <div className="max-w-xl mx-auto space-y-8 animate-in zoom-in-95 duration-400">
            <header className="pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Initialize Space</h2>
                <p className="font-bold uppercase text-[9px] tracking-widest brand-gradient-text">New Environment Provisioning</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-glow)', color: 'var(--accent-primary)' }}><Rocket size={18} /></div>
            </header>
            <div className="p-8 space-y-8 card">
              <div className="flex gap-6">
                <div className="w-24 space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>Icon</label>
                  <div className="relative group/icon">
                    <div className="w-full h-20 rounded-xl flex items-center justify-center text-3xl overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                      {generatedIcon ? (
                        <img src={generatedIcon} alt="Generated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <input id="icon-input" maxLength={2} className="w-full h-full bg-transparent text-center focus:outline-none" defaultValue="⚡" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                      <label className="p-1.5 bg-teal-600 text-white rounded-lg shadow-lg hover:scale-110 transition-all cursor-pointer">
                        <Upload size={12} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleIconUpload} />
                      </label>
                      <button 
                        onClick={async () => {
                          const nameInput = document.getElementById('proj-name-input') as HTMLInputElement;
                          if (!nameInput.value) {
                            alert("Enter a space name first to guide the AI");
                            return;
                          }
                          setIsGeneratingIcon(true);
                          try {
                            const icon = await generateIcon(nameInput.value, iconStyle);
                            setGeneratedIcon(icon);
                          } catch (e) {
                            alert("Failed to generate icon");
                          } finally {
                            setIsGeneratingIcon(false);
                          }
                        }}
                        disabled={isGeneratingIcon}
                        className="p-1.5 text-white rounded-lg hover:scale-110 transition-all disabled:opacity-50 disabled:scale-100" style={{ background: 'var(--accent-primary)' }}
                      >
                        {isGeneratingIcon ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      </button>
                    </div>
                    {generatedIcon && (
                      <button 
                        onClick={() => setGeneratedIcon(null)}
                        className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-md hover:scale-110 transition-all"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>Namespace</label>
                  <input id="proj-name-input" autoFocus className="input-base w-full p-3 text-sm font-bold" placeholder="Enter Space Name..." />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>Icon Style / Specification (Optional)</label>
                <textarea 
                  value={iconStyle}
                  onChange={(e) => setIconStyle(e.target.value)}
                  placeholder="e.g. Cyberpunk style, neon colors, minimalist line art..."
                  className="input-base w-full p-3 text-xs min-h-[60px]"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button onClick={async () => {
                  const nameInput = document.getElementById('proj-name-input') as HTMLInputElement;
                  const iconInput = document.getElementById('icon-input') as HTMLInputElement;
                  const val = nameInput?.value;
                  const icon = generatedIcon || iconInput?.value || '🛠️';
                  
                  if (val) {
                    try {
                      const spaceData = { name: val, platform: 'Lovable', icon: icon, color: 'Indigo', archived: false, lastUpdated: new Date().toISOString() };
                      const res = await fetch(`${API_BASE}/api/spaces`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(spaceData),
                        credentials: 'include'
                      });
                      
                      if (!res.ok) {
                        let errorMessage = 'Failed to create space';
                        try {
                          const errorData = await res.json();
                          errorMessage = errorData.error || errorMessage;
                        } catch (e) {
                          errorMessage = await res.text() || res.statusText || errorMessage;
                        }
                        throw new Error(errorMessage);
                      }
                      
                      const { id } = await res.json();
                      
                      setSpaces([{ ...spaceData, id, ideas: [] }, ...spaces]);
                      setGeneratedIcon(null);
                      setIconStyle('');
                      setView('projects');
                    } catch (error) {
                      console.error('Failed to create space:', error);
                      alert(`Failed to create space: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }
                }} className="btn-primary flex-1 py-4">Deploy Workspace</button>
                <button onClick={() => { setGeneratedIcon(null); setIconStyle(''); setView('projects'); }} className="btn-ghost px-6 py-4">Abort</button>
              </div>
            </div>
          </div>
        )}

        {isBlurtModeOpen && (
          <BlurtMode 
            activeSpace={activeSpace} 
            onClose={() => setIsBlurtModeOpen(false)} 
            onComplete={handleBlurtComplete} 
          />
        )}

      </main>
    </div>
  );
}

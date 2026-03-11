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
  Globe
} from 'lucide-react';
import { Space, Idea, Credits, ACCENT_COLORS } from './types';
import Mermaid from './components/Mermaid';
import ProgressPulse from './components/ProgressPulse';
import NewIdeaWorkflow from './components/NewIdeaWorkflow';
import FeatureSwiper from './components/FeatureSwiper';
import { generateIcon } from './services/gemini';

interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture: string;
  credits_used: number;
  monthly_limit: number;
}

export default function App() {
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
  const [expansionTarget, setExpansionTarget] = useState<Idea | null>(null);
  
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

  const fetchUser = async () => {
    try {
      const apiBase = window.location.origin.includes('pages.dev') 
        ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
        : '';
      const res = await fetch(`${apiBase}/api/auth/me`, { credentials: 'include' });
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
      const apiBase = window.location.origin.includes('pages.dev') 
        ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
        : '';
      const res = await fetch(`${apiBase}/api/spaces`, { credentials: 'include' });
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
      // If we are on Cloudflare Pages, we need to point to the AI Studio backend
      const apiBase = window.location.origin.includes('pages.dev') 
        ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
        : '';

      const res = await fetch(`${apiBase}/api/auth/url`, { credentials: 'include' });
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
      const apiBase = window.location.origin.includes('pages.dev') 
        ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
        : '';
      
      const endpoint = authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body = authMode === 'signup' ? { email, password, name } : { email, password };

      const res = await fetch(`${apiBase}${endpoint}`, {
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
      const apiBase = window.location.origin.includes('pages.dev') 
        ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
        : '';
      await fetch(`${apiBase}/api/auth/logout`, { 
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
      const apiBase = window.location.origin.includes('pages.dev') 
        ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
        : '';
      await fetch(`${apiBase}/api/user/credits`, {
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

  const activeColor = (space: Space | null) => ACCENT_COLORS.find(c => c.name === space?.color) || ACCENT_COLORS[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div onClick={() => setView('projects')} className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 rounded flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Terminal className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tighter uppercase text-slate-800">VibePlan <span className="text-indigo-400 font-medium">v1.4</span></span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-4 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Credits: {credits.monthlyLimit - credits.usedThisMonth}/{credits.monthlyLimit}</span>
             </div>
             <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${((credits.monthlyLimit - credits.usedThisMonth) / credits.monthlyLimit) * 100}%` }}></div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-200">
                  {user.name.charAt(0)}
                </div>
              )}
              <button onClick={handleLogout} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors">Logout</button>
            </div>
          )}
          <button onClick={() => setView('credit_settings')} className="flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 rounded text-teal-600 hover:bg-teal-100 transition-colors text-[9px] font-bold uppercase tracking-tighter">
            <Clock size={12} /> Reset: {resetTimer}
          </button>
          <button onClick={() => setView('vault')} className={`p-2 rounded-lg transition-all ${view === 'vault' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}><Database size={18} /></button>
        </div>
      </nav>

      <main className="px-6 py-12 max-w-6xl mx-auto">
        {view === 'projects' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-end border-b border-slate-200 pb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Workspaces</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-1">Environment Selection</p>
              </div>
              <button onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                {showArchived ? <Eye size={12} className="text-teal-500"/> : <EyeOff size={12}/>} {showArchived ? 'Active Spaces' : 'Archived Spaces'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <button onClick={() => setView('new_project')} className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border border-dashed border-slate-300 bg-white/50 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all group">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:border-indigo-100"><Plus size={20} /></div>
                <span className="font-bold text-[10px] uppercase tracking-[0.2em]">New Space</span>
              </button>
              {spaces.filter(p => showArchived ? p.archived : !p.archived).map((p) => {
                const colorSet = activeColor(p);
                return (
                  <div key={p.id} className="group relative bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                    <div onClick={() => { setActiveSpace(p); setView('roadmap'); }} className="p-6 cursor-pointer">
                      <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colorSet.light} flex items-center justify-center border border-slate-100 text-2xl group-hover:scale-110 transition-transform overflow-hidden`}>
                        {p.icon.startsWith('data:') ? (
                          <img src={p.icon} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          p.icon
                        )}
                      </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base font-bold text-slate-900 truncate group-hover:${colorSet.text} transition-colors`}>{p.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-bold ${colorSet.text} uppercase tracking-tighter ${colorSet.light} px-1.5 py-0.5 rounded`}>{p.platform}</span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase">{p.ideas.length} Vibes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setEditingSpace(p); setView('edit_space'); }} className="absolute bottom-4 right-4 p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100">
                      <Edit2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'roadmap' && activeSpace && (
          <div className="space-y-6 animate-in fade-in duration-400">
            <div className="flex items-center justify-between">
              <button onClick={() => setView('projects')} className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-indigo-600 transition-all text-[10px] font-bold uppercase tracking-widest">
                <ArrowLeft size={16} /> Exit Workspace
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => { setExpansionTarget(null); setView('swipe_suggestions'); }} className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 text-indigo-600 rounded-lg shadow-sm hover:bg-slate-50 transition-all">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Discover</span>
                </button>
                <button disabled={credits.usedThisMonth >= credits.monthlyLimit} onClick={() => setView('new_idea')} className={`flex items-center gap-3 px-5 py-2.5 rounded-lg shadow-lg shadow-indigo-200 transition-all ${credits.usedThisMonth >= credits.monthlyLimit ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-[1.02] active:scale-95'}`}>
                  <Zap size={14} className="fill-white/20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{credits.usedThisMonth >= credits.monthlyLimit ? 'Limit Reached' : 'Log Vibe'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-4 space-y-4">
                <header className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                   <div className={`absolute top-0 right-0 w-32 h-32 ${activeColor(activeSpace).light} rounded-full -mr-16 -mt-16 opacity-50`} />
                    <div className="relative z-10">
                      <div className="text-4xl mb-4 p-2 bg-slate-50 inline-block rounded-xl border border-slate-100 overflow-hidden w-16 h-16 flex items-center justify-center">
                        {activeSpace.icon.startsWith('data:') ? (
                          <img src={activeSpace.icon} alt={activeSpace.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          activeSpace.icon
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{activeSpace.name}</h2>
                      <p className={`text-[10px] ${activeColor(activeSpace).text} font-bold uppercase tracking-widest mt-1`}>Network: {activeSpace.platform}</p>
                      
                      <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vibes</span>
                            <span className={`text-2xl font-bold font-mono ${activeColor(activeSpace).text}`}>{activeSpace.ideas.length}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                            <span className="text-[10px] font-bold text-teal-500 uppercase bg-teal-50 px-2 py-1 rounded inline-block mt-1">Stable</span>
                          </div>
                      </div>
                   </div>
                </header>
              </div>
              <div className="col-span-12 md:col-span-8 space-y-4">
                {activeSpace.ideas.map((idea) => (
                  <div key={idea.id} className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/10 transition-all cursor-pointer relative">
                    <div onClick={() => { setSelectedFeature(idea); setView('detail'); }}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-0.5 rounded ${activeColor(activeSpace).light} text-[9px] font-bold uppercase ${activeColor(activeSpace).text} border border-slate-100`}>{idea.type}</span>
                        <span className="text-[9px] font-mono text-slate-300">REF_{idea.id.toString().slice(-4)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{idea.title}</h3>
                          <p className="text-slate-500 text-xs mt-2 line-clamp-2">{idea.summary}</p>
                        </div>
                        {idea.progress && (
                          <div className="ml-4 flex flex-col items-end">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${idea.progress.percentage}%` }} />
                              </div>
                              <span className="text-[10px] font-mono font-bold text-indigo-600">{idea.progress.percentage}%</span>
                            </div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Implemented</span>
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
                      className="absolute top-4 right-4 p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2"
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
                  const apiBase = window.location.origin.includes('pages.dev') 
                    ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
                    : '';
                  await fetch(`${apiBase}/api/ideas/${selectedFeature.id}`, {
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
              <button onClick={() => setView('roadmap')} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all"><ArrowLeft size={16}/> <span className="text-[10px] font-bold uppercase tracking-widest">Back to Space</span></button>
              <div className="flex items-center gap-3">
                <button onClick={() => { setExpansionTarget(selectedFeature); setView('swipe_suggestions'); }} className="flex items-center gap-3 px-5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Scan Vibe</span>
                </button>
                <button onClick={() => setView('progress_pulse')} className="flex items-center gap-3 px-5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm">
                  <Activity size={14} className="text-indigo-600" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Check Progress</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-8">
              <header className="border-b border-slate-200 pb-6 flex justify-between items-end">
                <div>
                  <span className={`px-2 py-0.5 ${activeColor(activeSpace).bg} text-white rounded text-[9px] font-bold uppercase tracking-widest shadow-sm`}>{selectedFeature.type}</span>
                  <h2 className="text-4xl font-bold tracking-tight text-slate-900 leading-none mt-4">{selectedFeature.title}</h2>
                </div>
                {selectedFeature.progress && (
                  <div className="text-right">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${selectedFeature.progress.percentage}%` }} />
                      </div>
                      <span className="text-2xl font-mono font-bold text-indigo-600">{selectedFeature.progress.percentage}%</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Implementation Status</p>
                  </div>
                )}
              </header>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 space-y-6">
                  <div className={`p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-base leading-relaxed text-slate-600 font-medium border-l-4 ${activeColor(activeSpace).border}`}>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Requirement Vibe</h4>
                    {selectedFeature.summary}
                  </div>
                  
                  {selectedFeature.progress && (
                    <div className="p-8 bg-indigo-50/30 rounded-2xl border border-indigo-100 space-y-4">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Implementation Review</h4>
                       <p className="text-sm text-slate-700 italic">"{selectedFeature.progress.summary}"</p>
                       {selectedFeature.progress.missing && selectedFeature.progress.missing.length > 0 && (
                         <div className="space-y-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Missing Blocks:</span>
                            <div className="flex flex-wrap gap-2">
                              {selectedFeature.progress.missing.map((m, i) => (
                                <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-rose-500 flex items-center gap-1">
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
               <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner"><Database size={32} /></div>
               <h2 className="text-2xl font-bold tracking-tight text-slate-900">System Data Terminal</h2>
               <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Portable Space Serialization</p>
            </header>
            <div className="grid grid-cols-1 gap-4 text-left">
              <button onClick={handleExport} className="group w-full flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-600 group-hover:translate-x-1 transition-transform">Export Space Map</span>
                  <span className="text-[10px] text-slate-400">Save current spaces with timestamp</span>
                </div>
                <Download size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </button>
              <label className={`group w-full flex items-center justify-between p-6 bg-white border rounded-2xl transition-all cursor-pointer ${importStatus === 'success' ? 'border-teal-500 bg-teal-50/30' : importStatus === 'error' ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/5'}`}>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-teal-600 group-hover:translate-x-1 transition-transform">
                    {importStatus === 'processing' ? 'Processing...' : importStatus === 'success' ? 'Data Ingested' : importStatus === 'error' ? 'Format Violation' : 'Ingest Space Map'}
                  </span>
                  <span className="text-[10px] text-slate-400">Restore architecture from JSON payload</span>
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
                  const apiBase = window.location.origin.includes('pages.dev') 
                    ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
                    : '';
                  const res = await fetch(`${apiBase}/api/spaces/${activeSpace.id}/ideas`, {
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
              const apiBase = window.location.origin.includes('pages.dev') 
                ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
                : '';
              const res = await fetch(`${apiBase}/api/spaces/${activeSpace.id}/ideas`, {
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
              <header className="border-b border-slate-200 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Configure Space</h2>
                <p className="text-indigo-400 font-bold uppercase text-[9px] tracking-widest">Update System Parameters</p>
              </header>
              <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-8">
                 <div className="flex gap-6">
                    <div className="w-20 space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1">ID</label>
                      <input id="edit-icon" maxLength={2} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl focus:bg-white outline-none" defaultValue={editingSpace.icon} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1">Namespace</label>
                      <input id="edit-name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white outline-none" defaultValue={editingSpace.name} />
                    </div>
                 </div>
                 <div className="pt-4 flex gap-3">
                    <button onClick={async () => {
                       const nameInput = document.getElementById('edit-name') as HTMLInputElement;
                       const iconInput = document.getElementById('edit-icon') as HTMLInputElement;
                       const name = nameInput.value;
                       const icon = iconInput.value;
                       
                       try {
                         const apiBase = window.location.origin.includes('pages.dev') 
                           ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
                           : '';
                         await fetch(`${apiBase}/api/spaces/${editingSpace.id}`, {
                           method: 'PUT',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ name, icon, archived: editingSpace.archived, lastUpdated: new Date().toISOString() }),
                           credentials: 'include'
                         });
                         
                         setSpaces(spaces.map(s => s.id === editingSpace.id ? { ...s, name, icon } : s));
                         setView('projects');
                       } catch (error) {
                         console.error('Failed to update space:', error);
                       }
                    }} className="flex-1 py-4 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-lg">Commit Changes</button>
                    <button onClick={() => setView('projects')} className="px-6 py-4 bg-white text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-slate-200">Cancel</button>
                 </div>
              </div>
           </div>
        )}

        {view === 'new_project' && (
          <div className="max-w-xl mx-auto space-y-8 animate-in zoom-in-95 duration-400">
            <header className="border-b border-slate-200 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Initialize Space</h2>
                <p className="text-indigo-400 font-bold uppercase text-[9px] tracking-widest">New Environment Provisioning</p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500"><Rocket size={18} /></div>
            </header>
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/50 space-y-8">
              <div className="flex gap-6">
                <div className="w-24 space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1">Icon</label>
                  <div className="relative group/icon">
                    <div className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-3xl overflow-hidden">
                      {generatedIcon ? (
                        <img src={generatedIcon} alt="Generated" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <input id="icon-input" maxLength={2} className="w-full h-full bg-transparent text-center focus:outline-none" defaultValue="⚡" />
                      )}
                    </div>
                    <button 
                      onClick={async () => {
                        const nameInput = document.getElementById('proj-name-input') as HTMLInputElement;
                        if (!nameInput.value) {
                          alert("Enter a space name first to guide the AI");
                          return;
                        }
                        setIsGeneratingIcon(true);
                        try {
                          const icon = await generateIcon(nameInput.value);
                          setGeneratedIcon(icon);
                        } catch (e) {
                          alert("Failed to generate icon");
                        } finally {
                          setIsGeneratingIcon(false);
                        }
                      }}
                      disabled={isGeneratingIcon}
                      className="absolute -bottom-2 -right-2 p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg hover:scale-110 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      {isGeneratingIcon ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    </button>
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
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-1">Namespace</label>
                  <input id="proj-name-input" autoFocus className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:outline-none transition-all" placeholder="Enter Space Name..." />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={async () => {
                  const nameInput = document.getElementById('proj-name-input') as HTMLInputElement;
                  const iconInput = document.getElementById('icon-input') as HTMLInputElement;
                  const val = nameInput.value;
                  const icon = generatedIcon || iconInput?.value || '🛠️';
                  
                  if (val) {
                    try {
                      const apiBase = window.location.origin.includes('pages.dev') 
                        ? 'https://ais-dev-73vzfbuac6sfbv2mnnolhm-170379606144.asia-southeast1.run.app' 
                        : '';
                      const spaceData = { name: val, platform: 'Lovable', icon: icon, color: 'Indigo', archived: false, lastUpdated: new Date().toISOString() };
                      const res = await fetch(`${apiBase}/api/spaces`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(spaceData),
                        credentials: 'include'
                      });
                      const { id } = await res.json();
                      
                      setSpaces([{ ...spaceData, id, ideas: [] }, ...spaces]);
                      setGeneratedIcon(null);
                      setView('projects');
                    } catch (error) {
                      console.error('Failed to create space:', error);
                    }
                  }
                }} className="flex-1 py-4 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">Deploy Workspace</button>
                <button onClick={() => { setGeneratedIcon(null); setView('projects'); }} className="px-6 py-4 bg-white text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-slate-200">Abort</button>
              </div>
            </div>
          </div>
        )}

        {view === 'credit_settings' && (
           <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-top-4 duration-500">
              <header className="text-center space-y-2">
                 <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldAlert size={32} /></div>
                 <h2 className="text-2xl font-bold">Resource Governance</h2>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Global Credit Allocation</p>
              </header>
              <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-xl shadow-indigo-500/5 space-y-10">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-500">Monthly Limit</label>
                       <input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-lg font-mono font-bold focus:bg-white outline-none" value={credits.monthlyLimit} onChange={e => setCredits({...credits, monthlyLimit: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-500">Reset Date</label>
                       <input type="number" min="1" max="31" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-lg font-mono font-bold focus:bg-white outline-none" value={credits.resetDay} onChange={e => setCredits({...credits, resetDay: parseInt(e.target.value)})} />
                    </div>
                 </div>
                 <button onClick={() => setView('projects')} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-lg shadow-slate-200">Save Protocol</button>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}

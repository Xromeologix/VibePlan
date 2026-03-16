import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { X, Check, RefreshCw, Sparkles, Loader2, ArrowUp } from 'lucide-react';
import { Idea, Space } from '../types';
import { callGemini } from '../services/gemini';

interface FeatureSwiperProps {
  space: Space;
  baseIdea?: Idea;
  onAccept: (idea: any) => void;
  onCancel: () => void;
}

export default function FeatureSwiper({ space, baseIdea, onAccept, onCancel }: FeatureSwiperProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReimagining, setIsReimagining] = useState(false);

  useEffect(() => {
    generateSuggestions();
  }, [baseIdea]);

  const generateSuggestions = async () => {
    setLoading(true);
    const existingTitles = space.ideas.map(i => i.title).join(", ");
    
    let prompt = "";
    if (baseIdea) {
      prompt = `Based on the workspace "${space.name}" and the specific feature "${baseIdea.title}" (${baseIdea.summary}), suggest 5 unique ways to EXPAND or SUB-DIVIDE this feature into more detailed modules or related capabilities. 
      Return ONLY a JSON array of objects: [{ "title": "...", "summary": "...", "mermaid": "graph TD\\n...", "type": "Module|API|UI|Logic", "personas": { "ux": { "score": 85, "comment": "..." }, "pm": { "score": 90, "comment": "..." }, "tech": { "score": 70, "comment": "..." } } }]`;
    } else {
      prompt = `Based on the workspace "${space.name}" (${space.platform}) and existing features [${existingTitles}], suggest 5 unique, creative, and technical feature ideas. 
      Return ONLY a JSON array of objects: [{ "title": "...", "summary": "...", "mermaid": "graph TD\\n...", "type": "Module|API|UI|Logic", "personas": { "ux": { "score": 85, "comment": "..." }, "pm": { "score": 90, "comment": "..." }, "tech": { "score": 70, "comment": "..." } } }]`;
    }
    
    try {
      const data = await callGemini(prompt, "You are a creative product architect. Return valid JSON only.");
      if (Array.isArray(data)) {
        setSuggestions(data);
      } else if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error("Failed to generate suggestions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
    const currentFeature = suggestions[currentIndex];
    
    if (direction === 'right') {
      onAccept(currentFeature);
      nextCard();
    } else if (direction === 'left') {
      nextCard();
    } else if (direction === 'up') {
      reimagineFeature(currentFeature);
    }
  };

  const reimagineFeature = async (feature: any) => {
    setIsReimagining(true);
    const prompt = `Reimagine this feature idea for "${space.name}": "${feature.title} - ${feature.summary}". 
    Make it more innovative or take a different technical approach.
    Return ONLY a JSON object: { "title": "...", "summary": "...", "mermaid": "graph TD\\n...", "type": "Module|API|UI|Logic", "personas": { "ux": { "score": 85, "comment": "..." }, "pm": { "score": 90, "comment": "..." }, "tech": { "score": 70, "comment": "..." } } }`;
    
    try {
      const data = await callGemini(prompt, "You are a creative product architect. Return valid JSON only.");
      const newSuggestions = [...suggestions];
      newSuggestions[currentIndex] = data;
      setSuggestions(newSuggestions);
    } catch (e) {
      console.error("Failed to reimagine:", e);
    } finally {
      setIsReimagining(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < suggestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Load more or finish
      generateSuggestions();
      setCurrentIndex(0);
    }
  };

  if (loading && suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] space-y-6">
        <div className="relative">
          <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
          <Loader2 className="animate-spin text-indigo-600 relative" size={48} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-900">Scanning the Vibe...</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">Generating AI Suggestions</p>
        </div>
      </div>
    );
  }

  const currentFeature = suggestions[currentIndex];

  return (
    <div className="max-w-md mx-auto h-[700px] flex flex-col relative">
      <header className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{baseIdea ? 'Vibe Expander' : 'Vibe Matcher'}</h2>
        <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-[0.4em] mt-1">
          {baseIdea ? `Expanding: ${baseIdea.title}` : 'Swipe to build your roadmap'}
        </p>
      </header>

      <div className="flex-1 relative perspective-1000">
        <AnimatePresence mode="popLayout">
          {currentFeature && (
            <SwipeCard 
              key={currentIndex}
              feature={currentFeature}
              onSwipe={handleSwipe}
              isReimagining={isReimagining}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center items-center gap-8 mt-8 pb-4">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-rose-500 shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <X size={24} />
        </button>
        <button 
          onClick={() => handleSwipe('up')}
          className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-amber-500 shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <RefreshCw size={20} className={isReimagining ? 'animate-spin' : ''} />
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-emerald-500 shadow-lg hover:scale-110 active:scale-95 transition-all"
        >
          <Check size={24} />
        </button>
      </div>
      
      <button 
        onClick={onCancel}
        className="mt-4 text-center text-slate-400 font-bold text-[9px] uppercase tracking-widest hover:text-slate-600"
      >
        Exit Discovery Mode
      </button>

      <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-10 pointer-events-none opacity-40">
        <div className="flex flex-col items-center gap-1">
          <X size={12} className="text-rose-500" />
          <span className="text-[7px] font-bold uppercase tracking-tighter">Reject</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ArrowUp size={12} className="text-amber-500" />
          <span className="text-[7px] font-bold uppercase tracking-tighter">Reimagine</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Check size={12} className="text-emerald-500" />
          <span className="text-[7px] font-bold uppercase tracking-tighter">Accept</span>
        </div>
      </div>
    </div>
  );
}

function SwipeCard({ feature, onSwipe, isReimagining }: { feature: any, onSwipe: (dir: 'left' | 'right' | 'up') => void, isReimagining: boolean, key?: any }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  
  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    } else if (info.offset.y < -100) {
      onSwipe('up');
    }
  };

  return (
    <motion.div
      style={{ x, y, rotate, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ 
        x: x.get() > 0 ? 500 : x.get() < 0 ? -500 : 0,
        y: y.get() < -50 ? -500 : 0,
        opacity: 0,
        scale: 0.5,
        transition: { duration: 0.3 }
      }}
      className="absolute inset-0 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing flex flex-col"
    >
      <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      
      <div className="p-8 flex-1 flex flex-col space-y-6">
        <div className="flex justify-between items-start">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
            {feature.type}
          </span>
          <Sparkles className="text-amber-400 animate-pulse" size={20} />
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-slate-900 leading-tight">{feature.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-4">
            {feature.summary}
          </p>
        </div>

        {feature.personas && (
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expert Arbitration</div>
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">UX</div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-700 uppercase">UX Designer</span>
                  <span className={`text-[10px] font-bold ${feature.personas.ux?.score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{feature.personas.ux?.score}/100</span>
                </div>
                <p className="text-xs text-slate-500 leading-snug">{feature.personas.ux?.comment}</p>
              </div>
            </div>

            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">PM</div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-700 uppercase">Product Manager</span>
                  <span className={`text-[10px] font-bold ${feature.personas.pm?.score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{feature.personas.pm?.score}/100</span>
                </div>
                <p className="text-xs text-slate-500 leading-snug">{feature.personas.pm?.comment}</p>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0">TL</div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-700 uppercase">Tech Lead</span>
                  <span className={`text-[10px] font-bold ${feature.personas.tech?.score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{feature.personas.tech?.score}/100</span>
                </div>
                <p className="text-xs text-slate-500 leading-snug">{feature.personas.tech?.comment}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isReimagining && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
          <span className="font-bold text-[9px] uppercase tracking-[0.3em] text-indigo-600 animate-pulse">Reimagining Vibe...</span>
        </div>
      )}
      
      <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">AI Optimized</span>
        </div>
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Swipe to Decide</span>
      </div>
    </motion.div>
  );
}

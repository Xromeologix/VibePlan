import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Sparkles, X, Loader2 } from 'lucide-react';
import { Space } from '../types';
import { processBlurt } from '../services/gemini';

interface BlurtModeProps {
  activeSpace: Space | null;
  onClose: () => void;
  onComplete: (result: any) => void;
}

const HASHTAGS = [
  '#synthesizing_vibes', 
  '#mapping_architecture', 
  '#routing_logic', 
  '#generating_ui', 
  '#arbitrating_personas', 
  '#compiling_nodes',
  '#analyzing_context',
  '#structuring_data'
];

export default function BlurtMode({ activeSpace, onClose, onComplete }: BlurtModeProps) {
  const [isListening, setIsListening] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentTag, setCurrentTag] = useState(HASHTAGS[0]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'aborted' || event.error === 'no-speech') {
          // Ignore these common non-fatal errors
          return;
        }
        console.error("Speech recognition error\n" + event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone access to use Blurt Mode.");
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } else {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      onClose();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onClose]);

  useEffect(() => {
    if (isComputing) {
      const interval = setInterval(() => {
        setCurrentTag(HASHTAGS[Math.floor(Math.random() * HASHTAGS.length)]);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isComputing]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      handleCompute();
    } else {
      setTranscript('');
      setIsListening(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleCompute = async () => {
    if (!transcript.trim()) {
      onClose();
      return;
    }
    
    setIsComputing(true);
    try {
      const result = await processBlurt(transcript, activeSpace?.name);
      onComplete(result);
    } catch (error) {
      console.error("Failed to process blurt:", error);
      alert("Failed to process your vibe. Please try again.");
    } finally {
      setIsComputing(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
      
      {/* Edge Lighting Animation */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-[-20%] pointer-events-none"
            style={{ filter: 'blur(80px)' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 origin-center"
            >
              {/* Blue Blob */}
              <motion.div
                className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-blue-600/50 mix-blend-screen"
                animate={{
                  scale: [1, 1.4, 1],
                  borderRadius: ['30% 70% 70% 30% / 30% 30% 70% 70%', '70% 30% 30% 70% / 70% 70% 30% 30%', '30% 70% 70% 30% / 30% 30% 70% 70%'],
                  x: ['-5%', '10%', '-5%'],
                  y: ['-5%', '10%', '-5%']
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Purple Blob */}
              <motion.div
                className="absolute bottom-[10%] right-[10%] w-[45%] h-[45%] bg-purple-600/50 mix-blend-screen"
                animate={{
                  scale: [1, 1.5, 1],
                  borderRadius: ['70% 30% 30% 70% / 70% 70% 30% 30%', '30% 70% 70% 30% / 30% 30% 70% 70%', '70% 30% 30% 70% / 70% 70% 30% 30%'],
                  x: ['5%', '-10%', '5%'],
                  y: ['5%', '-10%', '5%']
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Rose Blob */}
              <motion.div
                className="absolute top-[40%] right-[5%] w-[35%] h-[35%] bg-rose-500/50 mix-blend-screen"
                animate={{
                  scale: [1, 1.3, 1],
                  borderRadius: ['50% 50% 20% 80% / 25% 80% 20% 75%', '80% 20% 50% 50% / 75% 20% 80% 25%', '50% 50% 20% 80% / 25% 80% 20% 75%'],
                  x: ['5%', '-5%', '5%'],
                  y: ['-10%', '10%', '-10%']
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Teal Blob */}
              <motion.div
                className="absolute bottom-[30%] left-[5%] w-[40%] h-[40%] bg-teal-500/40 mix-blend-screen"
                animate={{
                  scale: [1, 1.4, 1],
                  borderRadius: ['20% 80% 80% 20% / 80% 20% 80% 20%', '80% 20% 20% 80% / 20% 80% 20% 80%', '20% 80% 80% 20% / 80% 20% 80% 20%'],
                  x: ['-10%', '10%', '-10%'],
                  y: ['5%', '-5%', '5%']
                }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        )}
        {isComputing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-[-20%] pointer-events-none"
            style={{ filter: 'blur(80px)' }}
          >
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 origin-center"
            >
              {/* Computing Teal Blob */}
              <motion.div
                className="absolute top-[15%] left-[15%] w-[40%] h-[40%] bg-teal-500/60 mix-blend-screen"
                animate={{
                  scale: [1, 1.5, 1],
                  borderRadius: ['30% 70% 70% 30% / 30% 30% 70% 70%', '70% 30% 30% 70% / 70% 70% 30% 30%', '30% 70% 70% 30% / 30% 30% 70% 70%'],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Computing Indigo Blob */}
              <motion.div
                className="absolute bottom-[15%] right-[15%] w-[40%] h-[40%] bg-indigo-500/60 mix-blend-screen"
                animate={{
                  scale: [1, 1.5, 1],
                  borderRadius: ['70% 30% 30% 70% / 70% 70% 30% 30%', '30% 70% 70% 30% / 30% 30% 70% 70%', '70% 30% 30% 70% / 70% 70% 30% 30%'],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Computing Violet Blob */}
              <motion.div
                className="absolute top-[30%] right-[15%] w-[35%] h-[35%] bg-violet-500/50 mix-blend-screen"
                animate={{
                  scale: [1, 1.4, 1],
                  borderRadius: ['50% 50% 20% 80% / 25% 80% 20% 75%', '80% 20% 50% 50% / 75% 20% 80% 25%', '50% 50% 20% 80% / 25% 80% 20% 75%'],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Vignette to keep it focused and blackish in the middle */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,black_80%)] pointer-events-none z-0" />

      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors z-10"
      >
        <X size={32} />
      </button>

      <div className="flex flex-col items-center justify-center w-full max-w-2xl px-6 z-10">
        
        <div className="relative w-48 h-48 flex items-center justify-center mb-12">
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.3, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-rose-500 rounded-full blur-3xl"
              />
            )}
            {isComputing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1], rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-teal-500 rounded-full blur-3xl"
              />
            )}
          </AnimatePresence>

          <motion.button
            onClick={toggleListening}
            disabled={isComputing}
            whileTap={{ 
              scale: 0.85, 
              borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" 
            }}
            animate={
              isListening 
                ? {
                    borderRadius: [
                      "50% 50% 50% 50% / 50% 50% 50% 50%",
                      "60% 40% 50% 50% / 50% 50% 40% 60%",
                      "40% 60% 40% 60% / 60% 40% 60% 40%",
                      "50% 50% 60% 40% / 40% 60% 50% 50%",
                      "50% 50% 50% 50% / 50% 50% 50% 50%"
                    ]
                  }
                : { borderRadius: "50%" }
            }
            transition={
              isListening 
                ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
            className={`relative z-10 w-24 h-24 flex items-center justify-center shadow-2xl transition-colors ${
              isComputing 
                ? 'bg-slate-800 border border-slate-700 cursor-not-allowed text-teal-400' 
                : isListening 
                  ? 'bg-rose-500 text-white shadow-rose-500/50' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/50 hover:scale-105'
            }`}
          >
            {/* Reactive pulse based on transcript length */}
            <AnimatePresence>
              {isListening && transcript.length > 0 && (
                <motion.div
                  key={transcript.length}
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.6 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-white/30 rounded-full pointer-events-none"
                />
              )}
            </AnimatePresence>

            {isComputing ? (
              <Loader2 size={32} className="animate-spin relative z-10" />
            ) : isListening ? (
              <Square size={28} className="fill-current relative z-10" />
            ) : (
              <Mic size={32} className="relative z-10" />
            )}
          </motion.button>
        </div>

        <div className="text-center space-y-6 w-full h-32">
          {isComputing ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-3">
                <Sparkles className="text-teal-400" />
                Manifesting Vibe...
              </h3>
              <p className="text-teal-400 font-mono text-sm font-bold uppercase tracking-widest animate-pulse">
                {currentTag}
              </p>
            </motion.div>
          ) : isListening ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h3 className="text-xl font-bold text-white tracking-tight">Listening...</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto italic">
                Speak your mind...
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h3 className="text-3xl font-bold text-white tracking-tight">Blurt Mode</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Tap the mic and speak your mind. Describe a new project or a feature you want to add. We'll handle the rest.
              </p>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from 'react';
import TypingArea from './components/TypingArea';
import Results from './components/Results';
import RainBackground from './components/RainBackground';
import { fetchQuotes, generateLocalText } from './api';
import {
  Clock,
  Type,
  FileText,
  X,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

// ============ GAME CONSTANTS ============
const GameStatus = {
  LOADING: 'LOADING',
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED',
};

const GameMode = {
  TIME: 'TIME',
  WORDS: 'WORDS',
  CUSTOM: 'CUSTOM',
};

// ============ MAIN APP COMPONENT ============
const App = () => {
  // Game State
  const [status, setStatus] = useState(GameStatus.LOADING);
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  
  // Game Settings
  const [mode, setMode] = useState(GameMode.TIME);
  const [timeLeft, setTimeLeft] = useState(30);
  const [initialTime, setInitialTime] = useState(30);
  const [wordCount, setWordCount] = useState(25);
  const [difficulty, setDifficulty] = useState('medium');

  const [stats, setStats] = useState({
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    timeElapsed: 0,
    totalChars: 0,
  });

  // UI State
  const [showCustomTextInput, setShowCustomTextInput] = useState(false);
  const [customTextDraft, setCustomTextDraft] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  const timerRef = useRef(null);

  // ============ CALCULATE STATS ============
  const calculateStats = useCallback((currentInput, timeElapsed) => {
    let correct = 0;
    let incorrect = 0;
    
    for (let i = 0; i < currentInput.length; i++) {
      if (currentInput[i] === text[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }

    const minutes = timeElapsed / 60;
    const wpm = minutes > 0 ? (correct / 5) / minutes : 0;
    const rawWpm = minutes > 0 ? (currentInput.length / 5) / minutes : 0;
    const accuracy = currentInput.length > 0 
      ? (correct / currentInput.length) * 100 
      : 100;

    return {
      wpm: Math.round(wpm),
      rawWpm: Math.round(rawWpm),
      accuracy: Math.round(accuracy),
      correctChars: correct,
      incorrectChars: incorrect,
      timeElapsed,
      totalChars: currentInput.length,
    };
  }, [text]);

  // ============ END GAME ============
  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus(GameStatus.FINISHED);
    setStartTime(null);
  }, []);

  // ============ START GAME ============
  const startGame = useCallback(() => {
    setStatus(GameStatus.PLAYING);
    setStartTime(Date.now());

    if (timerRef.current) clearInterval(timerRef.current);
    
    if (mode === GameMode.TIME) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [mode, endGame]);

  // ============ FETCH TEXT FROM API ============
  const fetchText = async (targetWordCount) => {
    try {
      const quoteText = await fetchQuotes(3);
      const words = quoteText.split(' ').slice(0, targetWordCount);
      return words.join(' ');
    } catch (error) {
      console.warn('API failed, using local text:', error.message);
      return generateLocalText(targetWordCount);
    }
  };

  // ============ RESET GAME ============
  const resetGame = useCallback(async (options = {}) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (options.newMode) setMode(options.newMode);
    if (options.newTime) {
      setTimeLeft(options.newTime);
      setInitialTime(options.newTime);
    } else {
      setTimeLeft(initialTime);
    }
    if (options.newWordCount) setWordCount(options.newWordCount);
    if (options.newDifficulty) setDifficulty(options.newDifficulty);

    const effectiveMode = options.newMode || mode;
    const effectiveWordCount = options.newWordCount || wordCount;

    if (options.customText) {
      setText(options.customText);
      setMode(GameMode.CUSTOM);
      setStatus(GameStatus.IDLE);
    } 
    else if (!options.keepText && effectiveMode !== GameMode.CUSTOM) {
      setStatus(GameStatus.LOADING);
      const targetLength = effectiveMode === GameMode.WORDS ? effectiveWordCount : 100;
      const newText = await fetchText(targetLength);
      setText(newText);
      setStatus(GameStatus.IDLE);
    } 
    else {
      setStatus(GameStatus.IDLE);
    }
    
    setInput('');
    setStartTime(null);
    setStats({ wpm: 0, rawWpm: 0, accuracy: 100, correctChars: 0, incorrectChars: 0 });
  }, [initialTime, mode, wordCount]);

  // ============ HANDLE INPUT ============
  const handleInput = useCallback((value) => {
    if (status === GameStatus.FINISHED || status === GameStatus.LOADING) return;

    if (status === GameStatus.IDLE) {
      startGame();
    }

    setInput(value);

    const now = Date.now();
    const start = startTime || now;
    const elapsedSeconds = (now - start) / 1000;
    const currentStats = calculateStats(value, elapsedSeconds);
    setStats(currentStats);

    if (value.length === text.length) {
      endGame();
    }
  }, [status, startTime, text, calculateStats, startGame, endGame]);

  // ============ MODE HANDLERS ============
  const handleModeChange = (m) => {
    if (m === GameMode.CUSTOM) {
      setShowCustomTextInput(true);
      return;
    }
    resetGame({ newMode: m });
  };

  const handleDifficultyChange = (d) => resetGame({ newDifficulty: d });
  const handleTimeChange = (t) => resetGame({ newTime: t });
  const handleWordCountChange = (w) => resetGame({ newWordCount: w });

  const submitCustomText = () => {
    if (customTextDraft.trim()) {
      resetGame({ customText: customTextDraft, newMode: GameMode.CUSTOM });
      setShowCustomTextInput(false);
    }
  };

  // ============ KEYBOARD SHORTCUTS ============
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (!gameStarted && e.key === 'Enter') {
        setGameStarted(true);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        resetGame({ keepText: false });
      }
      if (e.key === 'Escape') {
        resetGame({ keepText: false });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGame, gameStarted]);

  // ============ INITIAL LOAD ============
  useEffect(() => {
    resetGame();
  }, []);

  // ============ RENDER ============
  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-hidden">

      <RainBackground />

      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -5 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 via-white to-gold-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950/20"></div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold-400/10 dark:bg-gold-500/5 rounded-full blur-[80px] animate-float-delayed"></div>
      </div>

      <div className="relative flex-1 flex flex-col min-h-screen" style={{ zIndex: 10 }}>
        {!gameStarted ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="z-10 flex flex-col items-center text-center max-w-5xl px-4">
              <div className="mb-12 relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                <div className="relative bg-slate-900/80 backdrop-blur-sm p-5 rounded-2xl border border-cyan-400/30 shadow-[0_0_40px_rgba(0,212,255,0.2)]">
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1 justify-center">
                      <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600 key-1"></div>
                      <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600 key-2"></div>
                      <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600 key-3"></div>
                      <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600 key-4"></div>
                    </div>
                    <div className="flex gap-1 justify-center">
                      <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600 key-5"></div>
                      <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600 key-6"></div>
                      <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600 key-7"></div>
                      <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600 key-8"></div>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-12 h-3 rounded bg-slate-700 border border-slate-600 key-space"></div>
                    </div>
                  </div>
                </div>
              </div>

              <style>{`
                .key-1 { animation: keyPress 1.2s ease-in-out infinite; animation-delay: 0s; }
                .key-2 { animation: keyPress 1.2s ease-in-out infinite; animation-delay: 0.1s; }
                .key-3 { animation: keyPress 1.2s ease-in-out infinite; animation-delay: 0.2s; }
                .key-4 { animation: keyPress 1.2s ease-in-out infinite; animation-delay: 0.3s; }
                .key-5 { animation: keyPress 1.2s ease-in-out infinite; animation-delay: 0.4s; }
                .key-6 { animation: keyPress 1.2s ease-in-out infinite; animation-delay: 0.5s; }
                .key-7 { animation: keyPress 1.2s ease-in-out infinite; animation-delay: 0.6s; }
                .key-8 { animation: keyPress 1.2s ease-in-out infinite; animation-delay: 0.7s; }
                .key-space { animation: keyPress 1.2s ease-in-out infinite; animation-delay: 0.9s; }
                
                @keyframes keyPress {
                  0%, 100% { 
                    background: rgb(51, 65, 85);
                    transform: translateY(0);
                  }
                  20% { 
                    background: rgb(34, 211, 238);
                    transform: translateY(2px);
                    box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
                  }
                  40% {
                    background: rgb(51, 65, 85);
                    transform: translateY(0);
                  }
                }
              `}</style>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4 leading-none">
                <span className="text-white">ARE YOU A </span>
                <span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400"
                  style={{ textShadow: '0 0 40px rgba(34, 211, 238, 0.5)' }}
                >
                  FLASH
                </span>
                <span className="text-white "> IN TYPING?</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400/80 font-normal mb-12 tracking-wide">
                TEST YOUR SPEED. CHALLENGE YOURSELF.
              </p>

              <button
                onClick={() => setGameStarted(true)}
                className="group relative px-8 py-4 rounded-2xl text-white font-semibold text-base transition-all duration-300 flex items-center gap-3 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.4), 0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34, 211, 238, 1) 0%, rgba(96, 165, 250, 1) 100%)',
                  }}
                />
                <Zap size={20} className="relative z-10" strokeWidth={2.5} />
                <span className="relative z-10">Start Typing...</span>
              </button>

              <div className="mt-8 flex items-center gap-2 text-slate-500/60 text-sm">
                <span>or press</span>
                <kbd className="px-2 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-slate-400 text-xs font-mono">Enter</kbd>
              </div>
            </div>
          </div>
        ) : (
          <>
            <header className="p-6 md:px-12 flex justify-between items-center border-b border-transparent dark:border-slate-800/50 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setGameStarted(false)}>
                <div className="bg-slate-800 p-2.5 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(0,212,255,0.15)] group-hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all">
                  <Zap size={22} className="text-cyan-400" strokeWidth={2} />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">SPEED FORCE </h1>
              </div>


            </header>

            <main className="flex-1 flex flex-col items-center justify-start pt-8 pb-12 px-4 relative">

              {status === GameStatus.IDLE && (
                <div className="w-full max-w-4xl bg-white dark:bg-slate-900/50 rounded-2xl p-4 mb-8 flex flex-col gap-4 shadow-sm border border-slate-100 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-4 backdrop-blur-sm">

                  <div className="flex flex-col lg:flex-row flex-wrap items-center gap-4 lg:gap-2 justify-center">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        onClick={() => handleModeChange(GameMode.TIME)}
                        className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all", mode === GameMode.TIME ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200")}
                      >
                        <Clock size={14} /> Time
                      </button>
                      <button
                        onClick={() => handleModeChange(GameMode.WORDS)}
                        className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all", mode === GameMode.WORDS ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200")}
                      >
                        <Type size={14} /> Words
                      </button>
                      <button
                        onClick={() => handleModeChange(GameMode.CUSTOM)}
                        className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all", mode === GameMode.CUSTOM ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200")}
                      >
                        <FileText size={14} /> Custom
                      </button>
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden md:block mx-2"></div>

                    <div className="flex gap-2 items-center flex-wrap justify-center">
                      {mode === GameMode.TIME && [15, 30, 60, 120].map(t => (
                        <button key={t} onClick={() => handleTimeChange(t)} className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border", timeLeft === t ? "border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20" : "border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")}>
                          {t}s
                        </button>
                      ))}
                      {mode === GameMode.WORDS && [10, 25, 50, 100].map(w => (
                        <button key={w} onClick={() => handleWordCountChange(w)} className={clsx("px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border", wordCount === w ? "border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20" : "border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")}>
                          {w}
                        </button>
                      ))}
                      {mode === GameMode.CUSTOM && (
                        <button onClick={() => setShowCustomTextInput(true)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 border border-brand-500">
                          Change Text
                        </button>
                      )}
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden md:block mx-2"></div>

                    {mode !== GameMode.CUSTOM && (
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {['simple', 'medium', 'advanced'].map(d => (
                          <button
                            key={d}
                            onClick={() => handleDifficultyChange(d)}
                            className={clsx("px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all", difficulty === d ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200")}
                          >
                            {d === 'simple' ? 'Easy' : d === 'advanced' ? 'Hard' : 'Medium'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {status === GameStatus.PLAYING && (
                <div className="w-full max-w-5xl mb-8 flex justify-between items-end animate-in fade-in">
                  <div className="text-4xl font-mono font-bold text-brand-600 dark:text-brand-400">
                    {mode === GameMode.TIME ? timeLeft : `${input.length}/${text.length}`}
                    <span className="text-sm text-slate-400 ml-2 font-sans font-normal uppercase tracking-wider">
                      {mode === GameMode.TIME ? 'Seconds' : 'Chars'}
                    </span>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-right">
                      <div className="text-xs uppercase font-bold text-slate-400">WPM</div>
                      <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{stats.wpm}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase font-bold text-slate-400">Accuracy</div>
                      <div className={clsx("text-2xl font-mono font-bold", stats.accuracy > 95 ? "text-emerald-500" : "text-slate-900 dark:text-white")}>
                        {stats.accuracy}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showCustomTextInput && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Custom Text</h3>
                      <button onClick={() => setShowCustomTextInput(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white"><X size={20} /></button>
                    </div>
                    <textarea
                      className="w-full h-48 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-mono focus:ring-2 focus:ring-brand-500 outline-none resize-none dark:text-white"
                      placeholder="Paste your text here..."
                      value={customTextDraft}
                      onChange={(e) => setCustomTextDraft(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setShowCustomTextInput(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold text-sm">Cancel</button>
                      <button onClick={submitCustomText} className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold text-sm">Start Test</button>
                    </div>
                  </div>
                </div>
              )}

              {status === GameStatus.FINISHED ? (
                <Results
                  stats={stats}
                  onRetry={() => resetGame({ keepText: true })}
                  onNewTest={() => resetGame({ keepText: false })}
                />
              ) : (
                <TypingArea
                  text={text}
                  input={input}
                  status={status}
                  onInputChange={handleInput}
                />
              )}

              <div className="mt-16 text-center text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity duration-300">
                <p className="flex items-center justify-center gap-8">
                  <span className="flex items-center gap-2">
                    <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">TAB</span>
                    <span>Restart</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">ESC</span>
                    <span>Reset</span>
                  </span>
                </p>
              </div>

            </main>
          </>
        )}
      </div>
    </div>
  );
};

export default App;

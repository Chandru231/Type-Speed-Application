import React, { useEffect, useState } from 'react';
import {
  RefreshCcw,
  Target,
  Zap,
  RotateCcw,
  Crown
} from 'lucide-react';
import clsx from 'clsx';

const Results = ({ stats, onRetry, onNewTest }) => {
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const storedBest = localStorage.getItem('velocityType_bestWpm');
    const currentBest = storedBest ? parseInt(storedBest, 10) : 0;

    if (stats.wpm > currentBest) {
      setHighScore(stats.wpm);
      localStorage.setItem('velocityType_bestWpm', stats.wpm.toString());
    } else {
      setHighScore(currentBest);
    }
  }, [stats.wpm]);

  const levels = [
    { label: 'Fast', value: 90 },
    { label: 'Fluent', value: 60 },
    { label: 'Average', value: 30 },
    { label: 'Slow', value: 0 },
  ];

  const maxScale = Math.max(stats.wpm, highScore, 100) * 1.15;

  const getBarHeight = (value) => `${Math.min((value / maxScale) * 100, 100)}%`;
  const getLineBottom = (value) => `${(value / maxScale) * 100}%`;

  const isNewHigh = stats.wpm >= highScore;

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">

      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">Test Complete</h2>
        <p className="text-slate-500 dark:text-slate-400">Statistics & Benchmark</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center shadow-sm flex-1 min-h-[140px]">
            <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Zap size={14} /> WPM
            </div>
            <div className="text-4xl sm:text-5xl md:text-6xl font-black text-brand-600 dark:text-brand-400">{stats.wpm}</div>
            <div className="text-sm text-slate-400 mt-1 font-medium">Speed</div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center shadow-sm flex-1 min-h-[140px]">
            <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Target size={14} /> Accuracy
            </div>
            <div className={clsx("text-4xl sm:text-5xl md:text-6xl font-black", stats.accuracy >= 95 ? "text-emerald-500 dark:text-emerald-400" : "text-yellow-500 dark:text-yellow-400")}>
              {stats.accuracy}%
            </div>
            <div className="text-sm text-slate-400 mt-1 font-medium">Precision</div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-800 dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden shadow-xl min-h-[280px] sm:min-h-[350px] md:min-h-[400px] flex flex-col justify-end">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80 pointer-events-none"></div>

          <div className="relative h-48 sm:h-60 md:h-72 w-full z-10 mb-4 sm:mb-6">
            {levels.map((level) => (
              <div
                key={level.label}
                className="absolute w-full flex items-center justify-end group"
                style={{ bottom: getLineBottom(level.value), transform: 'translateY(50%)' }}
              >
                <div className="w-full border-t border-dashed border-slate-600/30 dark:border-slate-700/50 mr-4 transition-colors group-hover:border-slate-500/50"></div>

                <div className="text-right min-w-[60px]">
                  <span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-70">
                    {level.label}
                  </span>
                </div>
              </div>
            ))}

            <div className="absolute inset-0 flex items-end justify-center gap-16 md:gap-32 pr-[76px]">

              {!isNewHigh && (
                <div className="flex flex-col items-center group relative z-20" style={{ height: getBarHeight(stats.wpm) }}>
                  <div className="mb-3 text-3xl font-black text-white drop-shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-500">
                    {stats.wpm}
                  </div>
                  <div className="w-16 md:w-24 bg-slate-400/80 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors rounded-t-xl flex-1 shadow-[0_0_15px_rgba(148,163,184,0.3)] relative min-h-[12px]">
                  </div>
                  <div className="absolute -bottom-8 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wider">Current</div>
                </div>
              )}

              <div className="flex flex-col items-center relative z-20" style={{ height: getBarHeight(highScore) }}>
                <div className="absolute -top-12 animate-bounce drop-shadow-lg">
                  <Crown size={36} className="text-gold-500 fill-gold-500" />
                </div>
                <div className="mb-3 text-4xl font-black text-gold-500 dark:text-gold-400 drop-shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-700">
                  {highScore}
                </div>
                <div className="w-16 md:w-24 bg-gold-500 dark:bg-gold-500 rounded-t-xl flex-1 shadow-[0_0_25px_rgba(234,179,8,0.4)] relative overflow-hidden min-h-[12px]">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                </div>
                <div className="absolute -bottom-8 text-center text-[10px] font-bold uppercase text-gold-600 dark:text-gold-400 tracking-wider">
                  {isNewHigh ? 'New Best!' : 'Best'}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex justify-around items-center shadow-sm">
          <div className="flex flex-col items-center gap-1">
            <span className="text-slate-400 text-xs font-bold uppercase">Time</span>
            <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200">{Math.floor(stats.timeElapsed || 0)}s</span>
          </div>
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-slate-400 text-xs font-bold uppercase">Chars</span>
            <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200">{stats.totalChars || 0}</span>
          </div>
          <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-slate-400 text-xs font-bold uppercase">Errors</span>
            <span className={clsx("text-xl font-bold", stats.incorrectChars > 0 ? "text-rose-500" : "text-slate-800 dark:text-slate-200")}>{stats.incorrectChars}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-bold text-base sm:text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:outline-none focus:ring-4 focus:ring-slate-200 dark:focus:ring-slate-800"
        >
          <RotateCcw size={20} />
          Retry
        </button>

        <button
          onClick={onNewTest}
          className="group flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-900 dark:bg-brand-600 text-white rounded-full font-bold text-base sm:text-lg transition-all transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-slate-200 dark:focus:ring-brand-900"
        >
          <RefreshCcw className="group-hover:rotate-180 transition-transform duration-500" size={20} />
          New Test
        </button>
      </div>
    </div>
  );
};

export default Results;

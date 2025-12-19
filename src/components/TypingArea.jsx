import React, { useRef, useEffect, useMemo } from 'react';
import clsx from 'clsx';

// Game status constants
const GameStatus = {
  LOADING: 'LOADING',
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED',
};

const TypingArea = ({
  text,
  input,
  status,
  onInputChange,
  className
}) => {
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    // Optional: add visual indication of lost focus
  };

  useEffect(() => {
    if (status === GameStatus.IDLE || status === GameStatus.PLAYING) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  const renderedChars = useMemo(() => {
    return text.split('').map((char, index) => {
      const isTyped = index < input.length;
      const isCorrect = isTyped && input[index] === char;
      const isCurrent = index === input.length;

      return (
        <span
          key={index}
          className={clsx(
            "relative inline-block font-mono text-base sm:text-lg md:text-xl lg:text-2xl transition-colors duration-100 leading-relaxed sm:leading-loose tracking-normal sm:tracking-wide",
            {
              'text-cyan-400': isCorrect,
              'text-rose-500': isTyped && !isCorrect,
              'text-slate-500 dark:text-slate-500': !isTyped,
              'bg-rose-500/20 rounded-sm': isTyped && !isCorrect && char === ' ',
              'border-l-2 border-cyan-400 animate-caret-blink': isCurrent && status !== GameStatus.FINISHED,
              'opacity-50': status === GameStatus.LOADING
            }
          )}
        >
          {char === ' ' && (isTyped && !isCorrect) ? '_' : char}
        </span>
      );
    });
  }, [text, input, status]);

  return (
    <div
      className={clsx("relative w-full max-w-5xl mx-auto min-h-[200px] outline-none group", className)}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onBlur={handleBlur}
        onPaste={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        className="absolute inset-0 w-full h-full opacity-0 cursor-default z-20"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        enterKeyHint="done"
        inputMode="text"
        disabled={status === GameStatus.LOADING || status === GameStatus.FINISHED}
      />

      <div
        ref={containerRef}
        className={clsx(
          "relative z-10 p-4 sm:p-6 md:p-8 lg:p-12 rounded-2xl sm:rounded-3xl transition-all duration-300",
          status === GameStatus.LOADING ? "animate-pulse" : "",
          "bg-white dark:bg-slate-900/50",
          "shadow-xl shadow-slate-200/50 dark:shadow-black/20",
          "border border-slate-100 dark:border-slate-800"
        )}
      >
        {status === GameStatus.LOADING ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4 text-slate-400 dark:text-slate-500">
            <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium tracking-wide">GENERATING TEXT...</span>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center select-none pointer-events-none break-words whitespace-pre-wrap">
            {renderedChars}
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingArea;

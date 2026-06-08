import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Shuffle,
  RotateCcw,
  SkipForward,
  Undo2,
  Redo2,
  Sliders,
  History,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import type { Move } from '../hooks/useCubeState';

interface SolverPanelProps {
  solverStatus: string;
  history: string[];
  currentIndex: number;
  activeMove: Move | null;
  moveQueue: Move[];
  solution: string[];
  currentSolutionIndex: number;
  isSolving: boolean;
  isAutoPlaying: boolean;
  solveSpeed: number;
  error: string | null;
  setSolveSpeed: (speed: number) => void;
  applyMove: (notation: string) => void;
  undo: () => void;
  redo: () => void;
  resetCube: () => void;
  scrambleCube: () => void;
  calculateSolution: () => void;
  stepForward: () => void;
  toggleAutoPlay: () => void;
}

export const SolverPanel: React.FC<SolverPanelProps> = ({
  solverStatus,
  history,
  currentIndex,
  activeMove,
  moveQueue,
  solution,
  currentSolutionIndex,
  isSolving,
  isAutoPlaying,
  solveSpeed,
  error,
  setSolveSpeed,
  applyMove,
  undo,
  redo,
  resetCube,
  scrambleCube,
  calculateSolution,
  stepForward,
  toggleAutoPlay,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'history' | 'guide'>('controls');

  // Manual moves list for HUD
  const manualMoves = ['U', "U'", 'D', "D'", 'R', "R'", 'L', "L'", 'F', "F'", 'B', "B'"];

  // Helper to check if buttons should be disabled
  const isBusy = !!activeMove || moveQueue.length > 0;

  return (
    <div className="flex flex-col h-full bg-slate-950/65 backdrop-blur-2xl border-l border-slate-800/40 text-slate-200 overflow-hidden shadow-2xl">
      {/* Sidebar Tabs Navigation */}
      <div className="flex border-b border-slate-800/40 p-2 bg-slate-950/30">
        {(['controls', 'history', 'guide'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
            }`}
          >
            {tab === 'controls' && <Sliders className="w-3.5 h-3.5" />}
            {tab === 'history' && <History className="w-3.5 h-3.5" />}
            {tab === 'guide' && <Keyboard className="w-3.5 h-3.5" />}
            <span className="capitalize">{tab}</span>
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        <AnimatePresence mode="wait">
          {activeTab === 'controls' && (
            <motion.div
              key="controls"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Core Operations Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                  Core Operations
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={scrambleCube}
                    disabled={isBusy || isSolving}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 disabled:opacity-40 border border-slate-700/30 hover:border-slate-600/50 shadow-md text-sm font-semibold transition-all disabled:cursor-not-allowed group active:scale-98"
                  >
                    <Shuffle className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
                    Scramble
                  </button>

                  <button
                    onClick={resetCube}
                    disabled={isBusy}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 disabled:opacity-40 border border-slate-700/30 hover:border-slate-600/50 shadow-md text-sm font-semibold transition-all disabled:cursor-not-allowed group active:scale-98"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-400 group-hover:-rotate-45 transition-transform" />
                    Reset
                  </button>
                </div>

                <button
                  onClick={calculateSolution}
                  disabled={isSolving || history.length === 0}
                  className="w-full relative overflow-hidden group flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-900 disabled:to-slate-850 disabled:text-slate-500 disabled:border-slate-800/40 text-white shadow-xl shadow-indigo-600/10 border border-indigo-500/20 font-bold transition-all disabled:cursor-not-allowed active:scale-98"
                >
                  <Sparkles className="w-4.5 h-4.5 animate-pulse text-indigo-200" />
                  Solve Cube
                </button>
              </div>

              {/* Solver Controls Panel (Visible when solving/solution loaded) */}
              {isSolving && solution.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/15 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-indigo-300">Autoplay Solver</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Step {currentSolutionIndex + 1} of {solution.length}
                      </p>
                    </div>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded border border-indigo-500/20">
                      CFOP/Kociemba
                    </span>
                  </div>

                  {/* Playback Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAutoPlay}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-md active:scale-98"
                    >
                      {isAutoPlaying ? (
                        <>
                          <Pause className="w-4 h-4" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" /> Resume
                        </>
                      )}
                    </button>
                    <button
                      onClick={stepForward}
                      disabled={isAutoPlaying || isBusy || currentSolutionIndex >= solution.length}
                      className="flex items-center justify-center p-2.5 rounded-lg bg-slate-900 border border-slate-700/30 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Next Step"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Visual Solution Move List */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Solution Output
                    </span>
                    <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-slate-950/50 border border-slate-900/80 max-h-24 overflow-y-auto scrollbar-thin">
                      {solution.map((move, index) => {
                        const isPast = index < currentSolutionIndex;
                        const isCurrent = index === currentSolutionIndex;
                        return (
                          <span
                            key={index}
                            className={`text-xs font-mono font-bold px-2 py-1 rounded transition-colors ${
                              isCurrent
                                ? 'bg-indigo-500 text-white shadow shadow-indigo-500/50 scale-105'
                                : isPast
                                ? 'text-slate-600 line-through bg-slate-900/40 border border-slate-850'
                                : 'text-indigo-400 bg-indigo-950/20 border border-indigo-900/20'
                            }`}
                          >
                            {move}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error display */}
              {error && (
                <div className="p-3 text-xs bg-rose-950/30 border border-rose-900/40 rounded-xl text-rose-400 flex items-start gap-2">
                  <span className="font-bold">Error:</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Manual Turn HUD */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                    Manual Rotation HUD
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    Keyboard Active
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {manualMoves.map((move) => (
                    <button
                      key={move}
                      onClick={() => applyMove(move)}
                      disabled={isBusy || isSolving}
                      className="aspect-square flex items-center justify-center text-xs font-bold font-mono rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-indigo-600/10 hover:border-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed hover:text-indigo-400 transition-all select-none active:scale-95"
                    >
                      {move}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Controller Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                    Animation Speed
                  </h3>
                  <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-950/30 border border-indigo-900/40 px-2 py-0.5 rounded">
                    {solveSpeed}ms
                  </span>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/30 border border-slate-900 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Fast</span>
                  <input
                    type="range"
                    min="150"
                    max="1000"
                    step="50"
                    value={solveSpeed}
                    onChange={(e) => setSolveSpeed(Number(e.target.value))}
                    className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Slow</span>
                </div>
              </div>

              {/* Statistics & Cube Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                  Cube Information
                </h3>
                <div className="p-4 rounded-xl bg-slate-900/20 border border-slate-800/40 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Moves Logged:</span>
                    <span className="font-mono text-slate-200 font-bold">{history.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Position Index:</span>
                    <span className="font-mono text-slate-200 font-bold">{currentIndex + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cube State status:</span>
                    <span
                      className={`font-semibold ${
                        history.length === 0 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                      }`}
                    >
                      {history.length === 0 ? 'Solved' : 'Scrambled/Unsolved'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 h-full flex flex-col"
            >
              {/* Undo Redo Operations */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                  Timeline controls
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={undo}
                    disabled={currentIndex < 0 || isBusy}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 disabled:opacity-30 border border-slate-800 disabled:cursor-not-allowed hover:text-indigo-400 font-semibold text-sm transition-all"
                  >
                    <Undo2 className="w-4 h-4" />
                    Undo
                  </button>
                  <button
                    onClick={redo}
                    disabled={currentIndex >= history.length - 1 || isBusy}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 disabled:opacity-30 border border-slate-800 disabled:cursor-not-allowed hover:text-indigo-400 font-semibold text-sm transition-all"
                  >
                    <Redo2 className="w-4 h-4" />
                    Redo
                  </button>
                </div>
              </div>

              {/* Applied Moves List */}
              <div className="flex-1 space-y-3 flex flex-col min-h-[300px]">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                  History Timeline ({history.length} moves)
                </h3>
                
                {history.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-6 text-center">
                    <History className="w-8 h-8 text-slate-700 mb-2" />
                    <span className="text-xs text-slate-500 font-medium">Timeline is empty</span>
                    <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">
                      Scramble the cube or rotate faces to see moves appear here.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-3 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-2 max-h-[320px] scrollbar-thin scrollbar-thumb-slate-900">
                    <div className="flex flex-wrap gap-2">
                      {history.map((move, index) => {
                        const isActive = index <= currentIndex;
                        const isCurrentPointer = index === currentIndex;

                        return (
                          <div
                            key={index}
                            className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                              isCurrentPointer
                                ? 'bg-indigo-600 border-indigo-400 text-white scale-105 shadow shadow-indigo-600/30'
                                : isActive
                                ? 'bg-slate-900 border-slate-800 text-slate-200'
                                : 'bg-slate-950/20 border-slate-900/60 text-slate-600 line-through'
                            }`}
                          >
                            <span className="text-[10px] text-slate-500 mr-1">#{index + 1}</span>
                            {move}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {/* Keyboard Shortcuts guide */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                  Keyboard Shortcuts
                </h3>
                <div className="p-4 rounded-2xl border border-slate-800/40 bg-slate-900/20 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">U Face (CW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">U</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">U Face (CCW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">Shift+U</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">D Face (CW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">D</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">D Face (CCW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">Shift+D</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">R Face (CW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">R</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">R Face (CCW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">Shift+R</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">L Face (CW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">L</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">L Face (CCW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">Shift+L</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">F Face (CW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">F</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">F Face (CCW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">Shift+F</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">B Face (CW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">B</kbd>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-900/60">
                      <span className="text-slate-400 font-medium">B Face (CCW)</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold border border-indigo-900/60">Shift+B</kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cube notation guide */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">
                  Singmaster Notation
                </h3>
                <div className="p-4 rounded-2xl border border-slate-800/40 bg-slate-900/20 text-xs space-y-3 leading-relaxed">
                  <p className="text-slate-400">
                    The solver outputs moves in standard speedcubing notation. Each letter tells you which face to rotate relative to the current camera view:
                  </p>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
                    <li><strong className="text-indigo-400">U (Up):</strong> The Top layer</li>
                    <li><strong className="text-indigo-400">D (Down):</strong> The Bottom layer</li>
                    <li><strong className="text-indigo-400">R (Right):</strong> The Right layer</li>
                    <li><strong className="text-indigo-400">L (Left):</strong> The Left layer</li>
                    <li><strong className="text-indigo-400">F (Front):</strong> The Front layer facing you</li>
                    <li><strong className="text-indigo-400">B (Back):</strong> The Back layer opposite you</li>
                  </ul>
                  <p className="text-slate-400 border-t border-slate-800 pt-2 text-[11px]">
                    A single letter (e.g. <code className="text-slate-200 bg-slate-900 px-1 rounded">R</code>) means a 90° clockwise turn. An apostrophe (e.g. <code className="text-slate-200 bg-slate-900 px-1 rounded">R'</code>) means a 90° counter-clockwise turn. A "2" (e.g. <code className="text-slate-200 bg-slate-900 px-1 rounded">R2</code>) means a 180° turn.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

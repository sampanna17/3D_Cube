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
  BookOpen,
  Sparkles,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Zap,
  Eye,
  RefreshCw,
} from 'lucide-react';
import type { Move } from '../hooks/useCubeState';

interface SolverPanelProps {
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
  isCubeSolved: boolean;
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

const FACE_COLORS: Record<string, string> = {
  U: 'bg-white text-slate-900',
  D: 'bg-yellow-400 text-slate-900',
  R: 'bg-red-500 text-white',
  L: 'bg-orange-500 text-white',
  F: 'bg-emerald-500 text-white',
  B: 'bg-blue-600 text-white',
};

const FACE_LABELS: Record<string, string> = {
  U: 'Up',
  D: 'Down',
  R: 'Right',
  L: 'Left',
  F: 'Front',
  B: 'Back',
};

function MoveChip({ move, state }: { move: string; state: 'done' | 'current' | 'pending' }) {
  const face = move[0];
  const faceColor = FACE_COLORS[face] ?? 'bg-slate-700 text-white';
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold font-mono border
        transition-all duration-150
        ${state === 'current'
          ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-950 scale-110 shadow-lg shadow-indigo-500/30 bg-indigo-950 border-indigo-400 text-indigo-200'
          : state === 'done'
          ? 'opacity-35 border-slate-800 bg-slate-900/40 text-slate-500 line-through'
          : 'border-slate-700/50 bg-slate-900/60 text-slate-300'}
      `}
    >
      <span className={`w-3.5 h-3.5 rounded-sm text-[9px] flex items-center justify-center font-black ${faceColor}`}>
        {face}
      </span>
      {move.slice(1) || '↻'}
    </span>
  );
}

export const SolverPanel: React.FC<SolverPanelProps> = ({
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
  isCubeSolved,
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

  const manualMoves = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F', "F'", 'F2', 'B', "B'", 'B2'];
  const isBusy = !!activeMove || moveQueue.length > 0;
  const hasSolution = solution.length > 0;
  const solveProgress = hasSolution ? (currentSolutionIndex / solution.length) * 100 : 0;
  const movesRemaining = hasSolution ? solution.length - currentSolutionIndex : 0;

  const tabs = [
    { key: 'controls', label: 'Controls', Icon: Sliders },
    { key: 'history', label: 'History', Icon: History },
    { key: 'guide', label: 'Guide', Icon: BookOpen },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-slate-950/70 backdrop-blur-2xl border-l border-slate-800/50 text-slate-200 overflow-hidden">
      {/* Tab Bar */}
      <div className="flex border-b border-slate-800/50 bg-slate-950/50 px-2 pt-2 gap-1">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[11px] font-bold rounded-t-lg transition-all border-b-2
              ${activeTab === key
                ? 'bg-slate-900/60 text-indigo-300 border-indigo-500'
                : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-slate-900/30'
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <AnimatePresence mode="wait">
          {/* ═══════════════════ CONTROLS TAB ═══════════════════ */}
          {activeTab === 'controls' && (
            <motion.div
              key="controls"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="p-4 space-y-4"
            >
              {/* Cube Status Card */}
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                isCubeSolved
                  ? 'bg-emerald-950/20 border-emerald-700/30'
                  : 'bg-amber-950/20 border-amber-700/30'
              }`}>
                {isCubeSolved ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                )}
                <div>
                  <div className={`text-xs font-bold ${isCubeSolved ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {isCubeSolved ? 'Cube Solved ✓' : 'Cube Scrambled'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {isCubeSolved ? 'Ready to scramble' : `${currentIndex + 1} move${currentIndex !== 0 ? 's' : ''} from solved`}
                  </div>
                </div>
              </div>

              {/* Core Actions */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Quick Actions</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={scrambleCube}
                    disabled={isBusy || isSolving}
                    className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700/40 hover:border-slate-600 shadow-md text-sm font-bold transition-all disabled:cursor-not-allowed group active:scale-95"
                  >
                    <Shuffle className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
                    Scramble
                  </button>
                  <button
                    onClick={resetCube}
                    disabled={isBusy}
                    className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700/40 hover:border-slate-600 shadow-md text-sm font-bold transition-all disabled:cursor-not-allowed group active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-400 group-hover:-rotate-45 transition-transform" />
                    Reset
                  </button>
                </div>

                {/* Solve Button */}
                <button
                  onClick={calculateSolution}
                  disabled={isBusy || isCubeSolved || (isSolving && hasSolution)}
                  className="w-full relative overflow-hidden group flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:border-slate-700/30 text-white shadow-xl shadow-indigo-600/15 border border-indigo-500/20 font-bold text-sm transition-all disabled:cursor-not-allowed active:scale-98"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  {isSolving && !hasSolution ? 'Computing…' : 'Solve Cube'}
                </button>
              </div>

              {/* Solution Playback Panel */}
              <AnimatePresence>
                {hasSolution && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-bold text-indigo-200">Solution Found</span>
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-700/40">
                          {solution.length} moves
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Progress</span>
                          <span>{currentSolutionIndex} / {solution.length}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${solveProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {movesRemaining > 0 ? `${movesRemaining} moves remaining` : '✓ Solution complete!'}
                        </div>
                      </div>

                      {/* Playback Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleAutoPlay}
                          disabled={currentSolutionIndex >= solution.length}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-sm transition-colors active:scale-95"
                        >
                          {isAutoPlaying ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4 fill-white" /> {currentSolutionIndex === 0 ? 'Play' : 'Resume'}</>}
                        </button>
                        <button
                          onClick={stepForward}
                          disabled={isAutoPlaying || isBusy || currentSolutionIndex >= solution.length}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/40 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Next Step"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSolveSpeed(solveSpeed <= 200 ? 800 : solveSpeed <= 400 ? 200 : 400);
                          }}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/40 hover:bg-slate-800 transition-colors"
                          title={`Speed: ${solveSpeed}ms`}
                        >
                          <Eye className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>

                      {/* Move Sequence */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Move Sequence</span>
                          <span className="text-[10px] text-slate-600">{solveSpeed}ms/move</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                          {solution.map((move, idx) => (
                            <MoveChip
                              key={idx}
                              move={move}
                              state={idx < currentSolutionIndex ? 'done' : idx === currentSolutionIndex ? 'current' : 'pending'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 text-xs bg-rose-950/30 border border-rose-700/40 rounded-xl text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Speed Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Animation Speed</label>
                  <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-950/30 border border-indigo-900/40 px-2 py-0.5 rounded">
                    {solveSpeed}ms
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800/40 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Fast</span>
                  <input
                    type="range" min="100" max="1000" step="50"
                    value={solveSpeed}
                    onChange={(e) => setSolveSpeed(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Slow</span>
                </div>
              </div>

              {/* Manual Turn HUD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manual Moves</label>
                  <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
                    Keys: U D L R F B + Shift
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {manualMoves.map((move) => {
                    const face = move[0];
                    const fc = FACE_COLORS[face];
                    return (
                      <button
                        key={move}
                        onClick={() => applyMove(move)}
                        disabled={isBusy || isSolving}
                        title={`${FACE_LABELS[face] ?? face} ${move.includes("'") ? 'CCW' : move.includes('2') ? '180°' : 'CW'}`}
                        className="aspect-square flex items-center justify-center text-[10px] font-bold font-mono rounded-lg border border-slate-800/60 bg-slate-950/40 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 hover:border-indigo-500/40 hover:bg-indigo-950/20 hover:text-indigo-300 relative group"
                      >
                        <span className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-sm ${fc?.split(' ')[0] ?? 'bg-slate-600'}`} />
                        {move}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ HISTORY TAB ═══════════════════ */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="p-4 space-y-4"
            >
              {/* Undo / Redo */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timeline</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={undo}
                    disabled={currentIndex < 0 || isBusy || isSolving}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-700/40 hover:text-indigo-300 font-bold text-sm transition-all disabled:cursor-not-allowed active:scale-95"
                  >
                    <Undo2 className="w-4 h-4" />
                    Undo
                  </button>
                  <button
                    onClick={redo}
                    disabled={currentIndex >= history.length - 1 || isBusy || isSolving}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-700/40 hover:text-indigo-300 font-bold text-sm transition-all disabled:cursor-not-allowed active:scale-95"
                  >
                    <Redo2 className="w-4 h-4" />
                    Redo
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Applied', value: currentIndex + 1, color: 'text-indigo-300' },
                  { label: 'Total', value: history.length, color: 'text-slate-200' },
                  { label: 'Redo', value: history.length - currentIndex - 1, color: 'text-slate-500' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-900/40 border border-slate-800/40 rounded-xl p-3">
                    <div className={`text-xl font-black font-mono ${color}`}>{value}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Move History List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Move Log ({history.length})
                  </label>
                  {history.length > 0 && (
                    <button
                      onClick={resetCube}
                      disabled={isBusy}
                      className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 disabled:opacity-30"
                    >
                      <RefreshCw className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                    <History className="w-8 h-8 text-slate-700 mb-2" />
                    <span className="text-xs text-slate-500 font-medium">No moves yet</span>
                    <p className="text-[10px] text-slate-600 mt-1">Scramble or rotate faces to see moves here.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl border border-slate-800/50 bg-slate-950/40 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-900">
                    {history.map((move, idx) => {
                      const isApplied = idx <= currentIndex;
                      const isCurrent = idx === currentIndex;
                      const face = move[0];
                      const fc = FACE_COLORS[face];
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-1 rounded-lg border transition-all ${
                            isCurrent
                              ? 'bg-indigo-600 border-indigo-400 text-white scale-105 shadow shadow-indigo-600/30'
                              : isApplied
                              ? 'bg-slate-900 border-slate-800 text-slate-200'
                              : 'bg-slate-950/30 border-slate-800/40 text-slate-600 opacity-40'
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-sm text-[8px] flex items-center justify-center font-black ${isCurrent ? 'bg-white text-indigo-700' : fc?.split(' ')[0] ? `${fc.split(' ')[0]} ${fc.split(' ')[1]}` : 'bg-slate-600 text-white'}`}>
                            {face}
                          </span>
                          <span className="text-[9px] text-current opacity-50 mr-0.5">#{idx + 1}</span>
                          {move}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ GUIDE TAB ═══════════════════ */}
          {activeTab === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="p-4 space-y-5"
            >
              {/* How to Use */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">How to Use</label>
                <div className="space-y-2">
                  {[
                    { icon: Shuffle, title: 'Scramble', desc: 'Click Scramble to randomize the cube with a 20-move WCA scramble.' },
                    { icon: Sparkles, title: 'Solve', desc: 'Click Solve Cube to compute the optimal solution using the Kociemba algorithm.' },
                    { icon: Play, title: 'Auto-Play', desc: 'Hit Play to watch the cube solve itself step by step automatically.' },
                    { icon: SkipForward, title: 'Step Mode', desc: 'Use the Step button to advance one move at a time for learning.' },
                    { icon: Eye, title: 'Speed', desc: 'Adjust animation speed from 100ms (fast) to 1000ms (slow).' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/40">
                      <div className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-indigo-950/50 border border-indigo-800/40">
                        <Icon className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keyboard Shortcuts</label>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {[
                    ['U', 'Up face CW'],
                    ['Shift+U', 'Up face CCW'],
                    ['D', 'Down face CW'],
                    ['Shift+D', 'Down face CCW'],
                    ['R', 'Right face CW'],
                    ['Shift+R', 'Right face CCW'],
                    ['L', 'Left face CW'],
                    ['Shift+L', 'Left face CCW'],
                    ['F', 'Front face CW'],
                    ['Shift+F', 'Front face CCW'],
                    ['B', 'Back face CW'],
                    ['Shift+B', 'Back face CCW'],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/40 gap-2">
                      <span className="text-slate-400">{label}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/60 text-[10px] shrink-0">{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notation Guide */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Singmaster Notation</label>
                <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/40 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { face: 'U', desc: 'Up (Top)', color: 'bg-white text-slate-900' },
                      { face: 'D', desc: 'Down (Bottom)', color: 'bg-yellow-400 text-slate-900' },
                      { face: 'R', desc: 'Right', color: 'bg-red-500 text-white' },
                      { face: 'L', desc: 'Left', color: 'bg-orange-500 text-white' },
                      { face: 'F', desc: 'Front (facing you)', color: 'bg-emerald-500 text-white' },
                      { face: 'B', desc: 'Back', color: 'bg-blue-600 text-white' },
                    ].map(({ face, desc, color }) => (
                      <div key={face} className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black shrink-0 ${color}`}>{face}</span>
                        <span className="text-slate-400 text-[11px]">{desc}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-800 pt-3 space-y-1.5 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-800 px-1.5 rounded text-slate-200">R</code>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      <span>90° clockwise turn</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-800 px-1.5 rounded text-slate-200">R'</code>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      <span>90° counter-clockwise turn</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-800 px-1.5 rounded text-slate-200">R2</code>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      <span>180° turn (two turns)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drag Controls */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mouse / Touch Controls</label>
                <div className="space-y-1.5">
                  {[
                    { gesture: 'Drag on background', action: 'Orbit / rotate camera view' },
                    { gesture: 'Drag on a sticker', action: 'Rotate that cube face' },
                    { gesture: 'Scroll wheel', action: 'Zoom in / out' },
                  ].map(({ gesture, action }) => (
                    <div key={gesture} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900/30 border border-slate-800/40 text-[11px]">
                      <span className="font-bold text-indigo-400 shrink-0 min-w-[110px]">{gesture}</span>
                      <span className="text-slate-400">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

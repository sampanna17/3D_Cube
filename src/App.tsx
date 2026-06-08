import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Layers } from 'lucide-react';
import { useCubeState } from './hooks/useCubeState';
import { Header } from './components/Header';
import { CubeContainer } from './components/CubeContainer';
import { SolverPanel } from './components/SolverPanel';

function App() {
  const {
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
    handleMoveComplete,
    stepForward,
    toggleAutoPlay,
  } = useCubeState();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none antialiased">
      {/* Dynamic Background Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none -z-20" />

      {/* Header */}
      <Header solverStatus={solverStatus} />

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {/* Left Side: Cube Canvas Area */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <CubeContainer
            activeMove={activeMove}
            moveQueue={moveQueue}
            history={history}
            solveSpeed={solveSpeed}
            applyMove={applyMove}
            handleMoveComplete={handleMoveComplete}
          />

          {/* Quick HUD controls floating at the bottom center of the canvas */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/70 border border-slate-800/80 p-2.5 rounded-2xl backdrop-blur-xl shadow-2xl z-20 pointer-events-auto">
            <button
              onClick={undo}
              disabled={currentIndex < 0 || !!activeMove || moveQueue.length > 0}
              className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-indigo-400 transition-all"
              title="Undo Move"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-6 bg-slate-800" />
            <span className="text-[11px] font-mono text-slate-400 font-semibold px-2">
              Moves: {history.length}
            </span>
            <div className="w-[1px] h-6 bg-slate-800" />
            <button
              onClick={redo}
              disabled={currentIndex >= history.length - 1 || !!activeMove || moveQueue.length > 0}
              className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-indigo-400 transition-all"
              title="Redo Move"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Floating Mobile Sidebar Trigger */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden absolute bottom-6 right-6 p-4 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 border border-indigo-500 hover:bg-indigo-500 transition-all z-20"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Sidebar (1/3 width, hidden on mobile) */}
        <div className="hidden md:block w-[380px] lg:w-[420px] shrink-0 h-full">
          <SolverPanel
            solverStatus={solverStatus}
            history={history}
            currentIndex={currentIndex}
            activeMove={activeMove}
            moveQueue={moveQueue}
            solution={solution}
            currentSolutionIndex={currentSolutionIndex}
            isSolving={isSolving}
            isAutoPlaying={isAutoPlaying}
            solveSpeed={solveSpeed}
            error={error}
            setSolveSpeed={setSolveSpeed}
            applyMove={applyMove}
            undo={undo}
            redo={redo}
            resetCube={resetCube}
            scrambleCube={scrambleCube}
            calculateSolution={calculateSolution}
            stepForward={stepForward}
            toggleAutoPlay={toggleAutoPlay}
          />
        </div>
      </div>

      {/* Mobile Sidebar Slider Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden absolute top-0 right-0 h-full w-[85%] max-w-[380px] bg-slate-950 border-l border-slate-800 z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-850">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Control Board
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SolverPanel
                  solverStatus={solverStatus}
                  history={history}
                  currentIndex={currentIndex}
                  activeMove={activeMove}
                  moveQueue={moveQueue}
                  solution={solution}
                  currentSolutionIndex={currentSolutionIndex}
                  isSolving={isSolving}
                  isAutoPlaying={isAutoPlaying}
                  solveSpeed={solveSpeed}
                  error={error}
                  setSolveSpeed={setSolveSpeed}
                  applyMove={applyMove}
                  undo={undo}
                  redo={redo}
                  resetCube={resetCube}
                  scrambleCube={scrambleCube}
                  calculateSolution={calculateSolution}
                  stepForward={stepForward}
                  toggleAutoPlay={toggleAutoPlay}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Welcome & Instruction Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWelcomeModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[500px] p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl text-slate-200 z-50 text-center space-y-5"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-xl shadow-indigo-500/20 mb-2">
                <Layers className="w-7 h-7" />
              </div>
              
              <h2 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                Interactive 3D Rubik's Solver
              </h2>
              
              <p className="text-xs text-slate-400 leading-relaxed max-w-[400px] mx-auto">
                Welcome to a premium, GPU-accelerated 3D solver. Experience smooth, realistic face rotations and Herbert Kociemba's optimal solving logic compiled off-thread in real time.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-3 text-left">
                <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/40">
                  <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Orbit</div>
                  <div className="text-[11px] text-slate-400 leading-snug">Drag on empty background to rotate camera.</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/40">
                  <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Rotate Faces</div>
                  <div className="text-[11px] text-slate-400 leading-snug">Drag directly on cube stickers to rotate face layers.</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/40">
                  <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Shortcuts</div>
                  <div className="text-[11px] text-slate-400 leading-snug">Use speedcubing keys [U, D, R, L, F, B] for fast turns.</div>
                </div>
              </div>

              <button
                onClick={() => setShowWelcomeModal(false)}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-white text-sm shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
              >
                Launch Simulator
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline Undo/Redo Icons to avoid package import issues
const Undo2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const Redo2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
  </svg>
);

export default App;

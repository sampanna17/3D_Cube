import { useState, useEffect, useCallback, useRef } from 'react';
import { solverService } from '../solver/solverService';

export interface Move {
  id: string; // Unique ID to prevent React render issues
  notation: string; // e.g. "R", "U'", "F2"
  face: 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
  inverted: boolean;
  double: boolean;
}

export function parseMove(notation: string): Omit<Move, 'id'> {
  const face = notation[0] as Move['face'];
  const inverted = notation.includes("'");
  const double = notation.includes('2');
  return { notation, face, inverted, double };
}

export function useCubeState() {
  const [solverStatus, setSolverStatus] = useState<string>('uninitialized');
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1); // Index of last applied move
  
  // Animation queue
  const [moveQueue, setMoveQueue] = useState<Move[]>([]);
  const [activeMove, setActiveMove] = useState<Move | null>(null);

  // Solver states
  const [solution, setSolution] = useState<string[]>([]);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState<number>(-1);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [solveSpeed, setSolveSpeed] = useState<number>(300); // Animation duration in ms
  const [error, setError] = useState<string | null>(null);

  const solveRequestIdRef = useRef(0);
  const currentIndexRef = useRef(currentIndex);
  const activeMoveRef = useRef<Move | null>(null);
  const moveQueueLengthRef = useRef(0);
  const autoplayTimerRef = useRef<number | null>(null);

  // References for keeping track of variables in callbacks without re-render issues
  const isAutoPlayingRef = useRef(isAutoPlaying);
  const solveSpeedRef = useRef(solveSpeed);
  const currentSolutionIndexRef = useRef(currentSolutionIndex);
  const solutionRef = useRef(solution);
  const moveQueueRef = useRef(moveQueue);

  // Update references
  useEffect(() => { isAutoPlayingRef.current = isAutoPlaying; }, [isAutoPlaying]);
  useEffect(() => { solveSpeedRef.current = solveSpeed; }, [solveSpeed]);
  useEffect(() => { currentSolutionIndexRef.current = currentSolutionIndex; }, [currentSolutionIndex]);
  useEffect(() => { solutionRef.current = solution; }, [solution]);
  useEffect(() => { moveQueueRef.current = moveQueue; }, [moveQueue]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { activeMoveRef.current = activeMove; }, [activeMove]);
  useEffect(() => { moveQueueLengthRef.current = moveQueue.length; }, [moveQueue.length]);

  // Subscribe to solver status
  useEffect(() => {
    const unsubscribe = solverService.subscribeStatus((status) => {
      setSolverStatus(status);
    });

    // Initialize solver immediately in background
    solverService.initialize().catch((err) => {
      console.error('Failed to initialize solver:', err);
      setError('Failed to initialize solver engine. You can still play manually.');
    });

    return unsubscribe;
  }, []);

  // Helper to add a move to the visual animation queue
  const queueMove = useCallback((notation: string) => {
    const parsed = parseMove(notation);
    const moveWithId: Move = {
      ...parsed,
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
    };
    setMoveQueue((prev) => [...prev, moveWithId]);
  }, []);

  // Execute a manual move (adds to history and queues it)
  const applyMove = useCallback((notation: string, origin: 'user' | 'undoRedo' | 'solver' = 'user') => {
    queueMove(notation);

    if (origin === 'user') {
      // User input invalidates any in-flight solve result.
      solveRequestIdRef.current += 1;

      // If we make a new move, wipe out any forward history (redo path)
      setHistory((prev) => {
        const nextHistory = prev.slice(0, currentIndexRef.current + 1);
        nextHistory.push(notation);
        return nextHistory;
      });
      setCurrentIndex((prev) => prev + 1);
      
      // Also reset solution since state has diverged
      if (solution.length > 0) {
        setSolution([]);
        setCurrentSolutionIndex(-1);
        setIsSolving(false);
        setIsAutoPlaying(false);
      }
    } else if (origin === 'solver') {
      // Solver playback should NOT clear the remaining solution.
      setHistory((prev) => {
        const nextHistory = prev.slice(0, currentIndexRef.current + 1);
        nextHistory.push(notation);
        return nextHistory;
      });
      setCurrentIndex((prev) => prev + 1);
    }
  }, [queueMove, solution.length]);

  // Undo last move
  const undo = useCallback(() => {
    if (currentIndex < 0 || activeMove || moveQueue.length > 0) return;
    
    const moveNotation = history[currentIndex];
    // Invert the move to undo it
    let undoNotation = moveNotation;
    if (moveNotation.includes("'")) {
      undoNotation = moveNotation.replace("'", "");
    } else if (!moveNotation.includes('2')) {
      undoNotation = moveNotation + "'";
    }
    // R2 remains R2 for undo (it's 180 degrees)

    applyMove(undoNotation, 'undoRedo');
    setCurrentIndex((prev) => prev - 1);
  }, [currentIndex, history, applyMove, activeMove, moveQueue.length]);

  // Redo move
  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1 || activeMove || moveQueue.length > 0) return;

    const redoNotation = history[currentIndex + 1];
    applyMove(redoNotation, 'undoRedo');
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex, history, applyMove, activeMove, moveQueue.length]);

  // Reset cube state
  const resetCube = useCallback(() => {
    // Invalidate any in-flight solve.
    solveRequestIdRef.current += 1;
    setHistory([]);
    setCurrentIndex(-1);
    setMoveQueue([]);
    setActiveMove(null);
    setSolution([]);
    setCurrentSolutionIndex(-1);
    setIsSolving(false);
    setIsAutoPlaying(false);
    setError(null);
  }, []);

  // Scramble the cube
  const scrambleCube = useCallback(() => {
    resetCube();
    const faces: Move['face'][] = ['U', 'D', 'L', 'R', 'F', 'B'];
    const modifiers = ['', "'", '2'];
    const scrambleMoves: string[] = [];
    
    let lastFace = '';
    for (let i = 0; i < 20; i++) {
      let face = faces[Math.floor(Math.random() * faces.length)];
      // Prevent consecutive turns of same face
      while (face === lastFace) {
        face = faces[Math.floor(Math.random() * faces.length)];
      }
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      scrambleMoves.push(face + modifier);
      lastFace = face;
    }

    // Queue all scramble moves
    scrambleMoves.forEach((move) => queueMove(move));
    
    // Update history
    setHistory(scrambleMoves);
    setCurrentIndex(scrambleMoves.length - 1);
  }, [resetCube, queueMove]);

  // Calculate solver solution
  const calculateSolution = useCallback(async () => {
    if (history.length === 0) return;
    setError(null);

    // Invalidate any previous solve in flight and mark this request.
    const requestId = (solveRequestIdRef.current += 1);

    // Get applied moves up to current index
    const appliedMoves = history.slice(0, currentIndex + 1).join(' ');
    
    try {
      setIsSolving(true);
      setIsAutoPlaying(false);
      setSolution([]);
      setCurrentSolutionIndex(-1);
      const solutionStr = await solverService.solve(appliedMoves);

      if (solveRequestIdRef.current !== requestId) return;
      
      if (!solutionStr || solutionStr.trim() === '') {
        // Already solved
        setSolution([]);
        setCurrentSolutionIndex(-1);
        setIsSolving(false);
        return;
      }

      const solutionArray = solutionStr.split(/\s+/).filter(Boolean);
      setSolution(solutionArray);
      setCurrentSolutionIndex(0);
      setIsAutoPlaying(true);
    } catch (err) {
      if (solveRequestIdRef.current !== requestId) return;
      console.error('Solver failed:', err);
      setError('Solver failed to find a solution.');
      setIsSolving(false);
    }
  }, [currentIndex, history]);

  // Get active queue head
  useEffect(() => {
    if (!activeMove && moveQueue.length > 0) {
      const [next, ...rest] = moveQueue;
      setActiveMove(next);
      setMoveQueue(rest);
    }
  }, [activeMove, moveQueue]);

  // Handle when animation completes
  const handleMoveComplete = useCallback(() => {
    setActiveMove(null);
  }, []);

  // Autoplay driver: whenever the cube is idle, schedule the next solver move.
  useEffect(() => {
    if (autoplayTimerRef.current !== null) {
      window.clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }

    if (!isAutoPlaying) return;
    if (solution.length === 0) return;
    if (currentSolutionIndex < 0 || currentSolutionIndex >= solution.length) {
      setIsAutoPlaying(false);
      setIsSolving(false);
      return;
    }

    const isIdle = !activeMove && moveQueue.length === 0;
    if (!isIdle) return;

    const indexToPlay = currentSolutionIndex;
    const delay = Math.max(50, solveSpeedRef.current - 150);

    autoplayTimerRef.current = window.setTimeout(() => {
      autoplayTimerRef.current = null;
      if (!isAutoPlayingRef.current) return;
      if (solutionRef.current.length === 0) return;
      if (currentSolutionIndexRef.current !== indexToPlay) return;
      if (activeMoveRef.current || moveQueueLengthRef.current > 0) return;

      const nextMoveNotation = solutionRef.current[indexToPlay];
      if (!nextMoveNotation) return;

      applyMove(nextMoveNotation, 'solver');
      setCurrentSolutionIndex((prev) => {
        const nextVal = prev + 1;
        if (nextVal >= solutionRef.current.length) {
          setIsAutoPlaying(false);
          setIsSolving(false);
        }
        return nextVal;
      });
    }, delay);

    return () => {
      if (autoplayTimerRef.current !== null) {
        window.clearTimeout(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };
  }, [
    isAutoPlaying,
    activeMove,
    moveQueue.length,
    currentSolutionIndex,
    solution.length,
    applyMove,
  ]);

  // Step-by-step solver navigation
  const stepForward = useCallback(() => {
    if (isAutoPlaying || activeMove || moveQueue.length > 0) return;
    if (solution.length === 0 || currentSolutionIndex >= solution.length) return;

    const nextMoveNotation = solution[currentSolutionIndex];
    applyMove(nextMoveNotation, 'solver');
    setCurrentSolutionIndex((prev) => {
      const nextVal = prev + 1;
      if (nextVal >= solution.length) {
        setIsSolving(false);
      }
      return nextVal;
    });
  }, [isAutoPlaying, activeMove, moveQueue.length, solution, currentSolutionIndex, applyMove]);

  const toggleAutoPlay = useCallback(() => {
    if (solution.length === 0) return;
    setIsAutoPlaying((prev) => {
      const next = !prev;
      // If turning autoplay on and current solution is completed, restart or do nothing
      if (next && currentSolutionIndex >= solution.length) {
        setCurrentSolutionIndex(0);
      }
      return next;
    });
  }, [solution.length, currentSolutionIndex]);

  return {
    solverStatus,
    history,
    currentIndex,
    moveQueue,
    activeMove,
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
    setIsAutoPlaying
  };
}

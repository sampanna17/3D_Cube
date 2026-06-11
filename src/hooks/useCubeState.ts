import { useState, useEffect, useCallback, useRef } from 'react';
import { solverService } from '../solver/solverService';

export interface Move {
  id: string;
  notation: string;
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

function invertNotation(notation: string): string {
  if (notation.includes("'")) return notation.replace("'", '');
  if (notation.includes('2')) return notation; // 180° is its own inverse
  return notation + "'";
}

export function useCubeState() {
  const [solverStatus, setSolverStatus] = useState<string>('uninitialized');

  // The canonical list of moves applied to the cube so far.
  // We keep a separate "applied" slice (0..currentIndex inclusive) for solving.
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // Animation queue
  const [moveQueue, setMoveQueue] = useState<Move[]>([]);
  const [activeMove, setActiveMove] = useState<Move | null>(null);

  // Solver states
  const [solution, setSolution] = useState<string[]>([]);
  const [currentSolutionIndex, setCurrentSolutionIndex] = useState<number>(-1);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [solveSpeed, setSolveSpeed] = useState<number>(400);
  const [error, setError] = useState<string | null>(null);

  const solveRequestIdRef = useRef(0);
  const currentIndexRef = useRef(currentIndex);
  const activeMoveRef = useRef<Move | null>(null);
  const moveQueueLengthRef = useRef(0);
  const autoplayTimerRef = useRef<number | null>(null);

  const isAutoPlayingRef = useRef(isAutoPlaying);
  const solveSpeedRef = useRef(solveSpeed);
  const currentSolutionIndexRef = useRef(currentSolutionIndex);
  const solutionRef = useRef(solution);
  const moveQueueRef = useRef(moveQueue);

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
    solverService.initialize().catch((err) => {
      console.error('Failed to initialize solver:', err);
      setError('Failed to initialize solver engine. You can still play manually.');
    });
    return unsubscribe;
  }, []);

  // Queue a visual animation
  const queueMove = useCallback((notation: string) => {
    const parsed = parseMove(notation);
    const moveWithId: Move = {
      ...parsed,
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
    };
    setMoveQueue((prev) => [...prev, moveWithId]);
  }, []);

  /**
   * applyMove — the central move dispatcher.
   *
   * origin:
   *   'user'    — interactive move (keyboard / drag / HUD button).
   *               Truncates the forward redo history, clears any active solution.
   *   'solver'  — solution playback. Advances solution index but does NOT
   *               wipe forward history so Step/Auto can continue.
   *   'undoRedo'— time-travel that doesn't touch the solution state.
   */
  const applyMove = useCallback((notation: string, origin: 'user' | 'undoRedo' | 'solver' = 'user') => {
    queueMove(notation);

    if (origin === 'user') {
      solveRequestIdRef.current += 1;

      setHistory((prev) => {
        const next = prev.slice(0, currentIndexRef.current + 1);
        next.push(notation);
        return next;
      });
      setCurrentIndex((prev) => prev + 1);

      // Any user move invalidates an active solve result
      setSolution([]);
      setCurrentSolutionIndex(-1);
      setIsSolving(false);
      setIsAutoPlaying(false);
    } else if (origin === 'solver') {
      setHistory((prev) => {
        const next = prev.slice(0, currentIndexRef.current + 1);
        next.push(notation);
        return next;
      });
      setCurrentIndex((prev) => prev + 1);
    } else {
      // undoRedo — just visually animate; history/currentIndex were already adjusted by caller
    }
  }, [queueMove]);

  // Undo — walk backwards by replaying the inverse of the last applied move
  const undo = useCallback(() => {
    if (currentIndex < 0 || activeMove || moveQueue.length > 0) return;

    const moveNotation = history[currentIndex];
    const undoNotation = invertNotation(moveNotation);

    // Decrease pointer first, then animate the visual inverse
    setCurrentIndex((prev) => prev - 1);
    queueMove(undoNotation);
  }, [currentIndex, history, queueMove, activeMove, moveQueue.length]);

  // Redo — re-apply the next move in history
  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1 || activeMove || moveQueue.length > 0) return;

    const redoNotation = history[currentIndex + 1];
    setCurrentIndex((prev) => prev + 1);
    queueMove(redoNotation);
  }, [currentIndex, history, queueMove, activeMove, moveQueue.length]);

  // Reset cube to solved state
  const resetCube = useCallback(() => {
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

  // Scramble with a WCA-style random-move scramble
  const scrambleCube = useCallback(() => {
    resetCube();

    const faces: Move['face'][] = ['U', 'D', 'L', 'R', 'F', 'B'];
    const modifiers = ['', "'", '2'];
    const scrambleMoves: string[] = [];

    let lastFace = '';
    let secondLastFace = '';
    for (let i = 0; i < 20; i++) {
      let face = faces[Math.floor(Math.random() * faces.length)];
      // Avoid same face twice in a row, and avoid opposite-face pair repetition
      const opposite: Record<string, string> = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' };
      while (
        face === lastFace ||
        (face === opposite[lastFace] && opposite[lastFace] === secondLastFace)
      ) {
        face = faces[Math.floor(Math.random() * faces.length)];
      }
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      scrambleMoves.push(face + modifier);
      secondLastFace = lastFace;
      lastFace = face;
    }

    scrambleMoves.forEach((move) => queueMove(move));
    setHistory(scrambleMoves);
    setCurrentIndex(scrambleMoves.length - 1);
  }, [resetCube, queueMove]);

  // Calculate solver solution from current cube state
  const calculateSolution = useCallback(async () => {
    const appliedMoves = history.slice(0, currentIndexRef.current + 1);
    if (appliedMoves.length === 0) return;

    setError(null);
    const requestId = (solveRequestIdRef.current += 1);

    try {
      setIsSolving(true);
      setIsAutoPlaying(false);
      setSolution([]);
      setCurrentSolutionIndex(-1);

      const movesString = appliedMoves.join(' ');
      const solutionStr = await solverService.solve(movesString);

      if (solveRequestIdRef.current !== requestId) return;

      if (!solutionStr || solutionStr.trim() === '') {
        // Already solved
        setIsSolving(false);
        setError('The cube is already solved!');
        return;
      }

      const solutionArray = solutionStr.split(/\s+/).filter(Boolean);
      setSolution(solutionArray);
      setCurrentSolutionIndex(0);
      setIsSolving(true);
      setIsAutoPlaying(true);
    } catch (err) {
      if (solveRequestIdRef.current !== requestId) return;
      console.error('Solver failed:', err);
      setError('Solver failed to find a solution. Please try again.');
      setIsSolving(false);
    }
  }, [history]);

  // Dequeue: pull next move out of queue into activeMove
  useEffect(() => {
    if (!activeMove && moveQueue.length > 0) {
      const [next, ...rest] = moveQueue;
      setActiveMove(next);
      setMoveQueue(rest);
    }
  }, [activeMove, moveQueue]);

  // Handle animation completion
  const handleMoveComplete = useCallback(() => {
    setActiveMove(null);
  }, []);

  // Autoplay driver
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

      // Queue the animation
      queueMove(nextMoveNotation);
      setHistory((prev) => {
        const next = prev.slice(0, currentIndexRef.current + 1);
        next.push(nextMoveNotation);
        return next;
      });
      setCurrentIndex((prev) => prev + 1);

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
    queueMove,
  ]);

  // Step-by-step manual solve advance
  const stepForward = useCallback(() => {
    if (isAutoPlaying || activeMove || moveQueue.length > 0) return;
    if (solution.length === 0 || currentSolutionIndex >= solution.length) return;

    const nextMoveNotation = solution[currentSolutionIndex];
    queueMove(nextMoveNotation);
    setHistory((prev) => {
      const next = prev.slice(0, currentIndexRef.current + 1);
      next.push(nextMoveNotation);
      return next;
    });
    setCurrentIndex((prev) => prev + 1);

    setCurrentSolutionIndex((prev) => {
      const nextVal = prev + 1;
      if (nextVal >= solution.length) {
        setIsSolving(false);
      }
      return nextVal;
    });
  }, [isAutoPlaying, activeMove, moveQueue.length, solution, currentSolutionIndex, queueMove]);

  const toggleAutoPlay = useCallback(() => {
    if (solution.length === 0) return;
    setIsAutoPlaying((prev) => {
      const next = !prev;
      if (next && currentSolutionIndex >= solution.length) {
        setCurrentSolutionIndex(0);
      }
      return next;
    });
  }, [solution.length, currentSolutionIndex]);

  // Derived: the moves actually applied to the physical cube right now
  const appliedMoves = history.slice(0, currentIndex + 1);
  const isCubeSolved = appliedMoves.length === 0;

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
    isCubeSolved,
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
    setIsAutoPlaying,
  };
}

import Cube from './cubejs-local';

// Initialize the solver when the worker starts
let isInitialized = false;

// Handle messages from the main thread
self.onmessage = async (event: MessageEvent) => {
  const { type, payload } = event.data;

  if (type === 'INIT') {
    if (isInitialized) {
      self.postMessage({ type: 'INIT_COMPLETE' });
      return;
    }

    try {
      // Cube.initSolver() builds the pruning tables.
      // This takes 2-4 seconds but only needs to be run once.
      Cube.initSolver();
      isInitialized = true;
      self.postMessage({ type: 'INIT_COMPLETE' });
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error during initialization'
      });
    }
  }

  if (type === 'SOLVE') {
    if (!isInitialized) {
      self.postMessage({
        type: 'ERROR',
        payload: 'Solver not initialized. Please call INIT first.'
      });
      return;
    }

    try {
      const movesString = payload;
      const cube = new Cube();
      
      // Apply the history of moves to put the cube in the current state
      if (movesString && movesString.trim() !== '') {
        cube.move(movesString);
      }

      // Solve the cube
      const solution = cube.solve();
      
      self.postMessage({
        type: 'SOLVE_COMPLETE',
        payload: solution
      });
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error during solve'
      });
    }
  }
};

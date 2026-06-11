export class SolverService {
  private worker: Worker | null = null;
  private initResolver: (() => void) | null = null;
  private initRejecter: ((err: unknown) => void) | null = null;
  private solveResolver: ((solution: string) => void) | null = null;
  private solveRejecter: ((err: unknown) => void) | null = null;
  private statusListeners: Set<(status: 'uninitialized' | 'initializing' | 'ready' | 'error') => void> = new Set();
  
  public status: 'uninitialized' | 'initializing' | 'ready' | 'error' = 'uninitialized';

  constructor() {
    this.initWorker();

    // Eagerly warm up the engine as early as possible (off-thread).
    // This ensures the first Solve click doesn't pay the initialization cost.
    this.initialize().catch((e) => {
      console.error('Solver warm-up failed:', e);
    });
  }

  private initWorker() {
    try {
      // Standard Vite way to load workers
      this.worker = new Worker(
        new URL('./solver.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onerror = (errorEvent: ErrorEvent) => {
        console.error('Solver Worker Error Event:', errorEvent);
        const errorMsg = errorEvent.message || 'Unknown worker load/runtime error';
        if (this.status === 'initializing') {
          this.status = 'error';
          this.notifyListeners();
          if (this.initRejecter) {
            this.initRejecter(new Error(errorMsg));
            this.initResolver = null;
            this.initRejecter = null;
          }
        } else if (this.solveRejecter) {
          this.solveRejecter(new Error(errorMsg));
          this.solveResolver = null;
          this.solveRejecter = null;
        }
      };

      this.worker.onmessage = (event: MessageEvent) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'INIT_COMPLETE':
            this.status = 'ready';
            this.notifyListeners();
            if (this.initResolver) {
              this.initResolver();
              this.initResolver = null;
              this.initRejecter = null;
            }
            break;

          case 'SOLVE_COMPLETE':
            if (this.solveResolver) {
              this.solveResolver(payload);
              this.solveResolver = null;
              this.solveRejecter = null;
            }
            break;

          case 'ERROR':
            console.error('Solver Worker Error payload:', payload);
            if (this.status === 'initializing') {
              this.status = 'error';
              this.notifyListeners();
              if (this.initRejecter) {
                this.initRejecter(new Error(payload));
                this.initResolver = null;
                this.initRejecter = null;
              }
            } else if (this.solveRejecter) {
              this.solveRejecter(new Error(payload));
              this.solveResolver = null;
              this.solveRejecter = null;
            }
            break;
        }
      };
    } catch (e) {
      console.error('Failed to create solver worker:', e);
      this.status = 'error';
      this.notifyListeners();
    }
  }

  public subscribeStatus(listener: (status: typeof this.status) => void) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.statusListeners.forEach((listener) => listener(this.status));
  }

  public async initialize(): Promise<void> {
    if (this.status === 'ready') return Promise.resolve();
    if (this.status === 'initializing') {
      return new Promise((resolve, reject) => {
        const oldResolver = this.initResolver;
        const oldRejecter = this.initRejecter;
        this.initResolver = () => {
          if (oldResolver) oldResolver();
          resolve();
        };
        this.initRejecter = (err: unknown) => {
          if (oldRejecter) oldRejecter(err);
          reject(err);
        };
      });
    }

    this.status = 'initializing';
    this.notifyListeners();

    return new Promise((resolve, reject) => {
      this.initResolver = resolve;
      this.initRejecter = reject;
      if (this.worker) {
        this.worker.postMessage({ type: 'INIT' });
      } else {
        this.status = 'error';
        this.notifyListeners();
        reject(new Error('Worker is not available'));
      }
    });
  }

  public async solve(movesString: string): Promise<string> {
    if (this.status !== 'ready') {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      // If there was an outstanding solve, reject it first
      if (this.solveRejecter) {
        this.solveRejecter(new Error('Solve cancelled because a new solve request was issued.'));
      }

      this.solveResolver = resolve;
      this.solveRejecter = reject;

      if (this.worker) {
        this.worker.postMessage({ type: 'SOLVE', payload: movesString });
      } else {
        reject(new Error('Worker is not available'));
      }
    });
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.status = 'uninitialized';
    this.notifyListeners();
  }
}

// Export a singleton instance
export const solverService = new SolverService();

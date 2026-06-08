declare module 'cubejs' {
  class Cube {
    constructor();
    static initSolver(): void;
    static asyncInit(workerPath: string, callback: () => void): void;
    static asyncSolve(cube: Cube, callback: (algorithm: string) => void): void;
    move(algorithm: string): void;
    solve(): string;
    isSolved(): boolean;
  }
  export default Cube;
}

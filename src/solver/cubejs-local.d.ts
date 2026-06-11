// Type declaration for the locally-bundled patched cubejs ES module.

export default class Cube {
  constructor(state?: { center: number[]; cp: number[]; co: number[]; ep: number[]; eo: number[] });

  static initSolver(): void;
  static random(): Cube;
  static inverse(arg: string): string;
  static scramble(): string;

  move(algorithm: string): Cube;
  solve(maxDepth?: number): string;
  isSolved(): boolean;
  clone(): Cube;
  toJSON(): { center: number[]; cp: number[]; co: number[]; ep: number[]; eo: number[] };
}

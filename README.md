# 3D Cube — Interactive Rubik's Cube

An interactive 3D Rubik's Cube built with React, TypeScript and Vite. Explore, scramble, and solve the cube in-browser with GPU-accelerated rendering and a web-worker powered solver.

![Demo placeholder](public/demo-placeholder.png)

## Live demo
- Run locally (see below) or deploy to GitHub Pages / Netlify / Vercel for a public demo.

## Features
- Interactive 3D cube rendered with CSS/WebGL-friendly transforms
- Click-and-drag to rotate the cube and faces
- Scramble generator and visual step-by-step solver (worker-based)
- Solver panel with controls to scramble, solve, and step through moves
- Modular React + TypeScript codebase designed for experimentation

## Quickstart

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Controls
- Drag the cube to orbit the camera.
- Use the on-screen `SolverPanel` to scramble, solve, or step through moves.
-- The project includes `solver.worker.ts` to keep heavy computation off the main thread.

## Project structure

- `src/` — application source
  - `components/` — UI and cube components (e.g. `RubiksCube.tsx`, `SolverPanel.tsx`)
  - `hooks/` — custom hooks such as `useCubeState.ts`
  - `solver/` — solver implementation and `solver.worker.ts`
  - `types/` — type definitions

## Where to look
- The cube rendering and interaction live in `src/components/RubiksCube.tsx` and `src/components/Cubie.tsx`.
- Solver logic is in `src/solver/solverService.ts` and `src/solver/solver.worker.ts`.

## Development tips
- The solver runs in a web worker; open the DevTools to inspect messages between the main thread and worker.
- To add new cube algorithms, extend the solver module and expose the moves to the `SolverPanel`.

## Contributing
- Contributions welcome — open an issue or a pull request.
- Please keep changes focused and add tests for any new solver logic.

## License
- Choose a license for your project (e.g., MIT). Add `LICENSE` to the repo and update this section.

## Acknowledgements
- Built with Vite + React + TypeScript.

---

If you'd like, I can add a demo GIF, badges, or a short contributor guide next.

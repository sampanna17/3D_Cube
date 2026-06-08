import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { RubiksCube } from './RubiksCube';
import type { Move } from '../hooks/useCubeState';

interface CubeContainerProps {
  activeMove: Move | null;
  moveQueue: Move[];
  history: string[];
  solveSpeed: number;
  applyMove: (notation: string) => void;
  handleMoveComplete: () => void;
}

export const CubeContainer: React.FC<CubeContainerProps> = ({
  activeMove,
  moveQueue,
  history,
  solveSpeed,
  applyMove,
  handleMoveComplete,
}) => {
  const [orbitEnabled, setOrbitEnabled] = useState(true);

  return (
    <div className="relative w-full h-[50vh] md:h-full flex items-center justify-center">
      {/* Dynamic atmospheric radial glow in background */}
      <div className="absolute inset-0 bg-radial-gradient from-slate-900 via-slate-950 to-black opacity-90 -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* R3F WebGL Canvas */}
      <Canvas
        camera={{ position: [4.5, 4.5, 6], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Lights */}
        <ambientLight intensity={0.6} />
        
        {/* Main Sun-like light for clear lighting and soft shadows */}
        <directionalLight
          position={[6, 8, 4]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
        
        {/* Warm fill light */}
        <directionalLight
          position={[-6, 4, -4]}
          intensity={0.5}
        />

        {/* Ambient point lights for cyberpunk glowing aesthetics */}
        <pointLight
          position={[0, 5, 0]}
          intensity={1.2}
          color="#a855f7" // Purple neon highlight on top
        />
        <pointLight
          position={[0, -5, 0]}
          intensity={0.8}
          color="#6366f1" // Indigo neon highlight on bottom
        />
        <pointLight
          position={[5, 0, 5]}
          intensity={0.6}
          color="#3b82f6" // Deep blue highlight on front-right
        />

        {/* 3D Rubik's Cube Model */}
        <RubiksCube
          activeMove={activeMove}
          moveQueue={moveQueue}
          history={history}
          solveSpeed={solveSpeed}
          applyMove={applyMove}
          handleMoveComplete={handleMoveComplete}
          setOrbitEnabled={setOrbitEnabled}
        />

        {/* Dynamic Ground Contact Shadow */}
        <ContactShadows
          position={[0, -2.6, 0]}
          opacity={0.65}
          scale={8}
          blur={2.4}
          far={4}
        />

        {/* Camera Orbit Controls */}
        <OrbitControls
          enabled={orbitEnabled}
          enablePan={false}
          minDistance={4}
          maxDistance={12}
          makeDefault
        />
      </Canvas>
    </div>
  );
};

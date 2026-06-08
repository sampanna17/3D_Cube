import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Cubie } from './Cubie';
import type { Move } from '../hooks/useCubeState';

interface ActiveCubie {
  ref: THREE.Group;
  initPos: THREE.Vector3;
  initQuat: THREE.Quaternion;
}

interface RubiksCubeProps {
  activeMove: Move | null;
  moveQueue: Move[];
  history: string[];
  solveSpeed: number;
  applyMove: (notation: string) => void;
  handleMoveComplete: () => void;
  setOrbitEnabled: (enabled: boolean) => void;
}

// Generate the initial grid of 27 cubie coordinates
const cubiesData = (() => {
  const data = [];
  let idx = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        data.push({ x, y, z, index: idx++ });
      }
    }
  }
  return data;
})();

export const RubiksCube: React.FC<RubiksCubeProps> = ({
  activeMove,
  moveQueue,
  history,
  solveSpeed,
  applyMove,
  handleMoveComplete,
  setOrbitEnabled,
}) => {
  const { camera } = useThree();
  const cubeGroupRef = useRef<THREE.Group>(null);
  
  // Refs to each of the 27 cubie groups
  const cubiesRef = useRef<(THREE.Group | null)[]>([]);

  // Keep track of active move animation state
  const animationState = useRef<{
    activeCubies: ActiveCubie[];
    startTime: number;
    duration: number;
    axis: THREE.Vector3;
    angle: number;
  } | null>(null);

  // Parse moves to axis and angle helper
  const getMoveParams = (move: Move) => {
    let axis = new THREE.Vector3();
    let angle = 0;

    switch (move.face) {
      case 'R':
        axis.set(1, 0, 0);
        angle = -Math.PI / 2;
        break;
      case 'L':
        axis.set(1, 0, 0);
        angle = Math.PI / 2;
        break;
      case 'U':
        axis.set(0, 1, 0);
        angle = -Math.PI / 2;
        break;
      case 'D':
        axis.set(0, 1, 0);
        angle = Math.PI / 2;
        break;
      case 'F':
        axis.set(0, 0, 1);
        angle = -Math.PI / 2;
        break;
      case 'B':
        axis.set(0, 0, 1);
        angle = Math.PI / 2;
        break;
    }

    if (move.inverted) angle = -angle;
    if (move.double) angle = angle * 2;

    return { axis, angle };
  };

  // Easing function for smooth rotation
  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Reset/sync positions when history is reset (empty)
  useEffect(() => {
    if (history.length === 0) {
      cubiesData.forEach((c) => {
        const group = cubiesRef.current[c.index];
        if (group) {
          group.position.set(c.x, c.y, c.z);
          group.quaternion.set(0, 0, 0, 1);
        }
      });
      // Clear any running animation
      animationState.current = null;
    }
  }, [history]);

  // Trigger when a new activeMove is received
  useEffect(() => {
    if (!activeMove) {
      animationState.current = null;
      return;
    }

    const { axis, angle } = getMoveParams(activeMove);
    const face = activeMove.face;

    // Identify which cubies belong to the rotating face
    // We check their current position in local space
    const activeCubies: ActiveCubie[] = [];
    const EPS = 0.15;

    cubiesData.forEach((c) => {
      const group = cubiesRef.current[c.index];
      if (group) {
        let isMatch = false;
        const pos = group.position;

        switch (face) {
          case 'U': isMatch = pos.y > 0.5 - EPS; break;
          case 'D': isMatch = pos.y < -0.5 + EPS; break;
          case 'R': isMatch = pos.x > 0.5 - EPS; break;
          case 'L': isMatch = pos.x < -0.5 + EPS; break;
          case 'F': isMatch = pos.z > 0.5 - EPS; break;
          case 'B': isMatch = pos.z < -0.5 + EPS; break;
        }

        if (isMatch) {
          activeCubies.push({
            ref: group,
            initPos: group.position.clone(),
            initQuat: group.quaternion.clone(),
          });
        }
      }
    });

    animationState.current = {
      activeCubies,
      startTime: performance.now(),
      duration: solveSpeed,
      axis,
      angle,
    };
  }, [activeMove, solveSpeed]);

  // Frame animation loop
  useFrame((state) => {
    const anim = animationState.current;

    // 1. Ambient Floating & Subtle Wobble (only if no active move is being animated)
    if (cubeGroupRef.current) {
      const time = state.clock.getElapsedTime();
      
      // Floating y displacement
      cubeGroupRef.current.position.y = Math.sin(time * 1.2) * 0.08;
      
      // Very slight orbital sway (wobble)
      cubeGroupRef.current.rotation.x = Math.sin(time * 0.6) * 0.02;
      cubeGroupRef.current.rotation.z = Math.cos(time * 0.6) * 0.02;
    }

    // 2. Face Rotation Animation
    if (anim) {
      const elapsed = performance.now() - anim.startTime;
      const progress = Math.min(1, elapsed / anim.duration);
      const easedProgress = easeInOutCubic(progress);
      const currentAngle = anim.angle * easedProgress;

      const tempQuat = new THREE.Quaternion().setFromAxisAngle(anim.axis, currentAngle);

      anim.activeCubies.forEach((cubie) => {
        // Orbit position around origin
        cubie.ref.position.copy(cubie.initPos).applyQuaternion(tempQuat);
        // Multiply quaternion
        cubie.ref.quaternion.copy(cubie.initQuat).premultiply(tempQuat);
      });

      if (progress >= 1) {
        // Finalize and snap to integer grid to avoid floating-point drift
        anim.activeCubies.forEach((cubie) => {
          const finalQuat = new THREE.Quaternion().setFromAxisAngle(anim.axis, anim.angle);
          cubie.ref.position.copy(cubie.initPos).applyQuaternion(finalQuat);
          cubie.ref.quaternion.copy(cubie.initQuat).premultiply(finalQuat);

          // Snap to exact coordinates (-1, 0, 1)
          cubie.ref.position.set(
            Math.round(cubie.ref.position.x),
            Math.round(cubie.ref.position.y),
            Math.round(cubie.ref.position.z)
          );
        });

        animationState.current = null;
        handleMoveComplete();
      }
    }
  });

  // Handle keyboard shortcuts (U, D, L, R, F, B + Shift for inverted)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text inputs or solver is actively running
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        activeMove ||
        moveQueue.length > 0
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      const shift = e.shiftKey;

      if (['U', 'D', 'L', 'R', 'F', 'B'].includes(key)) {
        e.preventDefault();
        const notation = key + (shift ? "'" : '');
        applyMove(notation);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMove, moveQueue.length, applyMove]);

  // Pointer drag face rotation state
  const dragStart = useRef<{
    cubieIndex: number;
    worldNormal: THREE.Vector3;
    worldPosition: THREE.Vector3;
    screenX: number;
    screenY: number;
  } | null>(null);

  const handlePointerDown = (e: any, cubieIdx: number) => {
    // Only allow manual interaction when cube is static
    if (activeMove || moveQueue.length > 0) return;
    
    e.stopPropagation();
    
    // Get the world normal of the hit sticker
    const worldNormal = new THREE.Vector3();
    e.object.getWorldDirection(worldNormal);
    worldNormal.set(Math.round(worldNormal.x), Math.round(worldNormal.y), Math.round(worldNormal.z));

    const group = cubiesRef.current[cubieIdx];
    if (!group) return;
    const worldPosition = group.position.clone();

    dragStart.current = {
      cubieIndex: cubieIdx,
      worldNormal,
      worldPosition,
      screenX: e.clientX,
      screenY: e.clientY,
    };

    // Disable OrbitControls so they don't fight face dragging
    setOrbitEnabled(false);
  };

  const handlePointerMove = (e: any) => {
    if (!dragStart.current) return;
    e.stopPropagation();

    const start = dragStart.current;
    const dx = e.clientX - start.screenX;
    const dy = e.clientY - start.screenY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Threshold of 25px drag to trigger move
    if (distance > 25) {
      // Camera vectors in world coordinates
      const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

      // Drag direction in world space
      const dragDir = new THREE.Vector3()
        .addScaledVector(cameraRight, dx)
        .addScaledVector(cameraUp, -dy)
        .normalize();

      // Torque axis
      const torque = new THREE.Vector3().crossVectors(start.worldNormal, dragDir).normalize();

      // Find closest principal axis
      const dotX = torque.dot(new THREE.Vector3(1, 0, 0));
      const dotY = torque.dot(new THREE.Vector3(0, 1, 0));
      const dotZ = torque.dot(new THREE.Vector3(0, 0, 1));

      const absX = Math.abs(dotX);
      const absY = Math.abs(dotY);
      const absZ = Math.abs(dotZ);

      let maxAxis = 'X';
      let maxDot = dotX;
      let maxAbs = absX;

      if (absY > maxAbs) {
        maxAxis = 'Y';
        maxDot = dotY;
        maxAbs = absY;
      }
      if (absZ > maxAbs) {
        maxAxis = 'Z';
        maxDot = dotZ;
        maxAbs = absZ;
      }

      const sign = Math.sign(maxDot);
      const pos = start.worldPosition;

      let notation = '';

      if (maxAxis === 'X') {
        if (pos.x > 0.5) {
          notation = sign > 0 ? "R'" : 'R';
        } else if (pos.x < -0.5) {
          notation = sign > 0 ? 'L' : "L'";
        }
      } else if (maxAxis === 'Y') {
        if (pos.y > 0.5) {
          notation = sign > 0 ? "U'" : 'U';
        } else if (pos.y < -0.5) {
          notation = sign > 0 ? 'D' : "D'";
        }
      } else if (maxAxis === 'Z') {
        if (pos.z > 0.5) {
          notation = sign > 0 ? "F'" : 'F';
        } else if (pos.z < -0.5) {
          notation = sign > 0 ? 'B' : "B'";
        }
      }

      if (notation) {
        applyMove(notation);
      }

      // Finalize drag
      dragStart.current = null;
      setOrbitEnabled(true);
    }
  };

  const handlePointerUp = () => {
    if (dragStart.current) {
      dragStart.current = null;
      setOrbitEnabled(true);
    }
  };

  // Listen to window pointerup to clear drag if pointer is released outside canvas
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (dragStart.current) {
        dragStart.current = null;
        setOrbitEnabled(true);
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [setOrbitEnabled]);

  return (
    <group
      ref={cubeGroupRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {cubiesData.map((c) => (
        <group
          key={c.index}
          ref={(el) => {
            cubiesRef.current[c.index] = el;
          }}
          position={[c.x, c.y, c.z]}
          onPointerDown={(e) => handlePointerDown(e, c.index)}
        >
          <Cubie
            initialX={c.x}
            initialY={c.y}
            initialZ={c.z}
            cubieIndex={c.index}
          />
        </group>
      ))}
    </group>
  );
};

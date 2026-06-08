import React from 'react';
import { RoundedBox } from '@react-three/drei';

interface CubieProps {
  // Original coordinates (-1, 0, 1)
  initialX: number;
  initialY: number;
  initialZ: number;
  // Index of cubie (0 to 26)
  cubieIndex: number;
}

export const Cubie: React.FC<CubieProps> = ({
  initialX,
  initialY,
  initialZ,
  cubieIndex,
}) => {
  // Define sticker colors based on standard Rubik's Cube orientation
  // Up (+Y) = White
  // Down (-Y) = Yellow
  // Front (+Z) = Green
  // Back (-Z) = Blue
  // Right (+X) = Red
  // Left (-X) = Orange
  
  const stickers = [
    // Right (+X)
    {
      show: initialX === 1,
      color: '#ef4444', // Red
      position: [0.485, 0, 0] as [number, number, number],
      rotation: [0, Math.PI / 2, 0] as [number, number, number],
      faceName: 'R',
    },
    // Left (-X)
    {
      show: initialX === -1,
      color: '#f97316', // Orange
      position: [-0.485, 0, 0] as [number, number, number],
      rotation: [0, -Math.PI / 2, 0] as [number, number, number],
      faceName: 'L',
    },
    // Up (+Y)
    {
      show: initialY === 1,
      color: '#f8fafc', // White (bright premium white)
      position: [0, 0.485, 0] as [number, number, number],
      rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
      faceName: 'U',
    },
    // Down (-Y)
    {
      show: initialY === -1,
      color: '#fbbf24', // Yellow (vibrant gold)
      position: [0, -0.485, 0] as [number, number, number],
      rotation: [Math.PI / 2, 0, 0] as [number, number, number],
      faceName: 'D',
    },
    // Front (+Z)
    {
      show: initialZ === 1,
      color: '#10b981', // Green
      position: [0, 0, 0.485] as [number, number, number],
      rotation: [0, 0, 0] as [number, number, number],
      faceName: 'F',
    },
    // Back (-Z)
    {
      show: initialZ === -1,
      color: '#2563eb', // Blue (royal blue)
      position: [0, 0, -0.485] as [number, number, number],
      rotation: [0, Math.PI, 0] as [number, number, number],
      faceName: 'B',
    },
  ];

  return (
    <group name={`cubie-${cubieIndex}`}>
      {/* Cubie Core (Black base block) */}
      <RoundedBox
        args={[0.96, 0.96, 0.96]}
        radius={0.08}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color="#0f172a" // Deep slate black core
          roughness={0.4}
          metalness={0.1}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
        />
      </RoundedBox>

      {/* Stickers */}
      {stickers.map((sticker, idx) => {
        if (!sticker.show) return null;

        return (
          <group
            key={idx}
            position={sticker.position}
            rotation={sticker.rotation}
          >
            {/* The sticker geometry */}
            <RoundedBox
              args={[0.78, 0.78, 0.03]}
              radius={0.06}
              smoothness={4}
              name={`sticker-${sticker.faceName}`}
            >
              <meshPhysicalMaterial
                color={sticker.color}
                roughness={0.15}
                metalness={0.05}
                clearcoat={0.8} // High gloss finish for premium look
                clearcoatRoughness={0.1}
                envMapIntensity={1.0}
              />
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
};

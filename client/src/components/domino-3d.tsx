import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Html, RoundedBox, ContactShadows } from "@react-three/drei";

type Tile = [number, number];

const DOT_POSITIONS: Record<number, [number, number][]> = {
  0: [],
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]],
};

function Pip({ x, y }: { x: number; y: number }) {
  return (
    <mesh position={[x, 0.036, y]}>
      <sphereGeometry args={[0.03, 12, 8]} />
      <meshStandardMaterial metalness={0.1} roughness={0.3} color="#0b1220" />
    </mesh>
  );
}

function Tile3D({ tile, position, rotationZ = 0, faceDown = false, onClick, selected = false }: {
  tile: Tile;
  position: [number, number, number];
  rotationZ?: number;
  faceDown?: boolean;
  onClick?: () => void;
  selected?: boolean;
}) {
  const w = 1.6;
  const h = 0.9;
  const pipScale = 0.85;

  const leftDots = DOT_POSITIONS[tile[0]] || [];
  const rightDots = DOT_POSITIONS[tile[1]] || [];

  return (
    <group position={position} rotation={[0, rotationZ, 0]} onClick={onClick}>
      <RoundedBox args={[w, 0.08, h]} radius={0.06} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={faceDown ? "#0f4a32" : "#f7f3ea"} metalness={0.2} roughness={0.4} />
      </RoundedBox>

      {!faceDown && (
        <group position={[0, 0.045, 0]}>
          {/* left side dots */}
          {leftDots.map((p, i) => (
            <Pip key={`L-${i}`} x={(p[0] - 0.5) * 0.9 * pipScale} y={(p[1] - 0.5) * 0.45 * -1} />
          ))}
          {/* right side dots */}
          {rightDots.map((p, i) => (
            <Pip key={`R-${i}`} x={0.45 + (p[0] - 0.5) * 0.9 * pipScale} y={(p[1] - 0.5) * 0.45 * -1} />
          ))}
          {/* center divider */}
          <mesh position={[0, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[w - 0.08, 0.01]} />
            <meshStandardMaterial color="#cdbfa3" metalness={0.05} roughness={0.6} />
          </mesh>
          {/* optional selection glow */}
          {selected && (
            <Float intensity={1} rotationIntensity={0} floatIntensity={0.2}>
              <mesh position={[0, 0.07, 0]}>
                <ringGeometry args={[0.5, 0.6, 32]} />
                <meshBasicMaterial color="#f6c85b" transparent opacity={0.18} />
              </mesh>
            </Float>
          )}
        </group>
      )}

      {/* thin edge accent */}
      <mesh position={[0, 0.042, 0]} rotation={[0, 0, 0]}> 
        <boxGeometry args={[w - 0.02, 0.01, h - 0.02]} />
        <meshStandardMaterial color="rgba(0,0,0,0)" transparent opacity={0} />
      </mesh>
    </group>
  );
}

export function Domino3DScene({ board, hand, onSelect, selectedIndex, showHand = true }: {
  board: Tile[];
  hand?: Tile[];
  onSelect?: (i: number) => void;
  selectedIndex?: number | null;
  showHand?: boolean;
}) {
  const tiles = useMemo(() => board || [], [board]);
  const handTiles = useMemo(() => hand || [], [hand]);

  return (
    <div style={{ width: "100%", height: 320 }} className="rounded overflow-hidden shadow-lg bg-transparent">
      <Canvas camera={{ position: [0, 3, 4], fov: 45 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <directionalLight position={[-5, 6, -4]} intensity={0.3} />

        <group position={[0, 0, 0]}>
          {/* board row */}
          <group position={[0, 0.06, 0]}>
            {tiles.map((t, i) => (
              <Tile3D key={i} tile={t} position={[(i - tiles.length / 2) * 1.75, 0, 0]} rotationZ={0} selected={false} />
            ))}
          </group>

          {/* player's hand */}
          {showHand && (
            <group position={[0, 0.06, -2]}>
              {handTiles.map((t, i) => (
                <Tile3D key={`h-${i}`} tile={t} position={[(i - handTiles.length / 2) * 1.2, 0, 0]} rotationZ={0} selected={selectedIndex === i} onClick={() => onSelect && onSelect(i)} />
              ))}
            </group>
          )}

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#0b2f1f" metalness={0.1} roughness={0.9} />
          </mesh>
        </group>

        <ContactShadows position={[0, -0.03, 0]} opacity={0.6} scale={6} blur={2} />
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.2} minPolarAngle={Math.PI / 3} />
      </Canvas>
    </div>
  );
}

export default Domino3DScene;

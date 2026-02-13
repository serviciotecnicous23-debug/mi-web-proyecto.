import React from "react";
import { Canvas } from "@react-three/fiber";
import { Float, RoundedBox, OrbitControls } from "@react-three/drei";

export default function GamePreview3D({ type = "domino" }: { type?: string }) {
  return (
    <div style={{ width: 96, height: 64 }} className="mx-auto">
      <Canvas camera={{ position: [0, 2.5, 3], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <group position={[0, 0, 0]}>
          {type === "domino" && (
            <Float rotationIntensity={0.5} floatIntensity={0.6}>
              <RoundedBox args={[1.2, 0.06, 0.7]} radius={0.05} smoothness={4} position={[-0.6, 0, 0]}>
                <meshStandardMaterial color="#f7f3ea" metalness={0.2} roughness={0.5} />
              </RoundedBox>
              <RoundedBox args={[1.2, 0.06, 0.7]} radius={0.05} smoothness={4} position={[0.6, 0, 0.08]} rotation={[0, 0.35, 0]}>
                <meshStandardMaterial color="#f7f3ea" metalness={0.2} roughness={0.5} />
              </RoundedBox>
            </Float>
          )}

          {type === "chess" && (
            <Float>
              <mesh position={[0, 0.14, 0]}> 
                <cylinderGeometry args={[0.18, 0.22, 0.28, 24]} />
                <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.4} />
              </mesh>
            </Float>
          )}

          {type === "checkers" && (
            <Float>
              <mesh position={[0, 0.08, 0]}> 
                <cylinderGeometry args={[0.32, 0.32, 0.12, 32]} />
                <meshStandardMaterial color="#b45309" metalness={0.15} roughness={0.6} />
              </mesh>
            </Float>
          )}
        </group>
        <OrbitControls enableZoom={false} enableRotate={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

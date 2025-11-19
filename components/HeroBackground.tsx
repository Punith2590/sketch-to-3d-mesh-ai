import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Box, Icosahedron, Torus } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Starfield Component (Unchanged logic, just reacting to mouse)
 */
function Starfield() {
  const starsRef = useRef<any>(null);

  useFrame((state) => {
    if (starsRef.current) {
      const t = state.clock.getElapsedTime();
      // Rotate the stars slowly
      starsRef.current.rotation.z = t * 0.02;
      
      // Parallax effect based on mouse
      starsRef.current.rotation.x = THREE.MathUtils.lerp(
        starsRef.current.rotation.x,
        state.mouse.y * 0.1,
        0.05
      );
      starsRef.current.rotation.y = THREE.MathUtils.lerp(
        starsRef.current.rotation.y,
        -state.mouse.x * 0.1,
        0.05
      );
    }
  });

  return (
    <Stars
      ref={starsRef}
      radius={100}
      depth={50}
      count={5000}
      factor={4}
      saturation={0}
      fade
      speed={1}
    />
  );
}

/**
 * NEW: Floating Geometry Component
 * Adds 3D wireframe shapes that float in the background to emphasize the "Mesh" theme.
 */
function FloatingShapes() {
  return (
    <group>
      {/* 1. Floating Wireframe Cube (Neon Lime) */}
      <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2} floatingRange={[-1, 1]}>
        <Box args={[1.5, 1.5, 1.5]} position={[-5, 2, -8]}>
          <meshStandardMaterial color="#39FF14" wireframe opacity={0.15} transparent />
        </Box>
      </Float>

      {/* 2. Floating Icosahedron (Deep Sky Blue) */}
      <Float speed={2} rotationIntensity={2} floatIntensity={1.5} floatingRange={[-0.5, 0.5]}>
        <Icosahedron args={[1.2, 0]} position={[6, -3, -10]}>
          <meshStandardMaterial color="#00BFFF" wireframe opacity={0.2} transparent />
        </Icosahedron>
      </Float>
      
       {/* 3. Floating Torus (Subtle White) */}
      <Float speed={1} rotationIntensity={0.8} floatIntensity={1}>
         <Torus args={[2, 0.2, 16, 50]} position={[0, 4, -15]} rotation={[Math.PI/4, 0, 0]}>
            <meshStandardMaterial color="#E2E8F0" wireframe opacity={0.1} transparent />
         </Torus>
      </Float>
    </group>
  );
}

export const HeroBackground: React.FC = () => {
  return (
    <Canvas camera={{ position: [0, 0, 1] }}>
        {/* Ambient light so the wireframes are visible */}
        <ambientLight intensity={0.5} />
        {/* Point light attached to camera/mouse for subtle interactive lighting */}
        <pointLight position={[0, 0, 5]} intensity={1} distance={20} />
        
      <Suspense fallback={null}>
        <Starfield />
        <FloatingShapes />
      </Suspense>
    </Canvas>
  );
};
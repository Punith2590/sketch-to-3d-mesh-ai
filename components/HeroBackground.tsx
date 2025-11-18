import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/**
 * This component creates the starfield that reacts to mouse movement.
 */
function Starfield() {
  const starsRef = useRef<any>(null);

  useFrame((state) => {
    if (starsRef.current) {
      // Slowly rotate the starfield based on the mouse's X and Y position
      // This creates a subtle, interactive "parallax" effect
      starsRef.current.rotation.x = THREE.MathUtils.lerp(
        starsRef.current.rotation.x,
        state.mouse.y * 0.1,
        0.02
      );
      starsRef.current.rotation.y = THREE.MathUtils.lerp(
        starsRef.current.rotation.y,
        -state.mouse.x * 0.1,
        0.02
      );
    }
  });

  return (
    <Stars
      ref={starsRef}
      radius={100} // The size of the starfield
      depth={50}   // The depth of the starfield
      count={5000} // Number of stars
      factor={4}   // Star size
      saturation={0} // Makes stars white
      fade         // Stars fade in/out at the edges
      speed={1}    // Animation speed
    />
  );
}

/**
 * This is the main canvas component that will be exported.
 */
export const HeroBackground: React.FC = () => {
  return (
    <Canvas camera={{ position: [0, 0, 1] }}>
      <Suspense fallback={null}>
        <Starfield />
      </Suspense>
    </Canvas>
  );
};
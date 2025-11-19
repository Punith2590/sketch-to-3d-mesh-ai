import React, { Suspense, useRef } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Stars, Center, TorusKnot } from '@react-three/drei';
// --- FIX 1: Import loaders from 'three-stdlib' to fix TypeScript errors ---
import { OBJLoader, STLLoader } from 'three-stdlib';
import * as THREE from 'three';

interface Display3DModelProps {
  modelPath: string;
}

// Component to render the actual file (OBJ/STL)
const FileModel: React.FC<{ modelPath: string }> = ({ modelPath }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const isObj = modelPath.endsWith('.obj');
  const isStl = modelPath.endsWith('.stl');

  // This hook will suspend (show loading) until the model is loaded
  let geometry: THREE.BufferGeometry | null = null;
  
  // Handle OBJ loading
  if (isObj) {
    const obj = useLoader(OBJLoader, modelPath);
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        geometry = (child as THREE.Mesh).geometry;
      }
    });
  } 
  // Handle STL loading
  else if (isStl) {
    geometry = useLoader(STLLoader, modelPath) as THREE.BufferGeometry;
  }

  // Auto-center and scale
  useFrame(() => {
    if (meshRef.current && geometry) {
       // Simple auto-rotation
       meshRef.current.rotation.y += 0.005;
    }
  });

  if (!geometry) return null;

  return (
    <Center>
       <mesh ref={meshRef} geometry={geometry} scale={[2,2,2]}>
         <meshStandardMaterial color="#E2E8F0" roughness={0.4} metalness={0.6} />
       </mesh>
    </Center>
  );
};

// Fallback Model (Shows if no file is provided)
const FallbackShape = () => (
    <Center>
        <TorusKnot args={[1, 0.3, 128, 16]}>
            <meshStandardMaterial color="#39FF14" wireframe />
        </TorusKnot>
    </Center>
);

export const Display3DModel: React.FC<Display3DModelProps> = ({ modelPath }) => {
  // Check if we should use a fallback (placeholder) or try to load a real file
  const isPlaceholder = modelPath === 'placeholder';

  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <color attach="background" args={['#050816']} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1.5} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      <Stars radius={100} depth={50} count={500} factor={4} saturation={0} fade speed={0.5} />

      <Suspense fallback={<Html center className="text-white font-mono animate-pulse">LOADING...</Html>}>
         {isPlaceholder ? <FallbackShape /> : <FileModel modelPath={modelPath} />}
      </Suspense>
      
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
      <Environment preset="city" />
    </Canvas>
  );
};
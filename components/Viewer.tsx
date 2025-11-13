import React, { Suspense, forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Icosahedron, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ShadingMode, LightingPreset } from '../App';

interface ViewerProps {
  geometry: { vertices: number[]; faces: number[]; uvs?: number[] } | null;
  isGenerating: boolean;
  modelRef: React.RefObject<THREE.Group>;
  shadingMode: ShadingMode;
  lightingPreset: LightingPreset;
  sketchPreview: string | null; 
}

interface GeneratedModelProps {
  geometry: THREE.BufferGeometry; // Pass the computed geometry
  shadingMode: ShadingMode;
}

// --- Lighting Component (Unchanged) ---
const Lighting: React.FC<{ preset: LightingPreset }> = ({ preset }) => {
  if (preset === 'outdoor') {
    return (
      <>
        <ambientLight intensity={1.0} />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={3.0} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048} 
        />
        <directionalLight position={[-10, 5, -5]} intensity={1.0} />
      </>
    );
  }
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 5]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-5, -5, -2]} intensity={1} />
    </>
  );
};

// --- Generated Model Component (Simplified) ---
// This component now just displays the mesh
const GeneratedModel = forwardRef<THREE.Mesh, GeneratedModelProps>(({ geometry, shadingMode }, ref) => {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
    
    // Animate opacity on load
    useFrame(() => {
      if (materialRef.current) {
        materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, 1, 0.1);
      }
    });

    return (
        <mesh 
          ref={ref as React.RefObject<THREE.Mesh>}
          geometry={geometry}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial 
              ref={materialRef}
              color="#FFFFFF" 
              roughness={0.5} 
              metalness={0.5}
              transparent
              opacity={0} // Start transparent
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
              wireframe={shadingMode === 'wireframe'}
          />
        </mesh>
    );
});
GeneratedModel.displayName = 'GeneratedModel';

// --- Placeholder Component (Sits on the grid) ---
const Placeholder: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null!);
    useFrame((_, delta) => {
        if(meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2;
            meshRef.current.rotation.x += delta * 0.1;
        }
    });
    // Sits on the grid floor
    return (
        <Icosahedron ref={meshRef} args={[1, 0]} scale={0.8} position={[0, -0.2, 0]}>
            <meshStandardMaterial wireframe color="#1A1F44" roughness={0.5} />
        </Icosahedron>
    )
}

// --- Dynamic Loader Component (Unchanged) ---
const LOADING_MESSAGES = [
  "Warming up AI generators...",
  "Generating realistic 2D image...",
  "Analyzing 2D photo...",
  "Building 3D geometry...",
  "Almost done...",
];

const Loader: React.FC<{ sketchPreview: string | null }> = ({ sketchPreview }) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);
    
    useFrame(({ clock }) => {
        if(meshRef.current) {
            meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
            meshRef.current.rotation.x = clock.getElapsedTime() * 0.2;
            const pulse = (Math.sin(clock.getElapsedTime() * 2) + 1) / 2;
            meshRef.current.scale.set(1, 1, 1).multiplyScalar(0.8 + pulse * 0.2);
        }
    });

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % LOADING_MESSAGES.length;
            setLoadingText(LOADING_MESSAGES[index]);
        }, 3000); 

        return () => clearInterval(interval);
    }, []);

    return (
      <>
        <Icosahedron ref={meshRef} args={[1, 2]} position={[0, 0, 0]}>
            <meshStandardMaterial wireframe color="#39FF14" roughness={0.5} emissive="#39FF14" emissiveIntensity={0.5} />
        </Icosahedron>
        
        <Html center>
            <div className="text-center text-content w-72 flex flex-col items-center">
                {sketchPreview && (
                    <img 
                        src={sketchPreview} 
                        alt="Your sketch" 
                        className="w-32 h-32 object-cover rounded-lg border-2 border-base-300 mb-4 bg-white"
                    />
                )}
                <p className="text-xl font-bold animate-pulse text-brand-primary">
                    {loadingText}
                </p>
                <div className="w-full bg-base-300/50 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className="bg-brand-primary h-1.5 w-1/2 animate-infinite-progress" />
                </div>
            </div>
        </Html>
      </>
    );
}

// --- Component to handle model logic and positioning ---
const ModelWrapper: React.FC<ViewerProps> = (props) => {
    // This is where we do all the geometry logic now
    const [geometry, modelCenter] = useMemo(() => {
        if (!props.geometry) return [null, null];
        try {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(props.geometry.vertices, 3));
            geo.setIndex(props.geometry.faces);
            geo.computeVertexNormals(); 
            geo.center(); // Center the model
            
            geo.computeBoundingBox();
            if (geo.boundingBox) {
                // Get vertical offset to place it on the ground
                const yOffset = -geo.boundingBox.min.y;
                // We will move the *group* to this center
                const center = new THREE.Vector3(0, yOffset - 1, 0);
                return [geo, center];
            }
            return [geo, new THREE.Vector3(0, -1, 0)];
        } catch (e) {
            console.error("Failed to create geometry from provided data:", e);
            return [null, null];
        }
    }, [props.geometry]);

    return (
        <>
            {geometry && modelCenter && (
                <group 
                  position={modelCenter} // This group now sits on the floor
                  rotation={[-Math.PI / 2, 0, 0]} // Stands the model up
                > 
                    <GeneratedModel 
                      geometry={geometry} 
                      ref={props.modelRef as unknown as React.RefObject<THREE.Mesh>} 
                      shadingMode={props.shadingMode}
                    />
                </group>
            )}
            
            {/* --- FIX 2: Set OrbitControls target to the model's new center --- */}
            <OrbitControls 
                target={modelCenter || [0, 0, 0]} // Focuses on the model's center
                enableZoom={true} 
                enablePan={true}
                minDistance={0.5} // Allow closer zoom
                maxDistance={20}
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
            />
        </>
    );
};


// --- UPDATED VIEWER COMPONENT ---
export const Viewer: React.FC<ViewerProps> = (props) => {
  return (
    <div className="w-full h-full bg-base-100 relative">
      {/* --- FIX 1: Added `near: 0.01` to fix zoom clipping --- */}
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45, position: [0, 2, 5], near: 0.01 }}>
        
        <color attach="background" args={['#202020']} />
        
        <Lighting preset={props.lightingPreset} />
        
        <Suspense fallback={null}>
            {/* Show placeholder ONLY if not generating and no geometry */}
            {!props.geometry && !props.isGenerating && <Placeholder />}
            
            {/* The ModelWrapper now handles geometry and controls */}
            <ModelWrapper {...props} />
            
            <gridHelper args={[50, 50, '#505050', '#303030']} position={[0, -1, 0]} />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.001, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <shadowMaterial opacity={0.3} />
            </mesh>
            
        </Suspense>
        
        {props.isGenerating && <Loader sketchPreview={props.sketchPreview} />}

      </Canvas>
      {!props.geometry && !props.isGenerating && (
        <div className="absolute bottom-1/4 left-0 right-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 max-w-sm animate-fade-in">
            <h2 className="text-2xl font-bold tracking-widest">3D VIEWPORT</h2>
            <p className="text-content-muted mt-2">Upload or draw a sketch to begin.</p>
          </div>
        </div>
      )}
    </div>
  );
};
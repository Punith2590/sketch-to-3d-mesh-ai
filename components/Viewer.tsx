import React, { Suspense, forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Icosahedron, Html } from '@react-three/drei';
import * as THREE from 'three';
// @ts-ignore (Adjust path if your Workspace.tsx is elsewhere)
import type { ShadingMode, LightingPreset } from './Workspace'; 

interface ViewerProps {
  geometry: { vertices: number[]; faces: number[]; uvs?: number[] } | null;
  isGenerating: boolean;
  modelRef: React.RefObject<THREE.Group>;
  shadingMode: ShadingMode;
  lightingPreset: LightingPreset;
  sketchPreview: string | null; 
}

interface GeneratedModelProps {
  geometry: THREE.BufferGeometry;
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

// --- Generated Model Component (Unchanged) ---
const GeneratedModel = forwardRef<THREE.Mesh, GeneratedModelProps>(({ geometry, shadingMode }, ref) => {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
    
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

// --- Placeholder Component (Unchanged) ---
const Placeholder: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null!);
    useFrame((_, delta) => {
        if(meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2;
            meshRef.current.rotation.x += delta * 0.1;
        }
    });
    return (
        <Icosahedron ref={meshRef} args={[1, 0]} scale={0.8} position={[0, -0.2, 0]}>
            <meshStandardMaterial wireframe color="#1A1F44" roughness={0.5} />
        </Icosahedron>
    )
}

// --- UPDATED DYNAMIC LOADER COMPONENT ---
const LOADING_MESSAGES = [
  "Stage 1: Analyzing sketch...",
  "Stage 1: Generating photorealistic 2D image...",
  "Stage 1: Preparing image for 3D conversion...",
  "Stage 2: Building 3D geometry...",
  "Stage 2: Analyzing 3D mesh...",
  "Stage 2: Finalizing 3D model...",
];

const Loader: React.FC<{ sketchPreview: string | null }> = ({ sketchPreview }) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);
    const [animationStage, setAnimationStage] = useState<'stage1' | 'stage2'>('stage1');
    
    useFrame(({ clock }) => {
        // This just rotates the 3D wireframe
        if(meshRef.current) {
            meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
            meshRef.current.rotation.x = clock.getElapsedTime() * 0.2;
        }
    });

    useEffect(() => {
        // --- Cycle through loading messages ---
        let index = 0;
        const textInterval = setInterval(() => {
            index = (index + 1) % LOADING_MESSAGES.length;
            setLoadingText(LOADING_MESSAGES[index]);

            // --- Switch the animation stage ---
            // If we hit the first "Stage 2" message (index 3), switch the visual
            if (index === 3) { 
                setAnimationStage('stage2');
            }
        }, 2500); // Change text every 2.5 seconds

        return () => clearInterval(textInterval);
    }, []);

    return (
      <>
        <Html center>
            <div className="text-center text-content w-72 flex flex-col items-center">
                
                {/* --- This container holds the swapping animation --- */}
                <div className="w-48 h-48 rounded-lg border-2 border-base-300 mb-4 bg-base-300/20 overflow-hidden relative">
                    
                    {/* Stage 1: Sketch Preview + Scanline */}
                    <div 
                      className={`absolute inset-0 transition-opacity duration-300 ${
                        animationStage === 'stage1' ? 'animate-fade-in-fast opacity-100' : 'animate-fade-out-fast opacity-0'
                      }`}
                    >
                      {sketchPreview && (
                          <img 
                              src={sketchPreview} 
                              alt="Your sketch" 
                              className="w-full h-full object-contain bg-white"
                          />
                      )}
                      {/* The Scanline */}
                      <div className="absolute left-0 w-full h-1 bg-brand-primary/50 shadow-[0_0_10px_2px_#39FF14] animate-scanline"></div>
                    </div>

                    {/* Stage 2: 3D Wireframe Preview */}
                    <div 
                      className={`absolute inset-0 transition-opacity duration-300 ${
                        animationStage === 'stage2' ? 'animate-fade-in-fast opacity-100' : 'animate-fade-out-fast opacity-0'
                      }`}
                    >
                      {/* This is a mini 3D canvas inside the HTML loader */}
                      <Canvas camera={{ position: [0, 0, 2.5] }}>
                          <Icosahedron ref={meshRef} args={[1, 2]}>
                              <meshStandardMaterial 
                                wireframe 
                                color="#39FF14" 
                                roughness={0.5} 
                                emissive="#39FF14" 
                                emissiveIntensity={0.5} 
                              />
                          </Icosahedron>
                      </Canvas>
                    </div>
                </div>

                {/* Loading text and progress bar */}
                <p className="text-xl font-bold text-brand-primary h-6">
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
// --- END OF UPDATED LOADER ---


// --- Component to handle model logic and positioning (Unchanged) ---
const ModelWrapper: React.FC<ViewerProps> = (props) => {
    const [geometry, modelCenter] = useMemo(() => {
        if (!props.geometry) return [null, null];
        try {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(props.geometry.vertices, 3));
            geo.setIndex(props.geometry.faces);
            geo.computeVertexNormals(); 
            geo.center(); 
            
            geo.computeBoundingBox();
            if (geo.boundingBox) {
                const yOffset = -geo.boundingBox.min.y;
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
                  position={modelCenter} 
                  rotation={[-Math.PI / 2, 0, 0]} 
                > 
                    <GeneratedModel 
                      geometry={geometry} 
                      ref={props.modelRef as unknown as React.RefObject<THREE.Mesh>} 
                      shadingMode={props.shadingMode}
                    />
                </group>
            )}
            
            <OrbitControls 
                target={modelCenter || [0, 0, 0]} 
                enableZoom={true} 
                enablePan={true}
                minDistance={0.5} 
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
        
        {/* Make sure sketchPreview is passed to the Loader */}
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
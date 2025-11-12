import React, { Suspense, forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Icosahedron, Html } from '@react-three/drei';
import * as THREE from 'three';
// import type { PipelineStatus } from '../types'; // <-- This is no longer needed
import type { ShadingMode, LightingPreset } from '../App';

interface ViewerProps {
  geometry: { vertices: number[]; faces: number[]; uvs?: number[] } | null;
  isGenerating: boolean;
  // pipelineStatus: PipelineStatus; // <-- This is no longer needed
  modelRef: React.RefObject<THREE.Group>;
  shadingMode: ShadingMode;
  lightingPreset: LightingPreset;
  sketchPreview: string | null; // <-- New prop for the loader
}

interface GeneratedModelProps {
  geometryData: { vertices: number[]; faces: number[]; uvs?: number[] };
  shadingMode: ShadingMode;
}

// --- Lighting Component ---
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
  
  // Default to 'studio'
  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 5]} intensity={2.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-5, -5, -2]} intensity={1} />
    </>
  );
};

// --- Generated Model Component ---
const GeneratedModel = forwardRef<THREE.Group, GeneratedModelProps>(({ geometryData, shadingMode }, ref) => {
    const meshRef = useRef<THREE.Mesh>(null!);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [visibleGeometry, setVisibleGeometry] = useState(geometryData);

    useEffect(() => {
        setIsTransitioning(true);
        const timer = setTimeout(() => {
            setVisibleGeometry(geometryData);
            setIsTransitioning(false);
        }, 300); // Corresponds to fade out duration
        return () => clearTimeout(timer);
    }, [geometryData]);

    const [geometry, yOffset] = useMemo(() => {
        try {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(visibleGeometry.vertices, 3));
            geo.setIndex(visibleGeometry.faces);
            geo.computeVertexNormals(); 
            geo.center(); 
            
            geo.computeBoundingBox();
            if (geo.boundingBox) {
                const yOffset = -geo.boundingBox.min.y; 
                return [geo, yOffset];
            }
            return [geo, 0];
        } catch (e) {
            console.error("Failed to create geometry from provided data:", e);
            return [null, 0];
        }
    }, [visibleGeometry]);
    
    useFrame(() => {
      if (meshRef.current) {
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.opacity = THREE.MathUtils.lerp(material.opacity, isTransitioning ? 0 : 1, 0.1);
      }
    });

    return (
        <group 
          ref={ref} 
          position={[0, yOffset - 1, 0]} // Sits on the ground plane at y = -1
          rotation={[-Math.PI / 2, 0, 0]} // Stands the model up
        > 
            {geometry && (
                 <mesh 
                    ref={meshRef}
                    geometry={geometry}
                    castShadow
                    receiveShadow
                 >
                    <meshStandardMaterial 
                        color="#FFFFFF" // Clean white color
                        roughness={0.5} 
                        metalness={0.5}
                        transparent
                        opacity={0}
                        polygonOffset
                        polygonOffsetFactor={1}
                        polygonOffsetUnits={1}
                        wireframe={shadingMode === 'wireframe'} // <-- Apply shading mode
                    />
                </mesh>
            )}
        </group>
    );
});
GeneratedModel.displayName = 'GeneratedModel';

// --- Placeholder Component ---
const Placeholder: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null!);
    useFrame((_, delta) => {
        if(meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2;
            meshRef.current.rotation.x += delta * 0.1;
        }
    });
    return (
        <Icosahedron ref={meshRef} args={[1, 0]} scale={0.8} position={[0, 0, 0]}>
            <meshStandardMaterial wireframe color="#1A1F44" roughness={0.5} />
        </Icosahedron>
    )
}

// --- !! NEW DYNAMIC LOADER !! ---
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
    
    // Animate the loader model
    useFrame(({ clock }) => {
        if(meshRef.current) {
            meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
            meshRef.current.rotation.x = clock.getElapsedTime() * 0.2;
            const pulse = (Math.sin(clock.getElapsedTime() * 2) + 1) / 2; // 0 to 1
            meshRef.current.scale.set(1, 1, 1).multiplyScalar(0.8 + pulse * 0.2);
        }
    });

    // Cycle through loading messages
    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % LOADING_MESSAGES.length;
            setLoadingText(LOADING_MESSAGES[index]);
        }, 3000); // Change text every 3 seconds

        return () => clearInterval(interval); // Cleanup
    }, []);

    return (
      <>
        {/* The 3D spinning loader model */}
        <Icosahedron ref={meshRef} args={[1, 2]} position={[0, 0, 0]}>
            <meshStandardMaterial wireframe color="#39FF14" roughness={0.5} emissive="#39FF14" emissiveIntensity={0.5} />
        </Icosahedron>
        
        {/* The HTML overlay with text and sketch preview */}
        <Html center>
            <div className="text-center text-content w-72 flex flex-col items-center">
                {/* Show the user's sketch */}
                {sketchPreview && (
                    <img 
                        src={sketchPreview} 
                        alt="Your sketch" 
                        className="w-32 h-32 object-cover rounded-lg border-2 border-base-300 mb-4 bg-white" // <-- Added bg-white
                    />
                )}
                <p className="text-xl font-bold animate-pulse text-brand-primary">
                    {loadingText} {/* <-- Use dynamic text */}
                </p>
                
                {/* Optional: Add a subtle progress bar */}
                <div className="w-full bg-base-300/50 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className="bg-brand-primary h-1.5 w-1/2 animate-infinite-progress" />
                </div>
            </div>
        </Html>
      </>
    );
}

// --- UPDATED VIEWER COMPONENT ---
export const Viewer: React.FC<ViewerProps> = (props) => {
  return (
    <div className="w-full h-full bg-base-100 relative">
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45, position: [0, 2, 5] }}>
        
        <color attach="background" args={['#202020']} />
        
        {/* Use new Lighting component */}
        <Lighting preset={props.lightingPreset} />
        
        <Suspense fallback={null}>
            {/* Model and Placeholder */}
            {props.geometry && !props.isGenerating && (
              <GeneratedModel 
                geometryData={props.geometry} 
                ref={props.modelRef} 
                shadingMode={props.shadingMode}
              />
            )}
            
            {/* Show placeholder ONLY if not generating and no geometry */}
            {!props.geometry && !props.isGenerating && <Placeholder />}
            
            {/* Native gridHelper (visible from all angles) */}
            <gridHelper args={[50, 50, '#505050', '#303030']} position={[0, -1, 0]} />

            {/* Shadow plane moved slightly *below* the grid */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.001, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <shadowMaterial opacity={0.3} />
            </mesh>
            
            <OrbitControls 
                enableZoom={true} 
                enablePan={true}
                minDistance={1}
                maxDistance={20}
                minPolarAngle={0}
                maxPolarAngle={Math.PI}
            />
        </Suspense>
        
        {/* --- Pass sketchPreview to the new Loader --- */}
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
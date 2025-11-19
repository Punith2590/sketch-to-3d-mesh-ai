import React, { Suspense, forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Icosahedron, Html } from '@react-three/drei';
import * as THREE from 'three';
// @ts-ignore 
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

// --- Lighting Component (Original Clean Style) ---
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

// --- Generated Model Component ---
const GeneratedModel = forwardRef<THREE.Mesh, GeneratedModelProps>(({ geometry, shadingMode }, ref) => {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
    
    useFrame(() => {
      if (materialRef.current) {
        // Smooth fade in
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
        <Icosahedron ref={meshRef} args={[1, 0]} scale={0.8} position={[0, -0.2, 0]}>
            <meshStandardMaterial wireframe color="#1A1F44" roughness={0.5} />
        </Icosahedron>
    )
}

// --- NEW: Enhanced "Terminal" Loader ---
const LOG_LINES = [
  "> INITIALIZING NEURAL PATHWAYS...",
  "> CONNECTING TO GPU CLUSTER...",
  "> ANALYZING SKETCH TOPOLOGY...",
  "> DETECTING EDGES...",
  "> GENERATING DEPTH MAP...",
  "> EXTRUDING GEOMETRY...",
  "> OPTIMIZING MESH DENSITY...",
  "> CALCULATING NORMALS...",
  "> APPLYING TEXTURE...",
  "> FINALIZING MODEL..."
];

const TerminalLoader: React.FC<{ sketchPreview: string | null }> = ({ sketchPreview }) => {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < LOG_LINES.length) {
                setLogs(prev => [...prev.slice(-4), LOG_LINES[currentIndex]]); // Keep last 5 lines
                currentIndex++;
            } else {
                currentIndex = 0;
                setLogs([]);
            }
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <Html center>
             {/* Offset slightly to the left to center visually */}
            <div className="flex gap-6 items-center transform -translate-x-12 w-[500px]">
                {/* 1. Scanning Preview */}
                <div className="relative w-32 h-32 border border-brand-primary/50 rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm shrink-0">
                    {sketchPreview && (
                        <img src={sketchPreview} className="w-full h-full object-cover opacity-50" alt="preview" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-primary/20 to-transparent animate-scanline h-full w-full" />
                </div>

                {/* 2. Terminal Logs */}
                <div className="flex-grow font-mono text-xs space-y-1 text-left">
                    <div className="border-b border-white/10 pb-1 mb-2 text-brand-primary font-bold flex justify-between">
                        <span>SYSTEM STATUS</span>
                        <span className="animate-pulse text-brand-secondary">PROCESSING</span>
                    </div>
                    {logs.map((log, i) => (
                        <div key={i} className="text-brand-primary/80 animate-fade-in-fast">
                            {log}
                        </div>
                    ))}
                    <div className="text-brand-primary animate-pulse">_</div>
                </div>
            </div>
        </Html>
    );
};

// --- Model Logic Wrapper (FIXED POSITIONING) ---
const ModelWrapper: React.FC<ViewerProps> = (props) => {
    const [geometry, modelCenter] = useMemo(() => {
        if (!props.geometry) return [null, null];
        try {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(props.geometry.vertices, 3));
            geo.setIndex(props.geometry.faces);
            geo.computeVertexNormals(); 
            
            // 1. Center the geometry at (0,0,0)
            geo.center(); 
            
            // 2. Calculate the offset to sit on the floor
            geo.computeBoundingBox();
            if (geo.boundingBox) {
                // CRITICAL FIX: 
                // Since we rotate the group by -90 degrees on X (to make Z-up models stand up),
                // The local Z axis becomes the global Y axis (Height).
                // We must use min.z (not min.y) to find the bottom of the model.
                const heightOffset = -geo.boundingBox.min.z; 
                
                // Place it at -1 (grid level) + offset
                const center = new THREE.Vector3(0, heightOffset - 1, 0);
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
                  rotation={[-Math.PI / 2, 0, 0]} // Rotates Z-up to Y-up
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
                maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera from going under the floor
            />
        </>
    );
};

export const Viewer: React.FC<ViewerProps> = (props) => {
  return (
    <div className="w-full h-full bg-base-100 relative">
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45, position: [0, 2, 5], near: 0.01 }}>
        
        <color attach="background" args={['#202020']} />
        
        <Lighting preset={props.lightingPreset} />
        
        <Suspense fallback={null}>
            {/* Show placeholder only if mostly idle */}
            {!props.geometry && !props.isGenerating && <Placeholder />}
            
            <ModelWrapper {...props} />
            
            {/* Grid at y = -1 */}
            <gridHelper args={[50, 50, '#505050', '#303030']} position={[0, -1, 0]} />

            {/* Transparent Shadow Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.001, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <shadowMaterial opacity={0.3} />
            </mesh>
            
        </Suspense>
        
        {/* New Terminal Loader */}
        {props.isGenerating && <TerminalLoader sketchPreview={props.sketchPreview} />}

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
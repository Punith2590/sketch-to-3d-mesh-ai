import React, { Suspense, forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Icosahedron, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { ShadingMode, LightingPreset, GeneratedGeometry } from '../types'; 

interface ViewerProps {
  geometry: GeneratedGeometry | null;
  isGenerating: boolean;
  modelRef: React.RefObject<THREE.Group>;
  shadingMode: ShadingMode;
  lightingPreset: LightingPreset;
  sketchPreview: string | null;
  showColors: boolean;
}

interface GeneratedModelProps {
  geometry: THREE.BufferGeometry;
  shadingMode: ShadingMode;
  showColors: boolean;
}

// --- Lighting Component ---
const Lighting: React.FC<{ preset: LightingPreset; showColors: boolean }> = ({ preset, showColors }) => {
  // Reduce intensity when showing colors to prevent washout
  const intensityMod = showColors ? 0.7 : 1.0; 

  if (preset === 'outdoor') {
    return (
      <>
        <ambientLight intensity={0.8 * intensityMod} />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={2.5 * intensityMod} 
          castShadow 
        />
        <directionalLight position={[-10, 5, -5]} intensity={0.8 * intensityMod} />
      </>
    );
  }
  return (
    <>
      <ambientLight intensity={1.0 * intensityMod} />
      <directionalLight position={[5, 10, 5]} intensity={2.0 * intensityMod} castShadow />
      <directionalLight position={[-5, -5, -2]} intensity={0.5 * intensityMod} />
    </>
  );
};

// --- Generated Model Component ---
const GeneratedModel = forwardRef<THREE.Mesh, GeneratedModelProps>(({ geometry, shadingMode, showColors }, ref) => {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
    
    const hasColorAttribute = geometry.getAttribute('color') !== undefined;
    const useVertexColors = shadingMode === 'shaded' && showColors && hasColorAttribute;

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
              key={useVertexColors ? "colored" : "clay"} 
              ref={materialRef}
              color="#FFFFFF" 
              vertexColors={useVertexColors} 
              // --- IMPROVEMENT: Tweaked Material Settings for "Pop" ---
              roughness={useVertexColors ? 0.8 : 0.5} // Matte finish for colors
              metalness={useVertexColors ? 0.0 : 0.3} // No metal reflection for colors
              envMapIntensity={useVertexColors ? 0.5 : 1.0} // Reduce environment reflection
              transparent
              opacity={0}
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

// --- Terminal Loader (Unchanged) ---
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
                setLogs(prev => [...prev.slice(-4), LOG_LINES[currentIndex]]); 
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
            <div className="flex gap-6 items-center transform -translate-x-12 w-[500px]">
                <div className="relative w-32 h-32 border border-brand-primary/50 rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm shrink-0">
                    {sketchPreview && (
                        <img src={sketchPreview} className="w-full h-full object-cover opacity-50" alt="preview" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-primary/20 to-transparent animate-scanline h-full w-full" />
                </div>
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

// --- Model Logic Wrapper ---
const ModelWrapper: React.FC<ViewerProps> = (props) => {
    const [geometry, modelCenter] = useMemo(() => {
        if (!props.geometry) return [null, null];
        try {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(props.geometry.vertices, 3));
            
            if (props.geometry.colors && props.geometry.colors.length > 0) {
               geo.setAttribute('color', new THREE.Float32BufferAttribute(props.geometry.colors, 3));
            }

            geo.setIndex(props.geometry.faces);
            geo.computeVertexNormals(); 
            geo.center(); 
            geo.computeBoundingBox();
            if (geo.boundingBox) {
                const heightOffset = -geo.boundingBox.min.z; 
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
                <group position={modelCenter} rotation={[-Math.PI / 2, 0, 0]}> 
                    <GeneratedModel 
                      geometry={geometry} 
                      ref={props.modelRef as unknown as React.RefObject<THREE.Mesh>} 
                      shadingMode={props.shadingMode}
                      showColors={props.showColors} 
                    />
                </group>
            )}
            <OrbitControls target={modelCenter || [0, 0, 0]} enableZoom={true} enablePan={true} minDistance={0.5} maxDistance={20} minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} />
        </>
    );
};

export const Viewer: React.FC<ViewerProps> = (props) => {
  return (
    <div className="w-full h-full bg-base-100 relative">
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45, position: [0, 2, 5], near: 0.01 }}>
        <color attach="background" args={['#202020']} />
        <Lighting preset={props.lightingPreset} showColors={props.showColors} />
        <Suspense fallback={null}>
            <Environment preset="city" />
            {!props.geometry && !props.isGenerating && <Placeholder />}
            <ModelWrapper {...props} />
            <gridHelper args={[50, 50, '#505050', '#303030']} position={[0, -1, 0]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.001, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <shadowMaterial opacity={0.3} />
            </mesh>
        </Suspense>
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
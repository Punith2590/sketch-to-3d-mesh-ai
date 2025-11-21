import React, { Suspense, forwardRef, useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Icosahedron, Html, Environment, TransformControls } from '@react-three/drei';
import { XR, createXRStore, useXR, useXRHitTest } from '@react-three/xr'; 
import * as THREE from 'three';
import type { ShadingMode, LightingPreset, GeneratedGeometry } from '../types'; 

export const store = createXRStore();

interface ViewerProps {
  geometry: GeneratedGeometry | null;
  isGenerating: boolean;
  modelRef: React.RefObject<THREE.Group>;
  shadingMode: ShadingMode;
  lightingPreset: LightingPreset;
  sketchPreview: string | null;
  showColors: boolean;
  isEditing: boolean;
}

interface GeneratedModelProps {
  geometry: THREE.BufferGeometry;
  shadingMode: ShadingMode;
  showColors: boolean;
}

// --- 1. AR PLACEMENT LOGIC (Fixed Rotation) ---
const ArPlacementWrapper: React.FC<{ 
    children: React.ReactNode; 
    isEditing: boolean;
    modelRef: React.MutableRefObject<THREE.Group>;
}> = ({ children, isEditing, modelRef }) => {
    const { session } = useXR();
    const { camera } = useThree();
    const [isPlaced, setIsPlaced] = useState(false);
    const reticleRef = useRef<THREE.Mesh>(null!);
    const [reticleVisible, setReticleVisible] = useState(false);
    const hitMatrix = useMemo(() => new THREE.Matrix4(), []);

    // A. Float in front of camera if not placed
    useFrame(() => {
        if (session && !isPlaced && modelRef.current) {
            const floatPos = new THREE.Vector3(0, 0, -0.5); // 0.5m in front
            floatPos.applyQuaternion(camera.quaternion);
            floatPos.add(camera.position);
            modelRef.current.position.lerp(floatPos, 0.1);
            modelRef.current.lookAt(camera.position.x, modelRef.current.position.y, camera.position.z);
        }
    });

    // B. Hit Testing
    useXRHitTest(
        (results, getWorldMatrix) => {
            if (isPlaced) {
                setReticleVisible(false);
                return;
            }
            if (results.length > 0 && reticleRef.current) {
                getWorldMatrix(hitMatrix, results[0]);
                hitMatrix.decompose(
                    reticleRef.current.position,
                    reticleRef.current.quaternion,
                    reticleRef.current.scale
                );
                reticleRef.current.rotation.x = -Math.PI / 2; 
                setReticleVisible(true);
            } else {
                setReticleVisible(false);
            }
        },
        'viewer', ['plane']
    );

    // C. Rotation Logic (Restored!)
    const isDragging = useRef(false);
    const previousX = useRef(0);

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        if (session) { 
            e.stopPropagation();
            isDragging.current = true;
            previousX.current = e.pointer.x;

            // Tap to Place
            if (!isPlaced && reticleVisible && modelRef.current && reticleRef.current) {
                modelRef.current.position.copy(reticleRef.current.position);
                setIsPlaced(true);
            }
        }
    };

    const handlePointerUp = () => {
        isDragging.current = false;
    };

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        // Only rotate if placed and dragging
        if (session && isPlaced && isDragging.current && modelRef.current) {
            e.stopPropagation();
            const currentX = e.pointer.x;
            const delta = currentX - previousX.current;
            
            // Rotate Y (Yaw) - Multiply by 5 for faster spin
            modelRef.current.rotation.y += delta * 5; 
            
            previousX.current = currentX;
        }
    };

    const isAR = session !== null;

    return (
        <>
            {/* Reticle */}
            {isAR && !isPlaced && (
                <mesh ref={reticleRef} rotation={[-Math.PI / 2, 0, 0]} visible={reticleVisible}>
                    <ringGeometry args={[0.15, 0.2, 32]} />
                    <meshBasicMaterial color="white" opacity={0.8} transparent />
                </mesh>
            )}

            {/* Model Container with Events */}
            <group
                ref={modelRef}
                // Attach ALL pointer events here to enable rotation
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onPointerMove={handlePointerMove} 
            >
                {children}
            </group>
        </>
    );
};

// --- Lighting Component ---
const Lighting: React.FC<{ preset: LightingPreset; showColors: boolean }> = ({ preset, showColors }) => {
  const intensityMod = showColors ? 0.7 : 1.0; 
  if (preset === 'outdoor') {
    return (
      <>
        <ambientLight intensity={0.8 * intensityMod} />
        <directionalLight position={[10, 10, 10]} intensity={2.5 * intensityMod} castShadow />
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

// --- Generated Model ---
const GeneratedModel = forwardRef<THREE.Mesh, GeneratedModelProps>(({ geometry, shadingMode, showColors }, ref) => {
    const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
    const hasColorAttribute = geometry.getAttribute('color') !== undefined;
    const useVertexColors = shadingMode === 'shaded' && showColors && hasColorAttribute;

    useFrame(() => {
      if (materialRef.current) materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, 1, 0.1);
    });

    return (
        <mesh ref={ref as React.RefObject<THREE.Mesh>} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial 
              key={useVertexColors ? "colored" : "clay"} 
              ref={materialRef}
              color="#FFFFFF" 
              vertexColors={useVertexColors} 
              roughness={useVertexColors ? 0.8 : 0.5} 
              metalness={useVertexColors ? 0.0 : 0.3} 
              envMapIntensity={useVertexColors ? 0.5 : 1.0}
              transparent opacity={0}
              wireframe={shadingMode === 'wireframe'}
          />
        </mesh>
    );
});
GeneratedModel.displayName = 'GeneratedModel';

// --- Placeholder ---
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

// --- Terminal Loader (Restored Animation) ---
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

    // Restore the typing animation effect
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
                {/* Scanning Preview */}
                <div className="relative w-32 h-32 border border-brand-primary/50 rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm shrink-0">
                    {sketchPreview && <img src={sketchPreview} className="w-full h-full object-cover opacity-50" alt="preview" />}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-primary/20 to-transparent animate-scanline h-full w-full" />
                </div>
                
                {/* Terminal Logs */}
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
    const meshRef = useRef<THREE.Mesh>(null!);
    const groupRef = useRef<THREE.Group>(null!); 

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
            let center = new THREE.Vector3(0, -1, 0);
            if (geo.boundingBox) {
                const heightOffset = -geo.boundingBox.min.z; 
                center = new THREE.Vector3(0, heightOffset - 1, 0); 
            }
            return [geo, center];
        } catch (e) {
            console.error("Failed to create geometry:", e);
            return [null, null];
        }
    }, [props.geometry]);

    return (
        <>
            {geometry && (
                <ArPlacementWrapper isEditing={props.isEditing} modelRef={groupRef}>
                    <group rotation={[-Math.PI / 2, 0, 0]}> 
                        <GeneratedModel ref={meshRef} geometry={geometry} shadingMode={props.shadingMode} showColors={props.showColors} />
                        {props.isEditing && (
                            <TransformControls object={meshRef as any} mode="scale" />
                        )}
                    </group>
                </ArPlacementWrapper>
            )}
            
            <OrbitControls 
                enabled={!props.isEditing}
                target={[0, 0, 0]} 
                enableZoom={true} enablePan={true} minDistance={0.5} maxDistance={20} minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.05} 
            />
        </>
    );
};

export const Viewer: React.FC<ViewerProps> = (props) => {
  return (
    <div className="w-full h-full bg-base-100 relative">
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45, position: [0, 2, 5], near: 0.01 }}>
        <XR store={store}>
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
        </XR>
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
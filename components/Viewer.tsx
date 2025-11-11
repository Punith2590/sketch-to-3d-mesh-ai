import React, { Suspense, forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Icosahedron, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { PipelineStatus } from '../types';
import type { ShadingMode, LightingPreset } from '../App'; // <-- Import new types

interface ViewerProps {
  geometry: { vertices: number[]; faces: number[]; uvs?: number[] } | null;
  isGenerating: boolean;
  pipelineStatus: PipelineStatus;
  modelRef: React.RefObject<THREE.Group>;
  shadingMode: ShadingMode; // <-- New prop
  lightingPreset: LightingPreset; // <-- New prop
}

interface GeneratedModelProps {
  geometryData: { vertices: number[]; faces: number[]; uvs?: number[] };
  shadingMode: ShadingMode;
}

// --- NEW: Lighting Component ---
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

// --- UPDATED MODEL COMPONENT ---
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
                        color="#FFFFFF"
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


const Loader: React.FC<{ status: PipelineStatus }> = ({ status }) => {
    return (
        <Html center>
            <div className="text-center text-brand-primary bg-base-100/80 p-8 rounded-lg backdrop-blur-md w-64">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary mx-auto"></div>
                <p className="mt-4 text-lg font-bold animate-pulse">{status.currentStage || 'Initializing...'}</p>
                <p className="text-sm text-content-muted">AI is processing the sketch</p>
            </div>
        </Html>
    );
}

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

// --- UPDATED VIEWER COMPONENT ---
export const Viewer: React.FC<ViewerProps> = (props) => {
  return (
    <div className="w-full h-full bg-base-100 relative">
      <Canvas dpr={[1, 2]} shadows camera={{ fov: 45, position: [0, 2, 5] }}>
        
        <color attach="background" args={['#202020']} />
        
        {/* --- Use new Lighting component --- */}
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
        {props.isGenerating && <Loader status={props.pipelineStatus} />}
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
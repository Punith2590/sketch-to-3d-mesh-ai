import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { Header } from './Header';
import { ControlBar } from './ControlBar';
import { Sidebar } from './Sidebar';
import { AccuracyDisplay } from './AccuracyDisplay';
import { Viewer } from './Viewer';
import { LoginPage } from './LoginPage';
import { SignUpPage } from './SignUpPage';
import { Toast } from './Toast';
import { DrawingCanvas } from './DrawingCanvas';
import { auth } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { GeneratedGeometry, WorkflowStep, ShadingMode, LightingPreset } from '../types';

type AuthScreen = 'login' | 'signup';

const Workspace: React.FC = () => {
  const navigate = useNavigate();

  // --- AUTHENTICATION STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  
  // --- APPLICATION STATE ---
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('upload');
  const [generatedGeometries, setGeneratedGeometries] = useState<GeneratedGeometry[]>([]);
  const [selectedGeometryIndex, setSelectedGeometryIndex] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);
  const [sketchPreview, setSketchPreview] = useState<string | null>(null); 
  const modelRef = useRef<THREE.Group>(null!);

  // --- CONTROL STATE ---
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [numberOfVariations, setNumberOfVariations] = useState<number>(1);

  // --- VIEWER STATE ---
  const [shadingMode, setShadingMode] = useState<ShadingMode>('shaded');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studio');
  
  // --- NEW: COLORING STATE ---
  const [showColors, setShowColors] = useState<boolean>(false);

  // --- FIREBASE AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- AUTH FUNCTIONS ---
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  const navigateToSignUp = () => setAuthScreen('signup');
  const navigateToLogin = () => setAuthScreen('login');

  // --- CORE APP FUNCTIONS ---
  const handleFileChange = (file: File | null) => {
    if (file) {
      setSketchFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSketchPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      handleResetVariations();
      setWorkflowStep('generating');
    }
  };

  const handleGeneration = async () => {
    if (!sketchFile) {
      setError("Please upload a sketch first.");
      return;
    }

    const BACKEND_URL = "https://wisely-hazelly-cherly.ngrok-free.dev/generate-mesh/"; // <--- UPDATE THIS

    setIsGenerating(true);
    setError(null);
    setGeneratedGeometries([]);
    setSelectedGeometryIndex(null);
    setWorkflowStep('generating');
    
    try {
      const formData = new FormData();
      formData.append("file", sketchFile, sketchFile.name);
      formData.append("prompt", textPrompt || "a 3d model");
      formData.append("variations", String(numberOfVariations));
      
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Backend Error: ${errData.detail || response.statusText}`);
      }
      
      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error("The model failed to return valid 3D data.");
      }

      const geometries: GeneratedGeometry[] = results.map((res: any) => {
        if (!res.vertices || !res.faces) return null;
        return {
          vertices: res.vertices,
          faces: res.faces,
          colors: res.colors || [] // Capture colors from backend
        };
      }).filter((g: GeneratedGeometry | null) => g !== null);

      if (geometries.length === 0) {
        throw new Error("All generated variations were invalid.");
      }
      
      setGeneratedGeometries(geometries);
      setSelectedGeometryIndex(0);
      setWorkflowStep('results');

    } catch (e) {
      console.error(e);
      setError(`Generation Error: ${e instanceof Error ? e.message : String(e)}`);
      setWorkflowStep(sketchFile ? 'generating' : 'upload');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartOver = useCallback(() => {
    setSketchFile(null);
    setSketchPreview(null);
    setWorkflowStep('upload');
    handleResetVariations();
  }, []);

  const handleResetVariations = useCallback(() => {
    setIsGenerating(false);
    setGeneratedGeometries([]);
    setSelectedGeometryIndex(null);
    setError(null);
    setShowColors(false); // Reset colors on new generation
    if (sketchFile) {
      setWorkflowStep('generating');
    }
  }, [sketchFile]);

  // --- EXPORT FUNCTIONS ---
  const saveFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  };
  
  const getSelectedGeo = () => {
    if (selectedGeometryIndex === null || !generatedGeometries[selectedGeometryIndex]) {
        return null;
    }
    return generatedGeometries[selectedGeometryIndex];
  }

  const handleExportOBJ = () => {
    const geoData = getSelectedGeo();
    if (!geoData) return;
    const { vertices, faces } = geoData;
    
    let output = '# Generated by Sketch-to-3D Mesh AI\n';
    for (let i = 0; i < vertices.length; i += 3) {
        output += `v ${vertices[i].toFixed(6)} ${vertices[i+1].toFixed(6)} ${vertices[i+2].toFixed(6)}\n`;
    }
    output += `g object_1\ns 1\n`;
    for (let i = 0; i < faces.length; i += 3) {
        const i1 = faces[i] + 1;
        const i2 = faces[i + 1] + 1;
        const i3 = faces[i + 2] + 1;
        output += `f ${i1} ${i2} ${i3}\n`;
    }
    saveFile(new Blob([output], { type: 'text/plain' }), `model_${(selectedGeometryIndex ?? 0) + 1}.obj`);
  };
  
  const handleExportSTL = () => {
    const geoData = getSelectedGeo();
    if (!geoData) return;
    const { vertices, faces } = geoData;

    let output = 'solid model\n';
    for (let i = 0; i < faces.length; i += 3) {
        const v1Idx = faces[i] * 3;
        const v2Idx = faces[i + 1] * 3;
        const v3Idx = faces[i + 2] * 3;

        const v1 = new THREE.Vector3(vertices[v1Idx], vertices[v1Idx + 1], vertices[v1Idx + 2]);
        const v2 = new THREE.Vector3(vertices[v2Idx], vertices[v2Idx + 1], vertices[v2Idx + 2]);
        const v3 = new THREE.Vector3(vertices[v3Idx], vertices[v3Idx + 1], vertices[v3Idx + 2]);

        const normal = new THREE.Vector3().crossVectors(
            v2.clone().sub(v1),
            v3.clone().sub(v1)
        ).normalize();

        output += `  facet normal ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
        output += '    outer loop\n';
        output += `      vertex ${v1.x.toFixed(6)} ${v1.y.toFixed(6)} ${v1.z.toFixed(6)}\n`;
        output += `      vertex ${v2.x.toFixed(6)} ${v2.y.toFixed(6)} ${v2.z.toFixed(6)}\n`;
        output += `      vertex ${v3.x.toFixed(6)} ${v3.y.toFixed(6)} ${v3.z.toFixed(6)}\n`;
        output += '    endloop\n';
        output += '  endfacet\n';
    }
    output += 'endsolid model\n';
    saveFile(new Blob([output], { type: 'text/plain' }), `model_${(selectedGeometryIndex ?? 0) + 1}.stl`);
  };
  
  const handleToggleDrawing = () => setIsDrawing(prev => !prev);
  
  const handleDrawingComplete = (file: File) => {
    handleFileChange(file);
    setIsDrawing(false);
  };

  const selectedGeometry = selectedGeometryIndex !== null ? generatedGeometries[selectedGeometryIndex] : null;

  // --- RENDER ---

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-base-100">
        <p className="text-xl text-brand-primary animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    if (authScreen === 'login') return <LoginPage onNavigateToSignUp={navigateToSignUp} />;
    return <SignUpPage onNavigateToLogin={navigateToLogin} />;
  }
  
  return (
    <div className="flex flex-col h-screen font-sans bg-base-100 text-content antialiased">
      <Header currentUser={currentUser} onSignOut={handleSignOut} />
      
      {isDrawing && <DrawingCanvas onComplete={handleDrawingComplete} onCancel={handleToggleDrawing} />}
      
      <main className="flex-1 relative">
        <Viewer 
          geometry={selectedGeometry} 
          isGenerating={isGenerating}
          modelRef={modelRef}
          shadingMode={shadingMode}
          lightingPreset={lightingPreset}
          sketchPreview={sketchPreview}
          showColors={showColors} // Pass state
        />
        
        {workflowStep !== 'results' && (
          <ControlBar
            onFileChange={handleFileChange}
            onGenerate={handleGeneration}
            onToggleDrawing={handleToggleDrawing}
            isGenerating={isGenerating}
            sketchPreview={sketchPreview}
            onStartOver={handleStartOver}
            numberOfVariations={numberOfVariations}
            onNumberOfVariationsChange={setNumberOfVariations}
            textPrompt={textPrompt}
            onTextPromptChange={setTextPrompt}
            workflowStep={workflowStep}
          />
        )}
        
        {workflowStep === 'results' && (
          <>
            <Sidebar
                onStartOver={handleStartOver}
                onResetVariations={handleResetVariations}
                onExportOBJ={handleExportOBJ}
                onExportSTL={handleExportSTL}
                generatedGeometries={generatedGeometries}
                selectedVariationIndex={selectedGeometryIndex}
                onSelectVariation={setSelectedGeometryIndex}
                shadingMode={shadingMode}
                onShadingModeChange={setShadingMode}
                lightingPreset={lightingPreset}
                onLightingPresetChange={setLightingPreset}
                showColors={showColors} // Pass state
                onToggleColor={() => setShowColors(!showColors)} // Pass toggle handler
            />
            <AccuracyDisplay 
              selectedVariationIndex={selectedGeometryIndex}
            />
          </>
        )}
      </main>
      <Toast message={error} onDismiss={() => setError(null)} />
    </div>
  );
};

export default Workspace;
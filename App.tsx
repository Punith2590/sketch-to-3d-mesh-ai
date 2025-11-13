import React, { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Header } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { Sidebar } from './components/Sidebar';
import { AccuracyDisplay } from './components/AccuracyDisplay'; // <-- Import new component
import { Viewer } from './components/Viewer';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { Toast } from './components/Toast';
import { DrawingCanvas } from './components/DrawingCanvas';
// import type { PipelineStatus } from './types'; // (Removed)
// import { PipelineStage } from './types'; // (Removed)

type GeneratedGeometry = {
  vertices: number[];
  faces: number[];
  uvs?: number[];
};

export type WorkflowStep = 'upload' | 'generating' | 'results';
type AuthScreen = 'login' | 'signup';
export type ModelId = 'gemini-2.5-pro' | 'gemini-2.5-flash';

// --- Types for Viewer Controls ---
export type ShadingMode = 'shaded' | 'wireframe';
export type LightingPreset = 'studio' | 'outdoor';


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Skip login for faster testing
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('upload');
  
  const [generatedGeometries, setGeneratedGeometries] = useState<GeneratedGeometry[]>([]);
  const [selectedGeometryIndex, setSelectedGeometryIndex] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);
  const [sketchPreview, setSketchPreview] = useState<string | null>(null); 
  const modelRef = useRef<THREE.Group>(null!);

  // --- State for ControlBar (Simplified) ---
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [numberOfVariations, setNumberOfVariations] = useState<number>(1);

  // --- State for Viewer Controls ---
  const [shadingMode, setShadingMode] = useState<ShadingMode>('shaded');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studio');


  const handleFileChange = (file: File | null) => {
    if (file) {
      setSketchFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSketchPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      handleResetVariations(); // Clear any previous results
      setWorkflowStep('generating'); // Move to the step with the "Generate" button
    }
  };

  const handleGeneration = async () => {
    if (!sketchFile) {
      setError("Please upload a sketch first.");
      return;
    }

    // !!! PASTE YOUR NGROK URL FROM THE COLAB NOTEBOOK HERE
    const BACKEND_URL = "https://wisely-hazelly-cherly.ngrok-free.dev/generate-mesh/"; // Placeholder

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
        };
      }).filter((g: GeneratedGeometry | null) => g !== null);

      if (geometries.length === 0) {
        throw new Error("All generated variations were invalid.");
      }
      
      setGeneratedGeometries(geometries);
      setSelectedGeometryIndex(0); // Select the first mesh
      setWorkflowStep('results'); // Move to the results view

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
    if (sketchFile) {
      setWorkflowStep('generating');
    }
  }, [sketchFile]);

  // (saveFile function is unchanged)
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

  // (handleExportOBJ is unchanged)
  const handleExportOBJ = () => {
    const geoData = getSelectedGeo();
    if (!geoData) {
        setError("Error: No exportable mesh data found.");
        return;
    }
    const { vertices, faces, uvs } = geoData;
    
    let output = '# Generated by Sketch-to-3D Mesh AI\n';
    for (let i = 0; i < vertices.length; i += 3) {
        output += `v ${vertices[i].toFixed(6)} ${vertices[i+1].toFixed(6)} ${vertices[i+2].toFixed(6)}\n`;
    }
    if (uvs) { /* (omitted) */ }
    output += `g object_1\ns 1\n`;
    for (let i = 0; i < faces.length; i += 3) {
        const i1 = faces[i] + 1;
        const i2 = faces[i + 1] + 1;
        const i3 = faces[i + 2] + 1;
        if (uvs) {
            output += `f ${i1}/${i1} ${i2}/${i2} ${i3}/${i3}\n`;
        } else {
            output += `f ${i1} ${i2} ${i3}\n`;
        }
    }
    saveFile(new Blob([output], { type: 'text/plain' }), `model_${(selectedGeometryIndex ?? 0) + 1}.obj`);
  };
  
  // (handleExportSTL is unchanged)
  const handleExportSTL = () => {
    const geoData = getSelectedGeo();
    if (!geoData) {
        setError("Error: No exportable mesh data found.");
        return;
    }
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

  // --- Auth and Navigation ---
  const handleLogin = () => setIsAuthenticated(true);
  const navigateToSignUp = () => setAuthScreen('signup');
  const navigateToLogin = () => setAuthScreen('login');
  
  const handleToggleDrawing = () => setIsDrawing(prev => !prev);
  
  const handleDrawingComplete = (file: File) => {
    handleFileChange(file);
    setIsDrawing(false);
  };

  const selectedGeometry = selectedGeometryIndex !== null ? generatedGeometries[selectedGeometryIndex] : null;

  // --- Auth Screens ---
  if (!isAuthenticated) {
    if (authScreen === 'login') return <LoginPage onLogin={handleLogin} onNavigateToSignUp={navigateToSignUp} />;
    return <SignUpPage onNavigateToLogin={navigateToLogin} onSignUpSuccess={handleLogin}/>;
  }

  // --- Main App ---
  return (
    <div className="flex flex-col h-screen font-sans bg-base-100 text-content antialiased">
      <Header />
      {isDrawing && <DrawingCanvas onComplete={handleDrawingComplete} onCancel={handleToggleDrawing} />}
      <main className="flex-1 relative">
        <Viewer 
          geometry={selectedGeometry} 
          isGenerating={isGenerating}
          modelRef={modelRef}
          shadingMode={shadingMode}
          lightingPreset={lightingPreset}
          sketchPreview={sketchPreview}
        />
        
        {/* The main ControlBar: shows for 'upload' and 'generating' */}
        {workflowStep !== 'results' && (
          <ControlBar
            onFileChange={handleFileChange}
            onGenerate={handleGeneration}
            onToggleDrawing={handleToggleDrawing}
            isGenerating={isGenerating}
            // pipelineStatus removed
            sketchPreview={sketchPreview}
            onStartOver={handleStartOver}
            numberOfVariations={numberOfVariations}
            onNumberOfVariationsChange={setNumberOfVariations}
            textPrompt={textPrompt}
            onTextPromptChange={setTextPrompt}
            workflowStep={workflowStep}
          />
        )}
        
        {/* The NEW Sidebar: shows only for 'results' */}
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
            />
            {/* The NEW Accuracy Display */}
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

export default App;
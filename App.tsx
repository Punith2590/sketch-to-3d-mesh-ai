import React, { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Header } from './components/Header';
import { ControlBar } from './components/ControlBar';
import { Viewer } from './components/Viewer';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { Toast } from './components/Toast';
import { DrawingCanvas } from './components/DrawingCanvas';
import type { PipelineStatus } from './types';
import { PipelineStage } from './types';

// This is the geometry format our backend returns
type GeneratedGeometry = {
  vertices: number[];
  faces: number[];
  uvs?: number[];
  accuracyScore?: number;
  accuracyJustification?: string;
};

export type WorkflowStep = 'upload' | 'generating' | 'results';
type AuthScreen = 'login' | 'signup';
// We keep this type for the ControlBar, but won't use it for API calls
export type ModelId = 'gemini-2.5-pro' | 'gemini-2.5-flash';


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Skip login for faster testing
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('upload');
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>({
    currentStage: null,
    completedStages: new Set(),
  });
  const [generatedGeometries, setGeneratedGeometries] = useState<GeneratedGeometry[]>([]);
  const [selectedGeometryIndex, setSelectedGeometryIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sketchPreview, setSketchPreview] = useState<string | null>(null);
  const modelRef = useRef<THREE.Group>(null!);

  // --- State for ControlBar ---
  // These are no longer used by the API, but are kept for the UI
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [numberOfVariations, setNumberOfVariations] = useState<number>(1);
  const [generateUVs, setGenerateUVs] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('gemini-2.5-pro');
  const [creativityLevel, setCreativityLevel] = useState<number>(20);


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

  /**
   * This function now calls the new InstantMesh backend.
   * It only sends the image file.
   */
  const handleGeneration = async () => {
    if (!sketchFile) {
      setError("Please upload a sketch first.");
      return;
    }

    // !!! PASTE YOUR NEW NGROK URL FROM THE COLAB NOTEBOOK HERE
    // It will look like: https://xxxx-xxxx-xxxx.ngrok-free.dev
    const BACKEND_URL = "https://kim-dilemmic-overtrustfully.ngrok-free.dev/generate-mesh/";

    if (BACKEND_URL.includes("YOUR_NEW_INSTANTMESH_NGROK_URL")) {
        setError("Please update the BACKEND_URL in App.tsx with your new ngrok URL.");
        return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedGeometries([]);
    setSelectedGeometryIndex(null);
    setWorkflowStep('generating');
    
    // Set a simple status for the user
    // We can use any of the pipeline stages, 'TRAINING' works as a generic "processing"
    setPipelineStatus({ currentStage: PipelineStage.TRAINING, completedStages: new Set() });

    try {
      // 1. Create FormData to send the file
      // 1. Create FormData to send the file AND the text prompt
      const formData = new FormData();
      formData.append("file", sketchFile, sketchFile.name);
      formData.append("prompt", textPrompt || "a 3d model"); // Send the prompt, or a default

      // 2. Call your NEW Colab backend
      // We are *only* sending the file.
      // The textPrompt, numberOfVariations, etc., are ignored by this new backend.
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Backend Error: ${response.statusText} ${await response.text()}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`Generation Error: ${result.error}`);
      }

      if (!result.vertices || !result.faces) {
        throw new Error("The model failed to return valid 3D data.");
      }

      // 3. Set the geometry from the response
      // InstantMesh returns one mesh
      const geometry: GeneratedGeometry = {
        vertices: result.vertices,
        faces: result.faces,
        // We can skip the accuracy check for this custom model
        accuracyScore: 100, 
        accuracyJustification: "Generated by InstantMesh" // Updated justification
      };
      
      setGeneratedGeometries([geometry]);
      setSelectedGeometryIndex(0); // Select the first (and only) mesh
      setWorkflowStep('results'); // Move to the results view
      setPipelineStatus({ currentStage: null, completedStages: new Set(Object.values(PipelineStage)) });

    } catch (e) {
      console.error(e);
      setError(`Generation Error: ${e instanceof Error ? e.message : String(e)}`);
      setPipelineStatus({ currentStage: null, completedStages: new Set() });
      // Go back to the 'generating' step (where the 'Generate' button is) if we have a file,
      // otherwise go all the way back to 'upload'
      setWorkflowStep(sketchFile ? 'generating' : 'upload');
    } finally {
      setIsGenerating(false);
    }
  };


  const handleStartOver = useCallback(() => {
    setSketchFile(null);
    setSketchPreview(null);
    setWorkflowStep('upload');
    handleResetVariations(); // This clears all geometry state
  }, []);

  const handleResetVariations = useCallback(() => {
    setIsGenerating(false);
    setPipelineStatus({ currentStage: null, completedStages: new Set() });
    setGeneratedGeometries([]);
    setSelectedGeometryIndex(null);
    setError(null);
    // Keep the text prompt, but go back to the 'generating' step if a file exists
    if (sketchFile) {
      setWorkflowStep('generating');
    }
  }, [sketchFile]);

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

  const handleExportOBJ = () => {
    const geoData = selectedGeometryIndex !== null ? generatedGeometries[selectedGeometryIndex] : null;

    if (!geoData || !geoData.vertices || !geoData.faces) {
        setError("Error: No exportable mesh data found.");
        return;
    }
    
    const { vertices, faces, uvs } = geoData;
    
    // Updated model name in the comment
    let output = '# Generated by Sketch-to-3D Mesh AI (InstantMesh)\n';
    
    for (let i = 0; i < vertices.length; i += 3) {
        output += `v ${vertices[i].toFixed(6)} ${vertices[i+1].toFixed(6)} ${vertices[i+2].toFixed(6)}\n`;
    }
    
    if (uvs) {
        for (let i = 0; i < uvs.length; i += 2) {
            output += `vt ${uvs[i].toFixed(6)} ${uvs[i+1].toFixed(6)}\n`;
        }
    }

    output += `g object_1\n` // Add a group name
    output += `s 1\n` // Smoothing group

    for (let i = 0; i < faces.length; i += 3) {
        const i1 = faces[i] + 1;
        const i2 = faces[i + 1] + 1;
        const i3 = faces[i + 2] + 1;
        if (uvs) {
            // This model probably won't return UVs, but the logic is harmless
            output += `f ${i1}/${i1} ${i2}/${i2} ${i3}/${i3}\n`;
        } else {
            // Standard face definition v/vt/vn. We only have v.
            output += `f ${i1} ${i2} ${i3}\n`;
        }
    }
    
    saveFile(new Blob([output], { type: 'text/plain' }), `model_${(selectedGeometryIndex ?? 0) + 1}.obj`);
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
          pipelineStatus={pipelineStatus}
          modelRef={modelRef} 
        />
        <ControlBar
          onFileChange={handleFileChange}
          onGenerate={handleGeneration}
          onToggleDrawing={handleToggleDrawing}
          isGenerating={isGenerating}
          pipelineStatus={pipelineStatus}
          sketchPreview={sketchPreview}
          onExportOBJ={handleExportOBJ}
          onResetVariations={handleResetVariations}
          onStartOver={handleStartOver}
          
          // Pass down the UI-only state
          numberOfVariations={numberOfVariations}
          onNumberOfVariationsChange={setNumberOfVariations}
          generateUVs={generateUVs}
          onGenerateUVsChange={setGenerateUVs}
          textPrompt={textPrompt}
          onTextPromptChange={setTextPrompt}
          selectedModel={selectedModel}
          onSelectedModelChange={setSelectedModel}
          creativityLevel={creativityLevel}
          onCreativityLevelChange={setCreativityLevel}
          
          generatedGeometries={generatedGeometries}
          selectedVariationIndex={selectedGeometryIndex}
          onSelectVariation={setSelectedGeometryIndex}
          workflowStep={workflowStep}
        />
      </main>
      <Toast message={error} onDismiss={() => setError(null)} />
    </div>
  );
};

export default App;
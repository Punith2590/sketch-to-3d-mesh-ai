import React, { useState, useEffect } from 'react';
// import type { PipelineStatus } from '../types'; // <-- REMOVED
// import { PipelineStage } from '../types'; // <-- REMOVED
import type { WorkflowStep, ModelId } from '../App';
import { FileUpload } from './FileUpload';
import {
  SparklesIcon,
  UndoIcon,
  UploadIcon,
  PencilIcon,
} from './icons'; // Using consolidated icons

/**
 * UPDATED: This component no longer handles the 'results' step.
 * It is now much simpler.
 */
interface ControlBarProps {
  onFileChange: (file: File | null) => void;
  onGenerate: () => void;
  onToggleDrawing: () => void;
  isGenerating: boolean;
  // pipelineStatus: PipelineStatus; // <-- REMOVED
  sketchPreview: string | null;
  onStartOver: () => void; // Kept for the 'Generating' step
  numberOfVariations: number;
  onNumberOfVariationsChange: (count: number) => void;
  textPrompt: string;
  onTextPromptChange: (prompt: string) => void;
  workflowStep: WorkflowStep;
}

// --- NEW: List of loading messages ---
const LOADING_MESSAGES = [
  "Warming up AI generators...",
  "Generating realistic 2D image...",
  "Analyzing 2D photo...",
  "Building 3D geometry...",
  "Almost done...",
];

// --- UPDATED: GenerationProgress component ---
const GenerationProgress: React.FC = () => {
    // This component now manages its own text cycle
    const [loadingText, setLoadingText] = useState(LOADING_MESSAGES[0]);

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            index = (index + 1) % LOADING_MESSAGES.length;
            setLoadingText(LOADING_MESSAGES[index]);
        }, 3000); // Change text every 3 seconds

        return () => clearInterval(interval); // Cleanup
    }, []);

    return (
        <div className="w-full flex items-center justify-center text-center">
            <div className="w-full max-w-xs">
                {/* Use dynamic loading text */}
                <p className="text-brand-primary font-bold text-lg animate-pulse">{loadingText}</p>
                <div className="w-full bg-base-300/50 rounded-full h-1.5 mt-2 overflow-hidden">
                    {/* Use a moving progress bar */}
                    <div className="bg-brand-primary h-1.5 w-1/2 animate-infinite-progress" />
                </div>
            </div>
        </div>
    );
};

const UploadStep: React.FC<{ onFileChange: (file: File | null) => void; onToggleDrawing: () => void; }> = ({ onFileChange, onToggleDrawing }) => (
    <div className="flex items-center justify-center gap-4 animate-slide-in-up">
        <FileUpload
            onFileChange={onFileChange}
            className="bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-3 px-6 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 text-lg"
        >
            <UploadIcon className="w-6 h-6 mr-2" />
            Upload Sketch
        </FileUpload>
        <button
            onClick={onToggleDrawing}
            className="bg-base-300/80 hover:bg-base-300 text-content font-bold py-3 px-6 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 text-lg"
        >
            <PencilIcon className="w-6 h-6 mr-2" />
            Draw Sketch
        </button>
    </div>
);

/**
 * UPDATED: GeneratingStep
 */
const GeneratingStep: React.FC<ControlBarProps> = (props) => (
    <div className="w-full flex items-center justify-between gap-6 animate-slide-in-up">
        <div className="flex items-center gap-4">
            {props.sketchPreview && (
                 <div className="flex-shrink-0">
                    <img src={props.sketchPreview} alt="Sketch preview" className="h-14 w-14 object-cover rounded-md border-2 border-base-300" />
                </div>
            )}
            <div>
                 <button onClick={props.onStartOver} className="text-sm text-content-muted hover:text-white flex items-center transition-colors">
                    <UndoIcon className="w-4 h-4 mr-2" />
                    Start Over
                </button>
            </div>
        </div>
        
        {/* Pass `isGenerating` to the progress bar */}
        {props.isGenerating ? <GenerationProgress /> : (
            <div className="flex flex-col items-end gap-3 flex-grow max-w-4xl">
                <input
                    type="text"
                    value={props.textPrompt}
                    onChange={(e) => props.onTextPromptChange(e.target.value)}
                    placeholder="Describe your sketch (e.g., 'a detailed sci-fi helmet')"
                    className="w-full bg-base-300/70 text-content border border-base-300 rounded-full py-2 px-4 focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all text-sm placeholder:text-content-muted"
                    aria-label="Describe what to generate"
                />
                                
                <div className="flex items-center justify-end gap-4 w-full">
                    <div className="flex items-center gap-3">
                        <label htmlFor="variations-input" className="text-sm font-medium text-content-muted whitespace-nowrap">Variations</label>
                        <input
                            id="variations-input"
                            type="range"
                            min="1"
                            max="5"
                            value={props.numberOfVariations}
                            onChange={(e) => props.onNumberOfVariationsChange(parseInt(e.target.value, 10))}
                            className="w-24 h-2 bg-base-300 rounded-lg appearance-none cursor-pointer"
                            style={{'accentColor': '#39FF14'}}
                        />
                        <span className="font-bold text-lg text-brand-primary">{props.numberOfVariations}</span>
                    </div>
                    
                    <button
                        onClick={props.onGenerate}
                        className="bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-3 px-6 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 text-lg"
                    >
                        <SparklesIcon className="w-6 h-6 mr-2" />
                        Generate
                    </button>
                </div>
            </div>
        )}
    </div>
);


export const ControlBar: React.FC<ControlBarProps> = (props) => {
  const renderContent = () => {
      switch(props.workflowStep) {
          case 'upload':
              return <UploadStep onFileChange={props.onFileChange} onToggleDrawing={props.onToggleDrawing} />;
          case 'generating':
              return <GeneratingStep {...props} />;
          case 'results':
              return null; // This bar is hidden during results
          default:
              return null;
      }
  };
  
  const content = renderContent();
  
  // If content is null, don't render the bar at all
  if (!content) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto p-4">
            <div className="bg-base-200/50 backdrop-blur-lg border border-base-300/50 rounded-2xl shadow-2xl p-4 min-h-[90px] flex items-center justify-center">
                {content}
            </div>
        </div>
    </div>
  );
};
import React from 'react';
import {
  UndoIcon,
  PaintbrushIcon,
  GridIcon,
  ZapIcon,
  SunIcon,
  TrashIcon,
  DownloadIcon,
} from './icons'; // Assumes you have the consolidated icon file

// Import types from App.tsx
import type { ShadingMode, LightingPreset } from '../App';

interface SidebarProps {
  onStartOver: () => void;
  onResetVariations: () => void;
  onExportOBJ: () => void;
  onExportSTL: () => void;
  generatedGeometries: any[]; // Simple array for length
  selectedVariationIndex: number | null;
  onSelectVariation: (index: number) => void;
  shadingMode: ShadingMode;
  onShadingModeChange: (mode: ShadingMode) => void;
  lightingPreset: LightingPreset;
  onLightingPresetChange: (preset: LightingPreset) => void;
}

// --- NEW: Wider button component with text ---
const IconButton: React.FC<{
  title: string;
  onClick: () => void;
  isActive: boolean;
  isDanger?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, isActive, isDanger, children }) => (
  <button
    title={title}
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-brand-primary text-black'
        : isDanger
        ? 'text-red-400 hover:bg-red-600/20 hover:text-red-300'
        : 'text-content-muted hover:bg-base-300'
    }`}
  >
    {children}
    <span className="font-semibold text-sm">{title}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    // --- FIX 1: Changed top-0 to top-20 to clear the header ---
    <div className="absolute top-20 left-0 bottom-0 z-20 p-4">
      {/* --- FIX 2: Made sidebar wider (w-64) and padding larger (p-4) --- */}
      <div className="bg-base-200/50 backdrop-blur-lg border border-base-300/50 rounded-2xl shadow-2xl p-4 h-full w-56 flex flex-col justify-between animate-fade-in">
        
        {/* Top Section: View Controls */}
        <div className="flex flex-col gap-2">
          <IconButton
            title="Start Over"
            onClick={props.onStartOver}
            isActive={false}
          >
            <UndoIcon className="w-5 h-5" />
          </IconButton>

          <div className="w-full h-px bg-base-300/50 my-2"></div>

          <IconButton
            title="Shaded"
            onClick={() => props.onShadingModeChange('shaded')}
            isActive={props.shadingMode === 'shaded'}
          >
            <PaintbrushIcon className="w-5 h-5" />
          </IconButton>
          <IconButton
            title="Wireframe"
            onClick={() => props.onShadingModeChange('wireframe')}
            isActive={props.shadingMode === 'wireframe'}
          >
            <GridIcon className="w-5 h-5" />
          </IconButton>
          
          <div className="w-full h-px bg-base-300/50 my-2"></div>
          
          <IconButton
            title="Studio Light"
            onClick={() => props.onLightingPresetChange('studio')}
            isActive={props.lightingPreset === 'studio'}
          >
            <ZapIcon className="w-5 h-5" />
          </IconButton>
          <IconButton
            title="Outdoor Light"
            onClick={() => props.onLightingPresetChange('outdoor')}
            isActive={props.lightingPreset === 'outdoor'}
          >
            <SunIcon className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Bottom Section: Variations & Export */}
        <div className="flex flex-col gap-2">
          {/* Variation Toggles */}
          <div className="flex items-center justify-center gap-2 bg-base-300/50 rounded-full p-1">
            {Array.from({ length: props.generatedGeometries.length }).map((_, index) => (
              <button
                key={index}
                title={`Variation ${index + 1}`}
                onClick={() => props.onSelectVariation(index)}
                className={`w-10 h-10 rounded-full text-sm font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center ${
                  props.selectedVariationIndex === index
                  ? 'bg-brand-primary text-black shadow-md'
                  : 'text-content-muted hover:bg-base-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="w-full h-px bg-base-300/50 my-2"></div>

          {/* --- FIX 3: Clearer buttons with text --- */}
          <IconButton
            title="Regenerate"
            onClick={props.onResetVariations}
            isActive={false}
            isDanger={true}
          >
            <TrashIcon className="w-5 h-5" />
          </IconButton>
          <IconButton
            title="Export OBJ"
            onClick={props.onExportOBJ}
            isActive={false}
          >
            <DownloadIcon className="w-5 h-5" />
          </IconButton>
          <IconButton
            title="Export STL"
            onClick={props.onExportSTL}
            isActive={false}
          >
            <DownloadIcon className="w-5 h-5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
};
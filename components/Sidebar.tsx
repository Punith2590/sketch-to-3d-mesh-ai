import React from 'react';
import { store } from '../components/Viewer';
import {
  UndoIcon,
  PaintbrushIcon,
  GridIcon,
  ZapIcon,
  SunIcon,
  TrashIcon,
  DownloadIcon,
  PaintBucketIcon,
  MousePointerIcon,
  VrIcon,
  CubeIcon
} from './icons';
import type { ShadingMode, LightingPreset } from '../types';

interface SidebarProps {
  onStartOver: () => void;
  onResetVariations: () => void;
  onExportOBJ: () => void;
  onExportSTL: () => void;
  generatedGeometries: any[];
  selectedVariationIndex: number | null;
  onSelectVariation: (index: number) => void;
  shadingMode: ShadingMode;
  onShadingModeChange: (mode: ShadingMode) => void;
  lightingPreset: LightingPreset;
  onLightingPresetChange: (preset: LightingPreset) => void;
  showColors: boolean;
  onToggleColor: () => void;
  isEditing: boolean;
  onToggleEdit: () => void;
}

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
    className={`w-full flex-shrink-0 flex items-center gap-3 p-3 rounded-lg transition-colors ${
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
    <div className="absolute top-20 left-0 bottom-0 z-20 p-4 pointer-events-none">
      {/* Added: max-h-[80vh] and overflow-y-auto to handle small screens */}
      <div className="pointer-events-auto bg-base-200/50 backdrop-blur-lg border border-base-300/50 rounded-2xl shadow-2xl p-4 w-56 flex flex-col gap-2 max-h-[85vh] overflow-y-auto animate-fade-in scrollbar-hide">
        
        {/* Top Section */}
        <div className="flex flex-col gap-2">
          <IconButton title="Start Over" onClick={props.onStartOver} isActive={false}>
            <UndoIcon className="w-5 h-5" />
          </IconButton>

          <div className="w-full h-px bg-base-300/50 my-1"></div>

          <IconButton title="Colorize" onClick={props.onToggleColor} isActive={props.showColors}>
            <PaintBucketIcon className="w-5 h-5" />
          </IconButton>

          <IconButton title="Edit Shape" onClick={props.onToggleEdit} isActive={props.isEditing}>
            <MousePointerIcon className="w-5 h-5" />
          </IconButton>

          <div className="w-full h-px bg-base-300/50 my-1"></div>

          <IconButton title="Enter AR" onClick={() => store.enterAR()} isActive={false}>
            <CubeIcon className="w-5 h-5" />
          </IconButton>

          <IconButton title="Enter VR" onClick={() => store.enterVR()} isActive={false}>
            <VrIcon className="w-5 h-5" />
          </IconButton>

          <div className="w-full h-px bg-base-300/50 my-1"></div>

          <IconButton title="Shaded" onClick={() => props.onShadingModeChange('shaded')} isActive={props.shadingMode === 'shaded'}>
            <PaintbrushIcon className="w-5 h-5" />
          </IconButton>
          <IconButton title="Wireframe" onClick={() => props.onShadingModeChange('wireframe')} isActive={props.shadingMode === 'wireframe'}>
            <GridIcon className="w-5 h-5" />
          </IconButton>
          
          <div className="w-full h-px bg-base-300/50 my-1"></div>
          
          <IconButton title="Studio Light" onClick={() => props.onLightingPresetChange('studio')} isActive={props.lightingPreset === 'studio'}>
            <ZapIcon className="w-5 h-5" />
          </IconButton>
          <IconButton title="Outdoor Light" onClick={() => props.onLightingPresetChange('outdoor')} isActive={props.lightingPreset === 'outdoor'}>
            <SunIcon className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col gap-2 mt-auto pt-2">
          <div className="w-full h-px bg-base-300/50 my-1"></div>
          
          <div className="flex items-center justify-center gap-2 bg-base-300/50 rounded-full p-1">
            {Array.from({ length: props.generatedGeometries.length }).map((_, index) => (
              <button
                key={index}
                onClick={() => props.onSelectVariation(index)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  props.selectedVariationIndex === index ? 'bg-brand-primary text-black' : 'text-content-muted'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <IconButton title="Regenerate" onClick={props.onResetVariations} isActive={false} isDanger={true}>
            <TrashIcon className="w-5 h-5" />
          </IconButton>
          <IconButton title="Export OBJ" onClick={props.onExportOBJ} isActive={false}>
            <DownloadIcon className="w-5 h-5" />
          </IconButton>
          <IconButton title="Export STL" onClick={props.onExportSTL} isActive={false}>
            <DownloadIcon className="w-5 h-5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
};
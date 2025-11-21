export enum PipelineStage {
  SKETCH_PREP = "Sketch Preprocessing",
  MESH_PREP = "Mesh Preprocessing",
  PAIRING = "Silhouette Pairing",
  TRAINING = "Model Training",
  OUTPUT = "Generating Output Mesh",
}

export interface PipelineStatus {
  currentStage: PipelineStage | null;
  completedStages: Set<PipelineStage>;
}

// --- NEW: Added colors to the geometry type ---
export type GeneratedGeometry = {
  vertices: number[];
  faces: number[];
  uvs?: number[];
  colors?: number[];
};

// Shared Types for Workspace
export type WorkflowStep = 'upload' | 'generating' | 'results';
export type ModelId = 'gemini-2.5-pro' | 'gemini-2.5-flash';
export type ShadingMode = 'shaded' | 'wireframe';
export type LightingPreset = 'studio' | 'outdoor';
export interface ModelInfo {
  id: string;
  name: string;
  pollinationsModel: string;
  badge: string;
  speed: string;
  description: string;
  category: "General" | "Realistic" | "Stylized" | "Speed" | "Artistic" | "Retro";
  qualityTag: string;
  icon: string;
}

export interface StylePreset {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: "Popular" | "Photorealistic" | "Artistic" | "Anime" | "Sci-Fi" | "Whimsical";
  modelRecommendation?: string;
  strengthRecommendation?: number;
}

export interface SampleImage {
  id: string;
  title: string;
  category: string;
  url: string;
  suggestedPrompt: string;
  suggestedStyle: string;
}

export interface GenerationResult {
  id: string;
  imageUrl: string;
  sourceImageUrl: string;
  model: string;
  modelId: string;
  prompt: string;
  seed: number;
  generationTimeMs: number;
  timestamp: number;
  width: number;
  height: number;
  strength: number;
}

export interface CanvasFilterSettings {
  brightness: number; // 0 to 200 (100 is default)
  contrast: number; // 0 to 200 (100 is default)
  saturation: number; // 0 to 200 (100 is default)
  grayscale: boolean;
  invert: boolean;
  sepia: boolean;
  sketch: boolean;
}

export interface AspectRatioOption {
  id: string;
  label: string;
  ratio: string;
  width: number;
  height: number;
  icon: string;
}

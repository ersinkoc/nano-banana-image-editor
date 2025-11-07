export type Gender = 'male' | 'female' | 'unspecified';
export type ArtisticStyle = 'Realistic' | 'Artistic' | 'Impressionistic' | 'Surrealist' | 'Art Nouveau' | 'Cubist' | 'Pixel Art' | 'Synthwave' | 'Steampunk' | 'Vintage Photo' | 'Line Art';

export interface ImageData {
  dataUrl: string;
  base64: string;
  mimeType: string;
}

export interface PromptDetails {
  medium: string;
  genre: string;
  lighting: string[];
  camera_angle: string;
  color_palette: string[];
  atmosphere: string[];
  emotion: string[];
  year: string;
  location:string;
  costume: string;
  subject_expression: string;
  subject_action: string;
  environmental_elements: string;
}

export interface Prompt {
  prompt: string;
  details: PromptDetails;
}

export interface HistoryEntry {
  id: string;
  prompt: Prompt;
  image?: string; // The base64 data URL of the generated image, optional to save localStorage space
}

export interface DebugLog {
  type: 'REQUEST' | 'RESPONSE' | 'ERROR';
  timestamp: string;
  data: unknown;
}
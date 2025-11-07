import type { PromptDetails } from '../types';

export interface PromptOptionSection {
  title: string;
  key: keyof PromptDetails;
  type: 'single' | 'multi' | 'text';
  placeholder?: string;
  options?: readonly string[];
}

export const customPromptSections: readonly PromptOptionSection[] = [
  {
    title: 'Art Medium',
    key: 'medium',
    type: 'single',
    options: ['Cinematic Photograph', 'Oil Painting', 'Watercolor Painting', 'Charcoal Sketch', 'Anime/Manga', 'Pixel Art', '3D Render', 'Claymation'],
  },
  {
    title: 'Genre',
    key: 'genre',
    type: 'single',
    options: ['Sci-Fi', 'Fantasy', 'Horror', 'Cyberpunk', 'Steampunk', 'Post-Apocalyptic', 'Noir', 'Historical', 'Surreal'],
  },
  {
    title: 'Lighting',
    key: 'lighting',
    type: 'multi',
    options: ['Soft', 'Harsh', 'Golden Hour', 'Blue Hour', 'Neon', 'Moonlight', 'Studio', 'Volumetric', 'Backlit', 'Rembrandt'],
  },
  {
    title: 'Color Palette',
    key: 'color_palette',
    type: 'multi',
    options: ['Vibrant', 'Muted', 'Monochromatic', 'Pastel', 'Earthy', 'Synthwave', 'Sepia', 'Cool Tones', 'Warm Tones'],
  },
  {
    title: 'Camera Angle',
    key: 'camera_angle',
    type: 'single',
    options: ["Eye-Level", "Low-Angle", "High-Angle", "Dutch Angle", "Wide Shot", "Close-Up", "POV"],
  },
  {
    title: 'Atmosphere',
    key: 'atmosphere',
    type: 'multi',
    options: ['Dreamy', 'Eerie', 'Mysterious', 'Serene', 'Chaotic', 'Melancholy', 'Nostalgic', 'Futuristic', 'Gritty', 'Cinematic'],
  },
  {
    title: 'Emotion',
    key: 'emotion',
    type: 'multi',
    options: ['Joyful', 'Determined', 'Lonely', 'Anxious', 'Peaceful', 'Curious', 'Defiant', 'Hopeful', 'Introspective'],
  },
  {
    title: 'Year / Era',
    key: 'year',
    type: 'text',
    placeholder: 'e.g., 1985, Victorian Era, 2099',
  },
  {
    title: 'Location',
    key: 'location',
    type: 'text',
    placeholder: 'e.g., An enchanted forest, a neon-lit alley',
  },
  {
    title: 'Costume / Appearance',
    key: 'costume',
    type: 'text',
    placeholder: 'e.g., Worn leather jacket, elegant ball gown',
  },
  {
    title: 'Subject Expression',
    key: 'subject_expression',
    type: 'text',
    placeholder: 'e.g., A subtle, knowing smile',
  },
  {
    title: 'Subject Action',
    key: 'subject_action',
    type: 'text',
    placeholder: 'e.g., Adjusting their glasses, holding a book',
  },
  {
    title: 'Environmental Elements',
    key: 'environmental_elements',
    type: 'text',
    placeholder: 'e.g., Falling cherry blossoms, distant fog',
  },
];
export type Gender = 'male' | 'female' | 'unspecified';
export type ArtisticStyle = 
  | 'Realism' | 'Artistic' | 'Abstract Expressionism' | 'Afrofuturism' | 'Airbrush' | 'Algorithmic Art' | 'Anaglyph 3D' | 'Anamorphic' | 'Ancient Egyptian Art' | 'Art Deco' | 'Art Nouveau' | 'ASCII Art' | 'Assemblage' | 'Aztec Art'
  | 'Baroque' | 'Bauhaus' | 'Biopunk' | 'Boro' | 'Botanical Illustration' | 'Brutalism' | 'Byzantine Art'
  | 'Caricature' | 'Celtic Art' | 'Chiaroscuro' | 'Chibi' | 'Cloisonnism' | 'Collage' | 'Constructivism' | 'Cross-hatching' | 'Cubist' | 'Cyanotype' | 'Cyberpunk'
  | 'Dadaism' | 'De Stijl' | 'Decoupage' | 'Demoscene' | 'Dieselpunk' | 'Didone' | 'Dot Painting (Aboriginal)' | 'Double Exposure'
  | 'Encaustic Painting' | 'Etching' | 'Expressionism'
  | 'Fantasy Art' | 'Fauvism' | 'Figurative' | 'Filigree' | 'Flat Design' | 'Folk Art' | 'Fresco' | 'Frottage' | 'Futurism'
  | 'Geometric Abstraction' | 'Glitch Art' | 'Gothic Art' | 'Gouache' | 'Graffiti' | 'Grisaille' | 'Grotesque'
  | 'Haida Art' | 'Hard-edge Painting' | 'Harlem Renaissance' | 'High-Tech' | 'Holography' | 'Hyperrealism'
  | 'Impasto' | 'Impressionistic' | 'Infrared Photography' | 'Ink Wash Painting' | 'International Typographic Style' | 'Islamic Art'
  | 'Japonisme' | 'Kawaii' | 'Kinetic Art' | 'Kintsugi' | 'Kirigami'
  | 'Land Art' | 'Letterpress' | 'Light and Space' | 'Line Art' | 'Lomography' | 'Lowbrow (Pop Surrealism)' | 'Lyrical Abstraction'
  | 'Macrame' | 'Majolica' | 'Mandala' | 'Mannerism' | 'Marquetry' | 'Memphis Group' | 'Metaphysical Art' | 'Mexican Muralism' | 'Micrography' | 'Minimalism' | 'Minoan Art' | 'Miserere' | 'Mosaic'
  | 'Nautical' | 'Neoclassicism' | 'Neo-Impressionism'
  | 'Op Art' | 'Origami' | 'Orphism' | 'Outsider Art'
  | 'Paper Quilling' | 'Parchment Craft' | 'Pastel Drawing' | 'Persian Miniature' | 'Photorealism' | 'Pinhole Photography' | 'Pixel Art' | 'Pointillism' | 'Pop Art' | 'Post-Impressionism' | 'Precisionism' | 'Primitivism' | 'Psychedelic' | 'Pyrography'
  | 'Rayonism' | 'Renaissance' | 'Risograph' | 'Rococo' | 'Roman Art' | 'Romanticism' | 'Russian Icons'
  | 'Sfumato' | 'Sgraffito' | 'Shibori' | 'Social Realism' | 'Sots Art' | 'Sound Art' | 'Stained Glass' | 'Steampunk' | 'Stippling' | 'Street Art' | 'Suprematism' | 'Surrealist' | 'Symbolism' | 'Synthetism' | 'Synthwave'
  | 'Tachisme' | 'Tattoo Art' | 'Technical Drawing' | 'Tenebrism' | 'Tiki Art' | 'Tribal Art' | 'Trompe-l\'œil'
  | 'Ukiyo-e' | 'Vaporwave' | 'Vector Art' | 'Verism' | 'Vintage Photo' | 'Vorticism' | 'Voxel Art'
  | 'Wabi-sabi' | 'Whimsical' | 'Woodcut Print';


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

export type TextModel = 'gemini-2.5-pro' | 'gemini-2.5-flash';
export type ImageModel = 'gemini-2.5-flash-image';
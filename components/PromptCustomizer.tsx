
import React, { useState } from 'react';
import type { Gender, ImageData, ArtisticStyle, TextModel, SubjectSpecificDetails, ImageModel, NegativePrompt } from '../types';
import { ImageUploader } from './ImageUploader';
import { GenderSelector } from './GenderSelector';

interface PromptCustomizerProps {
  onGenerateRandom: (
    gender1: Gender,
    gender2: Gender | null,
    style: ArtisticStyle,
    numImages: number,
    subject1Details: SubjectSpecificDetails,
    subject2Details: SubjectSpecificDetails,
    negativePrompt: NegativePrompt,
    cameraAngle: string
  ) => void;
  onImageUpload: (imageData: ImageData | null, personIndex: 1 | 2) => void;
  uploadedImage1: ImageData | null;
  uploadedImage2: ImageData | null;
  isDisabled: boolean;
  numImages: 1 | 2 | 3 | 4;
  setNumImages: (num: 1 | 2 | 3 | 4) => void;
  isJsonOnly: boolean;
  setIsJsonOnly: (isJsonOnly: boolean) => void;
  removeBackground: boolean;
  setRemoveBackground: (remove: boolean) => void;
  textModel: TextModel;
  setTextModel: (model: TextModel) => void;
  imageModel: ImageModel;
  setImageModel: (model: ImageModel) => void;
}

const SettingButtonGroup: React.FC<{
    label: string;
    options: { value: string, label: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
    disabled?: boolean;
}> = ({ label, options, selectedValue, onSelect, disabled = false }) => (
    <div className="space-y-2">
        <label className={`block text-sm font-medium text-card-foreground ${disabled ? 'opacity-50' : ''}`}>{label}</label>
        <div className="grid grid-cols-4 gap-2">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelect(option.value)}
                    disabled={disabled}
                    className={`h-10 px-3 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                        selectedValue === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-muted'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    </div>
);

const SubjectDetailInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
}> = ({ label, value, onChange, placeholder, disabled }) => (
    <div className="space-y-1">
        <label className={`text-xs font-medium text-muted-foreground ${disabled ? 'opacity-50' : ''}`}>{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full h-9 bg-background text-foreground border border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm px-3 py-2"
        />
    </div>
);

const NegativePromptInput: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
}> = ({ label, value, onChange, placeholder, disabled }) => (
    <div className="space-y-1">
        <label className={`text-xs font-medium text-muted-foreground ${disabled ? 'opacity-50' : ''}`}>{label}</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            className="w-full bg-background text-foreground border border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm px-3 py-2 resize-none"
        />
    </div>
);


const Card: React.FC<{children: React.ReactNode, className?: string}> = ({children, className}) => (
    <div className={`bg-card border border-border rounded-lg shadow-sm ${className}`}>
        {children}
    </div>
);

const CardHeader: React.FC<{title: string, description: string}> = ({title, description}) => (
    <div className="p-4 sm:p-5 border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);

const CardContent: React.FC<{children: React.ReactNode, className?: string}> = ({children, className}) => (
    <div className={`p-4 sm:p-5 ${className}`}>{children}</div>
);

const CardFooter: React.FC<{children: React.ReactNode, className?: string}> = ({children, className}) => (
    <div className={`p-4 sm:p-5 border-t border-border ${className}`}>{children}</div>
);

const allStyleOptions: { value: ArtisticStyle; label: string }[] = [
    { value: 'Cinematic Photorealism', label: 'Cinematic Photorealism (Ultra Realistic)' },
    { value: 'Realism', label: 'Realism' },
    { value: 'Artistic', label: 'Artistic (Random)' },
    { value: 'Abstract Expressionism', label: 'Abstract Expressionism' },
    { value: 'Afrofuturism', label: 'Afrofuturism' },
    { value: 'Airbrush', label: 'Airbrush' },
    { value: 'Algorithmic Art', label: 'Algorithmic Art' },
    { value: 'Anaglyph 3D', label: 'Anaglyph 3D' },
    { value: 'Anamorphic', label: 'Anamorphic' },
    { value: 'Ancient Egyptian Art', label: 'Ancient Egyptian Art' },
    { value: 'Art Deco', label: 'Art Deco' },
    { value: 'Art Nouveau', label: 'Art Nouveau' },
    { value: 'ASCII Art', label: 'ASCII Art' },
    { value: 'Assemblage', label: 'Assemblage' },
    { value: 'Aztec Art', label: 'Aztec Art' },
    { value: 'Baroque', label: 'Baroque' },
    { value: 'Bauhaus', label: 'Bauhaus' },
    { value: 'Biopunk', label: 'Biopunk' },
    { value: 'Boro', label: 'Boro' },
    { value: 'Botanical Illustration', label: 'Botanical Illustration' },
    { value: 'Brutalism', label: 'Brutalism' },
    { value: 'Byzantine Art', label: 'Byzantine Art' },
    { value: 'Caricature', label: 'Caricature' },
    { value: 'Celtic Art', label: 'Celtic Art' },
    { value: 'Chiaroscuro', label: 'Chiaroscuro' },
    { value: 'Chibi', label: 'Chibi' },
    { value: 'Cloisonnism', label: 'Cloisonnism' },
    { value: 'Collage', label: 'Collage' },
    { value: 'Constructivism', label: 'Constructivism' },
    { value: 'Cross-hatching', label: 'Cross-hatching' },
    { value: 'Cubist', label: 'Cubist' },
    { value: 'Cyanotype', label: 'Cyanotype' },
    { value: 'Cyberpunk', label: 'Cyberpunk' },
    { value: 'Dadaism', label: 'Dadaism' },
    { value: 'De Stijl', label: 'De Stijl' },
    { value: 'Decoupage', label: 'Decoupage' },
    { value: 'Demoscene', label: 'Demoscene' },
    { value: 'Dieselpunk', label: 'Dieselpunk' },
    { value: 'Didone', label: 'Didone' },
    { value: 'Dot Painting (Aboriginal)', label: 'Dot Painting (Aboriginal)' },
    { value: 'Double Exposure', label: 'Double Exposure' },
    { value: 'Encaustic Painting', label: 'Encaustic Painting' },
    { value: 'Etching', label: 'Etching' },
    { value: 'Expressionism', label: 'Expressionism' },
    { value: 'Fantasy Art', label: 'Fantasy Art' },
    { value: 'Fauvism', label: 'Fauvism' },
    { value: 'Figurative', label: 'Figurative' },
    { value: 'Filigree', label: 'Filigree' },
    { value: 'Flat Design', label: 'Flat Design' },
    { value: 'Folk Art', label: 'Folk Art' },
    { value: 'Fresco', label: 'Fresco' },
    { value: 'Frottage', label: 'Frottage' },
    { value: 'Futurism', label: 'Futurism' },
    { value: 'Geometric Abstraction', label: 'Geometric Abstraction' },
    { value: 'Glitch Art', label: 'Glitch Art' },
    { value: 'Gothic Art', label: 'Gothic Art' },
    { value: 'Gouache', label: 'Gouache' },
    { value: 'Graffiti', label: 'Graffiti' },
    { value: 'Grisaille', label: 'Grisaille' },
    { value: 'Grotesque', label: 'Grotesque' },
    { value: 'Haida Art', label: 'Haida Art' },
    { value: 'Hard-edge Painting', label: 'Hard-edge Painting' },
    { value: 'Harlem Renaissance', label: 'Harlem Renaissance' },
    { value: 'High-Tech', label: 'High-Tech' },
    { value: 'Holography', label: 'Holography' },
    { value: 'Hyperrealism', label: 'Hyperrealism' },
    { value: 'Impasto', label: 'Impasto' },
    { value: 'Impressionistic', label: 'Impressionistic' },
    { value: 'Infrared Photography', label: 'Infrared Photography' },
    { value: 'Ink Wash Painting', label: 'Ink Wash Painting' },
    { value: 'International Typographic Style', label: 'Intl. Typographic Style' },
    { value: 'Islamic Art', label: 'Islamic Art' },
    { value: 'Japonisme', label: 'Japonisme' },
    { value: 'Kawaii', label: 'Kawaii' },
    { value: 'Kinetic Art', label: 'Kinetic Art' },
    { value: 'Kintsugi', label: 'Kintsugi' },
    { value: 'Kirigami', label: 'Kirigami' },
    { value: 'Land Art', label: 'Land Art' },
    { value: 'Letterpress', label: 'Letterpress' },
    { value: 'Light and Space', label: 'Light and Space' },
    { value: 'Line Art', label: 'Line Art' },
    { value: 'Lomography', label: 'Lomography' },
    { value: 'Lowbrow (Pop Surrealism)', label: 'Lowbrow (Pop Surrealism)' },
    { value: 'Lyrical Abstraction', label: 'Lyrical Abstraction' },
    { value: 'Macrame', label: 'Macrame' },
    { value: 'Majolica', label: 'Majolica' },
    { value: 'Mandala', label: 'Mandala' },
    { value: 'Mannerism', label: 'Mannerism' },
    { value: 'Marquetry', label: 'Marquetry' },
    { value: 'Memphis Group', label: 'Memphis Group' },
    { value: 'Metaphysical Art', label: 'Metaphysical Art' },
    { value: 'Mexican Muralism', label: 'Mexican Muralism' },
    { value: 'Micrography', label: 'Micrography' },
    { value: 'Minimalism', label: 'Minimalism' },
    { value: 'Minoan Art', label: 'Minoan Art' },
    { value: 'Miserere', label: 'Miserere' },
    { value: 'Mosaic', label: 'Mosaic' },
    { value: 'Nautical', label: 'Nautical' },
    { value: 'Neoclassicism', label: 'Neoclassicism' },
    { value: 'Neo-Impressionism', label: 'Neo-Impressionism' },
    { value: 'Op Art', label: 'Op Art' },
    { value: 'Origami', label: 'Origami' },
    { value: 'Orphism', label: 'Orphism' },
    { value: 'Outsider Art', label: 'Outsider Art' },
    { value: 'Paper Quilling', label: 'Paper Quilling' },
    { value: 'Parchment Craft', label: 'Parchment Craft' },
    { value: 'Pastel Drawing', label: 'Pastel Drawing' },
    { value: 'Persian Miniature', label: 'Persian Miniature' },
    { value: 'Photorealism', label: 'Photorealism' },
    { value: 'Pinhole Photography', label: 'Pinhole Photography' },
    { value: 'Pixel Art', label: 'Pixel Art' },
    { value: 'Pointillism', label: 'Pointillism' },
    { value: 'Pop Art', label: 'Pop Art' },
    { value: 'Post-Impressionism', label: 'Post-Impressionism' },
    { value: 'Precisionism', label: 'Precisionism' },
    { value: 'Primitivism', label: 'Primitivism' },
    { value: 'Psychedelic', label: 'Psychedelic' },
    { value: 'Pyrography', label: 'Pyrography' },
    { value: 'Rayonism', label: 'Rayonism' },
    { value: 'Renaissance', label: 'Renaissance' },
    { value: 'Risograph', label: 'Risograph' },
    { value: 'Rococo', label: 'Rococo' },
    { value: 'Roman Art', label: 'Roman Art' },
    { value: 'Romanticism', label: 'Romanticism' },
    { value: 'Russian Icons', label: 'Russian Icons' },
    { value: 'Sfumato', label: 'Sfumato' },
    { value: 'Sgraffito', label: 'Sgraffito' },
    { value: 'Shibori', label: 'Shibori' },
    { value: 'Social Realism', label: 'Social Realism' },
    { value: 'Sots Art', label: 'Sots Art' },
    { value: 'Sound Art', label: 'Sound Art' },
    { value: 'Stained Glass', label: 'Stained Glass' },
    { value: 'Steampunk', label: 'Steampunk' },
    { value: 'Stippling', label: 'Stippling' },
    { value: 'Street Art', label: 'Street Art' },
    { value: 'Suprematism', label: 'Suprematism' },
    { value: 'Surrealist', label: 'Surrealist' },
    { value: 'Symbolism', label: 'Symbolism' },
    { value: 'Synthetism', label: 'Synthetism' },
    { value: 'Synthwave', label: 'Synthwave' },
    { value: 'Tachisme', label: 'Tachisme' },
    { value: 'Tattoo Art', label: 'Tattoo Art' },
    { value: 'Technical Drawing', label: 'Technical Drawing' },
    { value: 'Tenebrism', label: 'Tenebrism' },
    { value: 'Tiki Art', label: 'Tiki Art' },
    { value: 'Tribal Art', label: 'Tribal Art' },
    { value: "Trompe-l'œil", label: "Trompe-l'œil" },
    { value: 'Ukiyo-e', label: 'Ukiyo-e' },
    { value: 'Vaporwave', label: 'Vaporwave' },
    { value: 'Vector Art', label: 'Vector Art' },
    { value: 'Verism', label: 'Verism' },
    { value: 'Vintage Photo', label: 'Vintage Photo' },
    { value: 'Vorticism', label: 'Vorticism' },
    { value: 'Voxel Art', label: 'Voxel Art' },
    { value: 'Wabi-sabi', label: 'Wabi-sabi' },
    { value: 'Whimsical', label: 'Whimsical' },
    { value: 'Woodcut Print', label: 'Woodcut Print' },
  ];

const styleOptions = [...allStyleOptions].sort((a, b) => {
    if (a.value === 'Cinematic Photorealism') return -1;
    if (b.value === 'Cinematic Photorealism') return 1;
    if (a.value === 'Realism') return -1;
    if (b.value === 'Realism') return 1;
    if (a.value === 'Artistic') return -1;
    if (b.value === 'Artistic') return 1;
    return a.label.localeCompare(b.label);
});

const cameraAngleOptions = [
    { value: 'None', label: 'Random (AI Decides)' },
    { value: 'Low-Angle Shot', label: 'Low-Angle Shot' },
    { value: 'High-Angle Shot', label: 'High-Angle Shot' },
    { value: 'Dutch Angle', label: 'Dutch Angle' },
    { value: 'Wide Shot', label: 'Wide Shot' },
    { value: 'Close-Up', label: 'Close-Up' },
    { value: 'Point of View (POV)', label: 'Point of View (POV)' },
];


export const PromptCustomizer: React.FC<PromptCustomizerProps> = ({ 
    onGenerateRandom, onImageUpload, uploadedImage1, uploadedImage2, isDisabled,
    numImages, setNumImages, isJsonOnly, setIsJsonOnly,
    removeBackground, setRemoveBackground,
    textModel, setTextModel,
    imageModel, setImageModel
}) => {
  const [gender1, setGender1] = useState<Gender>('unspecified');
  const [gender2, setGender2] = useState<Gender>('unspecified');
  const [style, setStyle] = useState<ArtisticStyle>('Cinematic Photorealism');
  const [subject1Details, setSubject1Details] = useState<SubjectSpecificDetails>({ costume: '', subject_expression: '', subject_action: '' });
  const [subject2Details, setSubject2Details] = useState<SubjectSpecificDetails>({ costume: '', subject_expression: '', subject_action: '' });
  
  const [cameraAngle, setCameraAngle] = useState('None');
  
  const [negVisuals, setNegVisuals] = useState('');
  const [negStyles, setNegStyles] = useState('');
  const [negColors, setNegColors] = useState('');
  const [negObjects, setNegObjects] = useState('');

  const [isDetails1Open, setIsDetails1Open] = useState(false);
  const [isDetails2Open, setIsDetails2Open] = useState(false);
  const [isSceneDetailsOpen, setIsSceneDetailsOpen] = useState(false);
  const [isNegativePromptOpen, setIsNegativePromptOpen] = useState(false);
  
  const imagesToGenerate = isJsonOnly ? 0 : numImages;

  const handleGenerate = () => {
      const negativePrompt: NegativePrompt = {
          exclude_visuals: negVisuals.split(',').map(s => s.trim()).filter(Boolean),
          exclude_styles: negStyles.split(',').map(s => s.trim()).filter(Boolean),
          exclude_colors: negColors.split(',').map(s => s.trim()).filter(Boolean),
          exclude_objects: negObjects.split(',').map(s => s.trim()).filter(Boolean),
      };
      onGenerateRandom(gender1, uploadedImage2 ? gender2 : null, style, imagesToGenerate, subject1Details, subject2Details, negativePrompt, cameraAngle);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader title="1. Person 1" description="Upload photo and add details." />
        <CardContent className="space-y-4">
            <ImageUploader onImageUpload={(img) => onImageUpload(img, 1)} uploadedImage={uploadedImage1} />
            <GenderSelector selectedGender={gender1} onGenderChange={setGender1} />
            <div className="pt-2 border-t border-border">
                <button
                    type="button"
                    onClick={() => setIsDetails1Open(!isDetails1Open)}
                    className="w-full flex justify-between items-center py-2"
                    aria-expanded={isDetails1Open}
                    aria-controls="subject1-details"
                    disabled={isDisabled}
                >
                    <h5 className={`text-sm font-semibold text-card-foreground ${isDisabled ? 'opacity-50' : ''}`}>Specific Details (Optional)</h5>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isDetails1Open ? 'rotate-180' : ''} ${isDisabled ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div
                    id="subject1-details"
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isDetails1Open ? 'max-h-96 pt-2' : 'max-h-0'}`}
                >
                    <div className="space-y-3">
                        <SubjectDetailInput label="Costume / Appearance" value={subject1Details.costume} onChange={(val) => setSubject1Details(p => ({...p, costume: val}))} placeholder="e.g., Worn leather jacket" disabled={isDisabled} />
                        <SubjectDetailInput label="Expression" value={subject1Details.subject_expression} onChange={(val) => setSubject1Details(p => ({...p, subject_expression: val}))} placeholder="e.g., A subtle, knowing smile" disabled={isDisabled} />
                        <SubjectDetailInput label="Action" value={subject1Details.subject_action} onChange={(val) => setSubject1Details(p => ({...p, subject_action: val}))} placeholder="e.g., Adjusting their glasses" disabled={isDisabled} />
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader title="2. Person 2 (Optional)" description="Add a second person to the scene." />
        <CardContent className="space-y-4">
            <ImageUploader onImageUpload={(img) => onImageUpload(img, 2)} uploadedImage={uploadedImage2} />
            <GenderSelector selectedGender={gender2} onGenderChange={setGender2} />
            <div className="pt-2 border-t border-border">
                <button
                    type="button"
                    onClick={() => setIsDetails2Open(!isDetails2Open)}
                    className="w-full flex justify-between items-center py-2"
                    aria-expanded={isDetails2Open}
                    aria-controls="subject2-details"
                    disabled={isDisabled}
                >
                    <h5 className={`text-sm font-semibold text-card-foreground ${isDisabled ? 'opacity-50' : ''}`}>Specific Details (Optional)</h5>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isDetails2Open ? 'rotate-180' : ''} ${isDisabled ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div
                    id="subject2-details"
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isDetails2Open ? 'max-h-96 pt-2' : 'max-h-0'}`}
                >
                    <div className="space-y-3">
                        <SubjectDetailInput label="Costume / Appearance" value={subject2Details.costume} onChange={(val) => setSubject2Details(p => ({...p, costume: val}))} placeholder="e.g., Elegant ball gown" disabled={isDisabled} />
                        <SubjectDetailInput label="Expression" value={subject2Details.subject_expression} onChange={(val) => setSubject2Details(p => ({...p, subject_expression: val}))} placeholder="e.g., A look of surprise" disabled={isDisabled} />
                        <SubjectDetailInput label="Action" value={subject2Details.subject_action} onChange={(val) => setSubject2Details(p => ({...p, subject_action: val}))} placeholder="e.g., Holding a glowing orb" disabled={isDisabled} />
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
          <Card>
             <CardHeader title="3. Configure AI" description="Set parameters for your creation." />
             <CardContent className="space-y-4">
                <div>
                    <label htmlFor="style-select" className="block text-sm font-medium text-card-foreground mb-2">Artistic Style (for Randomize)</label>
                    <select
                        id="style-select"
                        value={style}
                        onChange={(e) => setStyle(e.target.value as ArtisticStyle)}
                        className="w-full h-10 bg-background text-foreground border border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm px-3 py-2"
                        disabled={isDisabled}
                    >
                        {styleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="text-model-select" className="block text-sm font-medium text-card-foreground mb-2">Prompt Generation Model</label>
                    <select
                        id="text-model-select"
                        value={textModel}
                        onChange={(e) => setTextModel(e.target.value as TextModel)}
                        className="w-full h-10 bg-background text-foreground border border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm px-3 py-2"
                        disabled={isDisabled}
                    >
                        <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    </select>
                </div>
                 <div>
                     <label htmlFor="image-model-select" className="block text-sm font-medium text-card-foreground mb-2">Image Generation Model</label>
                     <select
                         id="image-model-select"
                         value={imageModel}
                         onChange={(e) => setImageModel(e.target.value as ImageModel)}
                         className="w-full h-10 bg-background text-foreground border border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm px-3 py-2"
                         disabled={isDisabled}
                     >
                         <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Fast)</option>
                         <option value="gemini-3-pro-image-preview">Gemini 3.0 Pro Image (High Quality)</option>
                     </select>
                 </div>
                <SettingButtonGroup 
                    label="Number of Images" 
                    options={[ { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' } ]} 
                    selectedValue={String(numImages)} 
                    onSelect={(value) => setNumImages(Number(value) as 1 | 2 | 3 | 4)}
                    disabled={isJsonOnly || isDisabled}
                />
                <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="json-only" className="text-sm font-medium text-card-foreground">
                            Just JSON prompt, no image generation
                        </label>
                        <button
                            id="json-only"
                            type="button"
                            role="switch"
                            aria-checked={isJsonOnly}
                            onClick={() => setIsJsonOnly(!isJsonOnly)}
                            disabled={isDisabled}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${isDisabled ? 'opacity-50' : ''} ${
                                isJsonOnly ? 'bg-primary' : 'bg-input'
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isJsonOnly ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                </div>
                 <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="remove-background" className="text-sm font-medium text-card-foreground">
                            Remove Background
                        </label>
                        <button
                            id="remove-background"
                            type="button"
                            role="switch"
                            aria-checked={removeBackground}
                            onClick={() => setRemoveBackground(!removeBackground)}
                            disabled={isDisabled}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${isDisabled ? 'opacity-50' : ''} ${
                                removeBackground ? 'bg-primary' : 'bg-input'
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    removeBackground ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                 </div>

                <div className="pt-2 border-t border-border mt-4">
                    <button
                        type="button"
                        onClick={() => setIsSceneDetailsOpen(!isSceneDetailsOpen)}
                        className="w-full flex justify-between items-center py-2"
                        aria-expanded={isSceneDetailsOpen}
                        aria-controls="scene-details"
                        disabled={isDisabled}
                    >
                        <h5 className={`text-sm font-semibold text-card-foreground ${isDisabled ? 'opacity-50' : ''}`}>Scene Details (Optional)</h5>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isSceneDetailsOpen ? 'rotate-180' : ''} ${isDisabled ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div
                        id="scene-details"
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${isSceneDetailsOpen ? 'max-h-96 pt-2' : 'max-h-0'}`}
                    >
                         <div className="space-y-3">
                            <div>
                                <label htmlFor="camera-angle-select" className="block text-xs font-medium text-muted-foreground mb-1">Camera Angle</label>
                                <select
                                    id="camera-angle-select"
                                    value={cameraAngle}
                                    onChange={(e) => setCameraAngle(e.target.value)}
                                    className="w-full h-9 bg-background text-foreground border border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm px-3 py-2"
                                    disabled={isDisabled}
                                >
                                    {cameraAngleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </select>
                            </div>
                         </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-border mt-4">
                    <button
                        type="button"
                        onClick={() => setIsNegativePromptOpen(!isNegativePromptOpen)}
                        className="w-full flex justify-between items-center py-2"
                        aria-expanded={isNegativePromptOpen}
                        aria-controls="negative-prompt-details"
                        disabled={isDisabled}
                    >
                        <h5 className={`text-sm font-semibold text-card-foreground ${isDisabled ? 'opacity-50' : ''}`}>Negative Prompt (Exclusions)</h5>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isNegativePromptOpen ? 'rotate-180' : ''} ${isDisabled ? 'opacity-50' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <div
                        id="negative-prompt-details"
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${isNegativePromptOpen ? 'max-h-[500px] pt-2' : 'max-h-0'}`}
                    >
                        <div className="space-y-3">
                             <p className="text-xs text-muted-foreground">Specify elements you want to STRICTLY avoid in the generated image.</p>
                             <NegativePromptInput label="Exclude Visuals (e.g., text, blur, watermark)" value={negVisuals} onChange={setNegVisuals} placeholder="e.g., ugly, blurry, text" disabled={isDisabled} />
                             <NegativePromptInput label="Exclude Styles (e.g., cartoon, 3d, anime)" value={negStyles} onChange={setNegStyles} placeholder="e.g., cartoon, sketch" disabled={isDisabled} />
                             <NegativePromptInput label="Exclude Colors" value={negColors} onChange={setNegColors} placeholder="e.g., red, neon, mud" disabled={isDisabled} />
                             <NegativePromptInput label="Exclude Objects" value={negObjects} onChange={setNegObjects} placeholder="e.g., cars, trees, hats" disabled={isDisabled} />
                        </div>
                    </div>
                </div>

             </CardContent>
          </Card>
          
          <Card>
            <CardHeader title="4. Generate" description="Let the AI surprise you." />
            <CardFooter>
               <button type="button" onClick={handleGenerate} disabled={isDisabled} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed font-bold py-3 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                 {isDisabled ? 'Generating...' : 'Randomize & Create'}
               </button>
            </CardFooter>
          </Card>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import type { Prompt, PromptDetails, Gender, ImageData, ArtisticStyle } from '../types';
import { ImageUploader } from './ImageUploader';
import { GenderSelector } from './GenderSelector';
import { CustomPromptModal } from './CustomPromptModal';

interface PromptCustomizerProps {
  onGenerateRandom: (gender: Gender, style: ArtisticStyle, numImages: 0 | 1 | 4) => void;
  onGenerateCustom: (prompt: Prompt, numImages: 0 | 1 | 4) => void;
  onImageUpload: (imageData: ImageData | null) => void;
  isDisabled: boolean;
  quality: string;
  setQuality: (quality: string) => void;
  aspectRatio: string;
  setAspectRatio: (aspectRatio: string) => void;
  numImages: 0 | 1 | 4;
  setNumImages: (num: 0 | 1 | 4) => void;
  removeBackground: boolean;
  setRemoveBackground: (remove: boolean) => void;
}

const initialDetails: PromptDetails = {
  medium: '', genre: '', lighting: [], camera_angle: '', color_palette: [], atmosphere: [], emotion: [], year: '',
  location: '', costume: '', subject_expression: '', subject_action: '', environmental_elements: '',
};

const SettingButtonGroup: React.FC<{
    label: string;
    options: { value: string, label: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
}> = ({ label, options, selectedValue, onSelect }) => (
    <div className="space-y-2">
        <label className="block text-sm font-medium text-card-foreground">{label}</label>
        <div className="grid grid-cols-3 gap-2">
            {options.map((option, index) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelect(option.value)}
                    className={`h-10 px-3 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                        selectedValue === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-muted'
                    } ${options.length === 2 ? 'col-span-3 grid grid-cols-2' : ''} ${options.length === 2 ? (index === 0 ? 'col-start-1' : 'col-start-2') : ''}`}
                    style={options.length === 2 ? { gridColumn: 'span 1' } : {}}
                >
                    {option.label}
                </button>
            ))}
        </div>
         {options.length === 2 && <div className="col-span-1"></div>}
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


export const PromptCustomizer: React.FC<PromptCustomizerProps> = ({ 
    onGenerateRandom, onGenerateCustom, onImageUpload, isDisabled, quality, setQuality,
    aspectRatio, setAspectRatio, numImages, setNumImages, removeBackground, setRemoveBackground
}) => {
  const [gender, setGender] = useState<Gender>('unspecified');
  const [style, setStyle] = useState<ArtisticStyle>('Realism');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [customDetails, setCustomDetails] = useState<PromptDetails>(() => {
    try {
      const savedDetails = window.localStorage.getItem('lastCustomPromptDetails');
      if (savedDetails) {
        return { ...initialDetails, ...JSON.parse(savedDetails) };
      }
      return initialDetails;
    } catch (error) {
      console.error("Failed to load custom prompt details from localStorage:", error);
      return initialDetails;
    }
  });

  const handleGenerateFromModal = (prompt: Prompt) => {
      setCustomDetails(prompt.details);
      try {
        window.localStorage.setItem('lastCustomPromptDetails', JSON.stringify(prompt.details));
      } catch (error) {
        console.error("Failed to save custom prompt details to localStorage:", error);
      }
      onGenerateCustom(prompt, numImages);
  };

  const styleOptions: { value: ArtisticStyle; label: string }[] = [
    { value: 'Realism', label: 'Realism' },
    { value: 'Artistic', label: 'Artistic (Random)' },
    { value: 'Abstract Expressionism', label: 'Abstract Expressionism' },
    { value: 'Airbrush', label: 'Airbrush' },
    { value: 'Art Deco', label: 'Art Deco' },
    { value: 'Art Nouveau', label: 'Art Nouveau' },
    { value: 'Baroque', label: 'Baroque' },
    { value: 'Bauhaus', label: 'Bauhaus' },
    { value: 'Biopunk', label: 'Biopunk' },
    { value: 'Collage', label: 'Collage' },
    { value: 'Cubist', label: 'Cubist' },
    { value: 'Cyberpunk', label: 'Cyberpunk' },
    { value: 'Dieselpunk', label: 'Dieselpunk' },
    { value: 'Double Exposure', label: 'Double Exposure' },
    { value: 'Etching', label: 'Etching' },
    { value: 'Fantasy Art', label: 'Fantasy Art' },
    { value: 'Fauvism', label: 'Fauvism' },
    { value: 'Folk Art', label: 'Folk Art' },
    { value: 'Glitch Art', label: 'Glitch Art' },
    { value: 'Gothic Art', label: 'Gothic Art' },
    { value: 'Gouache', label: 'Gouache' },
    { value: 'Impressionistic', label: 'Impressionistic' },
    { value: 'Ink Wash Painting', label: 'Ink Wash Painting' },
    { value: 'Line Art', label: 'Line Art' },
    { value: 'Lomography', label: 'Lomography' },
    { value: 'Minimalism', label: 'Minimalism' },
    { value: 'Neoclassicism', label: 'Neoclassicism' },
    { value: 'Pastel Drawing', label: 'Pastel Drawing' },
    { value: 'Pixel Art', label: 'Pixel Art' },
    { value: 'Pop Art', label: 'Pop Art' },
    { value: 'Post-Impressionism', label: 'Post-Impressionism' },
    { value: 'Psychedelic', label: 'Psychedelic' },
    { value: 'Renaissance', label: 'Renaissance' },
    { value: 'Risograph', label: 'Risograph' },
    { value: 'Rococo', label: 'Rococo' },
    { value: 'Romanticism', label: 'Romanticism' },
    { value: 'Stained Glass', label: 'Stained Glass' },
    { value: 'Steampunk', label: 'Steampunk' },
    { value: 'Street Art', label: 'Street Art' },
    { value: 'Surrealist', label: 'Surrealist' },
    { value: 'Synthwave', label: 'Synthwave' },
    { value: 'Tattoo Art', label: 'Tattoo Art' },
    { value: 'Technical Drawing', label: 'Technical Drawing' },
    { value: 'Tribal Art', label: 'Tribal Art' },
    { value: 'Ukiyo-e', label: 'Ukiyo-e' },
    { value: 'Vaporwave', label: 'Vaporwave' },
    { value: 'Vector Art', label: 'Vector Art' },
    { value: 'Vintage Photo', label: 'Vintage Photo' },
    { value: 'Voxel Art', label: 'Voxel Art' },
    { value: 'Woodcut Print', label: 'Woodcut Print' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="1. Upload Photo" description="Start by uploading a clear profile photo." />
        <CardContent>
            <ImageUploader onImageUpload={onImageUpload} />
        </CardContent>
      </Card>
      
      <Card>
         <CardHeader title="2. Configure AI" description="Set the parameters for your creation." />
         <CardContent className="space-y-4">
            <GenderSelector selectedGender={gender} onGenderChange={setGender} />
            <div>
                <label htmlFor="style-select" className="block text-sm font-medium text-card-foreground mb-2">Style (for Randomize)</label>
                <select
                    id="style-select"
                    value={style}
                    onChange={(e) => setStyle(e.target.value as ArtisticStyle)}
                    className="w-full h-10 bg-background text-foreground border border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm px-3 py-2"
                >
                    {styleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
            </div>
             <SettingButtonGroup label="Quality" options={[ { value: 'standard', label: 'Standard' }, { value: 'high', label: 'High' }]} selectedValue={quality} onSelect={setQuality} />
             <SettingButtonGroup label="Aspect Ratio" options={[ { value: '1:1', label: '1:1' }, { value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' } ]} selectedValue={aspectRatio} onSelect={setAspectRatio} />
             <SettingButtonGroup label="Number of Images" options={[ { value: '0', label: 'JSON' }, { value: '1', label: '1' }, { value: '4', label: '4' } ]} selectedValue={String(numImages)} onSelect={(value) => setNumImages(Number(value) as 0 | 1 | 4)} />
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
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
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
         </CardContent>
      </Card>
      
       <Card>
         <CardHeader title="3. Generate" description="Create a custom prompt or let the AI surprise you." />
         <CardFooter className="flex flex-col space-y-3">
             <button type="button" onClick={() => setIsModalOpen(true)} disabled={isDisabled} className="w-full h-11 bg-secondary text-secondary-foreground hover:bg-muted disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed font-bold py-3 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
              Create Custom Prompt
            </button>
            <button type="button" onClick={() => onGenerateRandom(gender, style, numImages)} disabled={isDisabled} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed font-bold py-3 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
              {isDisabled ? 'Generating...' : 'Randomize & Create'}
            </button>
         </CardFooter>
       </Card>

      <CustomPromptModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerateFromModal}
        initialDetails={customDetails}
      />
    </div>
  );
};
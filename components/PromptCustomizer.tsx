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
    aspectRatio, setAspectRatio, numImages, setNumImages
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
    { value: 'Art Nouveau', label: 'Art Nouveau' },
    { value: 'Baroque', label: 'Baroque' },
    { value: 'Cubist', label: 'Cubist' },
    { value: 'Fantasy Art', label: 'Fantasy Art' },
    { value: 'Impressionistic', label: 'Impressionistic' },
    { value: 'Line Art', label: 'Line Art' },
    { value: 'Minimalism', label: 'Minimalism' },
    { value: 'Pixel Art', label: 'Pixel Art' },
    { value: 'Steampunk', label: 'Steampunk' },
    { value: 'Surrealist', label: 'Surrealist' },
    { value: 'Synthwave', label: 'Synthwave' },
    { value: 'Vintage Photo', label: 'Vintage Photo' },
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
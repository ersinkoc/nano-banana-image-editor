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
    <div className="space-y-3">
        <label className={`block text-xs font-bold uppercase tracking-wider text-muted-foreground ${disabled ? 'opacity-50' : ''}`}>{label}</label>
        <div className="grid grid-cols-4 gap-2 bg-secondary/50 p-1 rounded-xl">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelect(option.value)}
                    disabled={disabled}
                    className={`h-9 text-xs font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                        selectedValue === option.value
                            ? 'bg-background text-primary shadow-sm scale-100 ring-1 ring-border'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
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
    <div className="space-y-1.5 input-glow rounded-xl transition-all duration-200">
        <label className={`text-xs font-bold text-muted-foreground ml-1 ${disabled ? 'opacity-50' : ''}`}>{label}</label>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full h-11 bg-secondary/30 text-foreground border border-transparent rounded-xl focus:border-ring/30 focus:bg-secondary/50 sm:text-sm px-4 transition-all outline-none placeholder:text-muted-foreground/50"
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
    <div className="space-y-1.5 input-glow rounded-xl">
        <label className={`text-xs font-bold text-muted-foreground ml-1 ${disabled ? 'opacity-50' : ''}`}>{label}</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            className="w-full bg-secondary/30 text-foreground border border-transparent rounded-xl focus:border-red-500/30 focus:bg-secondary/50 sm:text-sm px-4 py-3 resize-none transition-all outline-none placeholder:text-muted-foreground/50"
        />
    </div>
);


const GlassCard: React.FC<{children: React.ReactNode, className?: string}> = ({children, className}) => (
    <div className={`glass-card rounded-3xl shadow-glass overflow-hidden flex flex-col ${className}`}>
        {children}
    </div>
);

const CardHeader: React.FC<{title: string, description: string, icon?: React.ReactNode}> = ({title, description, icon}) => (
    <div className="p-6 border-b border-border/40 bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center gap-3 mb-1">
             {icon && <div className="text-primary">{icon}</div>}
             <h3 className="text-lg font-bold text-card-foreground tracking-tight">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
);

const CardContent: React.FC<{children: React.ReactNode, className?: string}> = ({children, className}) => (
    <div className={`p-6 ${className}`}>{children}</div>
);

const allStyleOptions: { value: ArtisticStyle; label: string }[] = [
    { value: 'Cinematic Photorealism', label: 'Cinematic Photorealism (Ultra Realistic)' },
    { value: 'Realism', label: 'Realism' },
    { value: 'Artistic', label: 'Artistic (Random)' },
    { value: 'Cyberpunk', label: 'Cyberpunk' },
    { value: 'Synthwave', label: 'Synthwave' },
    { value: 'Hyperrealism', label: 'Hyperrealism' },
    { value: 'Watercolor Painting', label: 'Watercolor' },
    { value: 'Oil Painting', label: 'Oil Painting' },
    { value: 'Charcoal Sketch', label: 'Charcoal Sketch' },
    { value: 'Anime/Manga', label: 'Anime/Manga' },
    { value: 'Pixel Art', label: 'Pixel Art' },
    { value: '3D Render', label: '3D Render' },
    { value: 'Claymation', label: 'Claymation' },
    { value: 'Abstract Expressionism', label: 'Abstract Expressionism' },
    { value: 'Pop Art', label: 'Pop Art' },
    { value: 'Steampunk', label: 'Steampunk' },
    { value: 'Noir', label: 'Noir' },
    { value: 'Vintage Photo', label: 'Vintage Photo' },
];

const styleOptions = allStyleOptions; 

const cameraAngleOptions = [
    { value: 'None', label: 'AI Decides (Random)' },
    { value: 'Low-Angle Shot', label: 'Low-Angle Shot' },
    { value: 'High-Angle Shot', label: 'High-Angle Shot' },
    { value: 'Dutch Angle', label: 'Dutch Angle' },
    { value: 'Wide Shot', label: 'Wide Shot' },
    { value: 'Close-Up', label: 'Close-Up' },
    { value: 'Point of View (POV)', label: 'Point of View (POV)' },
];

// Icons
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.15l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.15l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></svg>;


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

  const ExpandButton: React.FC<{isOpen: boolean, onClick: () => void, label: string, disabled?: boolean}> = ({isOpen, onClick, label, disabled}) => (
      <button
        type="button"
        onClick={onClick}
        className="w-full flex justify-between items-center py-3 px-1 group"
        disabled={disabled}
      >
        <span className={`text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors ${disabled ? 'opacity-50' : ''}`}>{label}</span>
        <div className={`h-6 w-6 rounded-full bg-secondary flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180 bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </button>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Subject 1 Card */}
      <GlassCard>
        <CardHeader title="Person 1" description="Main subject of your creation." icon={<UserIcon />} />
        <CardContent className="space-y-6 flex-grow">
            <ImageUploader onImageUpload={(img) => onImageUpload(img, 1)} uploadedImage={uploadedImage1} />
            <GenderSelector selectedGender={gender1} onGenderChange={setGender1} />
            <div className="border-t border-border/50 pt-1">
                <ExpandButton isOpen={isDetails1Open} onClick={() => setIsDetails1Open(!isDetails1Open)} label="Add Specific Details" disabled={isDisabled} />
                <div className={`transition-all duration-300 ease-in-out overflow-hidden space-y-3 ${isDetails1Open ? 'max-h-96 pt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <SubjectDetailInput label="Costume" value={subject1Details.costume} onChange={(val) => setSubject1Details(p => ({...p, costume: val}))} placeholder="e.g., Cyberpunk armor" disabled={isDisabled} />
                    <SubjectDetailInput label="Expression" value={subject1Details.subject_expression} onChange={(val) => setSubject1Details(p => ({...p, subject_expression: val}))} placeholder="e.g., Intense glare" disabled={isDisabled} />
                    <SubjectDetailInput label="Action" value={subject1Details.subject_action} onChange={(val) => setSubject1Details(p => ({...p, subject_action: val}))} placeholder="e.g., Holding a neon katana" disabled={isDisabled} />
                </div>
            </div>
        </CardContent>
      </GlassCard>
      
      {/* Subject 2 Card */}
      <GlassCard>
        <CardHeader title="Person 2 (Optional)" description="Add a companion or rival." icon={<UserIcon />} />
        <CardContent className="space-y-6 flex-grow">
            <ImageUploader onImageUpload={(img) => onImageUpload(img, 2)} uploadedImage={uploadedImage2} />
            <GenderSelector selectedGender={gender2} onGenderChange={setGender2} />
             <div className="border-t border-border/50 pt-1">
                <ExpandButton isOpen={isDetails2Open} onClick={() => setIsDetails2Open(!isDetails2Open)} label="Add Specific Details" disabled={isDisabled} />
                <div className={`transition-all duration-300 ease-in-out overflow-hidden space-y-3 ${isDetails2Open ? 'max-h-96 pt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <SubjectDetailInput label="Costume" value={subject2Details.costume} onChange={(val) => setSubject2Details(p => ({...p, costume: val}))} placeholder="e.g., Royal gown" disabled={isDisabled} />
                    <SubjectDetailInput label="Expression" value={subject2Details.subject_expression} onChange={(val) => setSubject2Details(p => ({...p, subject_expression: val}))} placeholder="e.g., Laughing" disabled={isDisabled} />
                    <SubjectDetailInput label="Action" value={subject2Details.subject_action} onChange={(val) => setSubject2Details(p => ({...p, subject_action: val}))} placeholder="e.g., Dancing" disabled={isDisabled} />
                </div>
            </div>
        </CardContent>
      </GlassCard>
      
      {/* Configuration Card */}
      <div className="flex flex-col gap-6">
          <GlassCard>
             <CardHeader title="Configure & Create" description="Fine-tune your masterpiece." icon={<SettingsIcon />} />
             <CardContent className="space-y-6">
                
                {/* Style Select */}
                <div className="space-y-1.5 input-glow rounded-xl">
                    <label htmlFor="style-select" className="block text-xs font-bold text-muted-foreground ml-1">Artistic Style</label>
                    <div className="relative">
                        <select
                            id="style-select"
                            value={style}
                            onChange={(e) => setStyle(e.target.value as ArtisticStyle)}
                            className="w-full h-11 bg-secondary/30 text-foreground border border-transparent rounded-xl focus:border-ring/30 focus:bg-secondary/50 sm:text-sm pl-4 pr-10 appearance-none cursor-pointer outline-none transition-all"
                            disabled={isDisabled}
                        >
                            {styleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                </div>

                {/* Model Selection Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1.5 input-glow rounded-xl">
                        <label className="block text-xs font-bold text-muted-foreground ml-1">Text Model</label>
                        <select
                            value={textModel}
                            onChange={(e) => setTextModel(e.target.value as TextModel)}
                            className="w-full h-10 bg-secondary/30 text-foreground border border-transparent rounded-lg text-xs px-3 outline-none"
                            disabled={isDisabled}
                        >
                            <option value="gemini-3-pro-preview">Gemini 3.0 Pro</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                        </select>
                     </div>
                     <div className="space-y-1.5 input-glow rounded-xl">
                        <label className="block text-xs font-bold text-muted-foreground ml-1">Image Model</label>
                        <select
                            value={imageModel}
                            onChange={(e) => setImageModel(e.target.value as ImageModel)}
                            className="w-full h-10 bg-secondary/30 text-foreground border border-transparent rounded-lg text-xs px-3 outline-none"
                            disabled={isDisabled}
                        >
                            <option value="gemini-2.5-flash-image">Gemini 2.5 Flash</option>
                            <option value="gemini-3-pro-image-preview">Gemini 3.0 Pro</option>
                        </select>
                     </div>
                </div>

                <SettingButtonGroup 
                    label="Image Count" 
                    options={[ { value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' } ]} 
                    selectedValue={String(numImages)} 
                    onSelect={(value) => setNumImages(Number(value) as 1 | 2 | 3 | 4)}
                    disabled={isJsonOnly || isDisabled}
                />

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-2 p-3 bg-secondary/20 rounded-xl border border-border/30">
                        <span className="text-xs font-semibold text-muted-foreground">JSON Only</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isJsonOnly}
                            onClick={() => setIsJsonOnly(!isJsonOnly)}
                            disabled={isDisabled}
                            className={`relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDisabled ? 'opacity-50' : ''} ${isJsonOnly ? 'bg-primary' : 'bg-input'}`}
                        >
                            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isJsonOnly ? 'translate-x-4' : 'translate-x-0'}`}/>
                        </button>
                    </div>
                    
                    <div className="flex flex-col gap-2 p-3 bg-secondary/20 rounded-xl border border-border/30">
                        <span className="text-xs font-semibold text-muted-foreground">Remove BG</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={removeBackground}
                            onClick={() => setRemoveBackground(!removeBackground)}
                            disabled={isDisabled}
                            className={`relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDisabled ? 'opacity-50' : ''} ${removeBackground ? 'bg-primary' : 'bg-input'}`}
                        >
                            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${removeBackground ? 'translate-x-4' : 'translate-x-0'}`}/>
                        </button>
                    </div>
                </div>

                {/* Advanced Options Sections */}
                <div className="space-y-1">
                    <ExpandButton isOpen={isSceneDetailsOpen} onClick={() => setIsSceneDetailsOpen(!isSceneDetailsOpen)} label="Scene Details (Camera)" disabled={isDisabled} />
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isSceneDetailsOpen ? 'max-h-40 pb-2' : 'max-h-0'}`}>
                         <div className="space-y-1.5 input-glow rounded-xl">
                            <label className="block text-xs font-bold text-muted-foreground ml-1">Camera Angle</label>
                            <select
                                value={cameraAngle}
                                onChange={(e) => setCameraAngle(e.target.value)}
                                className="w-full h-10 bg-secondary/30 text-foreground border border-transparent rounded-lg text-xs px-3 outline-none"
                                disabled={isDisabled}
                            >
                                {cameraAngleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <ExpandButton isOpen={isNegativePromptOpen} onClick={() => setIsNegativePromptOpen(!isNegativePromptOpen)} label="Negative Prompt (Exclusions)" disabled={isDisabled} />
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden space-y-3 ${isNegativePromptOpen ? 'max-h-[500px] pb-2' : 'max-h-0'}`}>
                        <NegativePromptInput label="Exclude Visuals" value={negVisuals} onChange={setNegVisuals} placeholder="e.g., text, blur, watermark" disabled={isDisabled} />
                        <NegativePromptInput label="Exclude Styles" value={negStyles} onChange={setNegStyles} placeholder="e.g., cartoon, anime" disabled={isDisabled} />
                        <NegativePromptInput label="Exclude Colors" value={negColors} onChange={setNegColors} placeholder="e.g., neon red" disabled={isDisabled} />
                        <NegativePromptInput label="Exclude Objects" value={negObjects} onChange={setNegObjects} placeholder="e.g., cars" disabled={isDisabled} />
                    </div>
                </div>

             </CardContent>
             
             <div className="p-6 pt-0 mt-auto">
               <button 
                type="button" 
                onClick={handleGenerate} 
                disabled={isDisabled} 
                className="w-full h-14 bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group"
               >
                 {isDisabled ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Thinking...</span>
                    </>
                 ) : (
                    <>
                        <SparklesIcon />
                        <span>Dream it</span>
                    </>
                 )}
               </button>
            </div>
          </GlassCard>
      </div>
    </div>
  );
};
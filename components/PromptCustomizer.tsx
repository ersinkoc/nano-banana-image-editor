import React, { useState } from 'react';
import type { Prompt, PromptDetails, Gender, ImageData, ArtisticStyle } from '../types';
import { ImageUploader } from './ImageUploader';
import { GenderSelector } from './GenderSelector';
import { CustomPromptModal } from './CustomPromptModal';

interface PromptCustomizerProps {
  onGenerateRandom: (gender: Gender, style: ArtisticStyle, numImages: 1 | 4) => void;
  onGenerateCustom: (prompt: Prompt, numImages: 1 | 4) => void;
  onImageUpload: (imageData: ImageData | null) => void;
  isDisabled: boolean;
  quality: string;
  setQuality: (quality: string) => void;
  aspectRatio: string;
  setAspectRatio: (aspectRatio: string) => void;
  numImages: 1 | 4;
  setNumImages: (num: 1 | 4) => void;
}

const initialDetails: PromptDetails = {
  medium: '',
  genre: '',
  lighting: [],
  camera_angle: '',
  color_palette: [],
  atmosphere: [],
  emotion: [],
  year: '',
  location: '',
  costume: '',
  subject_expression: '',
  subject_action: '',
  environmental_elements: '',
};

const SettingButtonGroup: React.FC<{
    label: string;
    options: { value: string, label: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
}> = ({ label, options, selectedValue, onSelect }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <div className="grid grid-cols-3 gap-2">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelect(option.value)}
                    className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 ${
                        selectedValue === option.value
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    </div>
);

export const PromptCustomizer: React.FC<PromptCustomizerProps> = ({ 
    onGenerateRandom, 
    onGenerateCustom,
    onImageUpload,
    isDisabled,
    quality,
    setQuality,
    aspectRatio,
    setAspectRatio,
    numImages,
    setNumImages
}) => {
  const [gender, setGender] = useState<Gender>('unspecified');
  const [style, setStyle] = useState<ArtisticStyle>('Realistic');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Stores the last used custom details to pre-fill the modal, now persisted in localStorage.
  const [customDetails, setCustomDetails] = useState<PromptDetails>(() => {
    try {
      const savedDetails = window.localStorage.getItem('lastCustomPromptDetails');
      if (savedDetails) {
        const parsed = JSON.parse(savedDetails);
        // Ensure all keys from initialDetails are present, especially new array fields,
        // to prevent errors if loading data from an older version of the app.
        return { ...initialDetails, ...parsed };
      }
      return initialDetails;
    } catch (error) {
      console.error("Failed to load custom prompt details from localStorage:", error);
      return initialDetails;
    }
  });

  const handleGenerateFromModal = (prompt: Prompt) => {
      setCustomDetails(prompt.details); // Save details for potential re-editing
      try {
        window.localStorage.setItem('lastCustomPromptDetails', JSON.stringify(prompt.details));
      } catch (error) {
        console.error("Failed to save custom prompt details to localStorage:", error);
      }
      onGenerateCustom(prompt, numImages);
  };

  const styleOptions: { value: ArtisticStyle; label: string }[] = [
    { value: 'Realistic', label: 'Realistic' },
    { value: 'Artistic', label: 'Artistic (Random)' },
    { value: 'Impressionistic', label: 'Impressionistic' },
    { value: 'Surrealist', label: 'Surrealist' },
    { value: 'Art Nouveau', label: 'Art Nouveau' },
    { value: 'Cubist', label: 'Cubist' },
    { value: 'Pixel Art', label: 'Pixel Art' },
    { value: 'Synthwave', label: 'Synthwave' },
    { value: 'Steampunk', label: 'Steampunk' },
    { value: 'Vintage Photo', label: 'Vintage Photo' },
    { value: 'Line Art', label: 'Line Art' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">Creative Controls</h2>
      <div className="space-y-4">
        <ImageUploader onImageUpload={onImageUpload} />
        <GenderSelector selectedGender={gender} onGenderChange={setGender} />
        
        <div className="space-y-4 pt-2">
            <h3 className="text-lg font-semibold text-gray-300">Output Settings</h3>
            <div>
                <label htmlFor="style-select" className="block text-sm font-medium text-gray-300 mb-2">Style (for Randomize)</label>
                <select
                    id="style-select"
                    value={style}
                    onChange={(e) => setStyle(e.target.value as ArtisticStyle)}
                    className="w-full bg-gray-700 text-gray-200 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm px-3 py-2"
                >
                    {styleOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
             <SettingButtonGroup
                label="Quality"
                options={[ { value: 'standard', label: 'Standard' }, { value: 'high', label: 'High' }]}
                selectedValue={quality}
                onSelect={setQuality}
            />
             <SettingButtonGroup
                label="Aspect Ratio"
                options={[ { value: '1:1', label: '1:1' }, { value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16' } ]}
                selectedValue={aspectRatio}
                onSelect={setAspectRatio}
            />
             <SettingButtonGroup
                label="Number of Images"
                options={[ { value: '1', label: '1' }, { value: '4', label: '4' } ]}
                selectedValue={String(numImages)}
                onSelect={(value) => setNumImages(Number(value) as 1 | 4)}
            />
        </div>
        
        <div className="pt-4 space-y-3">
             <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={isDisabled}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Create Detailed Custom Prompt
            </button>
            <button
              type="button"
              onClick={() => onGenerateRandom(gender, style, numImages)}
              disabled={isDisabled}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              {isDisabled ? 'Generating...' : 'Randomize & Edit'}
            </button>
        </div>
      </div>
      <CustomPromptModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerateFromModal}
        initialDetails={customDetails}
      />
    </div>
  );
};
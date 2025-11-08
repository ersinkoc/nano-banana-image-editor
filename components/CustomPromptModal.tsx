import React, { useState, useEffect } from 'react';
import type { Prompt, PromptDetails } from '../types';
import { customPromptSections, PromptOptionSection } from './promptOptions';

const createPromptFromDetails = (details: PromptDetails): string => {
  const parts: string[] = [
    'You will perform an image edit using the person from the provided photo as the main subject. Facial features can be adapted to the artistic style, but the core likeness and recognizable characteristics must be preserved.',
  ];

  let sceneDescription = `Create a ${details.medium || 'scene'}`;
  if (details.genre) sceneDescription += ` in a ${details.genre.toLowerCase()} style`;
  if (details.year) sceneDescription += ` set in the ${details.year}`;
  if (details.location) sceneDescription += ` taking place in ${details.location}`;
  parts.push(sceneDescription + '.');

  if (details.costume) parts.push(`The subject is wearing a ${details.costume}.`);
  if (details.subject_action) parts.push(`The subject is ${details.subject_action}.`);
  if (details.subject_expression) parts.push(`Their expression is ${details.subject_expression}.`);
  if (details.lighting.length > 0) parts.push(`The lighting is ${details.lighting.join(' and ')}.`);
  if (details.color_palette.length > 0) parts.push(`The color palette consists of ${details.color_palette.join(', ')} tones.`);
  if (details.camera_angle) parts.push(`Use a ${details.camera_angle.toLowerCase()} camera angle.`);
  if (details.environmental_elements) parts.push(`Key environmental elements include ${details.environmental_elements}.`);

  const overallFeeling = [...details.atmosphere, ...details.emotion];
  if (overallFeeling.length > 0) parts.push(`The overall feeling should be ${overallFeeling.join(' and ')}.`);

  return parts.join(' ');
};

const OptionButton: React.FC<{
  label: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ label, isSelected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
      isSelected
        ? 'bg-primary text-primary-foreground'
        : 'bg-secondary text-secondary-foreground hover:bg-muted'
    }`}
  >
    {label}
  </button>
);


const Section: React.FC<{
  section: PromptOptionSection;
  details: PromptDetails;
  onSingleSelect: (key: keyof PromptDetails, value: string) => void;
  onMultiSelect: (key: keyof PromptDetails, value: string) => void;
  onTextChange: (key: keyof PromptDetails, value: string) => void;
}> = ({ section, details, onSingleSelect, onMultiSelect, onTextChange }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">{section.title}</h3>
      {section.type === 'text' && (
        <input
          type="text"
          value={details[section.key] as string}
          onChange={(e) => onTextChange(section.key, e.target.value)}
          className="h-10 block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm text-foreground px-3 py-2 border"
          placeholder={section.placeholder}
        />
      )}
      <div className="flex flex-wrap gap-2">
        {section.type === 'single' && section.options?.map(opt => (
          <OptionButton
            key={opt}
            label={opt}
            isSelected={(details[section.key] as string) === opt}
            onClick={() => onSingleSelect(section.key, opt)}
          />
        ))}
        {section.type === 'multi' && section.options?.map(opt => (
          <OptionButton
            key={opt}
            label={opt}
            isSelected={(details[section.key] as string[]).includes(opt)}
            onClick={() => onMultiSelect(section.key, opt)}
          />
        ))}
      </div>
    </div>
  );
};


interface CustomPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: Prompt) => void;
  initialDetails: PromptDetails;
}

export const CustomPromptModal: React.FC<CustomPromptModalProps> = ({ isOpen, onClose, onGenerate, initialDetails }) => {
  const [details, setDetails] = useState<PromptDetails>(initialDetails);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDetails(initialDetails);
    }
  }, [isOpen, initialDetails]);

  useEffect(() => {
    setGeneratedPrompt(createPromptFromDetails(details));
  }, [details]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSingleSelect = (key: keyof PromptDetails, value: string) => {
    const currentValue = details[key] as string;
    setDetails(prev => ({ ...prev, [key]: currentValue === value ? '' : value }));
  };

  const handleMultiSelect = (key: keyof PromptDetails, value: string) => {
    const currentValues = details[key] as string[];
    const newValues = currentValues.includes(value) ? currentValues.filter(v => v !== value) : [...currentValues, value];
    setDetails(prev => ({ ...prev, [key]: newValues }));
  };
  
  const handleTextChange = (key: keyof PromptDetails, value: string) => {
    setDetails(prev => ({ ...prev, [key]: value }));
  }

  const handleNegativePromptChange = (type: 'exclude_visuals' | 'exclude_styles', value: string) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    setDetails(prev => ({
        ...prev,
        negative_prompt: {
            ...(prev.negative_prompt || { exclude_visuals: [], exclude_styles: [] }),
            [type]: items,
        }
    }));
  };

  const handleSubmit = () => {
    const customPrompt: Prompt = { prompt: generatedPrompt, details };
    onGenerate(customPrompt);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg border border-border shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 sm:p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">Create a Detailed Custom Prompt</h2>
            <p className="text-sm text-muted-foreground">Craft the perfect scene by selecting from the options below.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none rounded-full h-8 w-8 flex items-center justify-center" aria-label="Close">&times;</button>
        </header>

        <main className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 overflow-y-auto">
          {customPromptSections.map(section => (
            <Section 
              key={section.key} section={section} details={details}
              onSingleSelect={handleSingleSelect} onMultiSelect={handleMultiSelect} onTextChange={handleTextChange}
            />
          ))}
          <div className="space-y-3 md:col-span-1">
            <h3 className="text-sm font-semibold text-muted-foreground">Exclude Visuals (Negative Prompt)</h3>
            <textarea
              value={details.negative_prompt?.exclude_visuals?.join(', ') || ''}
              onChange={(e) => handleNegativePromptChange('exclude_visuals', e.target.value)}
              rows={2}
              className="block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm text-foreground px-3 py-2 border"
              placeholder="e.g., text, watermark, ugly, tiling"
            />
          </div>
          <div className="space-y-3 md:col-span-1">
            <h3 className="text-sm font-semibold text-muted-foreground">Exclude Styles (Negative Prompt)</h3>
            <textarea
              value={details.negative_prompt?.exclude_styles?.join(', ') || ''}
              onChange={(e) => handleNegativePromptChange('exclude_styles', e.target.value)}
              rows={2}
              className="block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm text-foreground px-3 py-2 border"
              placeholder="e.g., cartoon, 3d render, anime"
            />
          </div>
        </main>
        
        <footer className="p-4 sm:p-6 mt-auto border-t border-border bg-muted/50 space-y-3">
          <div>
              <label htmlFor="finalPrompt" className="block text-sm font-medium text-card-foreground">Final Prompt (Editable)</label>
              <textarea
                id="finalPrompt"
                value={generatedPrompt}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
                rows={3}
                className="mt-1 block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm text-foreground px-3 py-2 border"
              />
          </div>
           <button 
              onClick={handleSubmit}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3 px-4 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Generate Image
            </button>
        </footer>
      </div>
    </div>
  );
};

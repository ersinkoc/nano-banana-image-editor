import React, { useState, useEffect } from 'react';
import type { Prompt, PromptDetails } from '../types';
import { customPromptSections, PromptOptionSection } from './promptOptions';

// Helper function to generate a descriptive prompt from selected details
const createPromptFromDetails = (details: PromptDetails): string => {
  const parts: string[] = [
    'You will perform an image edit using the person from the provided photo as the main subject.',
    'The face must remain clear and unaltered.',
  ];

  let sceneDescription = `Create a ${details.medium || 'scene'}`;
  if (details.genre) sceneDescription += ` in a ${details.genre.toLowerCase()} style`;
  if (details.year) sceneDescription += ` set in the ${details.year}`;
  if (details.location) sceneDescription += ` taking place in ${details.location}`;
  parts.push(sceneDescription + '.');

  if (details.costume) {
    parts.push(`The subject is wearing a ${details.costume}.`);
  }
  
  if (details.subject_action) {
    parts.push(`The subject is ${details.subject_action}.`);
  }
  
  if (details.subject_expression) {
    parts.push(`Their expression is ${details.subject_expression}.`);
  }

  if (details.lighting.length > 0) {
    parts.push(`The lighting is ${details.lighting.join(' and ')}.`);
  }

  if (details.color_palette.length > 0) {
    parts.push(`The color palette consists of ${details.color_palette.join(', ')} tones.`);
  }
  
  if (details.camera_angle) {
    parts.push(`Use a ${details.camera_angle.toLowerCase()} camera angle.`);
  }

  if (details.environmental_elements) {
    parts.push(`Key environmental elements include ${details.environmental_elements}.`);
  }

  const overallFeeling = [...details.atmosphere, ...details.emotion];
  if (overallFeeling.length > 0) {
    parts.push(`The overall feeling should be ${overallFeeling.join(' and ')}.`);
  }

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
    className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 ${
      isSelected
        ? 'bg-purple-600 text-white'
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
    <div>
      <h3 className="text-md font-semibold text-gray-300 mb-3">{section.title}</h3>
      {section.type === 'text' && (
        <input
          type="text"
          value={details[section.key] as string}
          onChange={(e) => onTextChange(section.key, e.target.value)}
          className="block w-full bg-gray-900 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white px-3 py-2"
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
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSingleSelect = (key: keyof PromptDetails, value: string) => {
    const currentValue = details[key] as string;
    setDetails(prev => ({ ...prev, [key]: currentValue === value ? '' : value }));
  };

  const handleMultiSelect = (key: keyof PromptDetails, value: string) => {
    const currentValues = details[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setDetails(prev => ({ ...prev, [key]: newValues }));
  };
  
  const handleTextChange = (key: keyof PromptDetails, value: string) => {
    setDetails(prev => ({ ...prev, [key]: value }));
  }

  const handleSubmit = () => {
    const customPrompt: Prompt = {
      prompt: generatedPrompt,
      details: details,
    };
    onGenerate(customPrompt);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-purple-400">Create a Detailed Custom Prompt</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none" aria-label="Close">&times;</button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 overflow-y-auto">
          {customPromptSections.map(section => (
            <Section 
              key={section.key}
              section={section}
              details={details}
              onSingleSelect={handleSingleSelect}
              onMultiSelect={handleMultiSelect}
              onTextChange={handleTextChange}
            />
          ))}
        </div>
        
        <div className="p-6 mt-auto border-t border-gray-700 bg-gray-900/50 space-y-3">
          <div>
              <label htmlFor="finalPrompt" className="block text-sm font-medium text-gray-400">Final Prompt (Editable)</label>
              <textarea
                id="finalPrompt"
                value={generatedPrompt}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
                rows={3}
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-white px-3 py-2"
              />
          </div>
           <button 
              onClick={handleSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors"
            >
              Generate Image
            </button>
        </div>
      </div>
    </div>
  );
};
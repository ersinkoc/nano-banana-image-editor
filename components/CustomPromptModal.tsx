
import React, { useState, useEffect } from 'react';
import type { Prompt, PromptDetails, SubjectSpecificDetails } from '../types';
import { sceneSections, subjectSections, PromptOptionSection } from './promptOptions';

const createPromptFromDetails = (details: PromptDetails): string => {
  const parts: string[] = [];

  const baseInstruction = details.subject2
    ? 'You will perform an image edit using the people from the provided photos as the main subjects (Subject 1 and Subject 2). Facial features can be adapted to the artistic style, but the core likeness and recognizable characteristics must be preserved.'
    : 'You will perform an image edit using the person from the provided photo as the main subject. Facial features can be adapted to the artistic style, but the core likeness and recognizable characteristics must be preserved.';
  parts.push(baseInstruction);

  let sceneDescription = `Create a ${details.medium || 'scene'}`;
  if (details.genre) sceneDescription += ` in a ${details.genre.toLowerCase()} style`;
  if (details.year) sceneDescription += ` set in the ${details.year}`;
  if (details.location) sceneDescription += ` taking place in ${details.location}`;
  parts.push(sceneDescription + '.');

  const describeSubject = (subject: SubjectSpecificDetails, subjectNum: 1 | 2): string[] => {
      const subjectParts = [];
      if (subject.costume) subjectParts.push(`Subject ${subjectNum} is wearing a ${subject.costume}.`);
      if (subject.subject_action) subjectParts.push(`Subject ${subjectNum} is ${subject.subject_action}.`);
      if (subject.subject_expression) subjectParts.push(`Their expression is ${subject.subject_expression}.`);
      return subjectParts;
  }
  
  if (details.subject1) {
    parts.push(...describeSubject(details.subject1, 1));
  }
  if (details.subject2) {
    parts.push(...describeSubject(details.subject2, 2));
  }
  
  if (details.lighting.length > 0) parts.push(`The lighting is ${details.lighting.join(' and ')}.`);
  if (details.color_palette.length > 0) parts.push(`The color palette consists of ${details.color_palette.join(', ')} tones.`);
  if (details.camera_angle) parts.push(`Use a ${details.camera_angle.toLowerCase()} camera angle.`);
  if (details.environmental_elements) parts.push(`Key environmental elements include ${details.environmental_elements}.`);

  const overallFeeling = [...details.atmosphere, ...details.emotion];
  if (overallFeeling.length > 0) parts.push(`The overall feeling should be ${overallFeeling.join(' and ')}.`);

  if (details.negative_prompt) {
    const exclusions: string[] = [];
    const { exclude_visuals, exclude_styles, exclude_colors, exclude_objects } = details.negative_prompt;
    
    if (exclude_visuals && exclude_visuals.length > 0) exclusions.push(...exclude_visuals);
    if (exclude_styles && exclude_styles.length > 0) exclusions.push(...exclude_styles);
    if (exclude_colors && exclude_colors.length > 0) exclusions.push(...exclude_colors);
    if (exclude_objects && exclude_objects.length > 0) exclusions.push(...exclude_objects);

    if (exclusions.length > 0) {
        parts.push(`Strictly exclude the following: ${exclusions.join(', ')}.`);
    }
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
  value: string | string[];
  onSingleSelect: (key: string, value: string) => void;
  onMultiSelect: (key: string, value: string) => void;
  onTextChange: (key: string, value: string) => void;
}> = ({ section, value, onSingleSelect, onMultiSelect, onTextChange }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">{section.title}</h3>
      {section.type === 'text' && (
        <input
          type="text"
          value={value as string}
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
            isSelected={(value as string) === opt}
            onClick={() => onSingleSelect(section.key, opt)}
          />
        ))}
        {section.type === 'multi' && section.options?.map(opt => (
          <OptionButton
            key={opt}
            label={opt}
            isSelected={(value as string[]).includes(opt)}
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

const initialSubjectDetails: SubjectSpecificDetails = { costume: '', subject_action: '', subject_expression: '' };

export const CustomPromptModal: React.FC<CustomPromptModalProps> = ({ isOpen, onClose, onGenerate, initialDetails }) => {
  const [details, setDetails] = useState<PromptDetails>(initialDetails);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'scene' | 'subject1' | 'subject2' | 'negative'>('scene');

  useEffect(() => {
    if (isOpen) {
        // Ensure subject1 and subject2 are initialized properly
        const newDetails = { ...initialDetails };
        if (!newDetails.subject1) newDetails.subject1 = { ...initialSubjectDetails };
        if (!newDetails.subject2) newDetails.subject2 = { ...initialSubjectDetails };
        setDetails(newDetails);
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

  const handleSceneChange = (key: string, value: string | string[]) => {
      setDetails(prev => ({ ...prev, [key]: value }));
  }
  
  const handleSubjectChange = (subjectNum: 'subject1' | 'subject2', key: string, value: string) => {
    setDetails(prev => ({
        ...prev,
        [subjectNum]: {
            ...prev[subjectNum],
            [key]: value
        }
    }))
  };

  const handleNegativePromptChange = (type: 'exclude_visuals' | 'exclude_styles' | 'exclude_colors' | 'exclude_objects', value: string) => {
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
    const finalDetails = { ...details };
    // If subject 2 details are all empty, remove it from the final object
    if (details.subject2 && !details.subject2.costume && !details.subject2.subject_action && !details.subject2.subject_expression) {
        delete finalDetails.subject2;
    }
    const finalPromptText = createPromptFromDetails(finalDetails);
    const customPrompt: Prompt = { prompt: finalPromptText, details: finalDetails };
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
        <header className="flex-shrink-0 flex justify-between items-center p-4 sm:p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">Create a Detailed Custom Prompt</h2>
            <p className="text-sm text-muted-foreground">Craft the perfect scene by selecting from the options below.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none rounded-full h-8 w-8 flex items-center justify-center" aria-label="Close">&times;</button>
        </header>

        <div className="border-b border-border px-4 sm:px-6">
            <nav className="-mb-px flex space-x-6 overflow-x-auto">
                {(['scene', 'subject1', 'subject2', 'negative'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm focus:outline-none ${
                            activeTab === tab 
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                        }`}
                    >
                        {tab === 'scene' ? 'Scene Details' : tab === 'subject1' ? 'Person 1' : tab === 'subject2' ? 'Person 2' : 'Negative Prompt'}
                    </button>
                ))}
            </nav>
        </div>

        <main className="p-4 sm:p-6 overflow-y-auto flex-grow">
            <div className={`${activeTab === 'scene' ? 'block' : 'hidden'} space-y-6`}>
                {sceneSections.map(section => (
                    <Section 
                      key={section.key} section={section}
                      value={details[section.key as keyof PromptDetails] as string | string[]}
                      onSingleSelect={(key, value) => handleSceneChange(key, (details[key as keyof PromptDetails] as string) === value ? '' : value)}
                      onMultiSelect={(key, value) => {
                          const current = details[key as keyof PromptDetails] as string[];
                          const newArr = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
                          handleSceneChange(key, newArr);
                      }}
                      onTextChange={handleSceneChange}
                    />
                ))}
            </div>
            {(['subject1', 'subject2'] as const).map(subjectKey => (
                 <div key={subjectKey} className={`${activeTab === subjectKey ? 'block' : 'hidden'} space-y-6`}>
                    {subjectSections.map(section => (
                        <Section
                            key={section.key} section={section}
                            value={details[subjectKey]![section.key as keyof SubjectSpecificDetails]}
                            onSingleSelect={() => {}} onMultiSelect={() => {}}
                            onTextChange={(key, value) => handleSubjectChange(subjectKey, key, value)}
                        />
                    ))}
                 </div>
            ))}
            <div className={`${activeTab === 'negative' ? 'block' : 'hidden'} space-y-6`}>
                 <p className="text-sm text-muted-foreground">Specify elements or attributes you want to strictly exclude from the image generation.</p>
                 <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Exclude Visuals</h3>
                    <textarea
                      value={details.negative_prompt?.exclude_visuals?.join(', ') || ''}
                      onChange={(e) => handleNegativePromptChange('exclude_visuals', e.target.value)}
                      rows={2}
                      className="block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm text-foreground px-3 py-2 border"
                      placeholder="e.g., text, watermark, ugly, tiling, blur, distortion"
                    />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Exclude Styles</h3>
                    <textarea
                      value={details.negative_prompt?.exclude_styles?.join(', ') || ''}
                      onChange={(e) => handleNegativePromptChange('exclude_styles', e.target.value)}
                      rows={2}
                      className="block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm text-foreground px-3 py-2 border"
                      placeholder="e.g., cartoon, 3d render, anime, sketch, drawing"
                    />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Exclude Colors</h3>
                    <textarea
                      value={details.negative_prompt?.exclude_colors?.join(', ') || ''}
                      onChange={(e) => handleNegativePromptChange('exclude_colors', e.target.value)}
                      rows={2}
                      className="block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm text-foreground px-3 py-2 border"
                      placeholder="e.g., neon, bright red, muddy tones, black and white"
                    />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Exclude Objects</h3>
                    <textarea
                      value={details.negative_prompt?.exclude_objects?.join(', ') || ''}
                      onChange={(e) => handleNegativePromptChange('exclude_objects', e.target.value)}
                      rows={2}
                      className="block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm text-foreground px-3 py-2 border"
                      placeholder="e.g., cars, modern buildings, text, glasses, hats"
                    />
                  </div>
            </div>
        </main>
        
        <footer className="flex-shrink-0 p-4 sm:p-6 mt-auto border-t border-border bg-muted/50 space-y-3">
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

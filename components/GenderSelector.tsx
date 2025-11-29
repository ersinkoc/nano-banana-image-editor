import React from 'react';
import type { Gender } from '../types';

interface GenderSelectorProps {
  selectedGender: Gender;
  onGenderChange: (gender: Gender) => void;
}

export const GenderSelector: React.FC<GenderSelectorProps> = ({ selectedGender, onGenderChange }) => {
  const options: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'unspecified', label: 'Other' },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wide">Gender</label>
      <div className="grid grid-cols-3 gap-1 bg-secondary/30 p-1.5 rounded-xl border border-border/50">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onGenderChange(option.value)}
            className={`h-9 text-xs font-bold rounded-lg transition-all duration-200 focus:outline-none ${
              selectedGender === option.value
                ? 'bg-background text-primary shadow-sm scale-[1.02] ring-1 ring-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
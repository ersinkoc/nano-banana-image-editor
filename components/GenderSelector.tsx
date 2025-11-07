
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
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">Subject Gender</label>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onGenderChange(option.value)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 ${
              selectedGender === option.value
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
};

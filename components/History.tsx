import React, { useState } from 'react';
import type { Prompt, HistoryEntry } from '../types';

interface HistoryItemProps {
  item: HistoryEntry;
  onSelect: (prompt: Prompt) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { prompt, image } = item;

  return (
    <div className="bg-gray-700/50 rounded-lg overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 hover:bg-gray-600/50 transition-colors duration-200 focus:outline-none relative"
      >
        <div className="flex items-center gap-4">
            {image ? (
               <img src={image} alt={prompt.details.genre} className="w-16 h-16 object-cover rounded-md shrink-0 bg-gray-600" />
            ) : (
              <div className="w-16 h-16 rounded-md shrink-0 bg-gray-600 flex items-center justify-center" aria-label="No image preview available">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
            <div className="flex-grow overflow-hidden">
                <p className="font-medium text-gray-200 truncate">{prompt.details.genre} - {prompt.details.year}</p>
                <div className="mt-2 space-y-1 text-xs text-gray-400">
                    <p className="truncate">
                        <span className="font-semibold text-gray-500 capitalize">Location: </span> 
                        {prompt.details.location}
                    </p>
                    <p className="truncate">
                        <span className="font-semibold text-gray-500 capitalize">Atmosphere: </span> 
                        {Array.isArray(prompt.details.atmosphere) ? prompt.details.atmosphere.join(', ') : prompt.details.atmosphere}
                    </p>
                </div>
            </div>
        </div>
        <span className={`absolute top-1/2 -translate-y-1/2 right-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </span>
      </button>
      
      <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="p-4 border-t border-gray-600 bg-gray-900/50 text-xs">
          <p className="italic text-gray-400 mb-4">"{prompt.prompt}"</p>
          <ul className="space-y-2 mb-4">
            {Object.entries(prompt.details).map(([key, value]) => (
                value && (value as any).length > 0 && <li key={key} className="flex">
                    <span className="font-semibold text-gray-400 capitalize w-28 shrink-0">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-300">{Array.isArray(value) ? value.join(', ') : value}</span>
                </li>
            ))}
          </ul>
          <button 
            onClick={() => onSelect(prompt)}
            className="w-full bg-purple-600/80 hover:bg-purple-600 text-white font-semibold py-2 px-3 rounded-md text-xs transition-colors"
          >
            Use this Prompt
          </button>
        </div>
      </div>
    </div>
  );
};

const SkeletonHistoryItem: React.FC = () => (
    <div className="bg-gray-700/50 rounded-lg p-4 animate-pulse flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-600 rounded-md shrink-0"></div>
        <div className="flex-grow">
            <div className="h-4 bg-gray-600 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-600 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-600 rounded w-5/6"></div>
        </div>
    </div>
);


export const History: React.FC<{ prompts: HistoryEntry[], onSelectPrompt: (prompt: Prompt) => void, isGeneratingNewPrompt?: boolean }> = ({ prompts, onSelectPrompt, isGeneratingNewPrompt = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const showEmptyState = prompts.length === 0 && !isGeneratingNewPrompt;

  const lowercasedFilter = searchTerm.toLowerCase();
  const filteredPrompts = prompts.filter(item => {
      if (!lowercasedFilter) return true;
      const { prompt, details } = item.prompt;
      
      const detailsString = Object.values(details)
        .flat() // handles array values like atmosphere, lighting
        .join(' ')
        .toLowerCase();
      
      return prompt.toLowerCase().includes(lowercasedFilter) || detailsString.includes(lowercasedFilter);
  });

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
       <div className="flex flex-wrap justify-between items-center mb-4 border-b border-gray-600 pb-2 gap-4">
        <h2 className="text-xl font-semibold">Prompt History</h2>
        <div className="relative">
          <input
            type="search"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-700 text-gray-200 border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm pl-10 pr-4 py-2 w-full sm:w-64"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>
      {showEmptyState ? (
        <p className="text-gray-400 text-sm text-center py-4">Your generated prompts will appear here.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {isGeneratingNewPrompt && <SkeletonHistoryItem />}
          {filteredPrompts.map((item) => (
            <HistoryItem key={item.id} item={item} onSelect={onSelectPrompt} />
          ))}
          {filteredPrompts.length === 0 && !isGeneratingNewPrompt && (
              <p className="text-gray-400 text-sm text-center py-4">No prompts found matching your search.</p>
          )}
        </div>
      )}
    </div>
  );
};
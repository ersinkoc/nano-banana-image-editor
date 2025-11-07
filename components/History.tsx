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
    <div className="border border-border rounded-md bg-card transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-4">
            {image ? (
               <img src={image} alt={prompt.details.genre} className="w-16 h-16 object-cover rounded-md shrink-0 bg-muted" />
            ) : (
              <div className="w-16 h-16 rounded-md shrink-0 bg-muted flex items-center justify-center" aria-label="No image preview available">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-card-foreground truncate">{prompt.details.genre} - {prompt.details.year}</p>
                <p className="text-sm text-muted-foreground truncate">{prompt.details.location}</p>
            </div>
             <span className={`transition-transform duration-300 text-muted-foreground ${isOpen ? 'rotate-180' : ''}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </span>
        </div>
      </button>
      
      <div className={`transition-[max-height,padding] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="p-4 pt-0">
          <div className="border-t border-border pt-4 text-sm space-y-4">
            <p className="italic text-muted-foreground">"{prompt.prompt}"</p>
            <div className="flex justify-end">
                <button 
                    onClick={() => onSelect(prompt)}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                >
                    Use this Prompt
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonHistoryItem: React.FC = () => (
    <div className="border border-border rounded-md p-4 bg-card animate-pulse flex items-center gap-4">
        <div className="w-16 h-16 bg-muted rounded-md shrink-0"></div>
        <div className="flex-grow space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-5/6"></div>
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
      
      const detailsString = Object.values(details).flat().join(' ').toLowerCase();
      
      return prompt.toLowerCase().includes(lowercasedFilter) || detailsString.includes(lowercasedFilter);
  });

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
       <div className="p-4 sm:p-6 flex flex-wrap justify-between items-center gap-4 border-b border-border">
            <h2 className="text-lg font-semibold">Prompt History</h2>
            <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                    type="search"
                    placeholder="Search history..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-background text-foreground border border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm pl-9 pr-4 py-2 w-full sm:w-64 h-10"
                />
            </div>
        </div>
        <div className="p-4 sm:p-6">
            {showEmptyState ? (
                <p className="text-muted-foreground text-sm text-center py-4">Your generated prompts will appear here.</p>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 -mr-2">
                {isGeneratingNewPrompt && <SkeletonHistoryItem />}
                {filteredPrompts.map((item) => (
                    <HistoryItem key={item.id} item={item} onSelect={onSelectPrompt} />
                ))}
                {filteredPrompts.length === 0 && !isGeneratingNewPrompt && (
                    <p className="text-muted-foreground text-sm text-center py-4">No prompts found matching your search.</p>
                )}
                </div>
            )}
        </div>
    </div>
  );
};
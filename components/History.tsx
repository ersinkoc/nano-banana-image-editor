import React, { useState } from 'react';
import type { Prompt, HistoryEntry } from '../types';

interface HistoryItemProps {
  item: HistoryEntry;
  onSelect: (prompt: Prompt) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { prompt, image } = item;

  const copyPrompt = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(JSON.stringify(prompt, null, 2));
      alert("JSON copied to clipboard");
  };

  return (
    <div className={`border rounded-xl transition-all duration-300 overflow-hidden group ${isOpen ? 'bg-secondary/20 border-primary/30 shadow-lg' : 'bg-transparent border-border/50 hover:bg-secondary/10'}`}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 cursor-pointer flex items-center gap-4"
      >
        {/* Thumbnail */}
        <div className="h-16 w-16 rounded-lg bg-secondary/50 flex-shrink-0 overflow-hidden border border-white/5 relative group-hover:border-primary/30 transition-colors">
            {image ? (
                <img src={image} alt="History thumbnail" className="h-full w-full object-cover" />
            ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
            )}
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary truncate max-w-[150px]">{prompt.details.genre || 'Custom'}</span>
                {prompt.details.year && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground font-medium">{prompt.details.year}</span>}
            </div>
            <p className="text-sm text-foreground/90 font-medium truncate pr-4 opacity-90">{prompt.prompt}</p>
        </div>

        {/* Action Icon */}
        <div className={`text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}>
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
      
      {/* Expanded Content */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-40' : 'max-h-0'}`}>
        <div className="p-4 pt-0 border-t border-white/5">
            <p className="text-xs text-muted-foreground italic my-3 line-clamp-2 leading-relaxed">"{prompt.prompt}"</p>
            <div className="flex gap-2">
                <button 
                    onClick={() => onSelect(prompt)}
                    className="flex-1 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Reuse This Prompt
                </button>
                 <button 
                    onClick={copyPrompt}
                    className="px-4 py-2 bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-secondary/80 transition-colors"
                >
                    Copy JSON
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export const History: React.FC<{ prompts: HistoryEntry[], onSelectPrompt: (prompt: Prompt) => void, isGeneratingNewPrompt?: boolean }> = ({ prompts, onSelectPrompt, isGeneratingNewPrompt = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredPrompts = prompts.filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return item.prompt.prompt.toLowerCase().includes(term) || JSON.stringify(item.prompt.details).toLowerCase().includes(term);
  });

  return (
    <div className="glass-card rounded-3xl mt-6 p-6">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h2 className="text-lg font-bold text-card-foreground">Recent Creations</h2>
            <div className="relative w-full sm:w-64">
                <input
                    type="search"
                    placeholder="Search history..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 bg-secondary/30 border-transparent rounded-xl text-sm pl-10 pr-4 focus:bg-secondary/50 focus:border-primary/30 transition-all outline-none"
                />
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
        </div>
        
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {prompts.length === 0 && !isGeneratingNewPrompt && (
                <div className="text-center py-10 opacity-50">
                    <p className="text-sm font-medium">No history yet. Start creating!</p>
                </div>
            )}
            
            {filteredPrompts.map((item) => (
                <HistoryItem key={item.id} item={item} onSelect={onSelectPrompt} />
            ))}
        </div>
    </div>
  );
};
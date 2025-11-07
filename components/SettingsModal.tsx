import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveApiKey: (key: string) => void;
  onClearApiKey: () => void;
  currentApiKey: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaveApiKey, onClearApiKey, currentApiKey }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKeyInput(currentApiKey || '');
    }
  }, [isOpen, currentApiKey]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKeyInput.trim()) {
      onSaveApiKey(apiKeyInput.trim());
    }
  };
  
  const handleClear = () => {
    onClearApiKey();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg border border-border shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 sm:p-5 border-b border-border">
          <h2 className="text-lg font-bold text-card-foreground">API Key Settings</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none rounded-full h-8 w-8 flex items-center justify-center" aria-label="Close">&times;</button>
        </header>

        <main className="p-4 sm:p-5 space-y-4">
            <div className="p-3 bg-secondary/50 rounded-md border border-border flex items-center gap-3">
                {currentApiKey ? (
                    <>
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <p className="text-sm text-secondary-foreground">Currently using: <span className="font-semibold">Your API Key</span></p>
                    </>
                ) : (
                    <>
                         <span className="relative inline-flex rounded-full h-3 w-3 bg-muted-foreground/50 border border-muted-foreground"></span>
                         <p className="text-sm text-muted-foreground">Currently using: <span className="font-semibold">Default App Key</span></p>
                    </>
                )}
            </div>
            <p className="text-sm text-muted-foreground">
                You can use your own Google AI Studio API key. This can be useful if the default key is rate-limited. Your key is saved securely in your browser's local storage and is never sent anywhere else.
            </p>
            <div>
                 <label htmlFor="apiKey" className="block text-sm font-medium text-card-foreground">Your Gemini API Key</label>
                 <input
                    id="apiKey"
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="mt-1 h-10 block w-full bg-background border-input rounded-md shadow-sm focus:ring-ring focus:border-ring sm:text-sm text-foreground px-3 py-2 border"
                    placeholder="Enter your API key"
                 />
            </div>
            <p className="text-xs text-muted-foreground">
                Don't have a key? Get one from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Google AI Studio</a>.
            </p>
        </main>
        
        <footer className="p-4 sm:p-5 flex flex-col sm:flex-row-reverse gap-3 bg-muted/50 border-t border-border">
            <button 
                onClick={handleSave}
                className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
                Save Key
            </button>
            <button
                onClick={handleClear}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors bg-secondary text-secondary-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
                Clear & Use Default
            </button>
        </footer>
      </div>
    </div>
  );
};
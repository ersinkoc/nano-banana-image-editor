import React, { useState, useCallback, useEffect } from 'react';
import { Preview } from './components/Preview';
import { History } from './components/History';
import { PromptCustomizer } from './components/PromptCustomizer';
import { DebugConsole } from './components/DebugConsole';
import { DebugContext } from './contexts/DebugContext';
import { generateEditPrompt, editImageWithGemini } from './services/geminiService';
import * as googleDriveService from './services/googleDriveService';
import type { Prompt, Gender, ImageData, PromptDetails, DebugLog, ArtisticStyle, HistoryEntry } from './types';

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);

type Theme = 'light' | 'dark';

const Header: React.FC<{ theme: Theme, setTheme: (theme: Theme) => void }> = ({ theme, setTheme }) => {
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
    return (
      <header className="py-3 px-4 sm:px-6 bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Foto Maydonoz
          </h1>
          <button
            onClick={toggleTheme}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            aria-label="Toggle theme"
          >
            <SunIcon />
            <MoonIcon />
          </button>
        </div>
      </header>
    );
};

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageData | null>(null);
  const [editedImages, setEditedImages] = useState<string[] | null>(null);
  const [promptHistory, setPromptHistory] = useState<HistoryEntry[]>(() => {
    try {
      const savedHistory = window.localStorage.getItem('promptHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error("Failed to load prompt history from localStorage:", error);
      return [];
    }
  });
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingNewPrompt, setIsGeneratingNewPrompt] = useState<boolean>(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState<boolean>(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');

  // State lifted from PromptCustomizer
  const [quality, setQuality] = useState('standard');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [numImages, setNumImages] = useState<0 | 1 | 4>(4);


  // Debug Console State
  const [logs, setLogs] = useState<DebugLog[]>([]);

  // Google Drive State
  const [isGapiReady, setIsGapiReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [gTokenClient, setGTokenClient] = useState<any>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const addLog = useCallback((type: DebugLog['type'], data: unknown) => {
    const newLog: DebugLog = {
      type,
      data,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs(prevLogs => [newLog, ...prevLogs]);
  }, []);

  useEffect(() => {
    try {
      const limitedHistory = promptHistory.slice(0, 50);
      const historyToSave = limitedHistory.map(({ id, prompt }) => ({
        id,
        prompt,
      }));
      window.localStorage.setItem('promptHistory', JSON.stringify(historyToSave));
    } catch (error) {
      console.error("Failed to save prompt history to localStorage:", error);
    }
  }, [promptHistory]);

  // Google Drive initialization
  useEffect(() => {
    const initializeGapi = async () => {
      if (!googleDriveService.isDriveConfigured) {
        console.warn("Google Drive feature is disabled because no Client ID is configured.");
        return;
      }
      await googleDriveService.loadGapiScript();
      await googleDriveService.loadGisScript();
      await googleDriveService.gapiInit();
      setIsGapiReady(true);
      const tokenClient = googleDriveService.createTokenClient((tokenResponse) => {
        if (tokenResponse.access_token) {
          setIsSignedIn(true);
        }
      });
      setGTokenClient(tokenClient);
    };
    initializeGapi();
  }, []);


  const handleImageUpload = (imageData: ImageData | null) => {
    setOriginalImage(imageData);
    setEditedImages(null);
    setCurrentPrompt(null);
  };
  
  const handleGenericError = (e: unknown, context: string) => {
    console.error(`Error during ${context}:`, e);
    addLog('ERROR', { context, error: e });
    
    // Default error message
    let finalError: React.ReactNode = "An unexpected error occurred. Please try again later.";

    // Attempt to extract a meaningful string from the unknown error type
    let errorMessage = '';
    if (e instanceof Error) {
        errorMessage = e.message;
    } else if (typeof e === 'string') {
        errorMessage = e;
    } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
        errorMessage = e.message;
    } else {
        try {
            errorMessage = JSON.stringify(e);
        } catch {
            errorMessage = 'An unidentifiable error occurred.';
        }
    }

    const lowerCaseMessage = errorMessage.toLowerCase();

    // 1. Rate Limiting / Quota Errors
    if (lowerCaseMessage.includes("429") || lowerCaseMessage.includes("resource_exhausted") || lowerCaseMessage.includes("quota")) {
        finalError = (
            <>
                You have exceeded your API quota for the Gemini API. Please check your plan and billing details. For more information, you can review the{' '}
                <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-red-100">
                    rate limits documentation
                </a>
                {' '}or monitor your{' '}
                <a href="https://ai.dev/usage?tab=rate-limit" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-red-100">
                    current usage
                </a>.
            </>
        );
    }
    // 2. Content Safety Filtering
    else if (lowerCaseMessage.includes("[safety]") || lowerCaseMessage.includes("blocked by the safety filter")) {
        finalError = "Your request was blocked by the content safety filter. This can sometimes happen with profile pictures or specific prompts. Please try a different image or adjust your prompt.";
    }
    // 3. API Key Errors
    else if (lowerCaseMessage.includes("api key not valid") || lowerCaseMessage.includes("api_key_invalid")) {
        finalError = "The application is not configured correctly. The API key is invalid. Please contact support.";
    }
    // 4. Invalid Response from AI (e.g., malformed JSON)
    else if (lowerCaseMessage.includes("invalid json") || lowerCaseMessage.includes("unexpected format") || lowerCaseMessage.includes("failed to parse")) {
        finalError = "The AI generated an invalid response, which can be a temporary issue. Please try your request again.";
    }
    // 5. Network/RPC Errors
    else if (lowerCaseMessage.includes("rpc failed") || lowerCaseMessage.includes("network error")) {
        finalError = "A network error occurred. Please check your internet connection and try again. The service might be temporarily unavailable.";
    }
    // 6. General Fallback
    else {
        finalError = `An unexpected issue occurred. Please see details below. \n\nDetails: ${errorMessage}`;
    }

    setError(finalError);
  };

  const performImageEdit = async (prompt: Prompt, quality: string, aspectRatio: string, numImages: 0 | 1 | 4) => {
    setIsLoading(true);
    setError(null);
    setEditedImages(null);
    setCurrentPrompt(prompt);

    try {
        let editedImageResults: string[] | null = null;
        if (numImages > 0) {
            const requestPayload = { base64: '...', mimeType: originalImage!.mimeType, prompt: prompt.prompt, quality, aspectRatio, numImages };
            addLog('REQUEST', { endpoint: `editImageWithGemini (x${numImages})`, payload: requestPayload });
            
            const imagePromises = Array(numImages).fill(0).map(() => 
                editImageWithGemini(
                originalImage!.base64,
                originalImage!.mimeType,
                prompt.prompt,
                quality,
                aspectRatio,
                )
            );
            editedImageResults = await Promise.all(imagePromises);
            addLog('RESPONSE', { endpoint: `editImageWithGemini (x${numImages})`, result: `${numImages} images received` });
            setEditedImages(editedImageResults);
        } else {
            addLog('REQUEST', { endpoint: `generatePromptOnly`, payload: { prompt } });
        }

        const newHistoryEntry: HistoryEntry = {
            id: `${new Date().getTime()}-${prompt.prompt.slice(0, 20)}`,
            prompt,
            image: editedImageResults?.[0],
        };
        setPromptHistory(prev => [newHistoryEntry, ...prev.filter(p => p.prompt.prompt !== prompt.prompt)]);

    } catch (e) {
        handleGenericError(e, 'performImageEdit');
    } finally {
        setIsLoading(false);
        setIsGeneratingNewPrompt(false);
    }
  };

  const handleGenerateRandom = useCallback(async (gender: Gender, style: ArtisticStyle, numImages: 0 | 1 | 4) => {
    if (!originalImage && numImages > 0) {
      setError("Please upload an image first.");
      return;
    }
    setIsGeneratingNewPrompt(true);
    setError(null);
    setCurrentPrompt(null);
    setEditedImages(null);

    try {
      addLog('REQUEST', { endpoint: 'generateEditPrompt', payload: { gender, quality, aspectRatio, style } });
      const newPrompt = await generateEditPrompt(gender, quality, aspectRatio, style);
      addLog('RESPONSE', { endpoint: 'generateEditPrompt', prompt: newPrompt });
      await performImageEdit(newPrompt, quality, aspectRatio, numImages);
    } catch(e) {
      handleGenericError(e, 'handleGenerateRandom');
      setIsGeneratingNewPrompt(false);
    }
  }, [originalImage, addLog, quality, aspectRatio]);
  
  const handleGenerateCustom = useCallback(async (prompt: Prompt, numImages: 0 | 1 | 4) => {
      if (!originalImage && numImages > 0) {
          setError("Please upload an image first.");
          return;
      }
      await performImageEdit(prompt, quality, aspectRatio, numImages);
  }, [originalImage, addLog, quality, aspectRatio]);

  const handleUseHistoryPrompt = useCallback(async (promptToUse: Prompt) => {
     if (!originalImage && numImages > 0) {
      setError("Please upload an image first to use a historical prompt.");
      window.scrollTo(0, 0); 
      return;
    }
    await performImageEdit(promptToUse, quality, aspectRatio, numImages);
  }, [originalImage, addLog, quality, aspectRatio, numImages]);

  const handleSignIn = () => {
    if (gTokenClient) {
      googleDriveService.requestAccessToken(gTokenClient);
    } else {
      alert("Google Drive feature is not configured. A developer needs to provide a Google Cloud Client ID.");
    }
  };

  const handleSaveToDrive = async () => {
    if (!editedImages || editedImages.length === 0 || !currentPrompt) {
      alert("No edited images to save.");
      return;
    }

    if (!isSignedIn) {
      handleSignIn();
      return;
    }
    
    setIsSavingToDrive(true);
    try {
      const batchId = `nb-${new Date().getTime()}`;
      const uploadPromises = editedImages.map((image, index) =>
        googleDriveService.uploadImageAndPrompt(
          image,
          currentPrompt,
          `${batchId}_${index + 1}`
        )
      );
      await Promise.all(uploadPromises);
      alert(`Successfully saved ${editedImages.length} images to Google Drive!`);
    } catch (error) {
      console.error("Google Drive upload failed:", error);
      const errorMessage = (error as Error).message || 'An unknown error occurred.';
      alert(`Failed to save to Google Drive. ${errorMessage}`);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  return (
    <DebugContext.Provider value={{ logs, addLog }}>
      <div className="flex flex-col min-h-screen">
        <Header theme={theme} setTheme={setTheme} />
        <main className="container mx-auto p-4 sm:p-6 flex-grow w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="sticky top-24">
                <PromptCustomizer 
                  onGenerateRandom={handleGenerateRandom}
                  onGenerateCustom={handleGenerateCustom}
                  onImageUpload={handleImageUpload}
                  isDisabled={isLoading || isGeneratingNewPrompt}
                  quality={quality}
                  setQuality={setQuality}
                  aspectRatio={aspectRatio}
                  setAspectRatio={setAspectRatio}
                  numImages={numImages}
                  setNumImages={setNumImages}
                />
              </div>
            </aside>

            <section className="lg:col-span-8 xl:col-span-9 space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground p-4 rounded-lg flex items-start gap-3" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <div>
                        <h3 className="font-semibold">An Error Occurred</h3>
                        <div className="text-sm text-destructive-foreground/80 whitespace-pre-wrap">{error}</div>
                    </div>
                </div>
              )}
              <Preview
                editedImages={editedImages}
                isLoading={isLoading}
                prompt={currentPrompt}
                onSaveToDrive={handleSaveToDrive}
                onSignIn={handleSignIn}
                isSignedIn={isSignedIn}
                isGapiReady={isGapiReady}
                isSavingToDrive={isSavingToDrive}
                isDriveConfigured={googleDriveService.isDriveConfigured}
              />
              <History prompts={promptHistory} onSelectPrompt={handleUseHistoryPrompt} isGeneratingNewPrompt={isGeneratingNewPrompt} />
            </section>
          </div>
        </main>
        <DebugConsole />
      </div>
    </DebugContext.Provider>
  );
};

export default App;
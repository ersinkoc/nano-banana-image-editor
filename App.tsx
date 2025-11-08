import React, { useState, useCallback, useEffect } from 'react';
import { Preview } from './components/Preview';
import { History } from './components/History';
import { PromptCustomizer } from './components/PromptCustomizer';
import { DebugConsole } from './components/DebugConsole';
import { SettingsModal } from './components/SettingsModal';
import { DebugContext } from './contexts/DebugContext';
import { generateEditPrompt, editImageWithGemini, getApiUsage, resetApiUsage } from './services/geminiService';
import * as googleDriveService from './services/googleDriveService';
import type { Prompt, Gender, ImageData, PromptDetails, DebugLog, ArtisticStyle, HistoryEntry, TextModel, ImageModel } from './types';

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.15l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.15l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
);


type Theme = 'light' | 'dark';

const Header: React.FC<{ theme: Theme; setTheme: (theme: Theme) => void; onOpenSettings: () => void; isUserKeyActive: boolean; }> = ({ theme, setTheme, onOpenSettings, isUserKeyActive }) => {
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };
    return (
      <header className="py-3 px-4 sm:px-6 bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Foto Maydonoz
          </h1>
          <div className="flex items-center gap-2">
            {isUserKeyActive && (
                <div title="Using your custom API Key" className="h-9 w-9 flex items-center justify-center text-primary" aria-label="Custom API Key is active">
                    <KeyIcon />
                </div>
            )}
            <button
                onClick={onOpenSettings}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                aria-label="Open API Key Settings"
            >
                <SettingsIcon />
            </button>
            <button
                onClick={toggleTheme}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                aria-label="Toggle theme"
            >
                <SunIcon />
                <MoonIcon />
            </button>
          </div>
        </div>
      </header>
    );
};

const ERROR_MAP: { keywords: string[], message: React.ReactNode | ((isUserKeyActive: boolean) => React.ReactNode) }[] = [
    {
        keywords: ["429", "resource_exhausted", "quota"],
        message: (isUserKeyActive: boolean) => (
            isUserKeyActive ? (
                <>
                    You have exceeded the API quota for <strong>your provided API key</strong>. Please ensure that billing is enabled for the associated Google Cloud project and that your usage is within the defined limits. For more information, you can review the{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-red-100">
                        rate limits documentation
                    </a>
                    {' '}or monitor your project's{' '}
                    <a href="https://console.cloud.google.com/apis/enabled" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-red-100">
                        usage
                    </a>.
                </>
            ) : (
                <>
                    The application's default API key has exceeded its usage quota. This can happen during periods of high traffic. To continue, please enter your own Gemini API key in the settings.
                </>
            )
        )
    },
    {
        keywords: ["[safety]", "blocked by the safety filter"],
        message: "Your request was blocked by the content safety filter. This can sometimes happen with profile pictures or specific prompts. Please try a different image or adjust your prompt."
    },
    {
        keywords: ["api key not valid", "api_key_invalid", "api key is not configured"],
        message: "The provided API key is invalid or missing. Please enter a valid key in the settings, or clear it to use the default."
    },
    {
        keywords: ["invalid json", "unexpected format", "failed to parse"],
        message: "The AI generated an invalid response, which can be a temporary issue. Please try your request again."
    },
    {
        keywords: ["rpc failed", "network error"],
        message: "A network error occurred. Please check your internet connection and try again. The service might be temporarily unavailable."
    },
    {
        keywords: ["no image was generated by the model"],
        message: "The AI did not generate an image for this prompt. This can happen occasionally. Please try again, perhaps with a slightly different prompt."
    }
];

type FailedAction = 
    | { type: 'random'; payload: { gender: Gender; style: ArtisticStyle; numImages: 0 | 1 | 4 } }
    | { type: 'custom'; payload: { prompt: Prompt; numImages: 0 | 1 | 4 } }
    | { type: 'history'; payload: { promptToUse: Prompt } }
    | { type: 'retrySame'; payload: {} };


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
  const [lastFailedAction, setLastFailedAction] = useState<FailedAction | null>(null);

  // Model Selection State
  const [textModel, setTextModel] = useState<TextModel>('gemini-2.5-pro');
  const [imageModel, setImageModel] = useState<ImageModel>('gemini-2.5-flash-image');

  // User API Key State
  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [apiUsage, setApiUsage] = useState({ defaultKey: 0, userKey: 0 });


  // State lifted from PromptCustomizer
  const [quality, setQuality] = useState('standard');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [numImages, setNumImages] = useState<0 | 1 | 4>(4);
  const [removeBackground, setRemoveBackground] = useState(false);


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
  
  // Load user API key from local storage on initial render
  useEffect(() => {
    const savedKey = localStorage.getItem('userApiKey');
    if (savedKey) {
      setUserApiKey(savedKey);
    }
  }, []);

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
    const isUserKeyActive = !!userApiKey;

    const matchedError = ERROR_MAP.find(errorType =>
        errorType.keywords.some(keyword => lowerCaseMessage.includes(keyword))
    );
    
    let finalError: React.ReactNode;
    if (matchedError) {
        if (typeof matchedError.message === 'function') {
            finalError = matchedError.message(isUserKeyActive);
        } else {
            finalError = matchedError.message;
        }
    } else {
        finalError = `An unexpected issue occurred. Please see details below. \n\nDetails: ${errorMessage}`;
    }

    setError(finalError);
  };

  const performImageEdit = useCallback(async (prompt: Prompt, quality: string, aspectRatio: string, numImages: 0 | 1 | 4, removeBackground: boolean, imageModel: ImageModel) => {
    setCurrentPrompt(prompt);
    
    let editedImageResults: string[] | null = null;
    if (numImages > 0) {
        if (!originalImage) {
            throw new Error("Cannot edit image because no image was uploaded.");
        }
        const requestPayload = { base64: '...', mimeType: originalImage.mimeType, prompt: prompt.prompt, quality, aspectRatio, numImages, removeBackground };
        addLog('REQUEST', { endpoint: `editImageWithGemini (x${numImages})`, payload: requestPayload });
        
        const imagePromises = Array(numImages).fill(0).map(() => 
            editImageWithGemini(
            originalImage.base64,
            originalImage.mimeType,
            prompt.prompt,
            quality,
            aspectRatio,
            imageModel,
            userApiKey,
            removeBackground,
            )
        );
        editedImageResults = await Promise.all(imagePromises);
        addLog('RESPONSE', { endpoint: `editImageWithGemini (x${numImages})`, result: `${numImages} images received` });
    } else {
        addLog('REQUEST', { endpoint: `generatePromptOnly`, payload: { prompt } });
    }

    setEditedImages(editedImageResults);

    const newHistoryEntry: HistoryEntry = {
        id: `${new Date().getTime()}-${prompt.prompt.slice(0, 20)}`,
        prompt,
        image: editedImageResults?.[0],
    };
    setPromptHistory(prev => [newHistoryEntry, ...prev.filter(p => p.prompt.prompt !== prompt.prompt)]);

  }, [originalImage, addLog, userApiKey]);

  const handleGenerateRandom = useCallback(async (gender: Gender, style: ArtisticStyle, numImages: 0 | 1 | 4) => {
      if (!originalImage && numImages > 0) {
          setError("Please upload an image first.");
          return;
      }
      setIsGeneratingNewPrompt(true);
      setError(null);
      setLastFailedAction(null);
      setCurrentPrompt(null);
      setEditedImages(null);

      try {
          addLog('REQUEST', { endpoint: 'generateEditPrompt', payload: { gender, quality, aspectRatio, style, textModel } });
          const newPrompt = await generateEditPrompt(gender, quality, aspectRatio, style, textModel, userApiKey);
          addLog('RESPONSE', { endpoint: 'generateEditPrompt', prompt: newPrompt });
          await performImageEdit(newPrompt, quality, aspectRatio, numImages, removeBackground, imageModel);
      } catch(e) {
          handleGenericError(e, 'handleGenerateRandom');
          setLastFailedAction({ type: 'random', payload: { gender, style, numImages } });
      } finally {
          setIsGeneratingNewPrompt(false);
      }
  }, [originalImage, addLog, quality, aspectRatio, performImageEdit, userApiKey, removeBackground, textModel, imageModel]);
  
  const handleGenerateCustom = useCallback(async (prompt: Prompt, numImages: 0 | 1 | 4) => {
      if (!originalImage && numImages > 0) {
          setError("Please upload an image first.");
          return;
      }
      setIsLoading(true);
      setIsGeneratingNewPrompt(false);
      setError(null);
      setLastFailedAction(null);
      setEditedImages(null);

      try {
          await performImageEdit(prompt, quality, aspectRatio, numImages, removeBackground, imageModel);
      } catch(e) {
          handleGenericError(e, 'handleGenerateCustom');
          setLastFailedAction({ type: 'custom', payload: { prompt, numImages } });
      } finally {
          setIsLoading(false);
      }
  }, [originalImage, quality, aspectRatio, performImageEdit, removeBackground, userApiKey, imageModel]);

  const handleUseHistoryPrompt = useCallback(async (promptToUse: Prompt) => {
      if (!originalImage && numImages > 0) {
          setError("Please upload an image first to use a historical prompt.");
          window.scrollTo(0, 0); 
          return;
      }
      setIsLoading(true);
      setIsGeneratingNewPrompt(false);
      setError(null);
      setLastFailedAction(null);
      setEditedImages(null);

      try {
          await performImageEdit(promptToUse, quality, aspectRatio, numImages, removeBackground, imageModel);
      } catch(e) {
          handleGenericError(e, 'handleUseHistoryPrompt');
          setLastFailedAction({ type: 'history', payload: { promptToUse } });
      } finally {
          setIsLoading(false);
      }
  }, [originalImage, quality, aspectRatio, numImages, performImageEdit, removeBackground, userApiKey, imageModel]);

  const handleRetryWithSamePrompt = useCallback(async () => {
    if (!currentPrompt) {
        setError("Cannot retry: No active prompt found. Please generate an image first.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setLastFailedAction(null);
    setEditedImages(null);

    try {
        await performImageEdit(currentPrompt, quality, aspectRatio, numImages, removeBackground, imageModel);
    } catch(e) {
        handleGenericError(e, 'handleRetryWithSamePrompt');
        setLastFailedAction({ type: 'retrySame', payload: {} });
    } finally {
        setIsLoading(false);
    }
  }, [currentPrompt, quality, aspectRatio, numImages, performImageEdit, removeBackground, userApiKey, imageModel]);


  const handleRetry = () => {
      if (lastFailedAction) {
          setError(null);
          const { type, payload } = lastFailedAction;
          setLastFailedAction(null);

          switch (type) {
              case 'random':
                  handleGenerateRandom(payload.gender, payload.style, payload.numImages);
                  break;
              case 'custom':
                  handleGenerateCustom(payload.prompt, payload.numImages);
                  break;
              case 'history':
                  handleUseHistoryPrompt(payload.promptToUse);
                  break;
              case 'retrySame':
                  handleRetryWithSamePrompt();
                  break;
          }
      }
  };

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

  const handleSaveApiKey = (key: string) => {
    setUserApiKey(key);
    localStorage.setItem('userApiKey', key);
    setIsSettingsModalOpen(false);
  };

  const handleClearApiKey = () => {
    setUserApiKey(null);
    localStorage.removeItem('userApiKey');
    setIsSettingsModalOpen(false);
  };
  
  const handleOpenSettings = () => {
      setApiUsage(getApiUsage());
      setIsSettingsModalOpen(true);
  };
  
  const handleResetApiUsage = () => {
      setApiUsage(resetApiUsage());
  };

  return (
    <DebugContext.Provider value={{ logs, addLog }}>
      <div className="flex flex-col min-h-screen">
        <Header theme={theme} setTheme={setTheme} onOpenSettings={handleOpenSettings} isUserKeyActive={!!userApiKey} />
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
                  removeBackground={removeBackground}
                  setRemoveBackground={setRemoveBackground}
                  textModel={textModel}
                  setTextModel={setTextModel}
                  imageModel={imageModel}
                  setImageModel={setImageModel}
                />
              </div>
            </aside>

            <section className="lg:col-span-8 xl:col-span-9 space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground p-4 rounded-lg flex items-start gap-3" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <div className="flex-grow">
                        <h3 className="font-semibold">An Error Occurred</h3>
                        <div className="text-sm text-destructive-foreground/80 whitespace-pre-wrap mt-1">{error}</div>
                        <div className="mt-3 flex items-center gap-3">
                            {lastFailedAction && (
                                <button
                                    onClick={handleRetry}
                                    className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 focus:ring-offset-background"
                                >
                                    Retry
                                </button>
                            )}
                            <button
                                onClick={() => { setError(null); setLastFailedAction(null); }}
                                className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors border border-destructive/30 text-destructive-foreground/80 hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 focus:ring-offset-background"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
              )}
              <Preview
                editedImages={editedImages}
                isLoading={isLoading || isGeneratingNewPrompt}
                prompt={currentPrompt}
                onSaveToDrive={handleSaveToDrive}
                onSignIn={handleSignIn}
                isSignedIn={isSignedIn}
                isGapiReady={isGapiReady}
                isSavingToDrive={isSavingToDrive}
                isDriveConfigured={googleDriveService.isDriveConfigured}
                onRetryWithSamePrompt={handleRetryWithSamePrompt}
              />
              <History prompts={promptHistory} onSelectPrompt={handleUseHistoryPrompt} isGeneratingNewPrompt={isGeneratingNewPrompt} />
            </section>
          </div>
        </main>
        <DebugConsole />
      </div>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSaveApiKey={handleSaveApiKey}
        onClearApiKey={handleClearApiKey}
        currentApiKey={userApiKey}
        apiUsage={apiUsage}
        onResetUsage={handleResetApiUsage}
      />
    </DebugContext.Provider>
  );
};

export default App;
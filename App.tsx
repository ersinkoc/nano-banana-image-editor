import React, { useState, useCallback, useEffect } from 'react';
import { Preview } from './components/Preview';
import { History } from './components/History';
import { PromptCustomizer } from './components/PromptCustomizer';
import { DebugConsole } from './components/DebugConsole';
import { DebugContext } from './contexts/DebugContext';
import { generateEditPrompt, editImageWithGemini } from './services/geminiService';
import * as googleDriveService from './services/googleDriveService';
import type { Prompt, Gender, ImageData, PromptDetails, DebugLog, ArtisticStyle, HistoryEntry } from './types';

const Header: React.FC = () => (
  <header className="py-4 px-6 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-20">
    <div className="container mx-auto flex justify-between items-center">
      <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
        Nano Banana Image Editor
      </h1>
    </div>
  </header>
);

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

  // State lifted from PromptCustomizer
  const [quality, setQuality] = useState('standard');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [numImages, setNumImages] = useState<1 | 4>(4);


  // Debug Console State
  const [logs, setLogs] = useState<DebugLog[]>([]);

  // Google Drive State
  const [isGapiReady, setIsGapiReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [gTokenClient, setGTokenClient] = useState<any>(null);

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
      // Limit history to 50 items
      const limitedHistory = promptHistory.slice(0, 50);
      
      // Create a "lean" version of the history for localStorage by removing the large base64 image data.
      // This prevents exceeding the localStorage quota. Thumbnails for the current session are preserved in the React state.
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
    console.error(e);
    addLog('ERROR', { context, error: e });
    
    let isQuotaError = false;
    let errorText = '';

    // First, perform a structured check for the quota error if `e` is an object.
    if (typeof e === 'object' && e !== null) {
        const errorObject = e as any;
        // Check for common error structures, including the one reported by the user.
        if (errorObject?.error?.code === 429 || errorObject?.error?.status === 'RESOURCE_EXHAUSTED' || errorObject?.status === 'RESOURCE_EXHAUSTED') {
            isQuotaError = true;
        }
    }

    // Then, create a string representation for fallback checks and display.
    if (e instanceof Error) {
        errorText = e.message;
    } else if (typeof e === 'string') {
        errorText = e;
    } else {
        try {
            errorText = JSON.stringify(e);
        } catch {
            errorText = 'An unidentifiable error occurred.';
        }
    }

    const msg = errorText.toLowerCase();

    // The final check combines the structured check and the fallback string check.
    if (isQuotaError || msg.includes("429") || msg.includes("resource_exhausted")) {
        setError(
            <>
                You have exceeded your API quota. Please check your plan and billing details. For more information, see the{' '}
                <a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-red-100">
                    rate limits documentation
                </a>
                {' '}or monitor your{' '}
                <a href="https://ai.dev/usage?tab=rate-limit" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-red-100">
                    current usage
                </a>.
            </>
        );
        return;
    }

    // Generic handling for other errors.
    let errorMessage = `An unexpected issue occurred: ${errorText}`;
    if (msg.includes("rpc failed")) errorMessage = "A network error occurred. Please check your internet connection and try again. The service might be temporarily unavailable.";
    else if (msg.includes("invalid json") || msg.includes("unexpected format")) errorMessage = "The AI generated an invalid response. This can be a temporary issue. Please try again.";
    else if (msg.includes("[safety]")) errorMessage = "The request was blocked by the content safety filter. This can sometimes happen with profile pictures. Please try a different image.";
    else if (msg.includes("api key not valid")) errorMessage = "There is a configuration issue with the application. Please contact support.";
    
    setError(`Failed to generate image. ${errorMessage}`);
  };

  const performImageEdit = async (prompt: Prompt, quality: string, aspectRatio: string, numImages: 1 | 4) => {
    if (!originalImage) {
      setError("Please upload an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImages(null);
    setCurrentPrompt(prompt);

    try {
      const requestPayload = { base64: '...', mimeType: originalImage.mimeType, prompt: prompt.prompt, quality, aspectRatio, numImages };
      addLog('REQUEST', { endpoint: `editImageWithGemini (x${numImages})`, payload: requestPayload });
      
      const imagePromises = Array(numImages).fill(0).map(() => 
        editImageWithGemini(
          originalImage.base64,
          originalImage.mimeType,
          prompt.prompt,
          quality,
          aspectRatio,
        )
      );

      const editedImageResults = await Promise.all(imagePromises);
      
      addLog('RESPONSE', { endpoint: `editImageWithGemini (x${numImages})`, result: `${numImages} images received` });
      setEditedImages(editedImageResults);

      const newHistoryEntry: HistoryEntry = {
        id: `${new Date().getTime()}-${prompt.prompt.slice(0, 20)}`,
        prompt,
        image: editedImageResults[0], // Use the first image for the history thumbnail
      };
      // Add new entry to history, removing any exact duplicates of the same prompt text.
      // This is a simple way to "move to top" when re-using a prompt.
      setPromptHistory(prev => [newHistoryEntry, ...prev.filter(p => p.prompt.prompt !== prompt.prompt)]);

    } catch (e) {
      handleGenericError(e, 'performImageEdit');
    } finally {
      setIsLoading(false);
      setIsGeneratingNewPrompt(false);
    }
  };

  const handleGenerateRandom = useCallback(async (gender: Gender, style: ArtisticStyle, numImages: 1 | 4) => {
    if (!originalImage) {
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
  
  const handleGenerateCustom = useCallback(async (prompt: Prompt, numImages: 1 | 4) => {
      await performImageEdit(prompt, quality, aspectRatio, numImages);
  }, [originalImage, addLog, quality, aspectRatio]);

  const handleUseHistoryPrompt = useCallback(async (promptToUse: Prompt) => {
     if (!originalImage) {
      setError("Please upload an image first to use a historical prompt.");
      window.scrollTo(0, 0); // Scroll to top to show error
      return;
    }
    // performImageEdit will now handle adding the result to history, effectively "moving" it to the top.
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
      // User will need to click "Save" again after signing in.
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
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-4 xl:col-span-3">
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
            </aside>

            <section className="lg:col-span-8 xl:col-span-9">
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
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
            </section>
          </div>
          <div className="mt-8">
             <History prompts={promptHistory} onSelectPrompt={handleUseHistoryPrompt} isGeneratingNewPrompt={isGeneratingNewPrompt} />
          </div>
        </main>
        <DebugConsole />
      </div>
    </DebugContext.Provider>
  );
};

export default App;
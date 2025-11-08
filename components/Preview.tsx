import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Prompt } from '../types';

interface PreviewProps {
  editedImages: string[] | null;
  isLoading: boolean;
  prompt: Prompt | null;
  onSaveToDrive: () => void;
  onSignIn: () => void;
  isSignedIn: boolean;
  isGapiReady: boolean;
  isSavingToDrive: boolean;
  isDriveConfigured: boolean;
  onRetryWithSamePrompt: () => void;
}

const LoadingSpinner: React.FC = () => {
    const messages = [
        "Warming up the AI's imagination...",
        "Translating pixels into art...",
        "Teaching the AI about cinematography...",
        "Finding the perfect digital paintbrush...",
        "Reticulating splines...",
    ];
    const [message, setMessage] = useState(messages[0]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 3000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg z-10 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">{message}</p>
        </div>
    );
};


const ImageModal: React.FC<{ 
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNext: () => void;
    onPrevious: () => void;
}> = ({ images, currentIndex, onClose, onNext, onPrevious }) => {
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isPanningRef = useRef(false);
    const panStartRef = useRef({ x: 0, y: 0 });

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

    const updateTransform = useCallback((newTransform: { scale: number, x: number, y: number }) => {
        const { scale } = newTransform;
        let { x, y } = newTransform;
        
        if (imageRef.current && containerRef.current) {
            const { naturalWidth, naturalHeight } = imageRef.current;
            const { clientWidth, clientHeight } = containerRef.current;
            
            const aspectRatio = naturalWidth / naturalHeight;
            let displayWidth = clientWidth;
            let displayHeight = displayWidth / aspectRatio;
            if (displayHeight > clientHeight) {
                displayHeight = clientHeight;
                displayWidth = displayHeight * aspectRatio;
            }

            const max_x = Math.max(0, (displayWidth * scale - clientWidth) / 2) / scale;
            const max_y = Math.max(0, (displayHeight * scale - clientHeight) / 2) / scale;

            x = clamp(x, -max_x, max_x);
            y = clamp(y, -max_y, max_y);
        }

        setTransform({ scale, x, y });
    }, []);
    
    const handleReset = useCallback(() => setTransform({ scale: 1, x: 0, y: 0 }), []);

    useEffect(() => { handleReset(); }, [currentIndex, handleReset]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (images.length > 1) {
                if (e.key === 'ArrowRight') onNext();
                if (e.key === 'ArrowLeft') onPrevious();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNext, onPrevious, images.length]);


    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newScale = e.deltaY < 0 ? transform.scale * 1.1 : transform.scale / 1.1;
        updateTransform({ ...transform, scale: clamp(newScale, 1, 10) });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (transform.scale <= 1) return;
        e.preventDefault();
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX - transform.x * transform.scale, y: e.clientY - transform.y * transform.scale };
        if (imageRef.current) imageRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanningRef.current) return;
        e.preventDefault();
        const newX = (e.clientX - panStartRef.current.x) / transform.scale;
        const newY = (e.clientY - panStartRef.current.y) / transform.scale;
        updateTransform({ ...transform, x: newX, y: newY });
    };

    const handleMouseUpOrLeave = () => {
        isPanningRef.current = false;
        if (imageRef.current) imageRef.current.style.cursor = transform.scale > 1 ? 'grab' : 'default';
    };

    const handleZoomIn = () => updateTransform({ ...transform, scale: clamp(transform.scale * 1.5, 1, 10) });
    const handleZoomOut = () => updateTransform({ ...transform, scale: clamp(transform.scale / 1.5, 1, 10) });

    return (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in touch-none"
          onClick={onClose}
        >
            <div 
              ref={containerRef}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onWheel={handleWheel}
              onClick={(e) => e.stopPropagation()}
            >
                <button 
                  onClick={onClose}
                  className="absolute top-2 right-2 text-white text-4xl hover:text-gray-300 transition-colors z-[52] rounded-full bg-black/50 h-9 w-9 flex items-center justify-center"
                  aria-label="Close"
                >&times;</button>
                
                {images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); onPrevious(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 transition-colors z-[52] rounded-full bg-black/50 h-12 w-12 flex items-center justify-center"
                            aria-label="Previous image"
                        >
                            &#8249;
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onNext(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300 transition-colors z-[52] rounded-full bg-black/50 h-12 w-12 flex items-center justify-center"
                            aria-label="Next image"
                        >
                            &#8250;
                        </button>
                    </>
                )}

                <img 
                  ref={imageRef}
                  src={images[currentIndex]} 
                  alt={`Edited variation ${currentIndex + 1}`} 
                  className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out rounded-lg shadow-2xl"
                  style={{ transform: `scale(${transform.scale}) translate(${transform.x}px, ${transform.y}px)`, cursor: transform.scale > 1 ? 'grab' : 'default' }}
                  onMouseDown={handleMouseDown}
                />
            </div>
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 p-1.5 rounded-lg flex items-center gap-1 backdrop-blur-sm z-[51]">
                <button title="Zoom Out" onClick={handleZoomOut} className="text-white h-8 w-8 rounded-md hover:bg-white/20 transition-colors text-xl font-bold flex items-center justify-center">-</button>
                <button title="Reset View" onClick={handleReset} className="text-white h-8 px-4 rounded-md hover:bg-white/20 transition-colors text-sm">Reset</button>
                <button title="Zoom In" onClick={handleZoomIn} className="text-white h-8 w-8 rounded-md hover:bg-white/20 transition-colors text-xl font-bold flex items-center justify-center">+</button>
            </div>
        </div>
    );
};


const PromptDetails: React.FC<{ 
    prompt: Prompt, 
    editedImages: string[] | null,
    onSaveToDrive: () => void,
    onSignIn: () => void,
    isSignedIn: boolean,
    isGapiReady: boolean,
    isSavingToDrive: boolean,
    isDriveConfigured: boolean,
    onRetryWithSamePrompt: () => void,
    isLoading: boolean,
}> = ({ prompt, editedImages, onSaveToDrive, onSignIn, isSignedIn, isGapiReady, isSavingToDrive, isDriveConfigured, onRetryWithSamePrompt, isLoading }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copy JSON');
    
    const handleCopy = () => {
        const detailsToCopy = Object.fromEntries(
            Object.entries(prompt.details).filter(([, value]) => typeof value === 'string' && value.trim() !== '')
        );
        const promptToCopy = { prompt: prompt.prompt, details: detailsToCopy };
        
        navigator.clipboard.writeText(JSON.stringify(promptToCopy, null, 2))
            .then(() => {
                setCopyButtonText('Copied!');
                setTimeout(() => setCopyButtonText('Copy JSON'), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy prompt.');
            });
    };
    
    const handleDriveClick = () => isSignedIn ? onSaveToDrive() : onSignIn();
    
    const getDriveButtonText = () => {
        if (!isDriveConfigured) return 'Drive Disabled';
        if (isSavingToDrive) return 'Saving...';
        if (isSignedIn) return `Save ${editedImages?.length === 1 ? 'Image' : 'All'} to Drive`;
        return `Connect & Save`;
    };

    const handleDownloadAll = () => {
        if (!editedImages) return;
        const timestamp = new Date().getTime();
        editedImages.forEach((imageSrc, index) => {
            const link = document.createElement('a');
            link.href = imageSrc;
            link.download = `fotomaydonoz-${timestamp}-${index + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const ButtonSpinner = () => (
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );

    const isAnyActionInProgress = isLoading || isSavingToDrive;

    return (
        <div className="bg-card border border-border rounded-lg animate-fade-in">
            <div className="p-4 sm:p-6 border-b border-border">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h3 className="text-lg font-semibold text-card-foreground">Edit Details</h3>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={onRetryWithSamePrompt}
                            disabled={isAnyActionInProgress}
                            className="px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-secondary text-secondary-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Generate a new set of images using the exact same prompt and settings."
                        >
                            {isLoading ? 'Regenerating...' : 'Regenerate'}
                        </button>
                        {editedImages && editedImages.length > 1 && (
                            <button onClick={handleDownloadAll} disabled={isAnyActionInProgress} className="px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-secondary text-secondary-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed">Download All</button>
                        )}
                        <button onClick={handleCopy} disabled={isAnyActionInProgress} className="px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-secondary text-secondary-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed">{copyButtonText}</button>
                        {isGapiReady && (
                           <button onClick={handleDriveClick} disabled={isAnyActionInProgress || !editedImages || !isDriveConfigured} className="px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background flex items-center justify-center">
                               {isSavingToDrive && <ButtonSpinner />}
                               {getDriveButtonText()}
                           </button>
                        )}
                    </div>
                </div>
                <p className="italic text-muted-foreground mt-4 text-sm">"{prompt.prompt}"</p>
            </div>
            
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                {Object.entries(prompt.details).map(([key, value]) => {
                    if (key === 'negative_prompt' || !value) return null;
                    return (
                        <div key={key} className="flex flex-col">
                            <span className="font-semibold text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="text-card-foreground">{String(value)}</span>
                        </div>
                    )
                })}
            </div>
            
            {prompt.details.negative_prompt && (prompt.details.negative_prompt.exclude_visuals.length > 0 || prompt.details.negative_prompt.exclude_styles.length > 0) && (
                <div className="p-4 sm:p-6 border-t border-border space-y-4">
                    {prompt.details.negative_prompt.exclude_visuals.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Exclude Visuals (Negative Prompt)</h4>
                            <div className="flex flex-wrap gap-2">
                                {prompt.details.negative_prompt.exclude_visuals.map((tag, index) => (
                                    <span key={index} className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {prompt.details.negative_prompt.exclude_styles.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Exclude Styles (Negative Prompt)</h4>
                            <div className="flex flex-wrap gap-2">
                                {prompt.details.negative_prompt.exclude_styles.map((tag, index) => (
                                    <span key={index} className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
             )}
        </div>
    );
};


export const Preview: React.FC<PreviewProps> = ({ editedImages, isLoading, prompt, onRetryWithSamePrompt, ...driveProps }) => {
  const [modalImageIndex, setModalImageIndex] = useState<number | null>(null);

  const handleNextImage = () => {
    if (modalImageIndex !== null && editedImages && editedImages.length > 1) {
        setModalImageIndex((prevIndex) => (prevIndex! + 1) % editedImages.length);
    }
  };

  const handlePreviousImage = () => {
    if (modalImageIndex !== null && editedImages && editedImages.length > 1) {
        setModalImageIndex((prevIndex) => (prevIndex! - 1 + editedImages.length) % editedImages.length);
    }
  };

  const GridImage: React.FC<{ src: string; onClick: () => void }> = ({ src, onClick }) => (
    <div className="relative group aspect-square bg-muted rounded-md overflow-hidden">
      <img src={src} alt="Edited variation" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button onClick={onClick} className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition" aria-label="Enlarge image">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>
        </button>
        <a href={src} download={`fotomaydonoz-${new Date().getTime()}.png`} className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition" aria-label="Download image">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </a>
      </div>
    </div>
  );
  
  const SingleImageView: React.FC<{ src: string; onClick: () => void; }> = ({ src, onClick }) => (
    <div className="relative group w-full h-full animate-fade-in flex items-center justify-center">
        <img src={src} alt="Edited result" className="max-w-full max-h-full object-contain rounded-lg" />
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onClick} className="p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition" aria-label="Enlarge image">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>
            </button>
            <a href={src} download={`fotomaydonoz-${new Date().getTime()}.png`} className="p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition" aria-label="Download image">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </a>
        </div>
    </div>
);

  return (
    <div className="space-y-6">
        <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-center mb-4 text-card-foreground">Edited Results</h3>
            <div className="relative aspect-square bg-muted/50 rounded-md flex items-center justify-center">
                {isLoading && <LoadingSpinner />}
                {editedImages ? (
                   editedImages.length > 1 ? (
                      <div className="grid grid-cols-2 gap-2 w-full h-full p-2 animate-fade-in">
                          {editedImages.map((image, index) => <GridImage key={index} src={image} onClick={() => setModalImageIndex(index)} />)}
                      </div>
                  ) : <SingleImageView src={editedImages[0]} onClick={() => setModalImageIndex(0)} />
                ) : (
                    !isLoading && (
                        <div className="text-muted-foreground text-center p-4">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-12 w-12 opacity-50"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                             <p className="mt-2 text-sm">Your masterpiece will appear here</p>
                        </div>
                    )
                )}
            </div>
        </div>
        
        {prompt && <PromptDetails 
            prompt={prompt} 
            editedImages={editedImages} 
            onRetryWithSamePrompt={onRetryWithSamePrompt} 
            isLoading={isLoading} 
            {...driveProps} 
        />}

        {!prompt && !isLoading && (
          <div className="bg-card border border-border rounded-lg p-8 text-center shadow-sm animate-fade-in">
            <h2 className="text-2xl font-bold text-card-foreground mb-2">Welcome to Foto Maydonoz</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Upload a photo, customize your prompt, and let our AI transform it into a unique work of art.</p>
          </div>
        )}
        
        {modalImageIndex !== null && editedImages && (
            <ImageModal 
                images={editedImages} 
                currentIndex={modalImageIndex}
                onClose={() => setModalImageIndex(null)}
                onNext={handleNextImage}
                onPrevious={handlePreviousImage}
            />
        )}
    </div>
  );
};

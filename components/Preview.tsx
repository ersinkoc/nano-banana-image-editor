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
        <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center rounded-2xl z-10 backdrop-blur-md animate-fade-in">
            <div className="relative w-16 h-16">
                 <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-sm font-bold text-foreground/80 tracking-wide animate-pulse">{message}</p>
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

    // Reset on image change
    useEffect(() => { setTransform({ scale: 1, x: 0, y: 0 }); }, [currentIndex]);

    // Keyboard support
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

    const handleZoom = (direction: 'in' | 'out') => {
        setTransform(prev => ({
            ...prev,
            scale: Math.max(1, Math.min(10, prev.scale * (direction === 'in' ? 1.5 : 0.75)))
        }));
    };

    return (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-fade-in touch-none"
          onClick={onClose}
        >
            <div className="absolute top-4 right-4 z-[102] flex gap-2">
                 <a href={images[currentIndex]} download={`fotomaydonoz-${Date.now()}.png`} onClick={e => e.stopPropagation()} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </a>
                <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl">
                    &times;
                </button>
            </div>

            <div 
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
                {images.length > 1 && (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); onPrevious(); }} className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-[102] p-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-[102] p-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                    </>
                )}

                <img 
                  ref={imageRef}
                  src={images[currentIndex]} 
                  alt="Full screen view" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
                  style={{ transform: `scale(${transform.scale})` }}
                />
            </div>
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 p-2 rounded-full flex items-center gap-2 backdrop-blur-md z-[101] border border-white/10">
                <button onClick={(e) => { e.stopPropagation(); handleZoom('out'); }} className="h-8 w-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center font-bold text-xl">-</button>
                <button onClick={(e) => { e.stopPropagation(); setTransform({scale: 1, x:0, y:0}); }} className="h-8 px-3 rounded-full hover:bg-white/20 text-white text-xs font-bold uppercase">Reset</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoom('in'); }} className="h-8 w-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center font-bold text-xl">+</button>
            </div>
        </div>
    );
};

const JsonViewer: React.FC<{ prompt: Prompt }> = ({ prompt }) => {
    const jsonString = JSON.stringify(prompt, null, 2);
    const [copyStatus, setCopyStatus] = useState('Copy JSON');

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(jsonString).then(() => {
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus('Copy JSON'), 2000);
        });
    }, [jsonString]);

    return (
        <div className="w-full h-full bg-[#1e1e1e] text-blue-300 font-mono text-[13px] rounded-xl overflow-hidden flex flex-col animate-fade-in border border-white/10 shadow-inner">
            <div className="flex justify-between items-center bg-black/40 px-4 py-2 border-b border-white/5">
                <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Generated Prompt.json</span>
                <button 
                    onClick={handleCopy}
                    className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                    {copyStatus}
                </button>
            </div>
            <div className="overflow-auto flex-grow p-4">
                <pre className="whitespace-pre-wrap">{jsonString}</pre>
            </div>
        </div>
    );
};

const DetailItem: React.FC<{label: string; value: string | string[]}> = ({label, value}) => {
    const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
    if (!displayValue) return null;
    return (
         <div className="flex flex-col p-3 bg-secondary/30 rounded-lg border border-transparent hover:border-border/50 transition-colors">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 opacity-70">{label.replace(/_/g, ' ')}</span>
            <span className="text-sm font-medium text-foreground">{displayValue}</span>
        </div>
    );
};

const PromptDetailsDisplay: React.FC<{ 
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
    const hasImages = editedImages && editedImages.length > 0;
    
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

    const isAnyActionInProgress = isLoading || isSavingToDrive;
    const { details } = prompt;

    return (
        <div className="glass-card rounded-3xl animate-fade-in mt-6">
            <div className="p-6 border-b border-border/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-card-foreground">Prompt Details</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1 italic max-w-lg opacity-80">"{prompt.prompt}"</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={onRetryWithSamePrompt}
                        disabled={isAnyActionInProgress}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Wait...' : 'Regenerate'}
                    </button>
                    
                    {hasImages && (
                        <>
                            {editedImages.length > 1 && (
                                <button onClick={handleDownloadAll} disabled={isAnyActionInProgress} className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all disabled:opacity-50">Download All</button>
                            )}
                            {isGapiReady && (
                                <button onClick={handleDriveClick} disabled={isAnyActionInProgress || !isDriveConfigured} className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground flex items-center gap-2">
                                    {isSavingToDrive && <div className="animate-spin h-3 w-3 border-2 border-white/50 border-t-white rounded-full"></div>}
                                    {getDriveButtonText()}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(details).map(([key, value]) => {
                        if (['subject1', 'subject2', 'negative_prompt'].includes(key)) return null;
                        return <DetailItem key={key} label={key} value={value as string | string[]} />
                    })}
                </div>

                {details.subject1 && (
                    <div className="mt-6">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Person 1
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(details.subject1).map(([key, value]) => <DetailItem key={key} label={key} value={value} />)}
                        </div>
                    </div>
                )}
                {details.subject2 && (
                    <div className="mt-6">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Person 2
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(details.subject2).map(([key, value]) => <DetailItem key={key} label={key} value={value} />)}
                        </div>
                    </div>
                )}
                
                {details.negative_prompt && (
                     <div className="mt-6 pt-6 border-t border-border/40">
                         <h4 className="text-xs font-bold text-destructive/80 uppercase tracking-wider mb-3">Negative Prompt Exclusions</h4>
                         <div className="flex flex-wrap gap-2">
                            {[
                                ...(details.negative_prompt.exclude_visuals || []),
                                ...(details.negative_prompt.exclude_styles || []),
                                ...(details.negative_prompt.exclude_colors || []),
                                ...(details.negative_prompt.exclude_objects || [])
                            ].map((tag, idx) => (
                                <span key={idx} className="px-2 py-1 bg-destructive/10 text-destructive text-[10px] font-bold uppercase rounded-md border border-destructive/20">{tag}</span>
                            ))}
                            {[
                                ...(details.negative_prompt.exclude_visuals || []),
                                ...(details.negative_prompt.exclude_styles || []),
                                ...(details.negative_prompt.exclude_colors || []),
                                ...(details.negative_prompt.exclude_objects || [])
                            ].length === 0 && <span className="text-xs text-muted-foreground italic">None specified.</span>}
                         </div>
                     </div>
                )}
            </div>
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

  const hasImages = editedImages && editedImages.length > 0;
  const isJsonOnlyResult = !isLoading && !hasImages && prompt;

  const SingleImageView: React.FC<{ src: string; onClick: () => void; }> = ({ src, onClick }) => (
    <div className="relative group w-full h-full flex items-center justify-center animate-fade-in">
        <img src={src} alt="Edited result" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-[1.01]" />
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onClick} className="h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center hover:bg-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/></svg>
            </button>
            <a href={src} download={`fotomaydonoz-${Date.now()}.png`} className="h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center hover:bg-primary transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </a>
        </div>
    </div>
  );

  const GridImage: React.FC<{ src: string; onClick: () => void }> = ({ src, onClick }) => (
    <div className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all">
      <img src={src} alt="Edited variation" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
        <button onClick={onClick} className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-primary transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 15 6 6m-6-6v-4.8m0 4.8h-4.8"/></svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
        <div className="glass-card rounded-3xl p-6 min-h-[400px] flex flex-col items-center justify-center relative">
            <h3 className="absolute top-6 left-6 text-sm font-bold uppercase tracking-widest text-muted-foreground opacity-70">
                {isLoading ? "Generating..." : (hasImages ? "Output Results" : (isJsonOnlyResult ? "JSON Output" : "Preview"))}
            </h3>
            
            <div className="w-full flex-grow flex items-center justify-center mt-6">
                {isLoading && <LoadingSpinner />}
                
                {!isLoading && hasImages && (
                   editedImages.length > 1 ? (
                      <div className="grid grid-cols-2 gap-4 w-full h-full max-w-2xl animate-fade-in">
                          {editedImages.map((image, index) => <GridImage key={index} src={image} onClick={() => setModalImageIndex(index)} />)}
                      </div>
                  ) : <div className="h-[500px] w-full"><SingleImageView src={editedImages[0]} onClick={() => setModalImageIndex(0)} /></div>
                )}

                {isJsonOnlyResult && (
                    <div className="h-[400px] w-full"><JsonViewer prompt={prompt} /></div>
                )}

                {!isLoading && !hasImages && !prompt && (
                    <div className="text-center p-8 max-w-md">
                         <div className="mx-auto h-24 w-24 rounded-full bg-secondary/30 flex items-center justify-center mb-6 text-muted-foreground/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                         </div>
                         <h2 className="text-xl font-bold text-foreground mb-2">Ready to Create?</h2>
                         <p className="text-muted-foreground leading-relaxed">Upload a photo in the panel on the left, configure your style, and watch the AI transform it into art.</p>
                    </div>
                )}
            </div>
        </div>
        
        {prompt && <PromptDetailsDisplay 
            prompt={prompt} 
            editedImages={editedImages} 
            onRetryWithSamePrompt={onRetryWithSamePrompt} 
            isLoading={isLoading} 
            {...driveProps} 
        />}
        
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
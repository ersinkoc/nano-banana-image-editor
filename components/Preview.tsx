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
}

const LoadingSpinner: React.FC = () => (
    <div className="absolute inset-0 bg-gray-800/80 flex flex-col items-center justify-center rounded-lg z-10">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-400"></div>
        <p className="mt-4 text-lg font-semibold text-gray-200">AI is creating...</p>
    </div>
);

const ImageModal: React.FC<{ imageUrl: string; onClose: () => void }> = ({ imageUrl, onClose }) => {
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
            
            // Calculate the display size of the image within the container while maintaining aspect ratio
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
    
    const handleReset = useCallback(() => {
        setTransform({ scale: 1, x: 0, y: 0 });
    }, []);

    useEffect(() => {
        handleReset();
    }, [imageUrl, handleReset]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const newScale = e.deltaY < 0 ? transform.scale * zoomFactor : transform.scale / zoomFactor;
        const clampedScale = clamp(newScale, 1, 10);
        updateTransform({ ...transform, scale: clampedScale });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (transform.scale <= 1) return;
        e.preventDefault();
        isPanningRef.current = true;
        panStartRef.current = {
            x: e.clientX - transform.x * transform.scale,
            y: e.clientY - transform.y * transform.scale
        };
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
          ref={containerRef}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in touch-none"
          onClick={onClose}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors z-50"
              aria-label="Close"
            >
              &times;
            </button>
            <div 
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              onWheel={handleWheel}
            >
                <img 
                  ref={imageRef}
                  src={imageUrl} 
                  alt="Edited" 
                  className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out"
                  style={{
                      transform: `scale(${transform.scale}) translate(${transform.x}px, ${transform.y}px)`,
                      cursor: transform.scale > 1 ? 'grab' : 'default'
                  }}
                  onMouseDown={handleMouseDown}
                  onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking on the image
                />
            </div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/60 p-2 rounded-lg flex items-center gap-2 backdrop-blur-sm">
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
    isDriveConfigured: boolean;
}> = ({ prompt, editedImages, onSaveToDrive, onSignIn, isSignedIn, isGapiReady, isSavingToDrive, isDriveConfigured }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copy Prompt (JSON)');
    
    const handleCopy = () => {
        // Filter out details with empty values for a cleaner copied JSON
        const detailsToCopy = Object.fromEntries(
            // Fix: Added a type check to ensure `value` is a string before calling `trim()` to resolve "Property 'trim' does not exist on type 'unknown'" error.
            Object.entries(prompt.details).filter(([, value]) => typeof value === 'string' && value.trim() !== '')
        );

        const promptToCopy = {
            prompt: prompt.prompt,
            details: detailsToCopy,
        };
        
        navigator.clipboard.writeText(JSON.stringify(promptToCopy, null, 2))
            .then(() => {
                setCopyButtonText('Copied!');
                setTimeout(() => setCopyButtonText('Copy Prompt (JSON)'), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy prompt.');
            });
    };
    
    const handleDriveClick = () => {
        if (!isSignedIn) {
            onSignIn();
        } else {
            onSaveToDrive();
        }
    };
    
    const getDriveButtonText = () => {
        if (!isDriveConfigured) return 'Drive Disabled';
        if (isSavingToDrive) return 'Saving...';
        if (isSignedIn) return `Save ${editedImages?.length === 1 ? 'Image' : 'All'} to Drive`;
        return `Connect & Save ${editedImages?.length === 1 ? 'Image' : 'All'}`;
    };

    return (
        <div className="mt-6 bg-gray-800 rounded-lg p-6 shadow-lg animate-fade-in">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h3 className="text-xl font-bold text-purple-400">Edit Details</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={handleCopy}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                       {copyButtonText}
                    </button>
                    {isGapiReady && (
                        <div className="relative group">
                            <button 
                                onClick={handleDriveClick}
                                disabled={!editedImages || isSavingToDrive || !isDriveConfigured}
                                className={`font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                                    !editedImages || isSavingToDrive || !isDriveConfigured
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                {getDriveButtonText()}
                            </button>
                            {!isDriveConfigured && (
                                <div className="absolute bottom-full mb-2 w-max max-w-xs bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Feature not configured. A Google Cloud Client ID is required by the developer.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <p className="italic text-gray-300 mb-6">"{prompt.prompt}"</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                {Object.entries(prompt.details).map(([key, value]) => (
                    value && <div key={key}>
                        <span className="font-semibold text-gray-400 capitalize mr-2">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-gray-200">{String(value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const Preview: React.FC<PreviewProps> = ({ editedImages, isLoading, prompt, ...driveProps }) => {
  const [modalImage, setModalImage] = useState<string | null>(null);

  const GridImage: React.FC<{ src: string }> = ({ src }) => (
    <div className="relative group aspect-square bg-gray-700 rounded-md overflow-hidden">
      <img src={src} alt="Edited variation" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
        <button
          onClick={() => setModalImage(src)}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          aria-label="Enlarge image"
        >
          <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
          </svg>
        </button>
        <a
          href={src}
          download={`nano-banana-edit-${new Date().getTime()}.png`}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          aria-label="Download image"
        >
          <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      </div>
    </div>
  );
  
  const SingleImageView: React.FC<{ src: string }> = ({ src }) => (
    <div className="relative group w-full h-full animate-fade-in">
        <img src={src} alt="Edited result" className="w-full h-full object-contain" />
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                onClick={() => setModalImage(src)}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition"
                aria-label="Enlarge image"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>
            </button>
            <a
                href={src}
                download={`nano-banana-edit-${new Date().getTime()}.png`}
                className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition"
                aria-label="Download image"
            >
                <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </a>
        </div>
    </div>
);


  return (
    <div className="space-y-6">
        <div className="bg-gray-800 p-4 rounded-lg shadow-inner flex flex-col">
            <h3 className="text-lg font-semibold text-center mb-4 text-gray-300">Edited Results</h3>
            <div className="relative aspect-square bg-gray-900 rounded-md flex-grow flex items-center justify-center">
                {isLoading && <LoadingSpinner />}
                {editedImages ? (
                   editedImages.length > 1 ? (
                      <div className="grid grid-cols-2 gap-2 w-full h-full animate-fade-in">
                          {editedImages.map((image, index) => (
                              <GridImage key={index} src={image} />
                          ))}
                      </div>
                  ) : (
                      <SingleImageView src={editedImages[0]} />
                  )
                ) : (
                    !isLoading && (
                        <div className="text-gray-500 text-center p-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                             <p className="mt-2">Your edited images will appear here.</p>
                        </div>
                    )
                )}
            </div>
        </div>
        
        {prompt && <PromptDetails prompt={prompt} editedImages={editedImages} {...driveProps} />}

        {!prompt && !isLoading && (
          <div className="bg-gray-800 rounded-lg p-12 text-center shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-300 mb-2">Welcome to the AI Image Editor</h2>
            <p className="text-gray-400">Upload a profile photo and use the controls to begin your creative journey.</p>
          </div>
        )}
        
        {modalImage && <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />}
    </div>
  );
};
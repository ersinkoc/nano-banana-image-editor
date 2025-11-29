import React, { useState, useRef } from 'react';
import type { ImageData } from '../types';

interface ImageUploaderProps {
  onImageUpload: (imageData: ImageData | null) => void;
  uploadedImage: ImageData | null;
}

const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const fileToData = (file: File, onProgress: (progress: number) => void): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onprogress = (event: ProgressEvent<FileReader>) => {
            if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                onProgress(progress);
            }
        };
        
        reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
                const dataUrl = event.target.result;
                const [header, base64] = dataUrl.split(',');
                const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
                resolve({ dataUrl, base64, mimeType });
            } else {
                reject(new Error('Failed to read file.'));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, uploadedImage }) => {
  const [progress, setProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const processFile = async (file: File | undefined) => {
    if (file) {
       if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`File is too large. Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`);
        onImageUpload(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setProgress(0);
      try {
        const imageData = await fileToData(file, (p) => setProgress(p));
        onImageUpload(imageData);
      } catch (error) {
        console.error("Error processing file:", error);
        alert("There was an error processing your image.");
        onImageUpload(null);
      } finally {
        setProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      processFile(file);
  };

  const handleButtonClick = () => {
    if (progress === null) {
      fileInputRef.current?.click();
    }
  };
  
  const clearImage = (e: React.MouseEvent) => {
      e.stopPropagation();
      onImageUpload(null);
  }

  return (
    <div className="w-full">
        <div 
          className={`relative w-full aspect-[4/3] rounded-2xl flex flex-col items-center justify-center transition-all duration-300 overflow-hidden cursor-pointer group ${
              isDragging 
                ? 'border-2 border-primary bg-primary/10 scale-[1.02]' 
                : 'border border-dashed border-border/60 hover:border-primary/50 hover:bg-secondary/30 bg-secondary/10'
          } ${uploadedImage ? 'border-none bg-black/50' : ''}`}
          onClick={handleButtonClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
        
        {uploadedImage ? (
            <>
                <img src={uploadedImage.dataUrl} alt="Preview" className="object-contain h-full w-full opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                     <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full border border-white/20">Change Photo</span>
                </div>
                <button 
                    onClick={clearImage} 
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-destructive hover:text-white transition-colors z-10"
                    title="Remove image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </>
        ) : (
            <div className="text-center p-4 transform transition-transform group-hover:scale-105">
                <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3 transition-colors ${isDragging ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                </div>
                <p className="text-sm font-semibold text-foreground">Upload or Drop</p>
                <p className="text-xs text-muted-foreground mt-1">MAX {MAX_FILE_SIZE_MB}MB</p>
            </div>
        )}

        {progress !== null && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-8 z-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
              <p className="text-xs font-bold text-primary animate-pulse">OPTIMIZING...</p>
          </div>
        )}
        </div>
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
        />
    </div>
  );
};
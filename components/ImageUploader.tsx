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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
       if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`File is too large. Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`);
        onImageUpload(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        return;
      }

      setProgress(0);
      try {
        const imageData = await fileToData(file, (p) => setProgress(p));
        onImageUpload(imageData);
      } catch (error) {
        console.error("Error processing file:", error);
        alert("There was an error processing your image. It might be corrupted. Please try another one.");
        onImageUpload(null);
      } finally {
        setProgress(null);
        // FIX: Clear the file input value to allow re-uploading the same file
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleButtonClick = () => {
    // Don't open file dialog if we are currently reading a file
    if (progress === null) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
        <div 
          className="relative w-full aspect-square bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-border hover:border-primary transition-colors group overflow-hidden"
          onClick={handleButtonClick}
          style={{ cursor: progress !== null ? 'default' : 'pointer' }}
        >
        {uploadedImage ? (
            <img src={uploadedImage.dataUrl} alt="Preview" className="object-contain h-full w-full rounded-md" />
        ) : (
            <div className="text-center text-muted-foreground p-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-10 w-10 opacity-50 transition-colors group-hover:text-primary"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M20.4 14.5L16 10 4 20"></path></svg>
                <p className="mt-2 text-sm font-semibold">Click to upload photo</p>
                <p className="text-xs">PNG, JPG or WEBP (max {MAX_FILE_SIZE_MB}MB)</p>
            </div>
        )}
        {progress !== null && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
              <div className="w-full">
                  <p className="text-center text-sm font-semibold text-foreground mb-2">Reading file...</p>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                      <div 
                          className="bg-primary h-2.5 rounded-full transition-all duration-150 ease-linear" 
                          style={{ width: `${progress}%` }}
                      ></div>
                  </div>
              </div>
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
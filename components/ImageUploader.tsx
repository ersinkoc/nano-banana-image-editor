import React, { useState, useRef } from 'react';
import type { ImageData } from '../types';

interface ImageUploaderProps {
  onImageUpload: (imageData: ImageData | null) => void;
}

const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const fileToData = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
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

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
       if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`File is too large. Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`);
        onImageUpload(null);
        setPreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        return;
      }

      try {
        const imageData = await fileToData(file);
        setPreview(imageData.dataUrl);
        onImageUpload(imageData);
      } catch (error) {
        console.error("Error processing file:", error);
        alert("There was an error processing your image. It might be corrupted. Please try another one.");
        setPreview(null);
        onImageUpload(null);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
        <div 
          className="relative w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-500 cursor-pointer hover:border-purple-400 transition-colors"
          onClick={handleButtonClick}
        >
        {preview ? (
            <img src={preview} alt="Preview" className="object-contain h-full w-full rounded-md" />
        ) : (
            <div className="text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="mt-2 text-sm">Click to upload a profile photo</p>
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
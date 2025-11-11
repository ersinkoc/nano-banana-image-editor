import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import type { ImageData } from '../types';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedImage: ImageData) => void;
  onClose: () => void;
}

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; disabled?: boolean }> = ({ label, value, min, max, step, onChange, disabled }) => (
    <div className="flex items-center gap-4">
        <label className={`text-sm font-medium w-16 text-card-foreground ${disabled ? 'opacity-50' : ''}`}>{label}</label>
        <input
            type="range"
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer range-sm disabled:opacity-50"
        />
    </div>
);


export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ imageSrc, onCropComplete, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedImage) {
        onCropComplete(croppedImage);
      } else {
        alert("Could not crop image. Please try again.");
        onClose();
      }
    } catch (e) {
      console.error("Error during crop:", e);
      alert("An error occurred while cropping. Please try again.");
      onClose();
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[60] p-4 animate-fade-in"
    >
      <div
        className="bg-card rounded-lg border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <header className="flex justify-between items-center p-4 sm:p-5 border-b border-border">
          <h2 className="text-lg font-bold text-card-foreground">Crop Your Image</h2>
          <button onClick={onClose} disabled={isCropping} className="text-muted-foreground hover:text-foreground text-2xl leading-none rounded-full h-8 w-8 flex items-center justify-center" aria-label="Close">&times;</button>
        </header>

        <main className="flex-grow relative bg-muted/50">
           <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteCallback}
          />
        </main>
        
        <div className="p-4 sm:p-5 border-t border-border bg-card space-y-4">
            <Slider label="Zoom" value={zoom} min={1} max={3} step={0.1} onChange={setZoom} disabled={isCropping}/>
            <Slider label="Rotation" value={rotation} min={0} max={360} step={1} onChange={setRotation} disabled={isCropping} />
        </div>
        <div className="p-4 flex flex-col sm:flex-row-reverse gap-3 bg-muted/50 border-t border-border">
            <button 
                onClick={handleCrop}
                disabled={isCropping}
                className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
            >
                {isCropping ? 'Cropping...' : 'Apply Crop'}
            </button>
            <button
                onClick={onClose}
                disabled={isCropping}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors bg-secondary text-secondary-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
            >
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

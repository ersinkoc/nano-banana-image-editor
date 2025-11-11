import type { ImageData } from '../types';

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}


/**
 * This function crops and rotates an image.
 * @param {string} imageSrc - The source of the image to crop.
 * @param {Object} pixelCrop - The pixel crop area from the source image.
 * @param {number} rotation - The rotation angle in degrees.
 * @returns {Promise<ImageData | null>} A promise that resolves with the cropped image data.
 */
export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number; },
  rotation = 0
): Promise<ImageData | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate the size of the bounding box that will fit the rotated crop area.
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    pixelCrop.width,
    pixelCrop.height,
    rotation
  );

  // Set the canvas size to the bounding box size.
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate the canvas origin to the center for rotation.
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);

  // Draw the cropped portion of the source image onto the rotated canvas.
  // The destination rectangle is centered at [-width/2, -height/2] relative to the new origin.
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    -pixelCrop.width / 2,
    -pixelCrop.height / 2,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert the canvas content to our ImageData format.
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const [header, base64] = dataUrl.split(',');
    
    if (!base64) {
      throw new Error('Failed to parse data URL from cropped image.');
    }
    
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return { dataUrl, base64, mimeType };
  } catch (error) {
    console.error("Error converting canvas to data URL:", error);
    return null;
  }
}
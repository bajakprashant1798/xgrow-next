/**
 * Client-side image compression & resizing utility
 * Prevents localStorage QuotaExceededError by resizing and compressing uploaded base64 images
 */

export async function compressImageFile(
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 200,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, read directly as text/dataURL since SVGs are vector and already small
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new constrained aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw image into resized canvas
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Preserve transparency for PNGs or use WebP
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/webp';
        const compressedDataUrl = canvas.toDataURL(outputType, quality);

        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        // Fallback to original data URL if image creation fails
        resolve(readerEvent.target?.result as string);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function compressDataUrl(
  dataUrl: string,
  maxWidth: number = 400,
  maxHeight: number = 200,
  quality: number = 0.85
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.includes('image/svg+xml')) {
    return dataUrl;
  }

  // If already small (< 50KB), return as is
  if (dataUrl.length < 50 * 1024) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const isPng = dataUrl.startsWith('data:image/png');
      const outputType = isPng ? 'image/png' : 'image/webp';
      const compressed = canvas.toDataURL(outputType, quality);
      resolve(compressed);
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

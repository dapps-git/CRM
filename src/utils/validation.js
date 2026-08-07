/**
 * Form Validation and Image Compression Utilities
 */

// Letters and spaces only
export const isLettersOnly = (val) => {
  if (!val) return true; // empty checked separately by required
  return /^[a-zA-Z\s]+$/.test(val.trim());
};

// Digits only
export const isNumbersOnly = (val) => {
  if (val === '' || val === null || val === undefined) return true;
  return /^\d+$/.test(String(val).trim());
};

// Exactly 10 digits
export const isExactly10Digits = (val) => {
  if (!val) return true;
  return /^\d{10}$/.test(String(val).trim());
};

/**
 * Client-side image compression and WebP conversion.
 * Reduces large 5-10MB photo uploads to ~50-150KB WebP files.
 */
export const compressImageToWebP = (file, maxDimension = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File || file instanceof Blob)) {
      return resolve(file);
    }

    // Only compress image files
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            const webpFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.webp',
              { type: 'image/webp', lastModified: Date.now() }
            );
            resolve(webpFile);
          },
          'image/webp',
          quality
        );
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

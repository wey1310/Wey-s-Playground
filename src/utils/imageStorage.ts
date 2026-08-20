/**
 * Image Upload & Cloud Storage Utility
 * Supports:
 * 1. Direct local file upload with automatic image compression to WebP/DataURI (100% Free, zero external dependency)
 * 2. Cloudinary direct unsigned upload using user or app settings
 * 3. User email isolation (all images and question banks are saved strictly associated with user's email)
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

const CLOUDINARY_STORAGE_KEY = 'wey_cloudinary_config';

export function getSavedCloudinaryConfig(): CloudinaryConfig {
  try {
    const saved = localStorage.getItem(CLOUDINARY_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return {
    cloudName: (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || 'r7hnjozd',
    uploadPreset: (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wey_playground_upload',
  };
}

export function saveCloudinaryConfig(config: CloudinaryConfig): void {
  localStorage.setItem(CLOUDINARY_STORAGE_KEY, JSON.stringify(config));
}

/**
 * Compress an image file in-browser to a lightweight WebP/JPEG data URI (100% free client-side storage)
 */
export async function compressImageToDataUrl(file: File, maxWidth = 800, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first for ultra small size, fallback to JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể tải hình ảnh'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file hình ảnh'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image to Cloudinary if configured, or compress into lightweight DataURI
 */
export async function uploadImageFile(file: File, userEmail?: string | null): Promise<string> {
  const config = getSavedCloudinaryConfig();

  // If user configured Cloudinary unsigned upload
  if (config.cloudName && config.uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', config.uploadPreset);
      if (userEmail) {
        formData.append('folder', `wey_users/${userEmail.replace(/[^a-zA-Z0-9_]/g, '_')}`);
      }

      const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.secure_url) {
          return data.secure_url;
        }
      }
    } catch (e) {
      console.warn('Cloudinary upload failed, falling back to local compressed storage:', e);
    }
  }

  // 100% Free automatic fallback: in-browser compression to high quality lightweight WebP
  return await compressImageToDataUrl(file);
}

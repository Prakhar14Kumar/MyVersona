/**
 * Cloudinary Integration Service for MyVerSona
 * Handles image uploading and URL optimization
 */

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  [key: string]: any;
}

/**
 * Uploads an image file to Cloudinary
 * @param file The file object to upload
 * @returns A promise resolving to the Cloudinary upload response containing the secure_url
 */
export const uploadImage = async (file: File): Promise<CloudinaryUploadResponse> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing. Please check your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
  }

  return await response.json();
};

/**
 * Uploads a video file to Cloudinary
 * @param file The file object to upload
 * @returns A promise resolving to the Cloudinary upload response containing the secure_url
 */
export const uploadVideo = async (file: File): Promise<CloudinaryUploadResponse> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing. Please check your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to upload video to Cloudinary');
  }

  return await response.json();
};

/**
 * Uploads a document file (PDF, DOCX) to Cloudinary
 * @param file The file object to upload
 * @returns A promise resolving to the Cloudinary upload response containing the secure_url
 */
export const uploadDocument = async (file: File): Promise<CloudinaryUploadResponse> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing. Please check your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to upload document to Cloudinary');
  }

  return await response.json();
};

/**
 * Injects optimization transformations into a Cloudinary URL
 * Uses f_auto, q_auto, dpr_auto, c_limit, w_800
 * @param url The original Cloudinary URL
 * @returns The optimized URL
 */
export const getOptimizedCloudinaryUrl = (url: string): string => {
  if (!url) return '';
  
  // Only modify if it's a valid Cloudinary URL that doesn't already have these specific transforms
  if (!url.includes('res.cloudinary.com') || url.includes('f_auto,q_auto')) {
    return url;
  }

  // The standard format is: https://res.cloudinary.com/<cloud_name>/<resource_type>/<type>/<transformations>/<version>/<public_id>
  // A simple way to inject transformations is to add them right after 'upload/'
  const uploadToken = '/upload/';
  const uploadIndex = url.indexOf(uploadToken);
  
  if (uploadIndex !== -1) {
    const beforeUpload = url.substring(0, uploadIndex + uploadToken.length);
    const afterUpload = url.substring(uploadIndex + uploadToken.length);
    
    // Inject optimization parameters
    return `${beforeUpload}f_auto,q_auto,dpr_auto,c_limit,w_800/${afterUpload}`;
  }
  
  return url;
};

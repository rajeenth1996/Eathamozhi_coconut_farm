import { v2 as cloudinary } from 'cloudinary';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && API_KEY && API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
}

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  unconfigured?: boolean;
  error?: string;
}

/**
 * Uploads an image Buffer or Data URI string to Cloudinary with automatic optimization
 *
 * @param fileInput - Binary file buffer or base64 data URI string
 * @param folder - Cloudinary folder (e.g. 'receipts', 'batches', 'mother-trees')
 * @param filename - Optional custom identifier
 */
export async function uploadToCloudinary(
  fileInput: Buffer | string,
  folder: string = 'general',
  filename?: string
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) {
    return {
      success: false,
      unconfigured: true,
      error: 'Cloudinary credentials are not configured in .env.local',
    };
  }

  const uploadOptions: any = {
    folder: `eathamozhy-farm/${folder}`,
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' }, // Cloudinary auto-compression & WebP conversion
    ],
  };

  if (filename) {
    uploadOptions.public_id = filename.replace(/\.[^/.]+$/, ''); // Strip extension
  }

  try {
    // If input is already a Data URI or base64 string
    if (typeof fileInput === 'string') {
      const result = await cloudinary.uploader.upload(fileInput, uploadOptions);
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    // If input is a Buffer
    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            console.error('Cloudinary upload stream error:', error);
            resolve({
              success: false,
              error: error?.message || 'Cloudinary upload failed',
            });
          } else {
            resolve({
              success: true,
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      uploadStream.end(fileInput);
    });
  } catch (err: any) {
    console.error('Cloudinary upload error:', err);
    return {
      success: false,
      error: err?.message || 'Cloudinary upload threw an exception',
    };
  }
}

/**
 * Extracts public_id from Cloudinary URL and deletes the asset
 */
export async function deleteFromCloudinary(urlOrPublicId: string): Promise<boolean> {
  if (!isCloudinaryConfigured || !urlOrPublicId) return false;

  try {
    let publicId = urlOrPublicId;
    if (urlOrPublicId.includes('res.cloudinary.com')) {
      // Extract everything between '/upload/v...' and the file extension
      const matches = urlOrPublicId.match(/\/upload\/(?:v\d+\/)?([^.]+)/);
      if (matches && matches[1]) {
        publicId = matches[1];
      }
    }

    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  } catch (err) {
    console.error('Cloudinary destroy error:', err);
    return false;
  }
}


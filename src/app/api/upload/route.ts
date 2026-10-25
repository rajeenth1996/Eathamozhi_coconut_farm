// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { DataStore } from '@/lib/dataStore';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  // 1. Rate Limiting: Max 30 uploads per 10 minutes per IP
  const rateLimit = checkRateLimit(request, 'upload');
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit, 'Upload rate limit exceeded. Please wait a few minutes before uploading more images.');
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle JSON payloads containing base64 images
    if (contentType.includes('application/json')) {
      const jsonBody = await request.json();
      const { image, images, category = 'general' } = jsonBody;
      const rawImages: string[] = [];

      if (typeof image === 'string' && image) rawImages.push(image);
      if (Array.isArray(images)) {
        for (const img of images) {
          if (typeof img === 'string' && img) rawImages.push(img);
        }
      }

      if (rawImages.length === 0) {
        return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
      }

      const uploadedUrls: string[] = [];
      let provider = 'cloudinary';

      for (const img of rawImages) {
        if (img.startsWith('http://') || img.startsWith('https://')) {
          uploadedUrls.push(img);
        } else {
          const res = await uploadToCloudinary(img, category);
          if (res.success && res.url) {
            uploadedUrls.push(res.url);
          } else {
            console.error('Failed to upload base64 image to Cloudinary:', res.error);
          }
        }
      }

      return NextResponse.json({
        success: true,
        url: uploadedUrls[0] || '',
        urls: uploadedUrls,
        provider,
      });
    }

    // Handle multipart/form-data
    const form = await request.formData();

    // Collect all files from 'file', 'files', or 'images'
    const filesToUpload: File[] = [];
    const singleFile = form.get('file') as File | null;
    if (singleFile && typeof singleFile === 'object' && singleFile.name) {
      filesToUpload.push(singleFile);
    }

    const multiFiles = form.getAll('files') as File[];
    for (const f of multiFiles) {
      if (f && typeof f === 'object' && f.name && !filesToUpload.includes(f)) {
        filesToUpload.push(f);
      }
    }

    const imageFiles = form.getAll('images') as File[];
    for (const f of imageFiles) {
      if (f && typeof f === 'object' && f.name && !filesToUpload.includes(f)) {
        filesToUpload.push(f);
      }
    }

    if (filesToUpload.length === 0) {
      return NextResponse.json({ error: 'No files provided for upload' }, { status: 400 });
    }

    const categoryRaw = (form.get('category') as string | null) || (form.get('type') as string | null) || 'general';
    const safeCategory = categoryRaw.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
    const folder = safeCategory === 'receipt' ? 'receipts' : safeCategory;

    const uploadedUrls: string[] = [];
    let storageProvider = isCloudinaryConfigured ? 'cloudinary' : 'local';

    for (const file of filesToUpload) {
      // 2. File Size Validation (Max 10MB)
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds maximum limit of 10MB` },
          { status: 400 }
        );
      }

      // 3. MIME Type Validation
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          { error: `File "${file.name}" is not a supported format. Only JPEG, PNG, and WebP are allowed.` },
          { status: 400 }
        );
      }

      const ext = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
      const filename = `${randomUUID()}-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      let finalUrl = '';

      // 4. Cloudinary Upload
      if (isCloudinaryConfigured) {
        const cloudResult = await uploadToCloudinary(buffer, folder, filename);
        if (cloudResult.success && cloudResult.url) {
          finalUrl = cloudResult.url;
          storageProvider = 'cloudinary';
        } else {
          console.error('Cloudinary upload error:', cloudResult.error);
          return NextResponse.json(
            { error: `Cloud storage upload failed: ${cloudResult.error || 'Please check your cloud configuration'}` },
            { status: 500 }
          );
        }
      } else {
        // Local Storage Fallback only if Cloudinary is completely unconfigured
        const baseFolder = join(process.cwd(), 'public', 'images', 'uploads');
        await ensureDir(baseFolder);
        const filePath = join(baseFolder, filename);
        await fs.writeFile(filePath, buffer);
        finalUrl = `/images/uploads/${filename}`;
        storageProvider = 'local';
      }

      uploadedUrls.push(finalUrl);
      DataStore.addImageReference(folder, finalUrl);
    }

    // 6. Optional Order Receipt Linking (if orderId was supplied)
    const orderId = form.get('orderId') as string | null;
    if (orderId && uploadedUrls.length > 0) {
      DataStore.updateOrder(orderId, { receiptUrl: uploadedUrls[0] });
    }

    return NextResponse.json(
      {
        success: true,
        url: uploadedUrls[0] || '',
        urls: uploadedUrls,
        provider: storageProvider,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Upload error →', err);
    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get('path') || searchParams.get('url');

    if (!targetPath) {
      return NextResponse.json({ error: 'path query parameter is required' }, { status: 400 });
    }

    // If it's a Cloudinary URL
    if (targetPath.includes('cloudinary.com')) {
      await deleteFromCloudinary(targetPath);
      return NextResponse.json({ success: true, message: 'Deleted from Cloudinary' });
    }

    // If it's a local public file
    if (targetPath.startsWith('/images/')) {
      const localFilePath = join(process.cwd(), 'public', targetPath);
      try {
        await fs.unlink(localFilePath);
      } catch (e) {
        // File might already be gone
      }
      return NextResponse.json({ success: true, message: 'Deleted from local disk' });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete error →', err);
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 });
  }
}

import { API_BASE_URL } from "../../src/config/api";

/** Kept in step with backend/admin/adminUploads.js, which checks again. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Returns a sentence saying why the file can't be uploaded, or null if it's fine. */
export function checkImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "That file isn't a JPEG, PNG or WebP image. Choose a photo in one of those formats.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `That photo is ${(file.size / 1024 / 1024).toFixed(1)} MB. Choose one that's 3 MB or smaller.`;
  }
  return null;
}

/** True for paths stored by the upload endpoint, e.g. "/uploads/products/<uuid>.webp". */
export function isUploadedImage(url: string): boolean {
  return url.startsWith("/uploads/");
}

export class UploadCancelledError extends Error {}

export interface ImageUpload {
  /** Resolves to the stored image path; rejects with an Error whose message can be shown as-is. */
  done: Promise<string>;
  abort: () => void;
}

interface UploadResponse {
  success?: boolean;
  url?: string;
  message?: string;
}

/**
 * Sends one image to POST /api/admin/uploads. Uses XMLHttpRequest because
 * fetch can't report upload progress.
 */
export function uploadProductImage(file: File, onProgress: (percent: number) => void): ImageUpload {
  const xhr = new XMLHttpRequest();

  const done = new Promise<string>((resolve, reject) => {
    xhr.open("POST", `${API_BASE_URL}/api/admin/uploads`);
    xhr.responseType = "json";
    const token = localStorage.getItem("nova_admin_token");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      const body = xhr.response as UploadResponse | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.success && body.url) {
        resolve(body.url);
      } else if (xhr.status === 401 || xhr.status === 403) {
        reject(new Error("Your admin session has expired. Sign in again, then upload the photo."));
      } else {
        reject(new Error(body?.message || `The upload failed (error ${xhr.status}). Try again.`));
      }
    };
    xhr.onerror = () => reject(new Error("Couldn't reach the API. Check that the backend is running, then try again."));
    xhr.onabort = () => reject(new UploadCancelledError("Upload cancelled"));

    const form = new FormData();
    form.append("image", file);
    xhr.send(form);
  });

  return { done, abort: () => xhr.abort() };
}

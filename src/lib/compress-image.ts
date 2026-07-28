const MAX_EDGE = 1600;
const QUALITY = 0.82;

/**
 * Downscales a photo in the browser before upload. Phone cameras produce 4–12MB
 * files that would blow the 8MB limit and make uploads crawl on mobile data.
 *
 * Returns the original file untouched if anything goes wrong — HEIC can't be
 * decoded outside Safari, and a failed resize should never block logging.
 */
export async function compressImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function" || !file.type.startsWith("image/")) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

    // Already small enough and already a web-friendly format — leave it alone.
    if (scale === 1 && file.type === "image/jpeg" && file.size < 2_000_000) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

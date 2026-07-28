import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

function extensionFor(file: File): string {
  const fromMime = EXTENSIONS[file.type];
  if (fromMime) return fromMime;
  const fromName = path.extname(file.name).replace(".", "").toLowerCase();
  return fromName || "jpg";
}

export function usingBlobStore(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Uploads a photo and returns a URL to store on the Activity.
 *
 * With BLOB_READ_WRITE_TOKEN set it goes to Vercel Blob. Without it — local dev —
 * it lands in public/uploads/, which is fine for a laptop but will not survive a
 * redeploy on a serverless host, so production must set the token.
 */
export async function uploadPhoto(file: File, keyPrefix: string): Promise<string> {
  const name = `${keyPrefix}-${randomUUID()}.${extensionFor(file)}`;

  if (usingBlobStore()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`activities/${name}`, file, {
      access: "public",
      contentType: file.type || "application/octet-stream",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  if (process.env.NODE_ENV === "production") {
    // Serverless filesystems are read-only and wiped each deploy, so a silent
    // fallback here would look like it worked and lose every photo.
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Create a Blob store in the Vercel dashboard " +
        "(Storage tab) and redeploy — photos cannot be stored on the local filesystem in production.",
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

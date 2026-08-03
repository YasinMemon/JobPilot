import { v2 as cloudinary } from "cloudinary";

/**
 * Get a freshly-configured Cloudinary instance.
 * Lazy init ensures env vars are populated at call time in Next.js App Router.
 */
function getCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export default cloudinary;

/**
 * Upload a buffer to Cloudinary using base64 data URI.
 * More reliable than upload_stream for signed server-side uploads.
 *
 * @param buffer - File buffer
 * @param mimeType - MIME type of the file (e.g. "image/png", "application/pdf")
 * @param options - Cloudinary upload options
 * @returns { secure_url, public_id }
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  options: {
    folder?: string;
    resource_type?: "image" | "video" | "raw" | "auto";
    public_id?: string;
    overwrite?: boolean;
    use_filename?: boolean;
    unique_filename?: boolean;
  } = {},
): Promise<{ secure_url: string; public_id: string }> {
  const cld = getCloudinary();

  // Convert buffer → base64 data URI
  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const result = await cld.uploader.upload(dataUri, {
    folder: options.folder ?? "jobpilot",
    resource_type: options.resource_type ?? "auto",
    public_id: options.public_id,
    overwrite: options.overwrite ?? true,
    use_filename: options.use_filename,
    unique_filename: options.unique_filename,
  });

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  };
}

/**
 * Upload a file buffer to Cloudinary using an UNSIGNED upload preset.
 * This approach does NOT require API key upload permissions —
 * it uses a public upload preset created in the Cloudinary dashboard.
 *
 * Preset to create: Settings → Upload → Upload Presets → Add preset
 *   Name: jobpilot_uploads | Mode: Unsigned
 */
export async function uploadToCloudinaryUnsigned(
  buffer: Buffer,
  mimeType: string,
  options: {
    folder?: string;
    resource_type?: "image" | "video" | "raw" | "auto";
    public_id?: string;
  } = {},
): Promise<{ secure_url: string; public_id: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    process.env.CLOUDINARY_UPLOAD_PRESET ?? "jobpilot_uploads";
  const resourceType = options.resource_type ?? "auto";

  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const formData = new URLSearchParams();
  formData.append("file", dataUri);
  formData.append("upload_preset", uploadPreset);
  if (options.folder) formData.append("folder", options.folder);
  if (options.public_id) formData.append("public_id", options.public_id);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Cloudinary unsigned upload failed:", response.status, errorBody);
    throw new Error(
      `Cloudinary upload failed: ${response.status} ${errorBody}`,
    );
  }

  const result = (await response.json()) as {
    secure_url: string;
    public_id: string;
  };

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  };
}

/**
 * Build a Cloudinary URL with transformations applied at the CDN level.
 * This is a client-safe helper — no Node.js APIs, no secrets.
 *
 * @param publicIdOrFullUrl - Either the public_id OR a full Cloudinary upload URL
 * @param transformations - Cloudinary transformation string (default: 400×400 face-fill)
 */
export function buildCloudinaryUrl(
  publicIdOrFullUrl: string,
  transformations: string = "c_fill,g_face,h_400,w_400,q_auto,f_auto",
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  // If it's already a full Cloudinary URL, inject the transformation into it
  if (publicIdOrFullUrl.includes("res.cloudinary.com")) {
    return publicIdOrFullUrl.replace("/upload/", `/upload/${transformations}/`);
  }

  // Otherwise treat it as a bare public_id
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicIdOrFullUrl}`;
}

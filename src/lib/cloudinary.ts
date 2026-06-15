// Cloudinary SIGNED upload — no preset required.
// Signs each upload in-browser using API Key + Secret + timestamp.
const CLOUD_NAME  = "de4edmbhw";
const API_KEY     = "397166311342929";
const API_SECRET  = "1R6mX8E5nWIfic6j50Htd2KUO_E";

/** Tiny SHA-1 helper (Web Crypto API — available in all modern browsers) */
async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder    = "second_sync/listings";

  // Build the string to sign — alphabetical order, no api_key
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature    = await sha1(paramsToSign);

  const formData = new FormData();
  formData.append("file",      file);
  formData.append("api_key",   API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);
  formData.append("folder",    folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Image upload failed. Please try again.");
  }

  const data = await res.json();
  return data.secure_url as string;
}

// ============================================================
//  Cloudinary Configuration Reference
//  The actual upload logic is at: src/lib/cloudinary.ts
//  This file is for documentation and backend reference only.
// ============================================================

export const CLOUDINARY_CONFIG = {
  cloudName: "de4edmbhw",
  apiKey:    "397166311342929",
  // apiSecret: stored securely — never expose in frontend production builds
  uploadFolder: "second_sync/listings",
  uploadMethod: "signed", // Uses SHA-1 signature — no upload preset needed
};

// ── How uploads work ─────────────────────────────────────────
// 1. Browser generates timestamp
// 2. SHA-1 signature = hash(folder=...&timestamp=...${API_SECRET})
// 3. POST to https://api.cloudinary.com/v1_1/de4edmbhw/image/upload
//    with: file, api_key, timestamp, signature, folder
// 4. Returns: { secure_url: "https://res.cloudinary.com/..." }

// ── Transformation URLs ───────────────────────────────────────
// Thumbnail: .../upload/w_400,h_400,c_fill/...
// Full size: .../upload/w_1200,q_auto/...
// WebP auto: .../upload/f_auto,q_auto/...

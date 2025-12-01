import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 configuration
// These values should be set in your .env file
const s3Client = new S3Client({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "your-bucket-name";
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export type ClothingCategory = "HEAD" | "TOP" | "BOTTOM";
export type UploadType = "profile" | "clothing";

export async function uploadToR2(
  file: Buffer,
  fileName: string,
  contentType: string,
  userId: string,
  type: UploadType = "clothing",
  category?: ClothingCategory
): Promise<UploadResult> {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    // Build the key based on type
    let key: string;
    if (type === "profile") {
      key = `profile/${userId}/${timestamp}-${sanitizedFileName}`;
    } else {
      // For clothing, category is required
      if (!category) {
        return {
          success: false,
          error: "Category is required for clothing uploads",
        };
      }
      const categoryDir = category.toLowerCase();
      key = `clothing/${categoryDir}/${userId}/${timestamp}-${sanitizedFileName}`;
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Return the public URL
    const url = PUBLIC_URL
      ? `${PUBLIC_URL}/${key}`
      : `https://${BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return { success: true, url };
  } catch (error) {
    console.error("Error uploading to Cloudflare R2:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

// Keep the old function name for backward compatibility
export const uploadToSpaces = uploadToR2;

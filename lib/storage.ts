import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Digital Ocean Spaces configuration
// These values should be set in your .env file
const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT || "https://nyc3.digitaloceanspaces.com",
  region: process.env.DO_SPACES_REGION || "nyc3",
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY || "",
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY || "",
  },
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET || "your-bucket-name";
const CDN_URL = process.env.NEXT_PUBLIC_DO_SPACES_CDN_URL || "";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadToSpaces(
  file: Buffer,
  fileName: string,
  contentType: string,
  userId: string
): Promise<UploadResult> {
  try {
    // Create unique file path: userId/timestamp-filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `clothing/${userId}/${timestamp}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: "public-read",
    });

    await s3Client.send(command);

    // Return the CDN URL if available, otherwise construct the direct URL
    const url = CDN_URL
      ? `${CDN_URL}/${key}`
      : `${process.env.DO_SPACES_ENDPOINT}/${BUCKET_NAME}/${key}`;

    return { success: true, url };
  } catch (error) {
    console.error("Error uploading to Digital Ocean Spaces:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

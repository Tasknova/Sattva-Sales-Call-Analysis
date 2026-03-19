import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region = import.meta.env.VITE_S3_REGION;
const bucket = import.meta.env.VITE_S3_BUCKET_NAME;
const accessKeyId = import.meta.env.VITE_S3_ACCESS_KEY;
const secretAccessKey = import.meta.env.VITE_S3_SECRET_ACCESS_KEY;

let s3Client: S3Client | null = null;

function getClient() {
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('S3 credentials are not configured.');
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return s3Client;
}

function getObjectKeyFromUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    // Virtual-hosted style: bucket.s3.region.amazonaws.com/key
    if (bucket && host.startsWith(`${bucket}.s3.`)) {
      return decodeURIComponent(url.pathname.replace(/^\//, ''));
    }

    // Path-style: s3.region.amazonaws.com/bucket/key
    const pathParts = url.pathname.replace(/^\//, '').split('/');
    if (bucket && pathParts[0] === bucket && pathParts.length > 1) {
      return decodeURIComponent(pathParts.slice(1).join('/'));
    }

    // Last fallback: use full path as key.
    return decodeURIComponent(url.pathname.replace(/^\//, ''));
  } catch {
    return null;
  }
}

function addKeyWithVariants(keys: string[], key?: string | null) {
  if (!key) {
    return;
  }

  if (key.toLowerCase().endsWith('.mp3')) {
    // Prefer extensionless key first because many stored recording objects use UUID-only keys.
    keys.push(key.slice(0, -4));
    keys.push(key);
    return;
  }

  keys.push(key);
  keys.push(`${key}.mp3`);
}

function getKeyCandidates(rawUrl: string | null | undefined, preferredKey?: string | null): string[] {
  const keys: string[] = [];

  addKeyWithVariants(keys, preferredKey);

  if (rawUrl) {
    const parsed = getObjectKeyFromUrl(rawUrl);
    addKeyWithVariants(keys, parsed);
  }

  return [...new Set(keys.filter(Boolean))];
}

export async function getAccessibleRecordingUrl(
  awsS3Url: string | null | undefined,
  fallbackUrl?: string | null,
  expiresInSeconds = 3600,
  preferredKey?: string | null,
): Promise<string | null> {
  if (!awsS3Url && !preferredKey) {
    return fallbackUrl || null;
  }

  try {
    const client = getClient();
    const candidates = getKeyCandidates(awsS3Url, preferredKey);
    const key = candidates[0] || null;

    if (!key) {
      return fallbackUrl || null;
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (error) {
    console.error('Failed to presign S3 URL:', error);
    return fallbackUrl || null;
  }
}

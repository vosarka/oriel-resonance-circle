import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

let s3Client: S3Client | null = null;

function hasS3Config() {
  return Boolean(
    ENV.s3Bucket &&
      ENV.s3AccessKeyId &&
      ENV.s3SecretAccessKey,
  );
}

function getS3Client() {
  if (!hasS3Config()) return null;
  if (!s3Client) {
    s3Client = new S3Client({
      region: ENV.s3Region,
      endpoint: ENV.s3Endpoint || undefined,
      forcePathStyle: Boolean(ENV.s3Endpoint),
      credentials: {
        accessKeyId: ENV.s3AccessKeyId,
        secretAccessKey: ENV.s3SecretAccessKey,
      },
    });
  }
  return s3Client;
}

function publicUrlForKey(key: string) {
  if (!ENV.s3PublicBaseUrl) return "";
  return `${ENV.s3PublicBaseUrl.replace(/\/+$/, "")}/${key}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  if (!client) {
    console.warn("[Storage] No S3 provider configured — upload skipped");
    return { key: relKey, url: "" };
  }

  const body = typeof data === "string" ? Buffer.from(data) : data;
  await client.send(
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: relKey,
      Body: body,
      ContentType: contentType,
    }),
  );

  return { key: relKey, url: publicUrlForKey(relKey) };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  if (!client) {
    console.warn("[Storage] No S3 provider configured — download skipped");
    return { key: relKey, url: "" };
  }

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: relKey,
    }),
    { expiresIn: 60 * 60 },
  );

  return { key: relKey, url };
}

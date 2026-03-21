/**
 * Storage helpers — stubbed until direct S3 integration is configured.
 * Previously used Manus Forge storage proxy.
 */

export async function storagePut(
  relKey: string,
  _data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  console.warn("[Storage] No storage provider configured — upload skipped");
  return { key: relKey, url: "" };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  console.warn("[Storage] No storage provider configured — download skipped");
  return { key: relKey, url: "" };
}

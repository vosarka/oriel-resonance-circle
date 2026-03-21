/**
 * Image generation stub.
 * Previously used Manus Forge API. Stubbed until a direct provider is configured.
 */

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  _options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  console.warn("[ImageGeneration] No image provider configured — returning empty");
  return { url: undefined };
}

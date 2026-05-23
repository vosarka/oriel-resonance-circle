import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { ENV } from "./env";
import { storagePut } from "../storage";

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

type GeminiInlineData = {
  mimeType?: string;
  mime_type?: string;
  data?: string;
};

type GeminiFileData = {
  fileUri?: string;
  file_uri?: string;
  url?: string;
};

type GeminiPart = {
  text?: string;
  inlineData?: GeminiInlineData;
  inline_data?: GeminiInlineData;
  fileData?: GeminiFileData;
  file_data?: GeminiFileData;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
const DEPRECATED_GEMINI_IMAGE_MODEL_ALIASES = new Map([
  ["gemini-2.5-flash-image-preview", DEFAULT_GEMINI_IMAGE_MODEL],
]);
const GEMINI_GENERATE_CONTENT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_GENERATED_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_GENERATED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

function normalizeGeminiImageModel(model: string | undefined) {
  const trimmed = model?.trim() ?? "";
  const withoutApiPrefix = trimmed.startsWith("models/")
    ? trimmed.slice("models/".length)
    : trimmed;
  if (!withoutApiPrefix) return DEFAULT_GEMINI_IMAGE_MODEL;
  return (
    DEPRECATED_GEMINI_IMAGE_MODEL_ALIASES.get(withoutApiPrefix) ?? withoutApiPrefix
  );
}

function stripDataUrlPrefix(data: string) {
  const commaIndex = data.indexOf(",");
  if (data.startsWith("data:") && commaIndex >= 0) {
    return data.slice(commaIndex + 1);
  }
  return data;
}

function mimeTypeToExtension(mimeType: string) {
  switch (mimeType.toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "png";
  }
}

function hasExpectedImageSignature(buffer: Buffer, mimeType: string) {
  switch (mimeType.toLowerCase()) {
    case "image/png":
      return buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    case "image/jpeg":
    case "image/jpg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/gif":
      return buffer.subarray(0, 3).toString("ascii") === "GIF";
    case "image/webp":
      return (
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );
    default:
      return false;
  }
}

function decodeGeneratedInlineImage(data: string, mimeType: string) {
  const normalizedMimeType = mimeType.trim().toLowerCase();
  if (!SUPPORTED_GENERATED_IMAGE_TYPES.has(normalizedMimeType)) {
    throw new Error("Generated image MIME type is not supported.");
  }

  const base64 = stripDataUrlPrefix(data).replace(/\s+/g, "");
  if (!base64 || base64.length % 4 === 1 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new Error("Generated image data is not valid base64.");
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_GENERATED_IMAGE_BYTES) {
    throw new Error("Generated image is empty or too large.");
  }

  if (!hasExpectedImageSignature(buffer, normalizedMimeType)) {
    throw new Error("Generated image data does not match its MIME type.");
  }

  return { buffer, mimeType: normalizedMimeType };
}

function buildGeminiParts(options: GenerateImageOptions): GeminiPart[] {
  const parts: GeminiPart[] = [{ text: options.prompt }];

  for (const image of options.originalImages ?? []) {
    if (image.b64Json?.trim()) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType || "image/png",
          data: stripDataUrlPrefix(image.b64Json.trim()),
        },
      });
      continue;
    }

    if (image.url?.trim()) {
      parts.push({
        fileData: {
          fileUri: image.url.trim(),
        },
      });
    }
  }

  return parts;
}

function extractGeminiImagePart(response: GeminiResponse) {
  const parts =
    response.candidates?.flatMap(candidate => candidate.content?.parts ?? []) ??
    [];

  for (const part of parts) {
    const fileData = part.fileData ?? part.file_data;
    const url = fileData?.fileUri ?? fileData?.file_uri ?? fileData?.url;
    if (url?.trim()) {
      return { url: url.trim() };
    }

    const inlineData = part.inlineData ?? part.inline_data;
    if (inlineData?.data?.trim()) {
      return {
        data: inlineData.data.trim(),
        mimeType: inlineData.mimeType ?? inlineData.mime_type ?? "image/png",
      };
    }
  }

  return null;
}

async function persistInlineImage(data: string, mimeType: string) {
  const decoded = decodeGeneratedInlineImage(data, mimeType);
  const extension = mimeTypeToExtension(decoded.mimeType);
  const relKey = `oriel-chat-images/${randomUUID()}.${extension}`;
  const localPath = path.resolve(process.cwd(), "uploads/generated", relKey);

  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, decoded.buffer);

  try {
    await storagePut(relKey, decoded.buffer, decoded.mimeType);
  } catch (error) {
    console.warn("[ImageGeneration] Object storage upload failed:", error);
  }

  return `/generated/${relKey}`;
}

function redactGeminiKey(text: string) {
  if (!ENV.geminiApiKey) return text;
  return text.split(ENV.geminiApiKey).join("[redacted]");
}

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const prompt = options.prompt.trim();
  if (!prompt) {
    throw new Error("Image prompt is required.");
  }

  if (!ENV.geminiApiKey) {
    console.warn("[ImageGeneration] No Gemini image provider configured");
    return { url: undefined };
  }

  const model = normalizeGeminiImageModel(ENV.geminiImageModel);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    ENV.llmRequestTimeoutMs
  );
  let response: Response;
  try {
    response = await fetch(
      `${GEMINI_GENERATE_CONTENT_BASE_URL}/${model}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": ENV.geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: buildGeminiParts(options),
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = redactGeminiKey(await response.text());
    throw new Error(
      `Image generation provider failed: ${response.status} ${response.statusText} – ${errorText.slice(0, 500)}`
    );
  }

  const imagePart = extractGeminiImagePart(
    (await response.json()) as GeminiResponse
  );
  if (!imagePart) {
    return { url: undefined };
  }

  if ("url" in imagePart) {
    return { url: imagePart.url };
  }

  return {
    url: await persistInlineImage(imagePart.data, imagePart.mimeType),
  };
}

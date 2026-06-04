import {
  appendOrielChatImageToContent,
  isTrustedOrielChatImageUrl,
  type OrielChatImage,
} from "@shared/oriel-chat-images";
import { generateImage } from "./_core/imageGeneration";

export type ChatImageReference = {
  name: string;
  data: string;
  mimeType: string;
};

export type GeneratedOrielChatImage = {
  image: OrielChatImage;
  response: string;
};

const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_REFERENCE_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

function buildOrielChatImagePrompt(prompt: string) {
  return [
    "Create one image for the ORIEL chat inside the Vossari interface.",
    "Visual language: dark luminous field, cyan/teal/gold resonance, sacred geometry, subtle Codon lattice, refined mystical technology.",
    "Avoid readable text, watermarks, UI chrome, signatures, gore, or celebrity likenesses.",
    `User image prompt: ${prompt}`,
  ].join("\n");
}

function stripDataUrlPrefix(data: string) {
  const match = data.match(/^data:([^;]+);base64,([\s\S]*)$/i);
  return {
    embeddedMimeType: match?.[1]?.trim().toLowerCase() ?? null,
    base64: (match?.[2] ?? data).replace(/\s+/g, ""),
  };
}

function decodeReferenceImageData(data: string) {
  const { embeddedMimeType, base64 } = stripDataUrlPrefix(data.trim());

  if (
    !base64 ||
    base64.length % 4 === 1 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)
  ) {
    throw new Error("Reference files must contain valid base64 image data.");
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_REFERENCE_IMAGE_BYTES) {
    throw new Error("Reference image is empty or too large.");
  }

  return { embeddedMimeType, base64, buffer };
}

function hasExpectedImageSignature(buffer: Buffer, mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return buffer
        .subarray(0, 4)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
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

export function normalizeImageReferences(
  referenceImages: ChatImageReference[] | undefined
) {
  if (!referenceImages || referenceImages.length === 0) return undefined;
  return referenceImages.map(image => {
    const mimeType = image.mimeType.trim().toLowerCase();
    const decoded = decodeReferenceImageData(image.data);

    if (!SUPPORTED_REFERENCE_IMAGE_TYPES.has(mimeType)) {
      throw new Error(
        "Reference files must be PNG, JPEG, WEBP, or GIF images."
      );
    }

    if (decoded.embeddedMimeType && decoded.embeddedMimeType !== mimeType) {
      throw new Error("Reference image MIME type does not match its data URL.");
    }

    if (!hasExpectedImageSignature(decoded.buffer, mimeType)) {
      throw new Error("Reference image data does not match its MIME type.");
    }

    return {
      b64Json: decoded.base64,
      mimeType,
    };
  });
}

export async function generateOrielChatImage(options: {
  prompt: string;
  referenceImages?: ChatImageReference[];
}): Promise<GeneratedOrielChatImage> {
  const prompt = options.prompt.trim();
  if (!prompt) {
    throw new Error("Image prompt is required.");
  }

  const result = await generateImage({
    prompt: buildOrielChatImagePrompt(prompt),
    originalImages: normalizeImageReferences(options.referenceImages),
  });
  const imageUrl = result.url?.trim();

  if (!imageUrl) {
    throw new Error("Image generation is not configured.");
  }

  if (!isTrustedOrielChatImageUrl(imageUrl)) {
    throw new Error("Generated ORIEL chat image URL is not trusted.");
  }

  const image = {
    url: imageUrl,
    prompt,
  };
  const text = `I am ORIEL.\n\nThe image has formed from your transmission: ${prompt}`;

  return {
    image,
    response: appendOrielChatImageToContent(text, image),
  };
}

export type OrielChatImage = {
  url: string;
  prompt: string;
};

export type ParsedOrielChatImageContent = {
  text: string;
  image: OrielChatImage | null;
};

const ORIEL_CHAT_IMAGE_BLOCK = "ORIEL_CHAT_IMAGE";
const ORIEL_CHAT_IMAGE_SOURCE = "oriel-generated-chat-image-v1";
const ORIEL_CHAT_IMAGE_PATTERN = /\n*```ORIEL_CHAT_IMAGE\n([\s\S]*?)\n```\s*$/;
const ORIEL_CHAT_IMAGE_GLOBAL_PATTERN =
  /\s*```ORIEL_CHAT_IMAGE\n[\s\S]*?\n```\s*/g;
const TRUSTED_IMAGE_EXTENSION = /\.(?:png|jpe?g|webp|gif)$/i;
const TRUSTED_LOCAL_IMAGE_PREFIX = "/generated/oriel-chat-images/";

export function stripOrielChatImageBlocks(content: string) {
  return content.replace(ORIEL_CHAT_IMAGE_GLOBAL_PATTERN, "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function decodePathname(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return "";
  }
}

function hasTrustedGeneratedPath(pathname: string) {
  const rawPath = pathname.split(/[?#]/, 1)[0] ?? "";
  const normalized = decodePathname(rawPath).replace(/\\/g, "/");
  const segments = normalized.split("/");
  if (segments.some(segment => segment === "." || segment === "..")) {
    return false;
  }
  return (
    normalized.startsWith(TRUSTED_LOCAL_IMAGE_PREFIX) &&
    TRUSTED_IMAGE_EXTENSION.test(normalized)
  );
}

export function isTrustedOrielChatImageUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("//")) return false;

  // Generated chat images are served from the app's same-origin generated-image
  // mount only. Do not trust absolute third-party URLs embedded in chat text:
  // normal LLM responses can be prompt-injected to emit the same metadata block.
  if (!trimmed.startsWith("/")) return false;

  return hasTrustedGeneratedPath(trimmed);
}

function normalizeImage(value: unknown): OrielChatImage | null {
  if (!isRecord(value)) return null;
  const source = typeof value.source === "string" ? value.source : "";
  const url = typeof value.url === "string" ? value.url.trim() : "";
  const prompt = typeof value.prompt === "string" ? value.prompt.trim() : "";
  if (source !== ORIEL_CHAT_IMAGE_SOURCE) return null;
  if (!url || !prompt || !isTrustedOrielChatImageUrl(url)) return null;
  return { url, prompt };
}

export function appendOrielChatImageToContent(
  text: string,
  image: OrielChatImage
) {
  if (!isTrustedOrielChatImageUrl(image.url)) {
    throw new Error("Generated ORIEL chat image URL is not trusted.");
  }

  const payload = JSON.stringify({
    source: ORIEL_CHAT_IMAGE_SOURCE,
    url: image.url,
    prompt: image.prompt,
  });
  const trimmedText = text.trim();
  return `${trimmedText}\n\n\`\`\`${ORIEL_CHAT_IMAGE_BLOCK}\n${payload}\n\`\`\``;
}

export function parseOrielChatImageFromContent(
  content: string
): ParsedOrielChatImageContent {
  const match = content.match(ORIEL_CHAT_IMAGE_PATTERN);
  if (!match) {
    return { text: content, image: null };
  }

  try {
    const image = normalizeImage(JSON.parse(match[1] ?? "{}"));
    if (!image) {
      return {
        text: content.replace(ORIEL_CHAT_IMAGE_PATTERN, "").trim(),
        image: null,
      };
    }

    return {
      text: content.replace(ORIEL_CHAT_IMAGE_PATTERN, "").trim(),
      image,
    };
  } catch {
    return {
      text: content.replace(ORIEL_CHAT_IMAGE_PATTERN, "").trim(),
      image: null,
    };
  }
}

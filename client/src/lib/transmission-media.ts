const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function normalizeUrlInput(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

function toUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    try {
      return new URL(`https://${value}`);
    } catch {
      return null;
    }
  }
}

function normalizeYouTubeId(candidate?: string | null): string | null {
  const trimmed = candidate?.trim();
  if (!trimmed || !YOUTUBE_ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function getTransmissionImageUrl(value?: string | null): string | null {
  return normalizeUrlInput(value);
}

export function getYouTubeVideoId(value?: string | null): string | null {
  const normalized = normalizeUrlInput(value);
  if (!normalized) return null;

  const directId = normalizeYouTubeId(normalized);
  if (directId) return directId;

  const parsed = toUrl(normalized);
  if (parsed) {
    const hostname = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (hostname === "youtu.be") {
      return normalizeYouTubeId(parts[0]);
    }

    if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
      const queryId = normalizeYouTubeId(parsed.searchParams.get("v"));
      if (queryId) return queryId;

      if (["embed", "shorts", "live"].includes(parts[0] || "")) {
        return normalizeYouTubeId(parts[1]);
      }
    }
  }

  const fallbackMatch = normalized.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/,
  );

  return normalizeYouTubeId(fallbackMatch?.[1]);
}

export function getYouTubeEmbedUrl(value?: string | null): string | null {
  const videoId = getYouTubeVideoId(value);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function getYouTubeThumbnailUrl(value?: string | null): string | null {
  const videoId = getYouTubeVideoId(value);
  if (!videoId) return null;
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function getTransmissionPosterUrl(media: {
  imageUrl?: string | null;
  youtubeUrl?: string | null;
}): string | null {
  return getTransmissionImageUrl(media.imageUrl) ?? getYouTubeThumbnailUrl(media.youtubeUrl);
}

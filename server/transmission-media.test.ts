import { describe, expect, it } from "vitest";
import {
  getTransmissionPosterUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeVideoId,
} from "@/lib/transmission-media";

describe("transmission media helpers", () => {
  const videoId = "dQw4w9WgXcQ";

  it("extracts video ids from common YouTube URL variants", () => {
    expect(getYouTubeVideoId(`https://www.youtube.com/watch?v=${videoId}`)).toBe(videoId);
    expect(getYouTubeVideoId(`https://youtu.be/${videoId}?si=test`)).toBe(videoId);
    expect(getYouTubeVideoId(`https://youtube.com/shorts/${videoId}`)).toBe(videoId);
    expect(getYouTubeVideoId(videoId)).toBe(videoId);
  });

  it("builds safe embed and thumbnail URLs from YouTube sources", () => {
    expect(getYouTubeEmbedUrl(`https://www.youtube.com/watch?v=${videoId}`)).toBe(
      `https://www.youtube-nocookie.com/embed/${videoId}`,
    );
    expect(getYouTubeThumbnailUrl(`https://youtu.be/${videoId}`)).toBe(
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    );
  });

  it("prefers the still image when both image and youtube visuals exist", () => {
    expect(
      getTransmissionPosterUrl({
        imageUrl: "https://example.com/poster.jpg",
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      }),
    ).toBe("https://example.com/poster.jpg");
  });

  it("falls back to the YouTube thumbnail when no still image exists", () => {
    expect(
      getTransmissionPosterUrl({
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      }),
    ).toBe(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
  });

  it("returns null for invalid YouTube URLs", () => {
    expect(getYouTubeVideoId("https://example.com/video")).toBeNull();
    expect(getYouTubeEmbedUrl("")).toBeNull();
    expect(getYouTubeThumbnailUrl(undefined)).toBeNull();
  });
});

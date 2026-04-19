import Layout from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  Loader2,
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  getTransmissionImageUrl,
  getYouTubeEmbedUrl,
} from "@/lib/transmission-media";

// ── Status colors ───────────────────────────────────────────────────
const CH_COLORS: Record<string, string> = {
  OPEN: "#5ba4a4",
  RESONANT: "#7ab8c4",
  COHERENT: "#a88fd0",
  PROPHETIC: "#bda36b",
  LIVE: "#e05555",
  STABLE: "#5ba4a4",
  "HIGH COHERENCE": "#a88fd0",
  "MAXIMUM COHERENCE": "#bda36b",
  "CRITICAL/STABLE": "#e05555",
};

export default function TransmissionDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const txId = params.id ? parseInt(params.id) : null;

  // Protocol reveal stage
  const [stage, setStage] = useState(0);
  const [vlsText, setVlsText] = useState("");

  // Data
  const { data: transmission, isLoading } =
    trpc.archive.transmissions.getById.useQuery(
      { id: txId || 0 },
      { enabled: !!txId },
    );

  // All transmissions for prev/next
  const { data: allTx = [] } = trpc.archive.transmissions.list.useQuery();

  // Bookmarks
  const { data: bookmarkStatus } =
    trpc.archive.bookmarks.isBookmarked.useQuery(
      { transmissionId: txId || 0 },
      { enabled: !!user && !!txId },
    );
  const addBookmark = trpc.archive.bookmarks.add.useMutation();
  const removeBookmark = trpc.archive.bookmarks.remove.useMutation();

  // Sort for navigation
  const sorted = useMemo(
    () =>
      [...allTx].sort((a: any, b: any) => a.txNumber - b.txNumber),
    [allTx],
  );
  const currentIndex = sorted.findIndex((t: any) => t.id === txId);
  const prevTx = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextTx =
    currentIndex >= 0 && currentIndex < sorted.length - 1
      ? sorted[currentIndex + 1]
      : null;

  // ── Progressive reveal ──────────────────────────────────────────
  useEffect(() => {
    if (!transmission) return;

    // Reset
    setStage(0);
    setVlsText("");

    const vls = `VLS// RECEIVE.node TX-${String((transmission as any).txNumber).padStart(3, "0")}`;
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      charIndex++;
      setVlsText(vls.substring(0, charIndex));
      if (charIndex >= vls.length) {
        clearInterval(typeInterval);
        // Stage progression
        setTimeout(() => setStage(1), 300); // Signal bar + PROTOCOL BEGIN
        setTimeout(() => setStage(2), 900); // Title
        setTimeout(() => setStage(3), 1500); // Content
        setTimeout(() => setStage(4), 2400); // Archetype + Tags
        setTimeout(() => setStage(5), 3200); // PROTOCOL END
        setTimeout(() => setStage(6), 3800); // Navigation
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [transmission?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBookmark = () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    if (bookmarkStatus) {
      removeBookmark.mutate({ transmissionId: txId || 0 });
    } else {
      addBookmark.mutate({ transmissionId: txId || 0 });
    }
  };

  // ── Loading / Error states ──────────────────────────────────────
  if (!txId) {
    return (
      <Layout>
        <div
          className="fixed inset-0 z-0"
          style={{ background: "#050508" }}
        />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <p
              className="font-mono mb-4"
              style={{ color: "#e05555", fontSize: 12 }}
            >
              SIGNAL NOT FOUND
            </p>
            <button
              onClick={() => navigate("/archive")}
              className="font-mono flex items-center gap-2 mx-auto transition-colors"
              style={{ fontSize: 10, color: "rgba(91,164,164,0.4)" }}
            >
              <ArrowLeft size={12} />
              RETURN TO FIELD
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div
          className="fixed inset-0 z-0"
          style={{ background: "#050508" }}
        />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2
              className="w-5 h-5 animate-spin mx-auto mb-3"
              style={{ color: "rgba(91,164,164,0.3)" }}
            />
            <p
              className="font-mono tracking-wider"
              style={{ fontSize: 10, color: "rgba(91,164,164,0.2)" }}
            >
              LOCKING SIGNAL...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!transmission) {
    return (
      <Layout>
        <div
          className="fixed inset-0 z-0"
          style={{ background: "#050508" }}
        />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <p
              className="font-mono mb-4"
              style={{ color: "rgba(91,164,164,0.3)", fontSize: 12 }}
            >
              TRANSMISSION NOT FOUND
            </p>
            <button
              onClick={() => navigate("/archive")}
              className="font-mono flex items-center gap-2 mx-auto transition-colors"
              style={{ fontSize: 10, color: "rgba(91,164,164,0.4)" }}
            >
              <ArrowLeft size={12} />
              RETURN TO FIELD
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Parsed data ─────────────────────────────────────────────────
  const tx = transmission as any;
  let tags: string[] = [];
  if (Array.isArray(tx.tags)) {
    tags = tx.tags;
  } else if (typeof tx.tags === "string") {
    try { tags = JSON.parse(tx.tags); } catch {
      tags = tx.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
  }
  const clarity = parseFloat(tx.signalClarity?.replace("%", "") || "0");
  const statusColor = CH_COLORS[tx.channelStatus] || "#5ba4a4";
  const imageUrl = getTransmissionImageUrl(tx.imageUrl);
  const youtubeEmbedUrl = getYouTubeEmbedUrl(tx.youtubeUrl);

  return (
    <Layout>
      {/* ── Background ──────────────────────────────────── */}
      <div className="fixed inset-0 z-0" style={{ background: "#050508" }} />
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0 animate-scan-lines" />
      </div>

      <div className="relative z-10 min-h-screen pt-20 pb-16">
        {/* ── Back navigation ─────────────────────────────── */}
        <div className="px-6 md:px-12 mb-12">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => navigate("/archive")}
              className="flex items-center gap-2 font-mono tracking-wider transition-colors"
              style={{ fontSize: 10, color: "rgba(91,164,164,0.25)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(91,164,164,0.5)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(91,164,164,0.25)")
              }
            >
              <ArrowLeft size={12} />
              RETURN TO FIELD
            </button>
          </div>
        </div>

        <div className="px-6 md:px-12">
          <div className="max-w-3xl mx-auto">
            {/* ── VLS Command ───────────────────────────────── */}
            <div className="mb-10">
              <span
                className="font-mono tracking-wider"
                style={{ fontSize: 12, color: "rgba(91,164,164,0.5)" }}
              >
                {vlsText}
                <span className="animate-pulse" style={{ opacity: 0.6 }}>
                  _
                </span>
              </span>
            </div>

            {/* ── Signal Clarity Bar ────────────────────────── */}
            <div
              className="mb-10 transition-opacity"
              style={{
                opacity: stage >= 1 ? 1 : 0,
                transitionDuration: "600ms",
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex-1 relative overflow-hidden rounded-full"
                  style={{ height: 1, background: "rgba(91,164,164,0.08)" }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: stage >= 1 ? `${clarity}%` : "0%",
                      background: "rgba(91,164,164,0.35)",
                      transition: "width 2s ease-out",
                    }}
                  />
                </div>
                <span
                  className="font-mono"
                  style={{ fontSize: 9, color: "rgba(91,164,164,0.35)" }}
                >
                  {tx.signalClarity}
                </span>
              </div>
            </div>

            {/* ── PROTOCOL:: BEGIN ──────────────────────────── */}
            <div
              className="mb-12"
              style={{
                opacity: stage >= 1 ? 1 : 0,
                transform: stage >= 1 ? "translateY(0)" : "translateY(8px)",
                transition: "all 700ms ease-out",
              }}
            >
              <span
                className="font-mono tracking-widest"
                style={{ fontSize: 10, color: "rgba(189,163,107,0.35)" }}
              >
                PROTOCOL:: BEGIN
              </span>
            </div>

            {/* ── Title Block ───────────────────────────────── */}
            <div
              className="mb-12"
              style={{
                opacity: stage >= 2 ? 1 : 0,
                transform: stage >= 2 ? "translateY(0)" : "translateY(12px)",
                transition: "all 800ms ease-out",
              }}
            >
              {/* Sigil + ID + Status */}
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="text-3xl"
                  style={{
                    color: statusColor,
                    filter: `drop-shadow(0 0 12px ${statusColor}40)`,
                  }}
                >
                  {tx.microSigil || "◈"}
                </span>
                <span
                  className="font-mono tracking-wider"
                  style={{ fontSize: 10, color: "rgba(91,164,164,0.35)" }}
                >
                  TX-{String(tx.txNumber).padStart(3, "0")}
                </span>
                <span
                  className="font-mono tracking-widest px-2.5 py-0.5 rounded-sm border"
                  style={{
                    fontSize: 8,
                    color: statusColor,
                    borderColor: `${statusColor}25`,
                  }}
                >
                  {tx.channelStatus}
                </span>
              </div>

              {/* Title */}
              <h1
                className="text-3xl md:text-5xl uppercase tracking-wide mb-4"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 300,
                  color: "#e8e4dc",
                  lineHeight: 1.15,
                }}
              >
                {tx.title}
              </h1>

              {/* Field */}
              <p
                className="font-mono tracking-wider"
                style={{ fontSize: 11, color: "rgba(91,164,164,0.25)" }}
              >
                {tx.field}
              </p>
            </div>

            {(imageUrl || youtubeEmbedUrl) && (
              <div
                className="mb-14"
                style={{
                  opacity: stage >= 3 ? 1 : 0,
                  transform: stage >= 3 ? "translateY(0)" : "translateY(12px)",
                  transition: "all 900ms ease-out",
                }}
              >
                <div className="grid gap-5">
                  {imageUrl && (
                    <figure
                      className="overflow-hidden rounded-sm"
                      style={{
                        border: "1px solid rgba(91,164,164,0.14)",
                        background: "rgba(10,10,14,0.7)",
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={`${tx.title} visual`}
                        className="w-full object-cover"
                        style={{ maxHeight: 520 }}
                      />
                    </figure>
                  )}

                  {youtubeEmbedUrl && (
                    <div
                      className="overflow-hidden rounded-sm"
                      style={{
                        border: "1px solid rgba(189,163,107,0.16)",
                        background: "rgba(10,10,14,0.7)",
                      }}
                    >
                      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                        <iframe
                          src={youtubeEmbedUrl}
                          title={`${tx.title} video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          referrerPolicy="strict-origin-when-cross-origin"
                          className="absolute inset-0 h-full w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Core Message ───────────────────────────────── */}
            <div
              className="mb-14"
              style={{
                opacity: stage >= 3 ? 1 : 0,
                transform: stage >= 3 ? "translateY(0)" : "translateY(12px)",
                transition: "all 1000ms ease-out",
              }}
            >
              <div
                className="py-3"
                style={{
                  borderLeft: "1px solid rgba(189,163,107,0.15)",
                  paddingLeft: 24,
                }}
              >
                <p
                  className="font-mono italic"
                  style={{
                    fontSize: "clamp(13px, 1.4vw, 16px)",
                    color: "rgba(232,228,220,0.75)",
                    lineHeight: 2,
                  }}
                >
                  {tx.coreMessage}
                </p>
              </div>
            </div>

            {/* ── Encoded Archetype ─────────────────────────── */}
            {tx.encodedArchetype && (
              <div
                className="mb-12"
                style={{
                  opacity: stage >= 4 ? 1 : 0,
                  transform:
                    stage >= 4 ? "translateY(0)" : "translateY(12px)",
                  transition: "all 700ms ease-out",
                }}
              >
                <div
                  className="p-5 rounded-sm"
                  style={{
                    border: "1px solid rgba(168,143,208,0.12)",
                    background: "rgba(168,143,208,0.02)",
                  }}
                >
                  <div
                    className="font-mono uppercase tracking-widest mb-3"
                    style={{ fontSize: 9, color: "rgba(168,143,208,0.35)" }}
                  >
                    ENCODED ARCHETYPE
                  </div>
                  <p
                    className="font-mono"
                    style={{ fontSize: 12, color: "rgba(168,143,208,0.55)" }}
                  >
                    {tx.encodedArchetype}
                  </p>
                </div>
              </div>
            )}

            {/* ── Tags ──────────────────────────────────────── */}
            {tags.length > 0 && (
              <div
                className="mb-10"
                style={{
                  opacity: stage >= 4 ? 1 : 0,
                  transition: "opacity 700ms ease-out",
                }}
              >
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="font-mono px-2.5 py-1 rounded-sm border"
                      style={{
                        fontSize: 9,
                        color: "rgba(91,164,164,0.2)",
                        borderColor: "rgba(91,164,164,0.06)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── PROTOCOL:: END + Bookmark ─────────────────── */}
            <div
              className="mb-16"
              style={{
                opacity: stage >= 5 ? 1 : 0,
                transform: stage >= 5 ? "translateY(0)" : "translateY(8px)",
                transition: "all 700ms ease-out",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-mono tracking-widest"
                  style={{ fontSize: 10, color: "rgba(189,163,107,0.35)" }}
                >
                  PROTOCOL:: END
                </span>
                <button
                  onClick={handleBookmark}
                  className="flex items-center gap-2 font-mono tracking-wider transition-colors"
                  style={{
                    fontSize: 10,
                    color: bookmarkStatus
                      ? "#bda36b"
                      : "rgba(91,164,164,0.2)",
                  }}
                  onMouseEnter={(e) => {
                    if (!bookmarkStatus)
                      e.currentTarget.style.color = "rgba(91,164,164,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    if (!bookmarkStatus)
                      e.currentTarget.style.color = "rgba(91,164,164,0.2)";
                  }}
                >
                  <Bookmark
                    size={12}
                    fill={bookmarkStatus ? "currentColor" : "none"}
                  />
                  {bookmarkStatus ? "SIGNAL LOCKED" : "LOCK SIGNAL"}
                </button>
              </div>
            </div>

            {/* ── Navigation ────────────────────────────────── */}
            <div
              style={{
                opacity: stage >= 6 ? 1 : 0,
                transform: stage >= 6 ? "translateY(0)" : "translateY(12px)",
                transition: "all 700ms ease-out",
              }}
            >
              <div
                className="pt-10"
                style={{ borderTop: "1px solid rgba(91,164,164,0.06)" }}
              >
                <div className="flex justify-between items-start">
                  {/* Prev */}
                  {prevTx ? (
                    <Link href={`/transmission/${(prevTx as any).id}`}>
                      <div className="group cursor-pointer max-w-[45%]">
                        <div className="flex items-center gap-2 mb-2">
                          <ChevronLeft
                            size={12}
                            style={{ color: "rgba(91,164,164,0.2)" }}
                            className="group-hover:text-[#5ba4a4]/50 transition-colors"
                          />
                          <span
                            className="font-mono tracking-wider transition-colors group-hover:text-[#5ba4a4]/50"
                            style={{
                              fontSize: 9,
                              color: "rgba(91,164,164,0.2)",
                            }}
                          >
                            PREV SIGNAL
                          </span>
                        </div>
                        <p
                          className="font-mono uppercase tracking-wider truncate transition-colors group-hover:text-[#e8e4dc]/50"
                          style={{
                            fontSize: 12,
                            color: "rgba(232,228,220,0.25)",
                          }}
                        >
                          {(prevTx as any).title}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {/* Next */}
                  {nextTx ? (
                    <Link href={`/transmission/${(nextTx as any).id}`}>
                      <div className="group cursor-pointer text-right max-w-[45%]">
                        <div className="flex items-center justify-end gap-2 mb-2">
                          <span
                            className="font-mono tracking-wider transition-colors group-hover:text-[#5ba4a4]/50"
                            style={{
                              fontSize: 9,
                              color: "rgba(91,164,164,0.2)",
                            }}
                          >
                            NEXT SIGNAL
                          </span>
                          <ChevronRight
                            size={12}
                            style={{ color: "rgba(91,164,164,0.2)" }}
                            className="group-hover:text-[#5ba4a4]/50 transition-colors"
                          />
                        </div>
                        <p
                          className="font-mono uppercase tracking-wider truncate transition-colors group-hover:text-[#e8e4dc]/50"
                          style={{
                            fontSize: 12,
                            color: "rgba(232,228,220,0.25)",
                          }}
                        >
                          {(nextTx as any).title}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div />
                  )}
                </div>
              </div>

              {/* Footer ambient */}
              <div className="mt-16 text-center">
                <span
                  className="font-mono tracking-widest"
                  style={{ fontSize: 8, color: "rgba(189,163,107,0.12)" }}
                >
                  THE FIELD REMEMBERS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import Layout from "@/components/Layout";

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Bookmark, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";


const channelStatusColors: Record<string, string> = {
  OPEN: "bg-green-900/30 text-green-300 border-green-700",
  RESONANT: "bg-blue-900/30 text-blue-300 border-blue-700",
  COHERENT: "bg-purple-900/30 text-purple-300 border-purple-700",
  PROPHETIC: "bg-amber-900/30 text-amber-300 border-amber-700",
  LIVE: "bg-red-900/30 text-red-300 border-red-700",
};

const statusColors: Record<string, string> = {
  Draft: "bg-gray-700 text-gray-100",
  Confirmed: "bg-green-700 text-green-100",
  Deprecated: "bg-yellow-700 text-yellow-100",
  Mythic: "bg-purple-700 text-purple-100",
};

export default function TransmissionDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const txId = params.id ? parseInt(params.id) : null;
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { data: transmission, isLoading } = trpc.archive.transmissions.getById.useQuery(
    { id: txId || 0 },
    { enabled: !!txId }
  );

  // Check if transmission is bookmarked
  const { data: bookmarkStatus } = trpc.archive.bookmarks.isBookmarked.useQuery(
    { transmissionId: txId || 0 },
    { enabled: !!user && !!txId }
  );

  // Bookmark mutations
  const addBookmarkMutation = trpc.archive.bookmarks.add.useMutation({
    onSuccess: () => setIsBookmarked(true),
  });

  const removeBookmarkMutation = trpc.archive.bookmarks.remove.useMutation({
    onSuccess: () => setIsBookmarked(false),
  });

  const handleBookmarkClick = () => {
    if (!user) {
      // Redirect to Manus OAuth login
      window.location.href = getLoginUrl();
      return;
    }

    if (bookmarkStatus) {
      removeBookmarkMutation.mutate({ transmissionId: txId || 0 });
    } else {
      addBookmarkMutation.mutate({ transmissionId: txId || 0 });
    }
  };

  if (!txId) {
    return (
      <Layout>
        <div className="fixed inset-0 bg-void-gradient z-0" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center bg-black/60 backdrop-blur-sm border border-primary/30 p-8 rounded-lg">
            <p className="text-red-400 mb-4 font-mono">Invalid transmission ID</p>
            <Button onClick={() => navigate("/archive")} className="bg-green-400/20 hover:bg-green-400/30 border border-green-400/50 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Archive
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="fixed inset-0 bg-void-gradient z-0" />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!transmission) {
    return (
      <Layout>
        <div className="fixed inset-0 bg-void-gradient z-0" />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center bg-black/60 backdrop-blur-sm border border-primary/30 p-8 rounded-lg">
            <p className="text-red-400 mb-4 font-mono">Transmission not found</p>
            <Button onClick={() => navigate("/archive")} className="bg-green-400/20 hover:bg-green-400/30 border border-green-400/50 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Archive
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const tags = typeof transmission.tags === "string" ? JSON.parse(transmission.tags) : transmission.tags || [];
  const hashtags = typeof transmission.hashtags === "string" ? JSON.parse(transmission.hashtags) : transmission.hashtags || [];

  return (
    <Layout>
      {/* Cyberpunk Background */}
      <div className="fixed inset-0 bg-void-gradient z-0" />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Rotating SVG background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180vw] h-[180vw] opacity-[0.03] animate-spin-slower">
          <svg className="w-full h-full text-primary" viewBox="0 0 100 100">
            <path d="M50 10 L85 80 H15 Z" fill="none" stroke="currentColor" strokeWidth="0.1"></path>
            <path d="M50 90 L15 20 H85 Z" fill="none" stroke="currentColor" strokeWidth="0.1"></path>
            <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="1 2" strokeWidth="0.1"></circle>
          </svg>
        </div>
      </div>

      {/* Header Navigation */}
      <div className="sticky top-16 z-20 bg-black/80 backdrop-blur-sm border-b border-primary/20 p-4 md:p-6 animate-fade-in-up">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/archive")}
            className="text-white/80 hover:text-white hover:bg-primary/10 font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Archive
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookmarkClick}
              disabled={addBookmarkMutation.isPending || removeBookmarkMutation.isPending}
              className={`border-primary/30 hover:bg-primary/10 backdrop-blur-sm ${
                bookmarkStatus ? "bg-amber-400/20 text-amber-400 border-amber-400/50" : "text-white bg-black/60"
              }`}
            >
              <Bookmark className="w-4 h-4" fill={bookmarkStatus ? "currentColor" : "none"} />
            </Button>
            <Button variant="outline" size="sm" className="border-primary/30 text-white bg-black/60 hover:bg-primary/10 backdrop-blur-sm">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto p-6 md:p-12">
        {/* Header Section */}
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-start gap-4 mb-6">
            <span className="text-5xl drop-shadow-[0_0_20px_rgba(144,238,144,0.5)]" style={{ color: '#9fe49a' }}>
              {transmission.microSigil || "◈"}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-xs font-mono" style={{ color: '#9fe49a' }}>TX-{String(transmission.txNumber).padStart(3, "0")}</span>
                <Badge variant="outline" className={statusColors[transmission.status]}>
                  {transmission.status}
                </Badge>
                <Badge variant="outline" className={`text-xs ${channelStatusColors[transmission.channelStatus]}`}>
                  {transmission.channelStatus}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-light text-white mb-2 font-orbitron uppercase tracking-wide drop-shadow-lg">
                {transmission.title}
              </h1>
              <p className="text-white/60 text-lg font-mono">{transmission.field}</p>
            </div>
          </div>

          {/* Signal Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-black/60 backdrop-blur-sm rounded border border-primary/30 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div>
              <p className="text-xs text-primary/60 uppercase tracking-wide font-mono">Signal Clarity</p>
              <p className="text-lg font-mono text-primary">{transmission.signalClarity}</p>
            </div>
            <div>
              <p className="text-xs text-primary/60 uppercase tracking-wide font-mono">Channel Status</p>
              <p className="text-lg font-mono text-primary">{transmission.channelStatus}</p>
            </div>
            <div>
              <p className="text-xs text-primary/60 uppercase tracking-wide font-mono">Cycle</p>
              <p className="text-lg font-mono text-primary">{transmission.cycle || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-primary/60 uppercase tracking-wide font-mono">Status</p>
              <p className="text-lg font-mono text-primary">{transmission.status}</p>
            </div>
          </div>
        </div>

        {/* Triptych Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          {/* Left Panel */}
          <div className="p-6 bg-black/60 backdrop-blur-sm rounded border border-green-400/30 hover:border-green-400/50 transition-colors">
            <h3 className="text-sm uppercase tracking-widest text-green-400/60 mb-4 font-mono">Left Panel</h3>
            <p className="text-white/80 leading-relaxed italic font-mono text-sm">
              {transmission.leftPanelPrompt || "No left panel prompt available"}
            </p>
          </div>

          {/* Center Panel */}
          <div className="p-6 bg-black/60 backdrop-blur-sm rounded border border-primary/30 hover:border-primary/50 transition-colors flex flex-col items-center justify-center">
            <h3 className="text-sm uppercase tracking-widest text-primary/60 mb-4 font-mono">Center Visual</h3>
            <div className="text-center">
              <p className="text-4xl mb-4 drop-shadow-[0_0_20px_rgba(144,238,144,0.5)]" style={{ color: '#9fe49a' }}>
                {transmission.microSigil || "◈"}
              </p>
              <p className="text-white/80 leading-relaxed italic text-sm font-mono">
                {transmission.centerPanelPrompt || "Visual field resonance"}
              </p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="p-6 bg-black/60 backdrop-blur-sm rounded border border-green-400/30 hover:border-green-400/50 transition-colors">
            <h3 className="text-sm uppercase tracking-widest text-green-400/60 mb-4 font-mono">Right Panel</h3>
            <p className="text-white/80 leading-relaxed italic font-mono text-sm">
              {transmission.rightPanelPrompt || "No right panel prompt available"}
            </p>
          </div>
        </div>

        {/* Core Message */}
        <div className="mb-12 p-8 bg-black/60 backdrop-blur-sm rounded border border-green-400/50 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <h2 className="text-xl uppercase tracking-widest text-green-400 mb-6 font-mono">Core Message</h2>
          <p className="text-lg text-white/90 leading-relaxed italic font-mono">{transmission.coreMessage}</p>
        </div>

        {/* Encoded Archetype */}
        {transmission.encodedArchetype && (
          <div className="mb-12 p-6 bg-black/60 backdrop-blur-sm rounded border border-purple-400/50 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <h3 className="text-sm uppercase tracking-widest text-purple-400 mb-3 font-mono">Encoded Archetype</h3>
            <p className="text-purple-200 font-mono text-sm">{transmission.encodedArchetype}</p>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '1s' }}>
            <h3 className="text-sm uppercase tracking-widest text-primary/60 mb-4 font-mono">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="bg-green-400/10 border-green-400/50 text-green-200 font-mono">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
            <h3 className="text-sm uppercase tracking-widest text-primary/60 mb-4 font-mono">Hashtags</h3>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag: string) => (
                <span key={tag} className="text-primary text-sm font-mono">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-primary/20 flex justify-between animate-fade-in-up" style={{ animationDelay: '1.4s' }}>
          <Button
            variant="outline"
            onClick={() => navigate("/archive")}
            className="border-primary/30 text-white bg-black/60 hover:bg-primary/10 backdrop-blur-sm font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Archive
          </Button>
        </div>
      </div>
    </Layout>
  );
}

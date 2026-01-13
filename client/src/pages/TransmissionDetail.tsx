"use client";

import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Bookmark, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";


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
  const txId = params.id ? parseInt(params.id) : null;

  const { data: transmission, isLoading } = trpc.archive.transmissions.getById.useQuery(
    { id: txId || 0 },
    { enabled: !!txId }
  );

  if (!txId) {
    return (
      <div className="min-h-screen bg-black text-green-100 p-6 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Invalid transmission ID</p>
          <Button onClick={() => navigate("/archive")} className="bg-green-900 hover:bg-green-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Archive
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-green-100 p-6 md:p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
      </div>
    );
  }

  if (!transmission) {
    return (
      <div className="min-h-screen bg-black text-green-100 p-6 md:p-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Transmission not found</p>
          <Button onClick={() => navigate("/archive")} className="bg-green-900 hover:bg-green-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Archive
          </Button>
        </div>
      </div>
    );
  }

  const tags = typeof transmission.tags === "string" ? JSON.parse(transmission.tags) : transmission.tags || [];
  const hashtags = typeof transmission.hashtags === "string" ? JSON.parse(transmission.hashtags) : transmission.hashtags || [];

  return (
    <div className="min-h-screen bg-black text-green-100">
      {/* Header Navigation */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-green-900/30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/archive")}
            className="text-green-400 hover:text-green-300 hover:bg-green-950/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Archive
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-green-900/50 text-green-100 hover:bg-green-950/30">
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="border-green-900/50 text-green-100 hover:bg-green-950/30">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6 md:p-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-start gap-4 mb-6">
            <span className="text-5xl text-green-400">{transmission.microSigil}</span>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-green-500 font-mono">TX-{String(transmission.txNumber).padStart(3, "0")}</span>
                <Badge variant="outline" className={statusColors[transmission.status]}>
                  {transmission.status}
                </Badge>
                <Badge variant="outline" className={`text-xs ${channelStatusColors[transmission.channelStatus]}`}>
                  {transmission.channelStatus}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-green-100 mb-2">{transmission.title}</h1>
              <p className="text-green-300/80 text-lg">{transmission.field}</p>
            </div>
          </div>

          {/* Signal Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-green-950/20 rounded border border-green-900/30">
            <div>
              <p className="text-xs text-green-600 uppercase tracking-wide">Signal Clarity</p>
              <p className="text-lg font-mono text-green-400">{transmission.signalClarity}</p>
            </div>
            <div>
              <p className="text-xs text-green-600 uppercase tracking-wide">Channel Status</p>
              <p className="text-lg font-mono text-green-400">{transmission.channelStatus}</p>
            </div>
            <div>
              <p className="text-xs text-green-600 uppercase tracking-wide">Cycle</p>
              <p className="text-lg font-mono text-green-400">{transmission.cycle}</p>
            </div>
            <div>
              <p className="text-xs text-green-600 uppercase tracking-wide">Status</p>
              <p className="text-lg font-mono text-green-400">{transmission.status}</p>
            </div>
          </div>
        </div>

        {/* Triptych Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Left Panel */}
          <div className="p-6 bg-green-950/10 rounded border border-green-900/30">
            <h3 className="text-sm uppercase tracking-widest text-green-600 mb-4">Left Panel</h3>
            <p className="text-green-100 leading-relaxed italic">
              {transmission.leftPanelPrompt || "No left panel prompt available"}
            </p>
          </div>

          {/* Center Panel */}
          <div className="p-6 bg-green-950/10 rounded border border-green-900/30 flex flex-col items-center justify-center">
            <h3 className="text-sm uppercase tracking-widest text-green-600 mb-4">Center Visual</h3>
            <div className="text-center">
              <p className="text-4xl mb-4">{transmission.microSigil}</p>
              <p className="text-green-100 leading-relaxed italic text-sm">
                {transmission.centerPanelPrompt || "Visual field resonance"}
              </p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="p-6 bg-green-950/10 rounded border border-green-900/30">
            <h3 className="text-sm uppercase tracking-widest text-green-600 mb-4">Right Panel</h3>
            <p className="text-green-100 leading-relaxed italic">
              {transmission.rightPanelPrompt || "No right panel prompt available"}
            </p>
          </div>
        </div>

        {/* Core Message */}
        <div className="mb-12 p-8 bg-green-950/20 rounded border border-green-900/50">
          <h2 className="text-xl uppercase tracking-widest text-green-600 mb-6">Core Message</h2>
          <p className="text-lg text-green-100 leading-relaxed italic">{transmission.coreMessage}</p>
        </div>

        {/* Encoded Archetype */}
        {transmission.encodedArchetype && (
          <div className="mb-12 p-6 bg-purple-950/20 rounded border border-purple-900/50">
            <h3 className="text-sm uppercase tracking-widest text-purple-600 mb-3">Encoded Archetype</h3>
            <p className="text-purple-100 font-mono text-sm">{transmission.encodedArchetype}</p>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-12">
            <h3 className="text-sm uppercase tracking-widest text-green-600 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="bg-green-950/30 border-green-700 text-green-200">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="mb-12">
            <h3 className="text-sm uppercase tracking-widest text-green-600 mb-4">Hashtags</h3>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag: string) => (
                <span key={tag} className="text-green-400 text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-green-900/30 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/archive")}
            className="border-green-900/50 text-green-100 hover:bg-green-950/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Archive
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="border-green-900/50 text-green-100 hover:bg-green-950/30">
              <Bookmark className="w-4 h-4 mr-2" />
              Bookmark
            </Button>
            <Button variant="outline" className="border-green-900/50 text-green-100 hover:bg-green-950/30">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

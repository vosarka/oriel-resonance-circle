import { Link } from "wouter";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export interface TransmissionCardProps {
  id: number;
  txNumber: number;
  title: string;
  field: string;
  signalClarity: string;
  channelStatus: "OPEN" | "RESONANT" | "COHERENT" | "PROPHETIC" | "LIVE";
  coreMessage: string;
  microSigil?: string;
  tags: string[];
  cycle?: string;
  status: "Draft" | "Confirmed" | "Deprecated" | "Mythic";
  bookmarkCount?: number;
}

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

export function TransmissionCard({
  id,
  txNumber,
  title,
  field,
  signalClarity,
  channelStatus,
  coreMessage,
  microSigil,
  tags,
  cycle,
  status,
  bookmarkCount,
}: TransmissionCardProps) {
  const { user } = useAuth();
  const [localBookmarkCount, setLocalBookmarkCount] = useState(bookmarkCount || 0);

  // Check if transmission is bookmarked
  const { data: isBookmarked } = trpc.archive.bookmarks.isBookmarked.useQuery(
    { transmissionId: id },
    { enabled: !!user }
  );

  // Bookmark mutations
  const addBookmarkMutation = trpc.archive.bookmarks.add.useMutation({
    onSuccess: () => {
      setLocalBookmarkCount((prev) => prev + 1);
    },
  });

  const removeBookmarkMutation = trpc.archive.bookmarks.remove.useMutation({
    onSuccess: () => {
      setLocalBookmarkCount((prev) => Math.max(0, prev - 1));
    },
  });

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Redirect to Manus OAuth login
      window.location.href = getLoginUrl();
      return;
    }

    if (isBookmarked) {
      removeBookmarkMutation.mutate({ transmissionId: id });
    } else {
      addBookmarkMutation.mutate({ transmissionId: id });
    }
  };

  return (
    <Link href={`/transmission/${id}`}>
      <Card className="h-full hover:border-green-400/50 hover:shadow-[0_0_30px_rgba(144,238,144,0.2)] transition-all duration-300 cursor-pointer bg-black/60 backdrop-blur-sm border-green-400/30 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl drop-shadow-[0_0_10px_rgba(144,238,144,0.5)] group-hover:drop-shadow-[0_0_20px_rgba(144,238,144,0.8)] transition-all" style={{ color: '#9fe49a' }}>
                  {microSigil || "◈"}
                </span>
                <span className="text-xs font-mono" style={{ color: '#9fe49a' }}>TX-{String(txNumber).padStart(3, "0")}</span>
                <Badge variant="outline" className={`text-xs ${channelStatusColors[channelStatus]}`}>
                  {channelStatus}
                </Badge>
              </div>
              <CardTitle className="text-lg text-white line-clamp-2 group-hover:text-white/90 transition-colors font-orbitron uppercase tracking-wide">
                {title}
              </CardTitle>
              <CardDescription className="text-white/50 text-xs mt-1 font-mono">{field}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={statusColors[status]}>
                {status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmarkClick}
                disabled={addBookmarkMutation.isPending || removeBookmarkMutation.isPending}
                className={`h-8 w-8 p-0 hover:bg-amber-400/10 ${
                  isBookmarked ? "text-amber-400" : "text-white/40 hover:text-white/60"
                }`}
              >
                <Bookmark className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Signal Metadata */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400/60 font-mono">Signal:</span>
              <span className="text-cyan-400 font-mono">{signalClarity}</span>
            </div>
            {cycle && (
              <span className="text-cyan-400/60 font-mono">{cycle}</span>
            )}
          </div>

          {/* Core Message Preview */}
          <p className="text-sm text-white/70 line-clamp-3 leading-relaxed italic font-mono">
            {coreMessage}
          </p>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-green-400/10 border-green-400/50 text-green-200 font-mono">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-white/40 font-mono">+{tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-green-400/20 text-xs text-white/40 flex justify-between items-center font-mono">
            <span className="flex items-center gap-1">
              <Bookmark className="w-3 h-3" />
              {localBookmarkCount}
            </span>
            <span className="text-green-400 group-hover:translate-x-1 transition-transform duration-300">→ Access</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

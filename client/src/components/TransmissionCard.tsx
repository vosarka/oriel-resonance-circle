"use client";

import { useState } from "react";
import { Link } from "wouter";
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
  microSigil: string;
  tags: string[];
  cycle: string;
  status: "Draft" | "Confirmed" | "Deprecated" | "Mythic";
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
}: TransmissionCardProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Check if transmission is bookmarked
  const { data: bookmarkStatus } = trpc.archive.bookmarks.isBookmarked.useQuery(
    { transmissionId: id },
    { enabled: !!user }
  );

  // Get bookmark count
  const { data: bookmarkCount = 0 } = trpc.archive.bookmarks.getCount.useQuery({
    transmissionId: id,
  });

  // Bookmark mutations
  const addBookmarkMutation = trpc.archive.bookmarks.add.useMutation({
    onSuccess: () => setIsBookmarked(true),
  });

  const removeBookmarkMutation = trpc.archive.bookmarks.remove.useMutation({
    onSuccess: () => setIsBookmarked(false),
  });

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Redirect to Manus OAuth login
      window.location.href = getLoginUrl();
      return;
    }

    if (bookmarkStatus) {
      removeBookmarkMutation.mutate({ transmissionId: id });
    } else {
      addBookmarkMutation.mutate({ transmissionId: id });
    }
  };

  return (
    <Link href={`/transmission/${id}`}>
      <Card className="h-full hover:border-green-500/50 transition-colors cursor-pointer bg-black/40 border-green-900/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl text-green-400">{microSigil}</span>
                <span className="text-xs text-green-500 font-mono">TX-{String(txNumber).padStart(3, "0")}</span>
              </div>
              <CardTitle className="text-lg text-green-100 line-clamp-2">{title}</CardTitle>
              <CardDescription className="text-green-700/70 text-xs mt-1">{field}</CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge variant="outline" className={statusColors[status]}>
                {status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmarkClick}
                className={`h-8 w-8 p-0 ${bookmarkStatus ? "text-amber-400" : "text-green-600 hover:text-amber-400"}`}
                disabled={addBookmarkMutation.isPending || removeBookmarkMutation.isPending}
              >
                <Bookmark className="h-4 w-4" fill={bookmarkStatus ? "currentColor" : "none"} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Signal Metadata */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-green-600">Signal:</span>
              <span className="text-green-400 font-mono">{signalClarity}</span>
            </div>
            <Badge variant="outline" className={`text-xs ${channelStatusColors[channelStatus]}`}>
              {channelStatus}
            </Badge>
          </div>

          {/* Core Message Preview */}
          <p className="text-sm text-green-200/80 line-clamp-3 leading-relaxed italic">
            "{coreMessage}"
          </p>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-green-950 text-green-300 border-green-800">
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-green-950 text-green-400 border-green-800">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Cycle & Footer */}
          <div className="pt-2 border-t border-green-900/30 text-xs text-green-600 flex justify-between">
            <span>{cycle}</span>
            <span className="text-green-500">{bookmarkCount} bookmarks</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface OracleCardProps {
  id: string;
  oracleId: string;
  oracleNumber: number;
  part: "Past" | "Present" | "Future";
  title: string;
  field: string;
  signalClarity: string;
  channelStatus: "OPEN" | "RESONANT" | "PROPHETIC" | "LIVE";
  content: string;
  visualStyle?: string;
  status: "Draft" | "Confirmed" | "Deprecated" | "Prophetic";
}

const partColors: Record<string, string> = {
  Past: "bg-amber-900/30 text-amber-300 border-amber-700",
  Present: "bg-blue-900/30 text-blue-300 border-blue-700",
  Future: "bg-purple-900/30 text-purple-300 border-purple-700",
};

const partSymbols: Record<string, string> = {
  Past: "◆",
  Present: "●",
  Future: "▲",
};

const channelStatusColors: Record<string, string> = {
  OPEN: "bg-green-900/30 text-green-300 border-green-700",
  RESONANT: "bg-blue-900/30 text-blue-300 border-blue-700",
  PROPHETIC: "bg-purple-900/30 text-purple-300 border-purple-700",
  LIVE: "bg-red-900/30 text-red-300 border-red-700",
};

const statusColors: Record<string, string> = {
  Draft: "bg-gray-700 text-gray-100",
  Confirmed: "bg-green-700 text-green-100",
  Deprecated: "bg-yellow-700 text-yellow-100",
  Prophetic: "bg-purple-700 text-purple-100",
};

export function OracleCard({
  id,
  oracleId,
  oracleNumber,
  part,
  title,
  field,
  signalClarity,
  channelStatus,
  content,
  visualStyle,
  status,
}: OracleCardProps) {
  return (
    <Link href={`/oracle/${oracleId}/${part.toLowerCase()}`}>
      <Card className="h-full hover:border-purple-500/50 transition-colors cursor-pointer bg-black/40 border-purple-900/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{partSymbols[part]}</span>
                <span className="text-xs text-purple-500 font-mono">OX-{String(oracleNumber).padStart(3, "0")}.{part[0]}</span>
                <Badge variant="outline" className={`text-xs ${partColors[part]}`}>
                  {part}
                </Badge>
              </div>
              <CardTitle className="text-lg text-purple-100 line-clamp-2">{title}</CardTitle>
              <CardDescription className="text-purple-700/70 text-xs mt-1">{field}</CardDescription>
            </div>
            <Badge variant="outline" className={statusColors[status]}>
              {status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Signal Metadata */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-purple-600">Signal:</span>
              <span className="text-purple-400 font-mono">{signalClarity}</span>
            </div>
            <Badge variant="outline" className={`text-xs ${channelStatusColors[channelStatus]}`}>
              {channelStatus}
            </Badge>
          </div>

          {/* Oracle Content Preview */}
          <p className="text-sm text-purple-200/80 line-clamp-3 leading-relaxed italic">
            "{content}"
          </p>

          {/* Visual Style */}
          {visualStyle && (
            <div className="text-xs text-purple-600 bg-purple-950/30 px-2 py-1 rounded border border-purple-900/30">
              Style: {visualStyle}
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-purple-900/30 text-xs text-purple-600 flex justify-between">
            <span className="text-purple-500">Temporal Transmission</span>
            <span className="text-purple-500">→ Receive</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

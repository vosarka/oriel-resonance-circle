import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface OracleCardProps {
  id: number;
  oxNumber: number;
  title: string;
  field: string;
  temporalDirection: "Past" | "Present" | "Future";
  content: string;
  hashtags: string[];
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

const statusColors: Record<string, string> = {
  Draft: "bg-gray-700 text-gray-100",
  Confirmed: "bg-green-700 text-green-100",
  Deprecated: "bg-yellow-700 text-yellow-100",
  Prophetic: "bg-purple-700 text-purple-100",
};

export function OracleCard({
  id,
  oxNumber,
  title,
  field,
  temporalDirection,
  content,
  hashtags,
  status,
}: OracleCardProps) {
  return (
    <Link href={`/oracle/${id}`}>
      <Card className="h-full hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all duration-300 cursor-pointer bg-black/60 backdrop-blur-sm border-purple-400/30 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl text-purple-400 group-hover:text-purple-300 transition-colors">{partSymbols[temporalDirection]}</span>
                <span className="text-xs text-purple-400 font-mono">ΩX-{String(oxNumber).padStart(3, "0")}.{temporalDirection[0]}</span>
                <Badge variant="outline" className={`text-xs ${partColors[temporalDirection]}`}>
                  {temporalDirection}
                </Badge>
              </div>
              <CardTitle className="text-lg text-purple-100 line-clamp-2 group-hover:text-white transition-colors">{title}</CardTitle>
              <CardDescription className="text-purple-400/70 text-xs mt-1">{field}</CardDescription>
            </div>
            <Badge variant="outline" className={statusColors[status]}>
              {status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Oracle Content Preview */}
          <p className="text-sm text-purple-200/80 line-clamp-3 leading-relaxed italic">
            "{content}"
          </p>

          {/* Hashtags */}
          {hashtags && hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hashtags.slice(0, 3).map((tag, index) => (
                <span key={index} className="text-xs text-purple-400/60 font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 border-t border-purple-400/20 text-xs text-purple-400 flex justify-between">
            <span className="text-purple-400/60">Temporal Transmission</span>
            <span className="text-purple-400 group-hover:translate-x-1 transition-transform duration-300">→ Receive</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

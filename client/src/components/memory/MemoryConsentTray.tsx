import { Check, Clock, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MemoryConsentCandidate = {
  id: number;
  category: string;
  content: string;
  sensitivity: "low" | "medium" | "high" | string;
  source: "conversation" | "explicit" | "inferred" | string;
  reason?: string | null;
};

export type AcceptedMemorySummary = {
  id: number;
  category: string;
  content: string;
  source?: string | null;
};

export type MemoryConsentTrayProps = {
  pendingCandidates: MemoryConsentCandidate[];
  acceptedMemories: AcceptedMemorySummary[];
  onAccept: (id: number) => void | Promise<void>;
  onReject: (id: number) => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
};

function sensitivityClass(sensitivity: string) {
  if (sensitivity === "high") {
    return "border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-200";
  }

  if (sensitivity === "medium") {
    return "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-200";
  }

  return "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
}

export function MemoryConsentTray({
  pendingCandidates,
  acceptedMemories,
  onAccept,
  onReject,
  isLoading = false,
  className,
}: MemoryConsentTrayProps) {
  return (
    <section
      className={cn(
        "w-full rounded-lg border border-border bg-background p-4 shadow-sm",
        className,
      )}
      aria-busy={isLoading}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Memory consent
          </h2>
          <p className="text-xs text-muted-foreground">
            Review what ORIEL wants to remember.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Clock className="size-3" />
          {pendingCandidates.length} pending
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Loading memory candidates...
          </div>
        ) : pendingCandidates.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            No pending memory requests.
          </div>
        ) : (
          pendingCandidates.map((candidate) => (
            <article
              key={candidate.id}
              className="rounded-md border border-border bg-card p-3"
            >
              <p className="text-sm leading-6 text-card-foreground">
                {candidate.content}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{candidate.category}</Badge>
                <Badge
                  variant="outline"
                  className={sensitivityClass(candidate.sensitivity)}
                >
                  {candidate.sensitivity}
                </Badge>
                <Badge variant="outline">{candidate.source}</Badge>
              </div>
              {candidate.reason ? (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {candidate.reason}
                </p>
              ) : null}
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(candidate.id)}
                  disabled={isLoading}
                >
                  <X className="size-4" />
                  Reject
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onAccept(candidate.id)}
                  disabled={isLoading}
                >
                  <Check className="size-4" />
                  Accept
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          Remembered now
        </h3>
        {acceptedMemories.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No active memories yet.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {acceptedMemories.map((memory) => (
              <li
                key={memory.id}
                className="flex items-start justify-between gap-3 rounded-md bg-muted/40 px-3 py-2"
              >
                <span className="min-w-0 text-sm leading-5 text-foreground">
                  {memory.content}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {memory.category}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default MemoryConsentTray;

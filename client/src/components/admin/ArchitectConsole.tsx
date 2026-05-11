import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  GitPullRequestArrow,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../../../server/routers";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type AutonomyHealth = RouterOutputs["oriel"]["autonomy"]["getAutonomyHealth"];
type Proposal = RouterOutputs["oriel"]["autonomy"]["listProposals"][number];
type ReflectionEvent =
  RouterOutputs["oriel"]["autonomy"]["listReflectionEvents"][number];

type ProposalStatus = Proposal["status"];
type ProposalPayload = Proposal["proposalPayload"];

type RejectRoute = {
  reject?: {
    useMutation: (options: { onSuccess?: () => void }) => {
      mutate: (input: { proposalId: number; notes?: string }) => void;
      isPending: boolean;
    };
  };
};

const MEANINGFUL_TEXT_MIN = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function meaningfulText(value: unknown): string {
  return typeof value === "string" && value.trim().length >= MEANINGFUL_TEXT_MIN
    ? value.trim()
    : "";
}

function canActivateProposal(payload: ProposalPayload, status: ProposalStatus) {
  const rollbackPath = meaningfulText(payload.rollbackPath);
  const falsifier = meaningfulText(payload.falsifier);

  return {
    allowed:
      (status === "evaluated" || status === "approved") &&
      Boolean(rollbackPath) &&
      Boolean(falsifier),
    missing: [
      rollbackPath ? null : "rollbackPath",
      falsifier ? null : "falsifier",
    ].filter((item): item is string => Boolean(item)),
  };
}

function statusTone(status: ProposalStatus) {
  switch (status) {
    case "approved":
    case "applied":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    case "evaluated":
      return "border-sky-500/40 bg-sky-500/10 text-sky-200";
    case "blocked":
    case "rejected":
      return "border-red-500/40 bg-red-500/10 text-red-200";
    case "rolled_back":
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    default:
      return "border-zinc-500/40 bg-zinc-500/10 text-zinc-200";
  }
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "not recorded";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "not recorded";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function summarizePayload(payload: unknown) {
  if (!isRecord(payload)) return "No payload details.";

  const violations = payload.violations;
  if (Array.isArray(violations)) {
    const readable = violations.filter(
      (item): item is string => typeof item === "string" && item.trim() !== ""
    );
    if (readable.length > 0) return readable.join("; ");
  }

  const title = typeof payload.title === "string" ? payload.title : "";
  const verdict = typeof payload.verdict === "string" ? payload.verdict : "";
  const score =
    typeof payload.score === "number" ? `score ${payload.score}` : "";
  const generatedFrom =
    typeof payload.generatedFrom === "string" ? payload.generatedFrom : "";

  return (
    [title, verdict, score, generatedFrom].filter(Boolean).join(" | ") ||
    JSON.stringify(payload)
  );
}

function configKeys(value: unknown) {
  if (!isRecord(value)) return [];
  return Object.keys(value).filter(key => value[key] !== undefined);
}

function SafetyMetadata({ proposal }: { proposal: Proposal }) {
  const payload = proposal.proposalPayload;
  const safetyChecks = Array.isArray(payload.safetyChecks)
    ? payload.safetyChecks.filter(
        (item): item is string => typeof item === "string" && item.trim() !== ""
      )
    : [];
  const activation = canActivateProposal(payload, proposal.status);

  return (
    <div className="grid gap-3 text-xs text-zinc-300 md:grid-cols-2">
      <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
        <p className="mb-2 flex items-center gap-2 font-medium uppercase tracking-[0.16em] text-zinc-500">
          <ShieldCheck className="size-3.5" />
          Safety
        </p>
        {safetyChecks.length > 0 ? (
          <ul className="space-y-1">
            {safetyChecks.slice(0, 4).map(check => (
              <li key={check}>- {check}</li>
            ))}
          </ul>
        ) : (
          <p>No safety checks recorded.</p>
        )}
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
        <p className="mb-2 flex items-center gap-2 font-medium uppercase tracking-[0.16em] text-zinc-500">
          <ShieldAlert className="size-3.5" />
          Activation Gate
        </p>
        <p>
          {activation.allowed
            ? "Rollback path and falsifier are present."
            : `Missing: ${activation.missing.join(", ") || "eligible status"}`}
        </p>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3 md:col-span-2">
        <p className="mb-1 text-zinc-500">Rollback path</p>
        <p>
          {meaningfulText(payload.rollbackPath) || "Not meaningful enough."}
        </p>
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3 md:col-span-2">
        <p className="mb-1 text-zinc-500">Falsifier</p>
        <p>{meaningfulText(payload.falsifier) || "Not meaningful enough."}</p>
      </div>
    </div>
  );
}

function HealthPanel({ health }: { health?: AutonomyHealth }) {
  const active = health?.activeProfile;
  const activeKeys = configKeys(active?.configPayload);

  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-950/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Runtime Profile
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-50">
            {active?.name ?? "No active profile"}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {active?.profileKey ?? "Runtime overlay is not currently selected."}
          </p>
        </div>
        <Badge
          className={cn(
            "border px-3 py-1",
            health?.runtimeEnabled
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-amber-500/40 bg-amber-500/10 text-amber-200"
          )}
          variant="outline"
        >
          {health?.runtimeEnabled ? "Runtime enabled" : "Runtime disabled"}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 text-sm md:grid-cols-4">
        <Metric label="Proposals" value={health?.proposalCount ?? 0} />
        <Metric label="Profiles" value={health?.runtimeProfileCount ?? 0} />
        <Metric label="Reflections" value={health?.reflectionEventCount ?? 0} />
        <Metric
          label="Observations"
          value={health?.runtimeObservationCount ?? 0}
        />
      </div>

      {active ? (
        <div className="mt-4 rounded-md border border-zinc-800 bg-black/30 p-3 text-xs text-zinc-300">
          <p className="mb-2 uppercase tracking-[0.16em] text-zinc-500">
            Active config
          </p>
          <p>{activeKeys.length ? activeKeys.join(", ") : "Empty config"}</p>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-black/30 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

function ProposalRow({
  proposal,
  onEvaluate,
  onApprove,
  onActivate,
  onReject,
  busy,
}: {
  proposal: Proposal;
  onEvaluate: (proposalId: number) => void;
  onApprove: (proposalId: number) => void;
  onActivate: (proposal: Proposal) => void;
  onReject?: (proposalId: number) => void;
  busy: boolean;
}) {
  const activation = canActivateProposal(
    proposal.proposalPayload,
    proposal.status
  );
  const config = proposal.proposalPayload.proposedConfig;

  return (
    <article className="rounded-md border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-semibold text-zinc-50">
              {proposal.title}
            </h3>
            <Badge className={cn("border", statusTone(proposal.status))}>
              {proposal.status}
            </Badge>
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">
            {proposal.scope} | created {formatDate(proposal.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            Score
          </p>
          <p className="text-2xl font-semibold text-zinc-50">
            {proposal.evaluationScore ?? "--"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
        <div>
          <p className="text-zinc-500">Objective</p>
          <p>{proposal.objective}</p>
        </div>
        <div>
          <p className="text-zinc-500">Hypothesis</p>
          <p>{proposal.hypothesis}</p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-zinc-800 bg-black/30 p-3 text-xs text-zinc-300">
        <p className="mb-2 uppercase tracking-[0.16em] text-zinc-500">
          Proposed config
        </p>
        <p>
          {configKeys(config).length
            ? configKeys(config).join(", ")
            : "No runtime config keys."}
        </p>
      </div>

      {proposal.evaluationSummary ? (
        <div className="mt-3 rounded-md border border-zinc-800 bg-black/30 p-3 text-xs text-zinc-300">
          {proposal.evaluationSummary}
        </div>
      ) : null}

      <div className="mt-4">
        <SafetyMetadata proposal={proposal} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          className="bg-zinc-100 text-zinc-950 hover:bg-white"
          disabled={busy}
          onClick={() => onEvaluate(proposal.id)}
          size="sm"
          type="button"
        >
          <CheckCircle2 className="size-4" />
          Evaluate
        </Button>
        <Button
          disabled={busy || proposal.status !== "evaluated"}
          onClick={() => onApprove(proposal.id)}
          size="sm"
          type="button"
          variant="outline"
        >
          <ShieldCheck className="size-4" />
          Approve
        </Button>
        <Button
          disabled={busy || !activation.allowed}
          onClick={() => onActivate(proposal)}
          size="sm"
          type="button"
          variant="outline"
        >
          <Play className="size-4" />
          Activate
        </Button>
        {onReject ? (
          <Button
            disabled={busy || proposal.status === "rejected"}
            onClick={() => onReject(proposal.id)}
            size="sm"
            type="button"
            variant="destructive"
          >
            <XCircle className="size-4" />
            Reject
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function ReflectionList({ events }: { events: ReflectionEvent[] }) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-950/70 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Reflection Events
          </p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-50">
            Recent runtime traces
          </h2>
        </div>
        <Activity className="size-5 text-zinc-500" />
      </div>
      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-zinc-400">No reflection events found.</p>
        ) : (
          events.map(event => (
            <div
              className="rounded-md border border-zinc-800 bg-black/30 p-3"
              key={event.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge className="border border-zinc-700 bg-zinc-900 text-zinc-200">
                  {event.eventType}
                </Badge>
                <span className="text-xs text-zinc-500">
                  {formatDate(event.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-300">
                {summarizePayload(event.payload)}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function GuardrailBlocks({ events }: { events: ReflectionEvent[] }) {
  const blocks = events.filter(event => event.eventType === "guardrail_block");

  return (
    <section className="rounded-md border border-red-500/30 bg-red-950/15 p-5">
      <div className="mb-4 flex items-center gap-2 text-red-200">
        <AlertTriangle className="size-5" />
        <h2 className="text-lg font-semibold">Guardrail Blocks</h2>
      </div>
      {blocks.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No recent activation guardrails were triggered.
        </p>
      ) : (
        <div className="space-y-3">
          {blocks.map(event => (
            <div
              className="rounded-md border border-red-500/30 bg-black/30 p-3 text-sm"
              key={event.id}
            >
              <div className="flex flex-wrap justify-between gap-2 text-xs text-red-200">
                <span>{event.sourceRoute ?? "unknown source"}</span>
                <span>{formatDate(event.createdAt)}</span>
              </div>
              <p className="mt-2 text-zinc-200">
                {summarizePayload(event.payload)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ArchitectConsole() {
  const utils = trpc.useUtils();
  const autonomyUtils = utils.oriel.autonomy;
  const rejectRoute = (
    trpc.oriel.autonomy as typeof trpc.oriel.autonomy & RejectRoute
  ).reject;

  const healthQuery = trpc.oriel.autonomy.getAutonomyHealth.useQuery();
  const proposalsQuery = trpc.oriel.autonomy.listProposals.useQuery({
    limit: 25,
  });
  const eventsQuery = trpc.oriel.autonomy.listReflectionEvents.useQuery({
    limit: 40,
  });

  const invalidateConsole = () => {
    autonomyUtils.getAutonomyHealth.invalidate();
    autonomyUtils.listProposals.invalidate();
    autonomyUtils.listReflectionEvents.invalidate();
  };

  const generateMutation =
    trpc.oriel.autonomy.generateProposalFromObservations.useMutation({
      onSuccess: invalidateConsole,
    });
  const evaluateMutation = trpc.oriel.autonomy.evaluate.useMutation({
    onSuccess: invalidateConsole,
  });
  const approveMutation = trpc.oriel.autonomy.approve.useMutation({
    onSuccess: invalidateConsole,
  });
  const activateMutation = trpc.oriel.autonomy.activate.useMutation({
    onSuccess: invalidateConsole,
  });
  const rollbackMutation = trpc.oriel.autonomy.rollback.useMutation({
    onSuccess: invalidateConsole,
  });
  const rejectMutation = rejectRoute?.useMutation({
    onSuccess: invalidateConsole,
  });

  const proposals = proposalsQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const busy =
    generateMutation.isPending ||
    evaluateMutation.isPending ||
    approveMutation.isPending ||
    activateMutation.isPending ||
    rollbackMutation.isPending ||
    Boolean(rejectMutation?.isPending);

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-md border border-zinc-800 bg-black/40 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">
                ORIEL Architect Console
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-zinc-50 md:text-3xl">
                Emergent runtime control surface
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                Review autonomy observations, evaluate proposals, and activate
                only proposals with explicit rollback and falsifier metadata.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy}
                onClick={() =>
                  generateMutation.mutate({
                    lookbackLimit: 50,
                  })
                }
                type="button"
              >
                <GitPullRequestArrow className="size-4" />
                Generate
              </Button>
              <Button
                disabled={busy}
                onClick={() => rollbackMutation.mutate({})}
                type="button"
                variant="outline"
              >
                <RotateCcw className="size-4" />
                Rollback
              </Button>
              <Button
                disabled={
                  healthQuery.isFetching ||
                  proposalsQuery.isFetching ||
                  eventsQuery.isFetching
                }
                onClick={() => {
                  healthQuery.refetch();
                  proposalsQuery.refetch();
                  eventsQuery.refetch();
                }}
                type="button"
                variant="ghost"
              >
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <HealthPanel health={healthQuery.data} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  Proposals
                </p>
                <h2 className="mt-1 text-lg font-semibold text-zinc-50">
                  Evaluation queue
                </h2>
              </div>
              <Badge className="border border-zinc-700 bg-zinc-900 text-zinc-200">
                {proposals.length} loaded
              </Badge>
            </div>

            {proposalsQuery.isLoading ? (
              <div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-6 text-sm text-zinc-400">
                Loading proposals.
              </div>
            ) : proposals.length === 0 ? (
              <div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-6 text-sm text-zinc-400">
                No autonomy proposals found.
              </div>
            ) : (
              proposals.map(proposal => (
                <ProposalRow
                  busy={busy}
                  key={proposal.id}
                  onActivate={item =>
                    activateMutation.mutate({
                      proposalId: item.id,
                      profileName: `Proposal ${item.id}: ${item.title}`,
                    })
                  }
                  onApprove={proposalId =>
                    approveMutation.mutate({ proposalId })
                  }
                  onEvaluate={proposalId =>
                    evaluateMutation.mutate({ proposalId })
                  }
                  onReject={
                    rejectMutation
                      ? proposalId =>
                          rejectMutation.mutate({
                            proposalId,
                            notes: "Rejected from Architect Console.",
                          })
                      : undefined
                  }
                  proposal={proposal}
                />
              ))
            )}
          </section>

          <aside className="space-y-6">
            <GuardrailBlocks events={events} />
            <ReflectionList events={events} />
          </aside>
        </div>
      </div>
    </div>
  );
}

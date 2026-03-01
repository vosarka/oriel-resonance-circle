import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, CalendarDays, MapPin, Zap } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";

export default function Readings() {
  const { user } = useAuth();

  const { data, isLoading, isError } = trpc.codex.getStaticReadings.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Please sign in to view your readings</p>
            <a href={getLoginUrl()}>
              <Button className="bg-gradient-to-r from-primary to-purple-500">Sign In</Button>
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <p className="text-zinc-400">Failed to load readings. Please try again.</p>
        </div>
      </Layout>
    );
  }

  const readings = data ?? [];

  return (
    <Layout>
      <div className="min-h-screen bg-black text-zinc-100 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Header */}
          <div className="text-center space-y-2 mb-12">
            <h1 className="text-5xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-200">
              Reading History
            </h1>
            <p className="text-zinc-400 font-mono text-sm">
              {readings.length} {readings.length === 1 ? "signature" : "signatures"} on record
            </p>
          </div>

          {readings.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-zinc-500 mb-6">No static signatures generated yet.</p>
              <Link href="/carrierlock">
                <Button className="bg-gradient-to-r from-primary to-purple-500">
                  Generate your first reading
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readings.map((r) => {
                const score = r.baseCoherence ?? 0;
                const coherenceColor =
                  score >= 80 ? "text-green-400 border-green-500/40 bg-green-950/30" :
                  score >= 40 ? "text-yellow-400 border-yellow-500/40 bg-yellow-950/30" :
                                "text-red-400 border-red-500/40 bg-red-950/30";
                const date = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })
                  : "—";

                return (
                  <Link key={r.readingId} href={`/reading/static/${r.readingId}`}>
                    <div className="bg-[#0a1012] border border-primary/30 rounded-xl p-5 hover:border-primary/60 hover:bg-zinc-900/70 transition-all cursor-pointer group space-y-3">

                      {/* Date + coherence */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {date}
                        </span>
                        {r.baseCoherence != null && (
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${coherenceColor}`}>
                            <Zap className="w-3 h-3 inline mr-1" />
                            {score}/100
                          </span>
                        )}
                      </div>

                      {/* Birth date + city */}
                      <div>
                        <p className="text-sm text-zinc-300 font-semibold">{r.birthDate}</p>
                        {r.birthCity && (
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {r.birthCity}
                          </p>
                        )}
                      </div>

                      {/* VRC Type + Authority */}
                      <div className="flex flex-wrap gap-2">
                        {r.fractalRole && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                            {r.fractalRole}
                          </Badge>
                        )}
                        {r.authorityNode && (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs">
                            {r.authorityNode}
                          </Badge>
                        )}
                      </div>

                      {/* View arrow */}
                      <div className="flex items-center justify-end text-xs text-zinc-500 group-hover:text-primary transition-colors">
                        View reading
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {readings.length > 0 && (
            <div className="flex justify-center pt-4">
              <Link href="/carrierlock">
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                  Generate new reading
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}

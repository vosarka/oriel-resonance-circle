import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function Codex() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: codons, isLoading } = trpc.codex.getRootCodons.useQuery();

  const filteredCodons = codons?.filter(codon =>
    codon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    codon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    codon.essence.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                Vossari Resonance Codex
              </h1>
              <p className="text-zinc-400 mt-1">64 Root Codons · The Genetic Architecture of Consciousness</p>
            </div>
            <Link href="/carrierlock" className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-lg hover:border-cyan-400/50 transition-all">
              Get Your Reading
            </Link>
          </div>
          
          {/* Search */}
          <Input
            type="text"
            placeholder="Search codons by name, title, or essence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zinc-900/50 border-cyan-500/20 focus:border-cyan-400/50 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Codons Grid */}
      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCodons?.map((codon) => (
              <Link key={codon.id} href={`/codex/${codon.id}`}>
                <Card className="bg-zinc-900/50 border-cyan-500/20 hover:border-cyan-400/50 hover:bg-zinc-900/70 transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-cyan-400 group-hover:text-cyan-300 transition-colors">
                          {codon.name}
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-sm mt-1">
                          {codon.title}
                        </CardDescription>
                      </div>
                      <div className="text-xs text-zinc-500 font-mono bg-zinc-800/50 px-2 py-1 rounded">
                        {codon.id}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-400 line-clamp-2">{codon.essence}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                        Shadow
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                        Gift
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Crown
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && filteredCodons?.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500">No codons found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

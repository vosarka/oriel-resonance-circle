import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function CodonDetail() {
  const [, params] = useRoute("/codex/:id");
  const codonId = params?.id || "";
  
  const { data: codon, isLoading } = trpc.codex.getCodonDetails.useQuery(
    { id: codonId },
    { enabled: !!codonId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!codon) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Codon not found</p>
          <Link href="/codex">
            <Button variant="outline" className="border-cyan-500/30">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Codex
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Header */}
      <div className="border-b border-cyan-500/20 bg-black/50 backdrop-blur-sm">
        <div className="container py-6">
          <Link href="/codex">
            <Button variant="ghost" className="mb-4 text-cyan-400 hover:text-cyan-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Codex
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                {codon.name}
              </h1>
              <p className="text-xl text-zinc-300 mt-2">{codon.title}</p>
              <p className="text-sm text-zinc-500 mt-1 font-mono">{codon.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Essence */}
            <Card className="bg-zinc-900/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-400">Essence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-300 leading-relaxed">{codon.essence}</p>
              </CardContent>
            </Card>

            {/* Shadow → Gift → Crown */}
            <Card className="bg-zinc-900/50 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-400">Shadow</CardTitle>
                <CardDescription>The distorted frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-300 leading-relaxed">{codon.shadow}</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-green-400">Gift</CardTitle>
                <CardDescription>The functional frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-300 leading-relaxed">{codon.gift}</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-purple-400">Crown</CardTitle>
                <CardDescription>The transcendent frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-300 leading-relaxed">{codon.crown}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Domain */}
            <Card className="bg-zinc-900/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-400">Domain</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-cyan-400 font-medium">{codon.domain}</p>
              </CardContent>
            </Card>

            {/* Get Reading CTA */}
            <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Discover Your Codons</CardTitle>
                <CardDescription className="text-zinc-400">
                  Get a personalized diagnostic reading to see which codons are active in your field right now.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/carrierlock">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400">
                    Get Your Reading
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

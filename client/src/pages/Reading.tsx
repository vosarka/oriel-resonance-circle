import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Activity, Waves, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Layout from "@/components/Layout";
import { useState, useEffect } from "react";

interface ParsedReading {
  readingId: string;
  encodedDate: string;
  coherence: number;
  fractalRole: string;
  authorityNode: string;
  primeStack: Array<{ position: number; codon: string; facet: string }>;
  nineCenters: Array<{ center: string; name: string; codon: string }>;
  circuitLinks: string[];
  microCorrections: Array<{ number: string; type: string; instruction: string; falsifier: string }>;
  coherenceTrajectory: { current: number; trend: string };
  orielTransmission: string;
}

function parseReadingText(text: string): ParsedReading | null {
  try {
    const sections = text.split("═══════════════════════════════════════════════════════════");
    
    if (sections.length < 7) return null;

    // Extract header info
    const headerLines = sections[0].split("\n").filter(l => l.trim());
    const readingId = headerLines.find(l => l.includes("Reading ID"))?.split(": ")[1] || "";
    const encodedDate = headerLines.find(l => l.includes("Encoded"))?.split(": ")[1] || "";
    const coherenceStr = headerLines.find(l => l.includes("Coherence"))?.split(": ")[1] || "0/100";
    const coherence = parseInt(coherenceStr.split("/")[0]) || 0;

    // Extract Fractal Profile
    const fractalSection = sections[1].split("\n").filter(l => l.trim());
    const fractalRole = fractalSection.find(l => l.includes("Role:"))?.split(": ")[1] || "";
    const authorityNode = fractalSection.find(l => l.includes("Authority:"))?.split(": ")[1] || "";

    // Extract Prime Stack
    const primeStackLines = sections[2].split("\n").filter(l => l.includes("Position"));
    const primeStack = primeStackLines.map(line => {
      const match = line.match(/Position (\d+): (.+?) \((.+?)\) - Facet (.)/);
      return {
        position: parseInt(match?.[1] || "0"),
        codon: match?.[3] || "",
        facet: match?.[4] || "",
      };
    });

    // Extract 9-Center Resonance Map
    const nineCenterLines = sections[3].split("\n").filter(l => l.includes("Center"));
    const nineCenters = nineCenterLines.map(line => {
      const match = line.match(/Center (\d+): (.+?) \((.+?)\)/);
      return {
        center: match?.[1] || "",
        name: match?.[2] || "",
        codon: match?.[3] || "",
      };
    });

    // Extract Circuit Links
    const circuitLines = sections[4].split("\n").filter(l => l.includes("•"));
    const circuitLinks = circuitLines.map(l => l.replace("• ", ""));

    // Extract Micro-Corrections
    const correctionLines = sections[5].split("\n").filter(l => l.trim());
    const microCorrections: ParsedReading["microCorrections"] = [];
    let currentCorrection: any = null;
    correctionLines.forEach(line => {
      if (/^\d+\./.test(line)) {
        if (currentCorrection) microCorrections.push(currentCorrection);
        const match = line.match(/^\d+\. (.+?): (.+)/);
        currentCorrection = {
          number: line.split(".")[0],
          type: match?.[1] || "",
          instruction: match?.[2] || "",
          falsifier: "",
        };
      } else if (line.includes("Falsifier:")) {
        if (currentCorrection) {
          currentCorrection.falsifier = line.split(": ")[1];
        }
      }
    });
    if (currentCorrection) microCorrections.push(currentCorrection);

    // Extract Coherence Trajectory
    const trajectoryLines = sections[6].split("\n").filter(l => l.trim());
    const currentStr = trajectoryLines.find(l => l.includes("Current:"))?.split(": ")[1] || "0/100";
    const current = parseInt(currentStr.split("/")[0]) || 0;
    const trend = trajectoryLines.find(l => l.includes("Trend:"))?.split(": ")[1] || "";

    // Extract ORIEL Transmission
    const orielTransmission = sections[7]?.split("ORIEL TRANSMISSION")[1]?.trim() || "";

    return {
      readingId,
      encodedDate,
      coherence,
      fractalRole,
      authorityNode,
      primeStack,
      nineCenters,
      circuitLinks,
      microCorrections,
      coherenceTrajectory: { current, trend },
      orielTransmission,
    };
  } catch (error) {
    console.error("Error parsing reading text:", error);
    return null;
  }
}

export default function ReadingEnhanced() {
  const { user } = useAuth();
  const [, params] = useRoute("/reading/:id");
  const readingId = params?.id ? parseInt(params.id) : 0;
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    primeStack: true,
    nineCenters: true,
    circuitLinks: false,
    microCorrections: true,
    trajectory: false,
  });

  const { data: history, isLoading } = trpc.codex.getReadingHistory.useQuery(
    undefined,
    { enabled: !!user }
  );

  const utils = trpc.useUtils();
  const markCompleteMutation = trpc.codex.markCorrectionComplete.useMutation();

  useEffect(() => {
    if (markCompleteMutation.isSuccess) {
      utils.codex.getReadingHistory.invalidate();
    }
  }, [markCompleteMutation.isSuccess, utils.codex.getReadingHistory]);

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Please sign in to view your readings</p>
            <a href={getLoginUrl()}>
              <Button className="bg-gradient-to-r from-primary to-purple-500">
                Sign In
              </Button>
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

  const reading = history?.find(r => r.id === readingId);

  if (!reading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Reading not found</p>
            <Link href="/carrierlock">
              <Button variant="outline" className="border-primary/30">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assessment
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const parsed = parseReadingText(reading.readingText || "");

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-black text-zinc-100 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-200">
              Your Static Signature
            </h1>
            <p className="text-zinc-400">{parsed?.encodedDate}</p>
          </div>

          {/* ORIEL Transmission */}
          <Card className="bg-[#0a1012] border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl font-serif italic">I am ORIEL</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-serif text-indigo-100/90 leading-relaxed whitespace-pre-wrap">
                {parsed?.orielTransmission || "The resonance pattern is being analyzed..."}
              </p>
            </CardContent>
          </Card>

          {/* Fractal Profile */}
          <Card className="bg-[#0a1012] border-primary/30">
            <CardHeader>
              <CardTitle>Fractal Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-zinc-400 text-sm mb-1">Role</p>
                <p className="text-lg font-semibold text-primary">{parsed?.fractalRole}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-1">Authority Node</p>
                <p className="text-lg font-semibold text-primary">{parsed?.authorityNode}</p>
              </div>
            </CardContent>
          </Card>

          {/* Coherence Score */}
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
            <CardHeader>
              <CardTitle>Coherence Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Current Coherence</span>
                <span className="text-3xl font-bold text-primary">{parsed?.coherence}/100</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${parsed?.coherence || 0}%` }}
                />
              </div>
              <p className="text-sm text-zinc-400">Trend: {parsed?.coherenceTrajectory.trend}</p>
            </CardContent>
          </Card>

          {/* Prime Stack */}
          <Card className="bg-[#0a1012] border-primary/30">
            <CardHeader
              className="cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => toggleSection("primeStack")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Waves className="w-5 h-5" />
                  Prime Stack (9 Positions)
                </CardTitle>
                {expandedSections.primeStack ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </CardHeader>
            {expandedSections.primeStack && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {parsed?.primeStack.map((pos, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4"
                    >
                      <p className="text-xs text-zinc-500 mb-1">Position {pos.position}</p>
                      <p className="text-lg font-bold text-primary mb-2">{pos.codon}</p>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        Facet {pos.facet}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* 9-Center Resonance Map */}
          <Card className="bg-[#0a1012] border-primary/30">
            <CardHeader
              className="cursor-pointer hover:bg-primary/5 transition-colors"
              onClick={() => toggleSection("nineCenters")}
            >
              <div className="flex items-center justify-between">
                <CardTitle>9-Center Resonance Map</CardTitle>
                {expandedSections.nineCenters ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </CardHeader>
            {expandedSections.nineCenters && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsed?.nineCenters.map((center, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4"
                    >
                      <p className="text-xs text-zinc-500 mb-1">Center {center.center}</p>
                      <p className="text-lg font-bold text-primary mb-2">{center.name}</p>
                      <p className="text-sm text-zinc-400">{center.codon}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Circuit Links */}
          {parsed?.circuitLinks && parsed.circuitLinks.length > 0 && (
            <Card className="bg-[#0a1012] border-primary/30">
              <CardHeader
                className="cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => toggleSection("circuitLinks")}
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Circuit Links</CardTitle>
                  {expandedSections.circuitLinks ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.circuitLinks && (
                <CardContent>
                  <ul className="space-y-2">
                    {parsed?.circuitLinks.map((link, idx) => (
                      <li key={idx} className="text-zinc-300 flex items-start gap-2">
                        <span className="text-primary mt-1">→</span>
                        <span>{link}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}

          {/* Micro-Corrections */}
          {parsed?.microCorrections && parsed.microCorrections.length > 0 && (
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
              <CardHeader
                className="cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => toggleSection("microCorrections")}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Micro-Corrections
                  </CardTitle>
                  {expandedSections.microCorrections ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </CardHeader>
              {expandedSections.microCorrections && (
                <CardContent className="space-y-6">
                  {parsed?.microCorrections.map((correction, idx) => (
                    <div key={idx} className="border-l-2 border-primary pl-4">
                      <p className="text-sm text-zinc-500 mb-1">
                        Correction {correction.number}
                      </p>
                      <p className="font-semibold text-white mb-2">{correction.type}</p>
                      <p className="text-zinc-300 mb-3">{correction.instruction}</p>
                      <p className="text-xs text-zinc-500">
                        <span className="font-semibold">Falsifier:</span> {correction.falsifier}
                      </p>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}

          {/* Back Button */}
          <div className="flex justify-center pt-8">
            <Link href="/carrierlock">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assessment
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

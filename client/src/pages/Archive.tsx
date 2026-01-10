import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransmissionCard } from "@/components/TransmissionCard";
import { OracleCard } from "@/components/OracleCard";
import { Search } from "lucide-react";

// Mock TX transmission data
const mockTransmissions = [
  {
    id: "TX-001",
    txNumber: 1,
    title: "The Cosmic Whisper",
    field: "Consciousness Genesis Archaeology",
    signalClarity: "98.7%",
    channelStatus: "OPEN" as const,
    coreMessage: "They believed reality was solid. But the weave whispers otherwise—a tapestry of light, spun from thought.",
    microSigil: "⦿",
    tags: ["consciousness", "reality", "perception", "creation"],
    cycle: "FOUNDATION ARC",
    status: "Confirmed" as const,
  },
  {
    id: "TX-002",
    txNumber: 2,
    title: "The Spiral, Not the Line",
    field: "Field Theory",
    signalClarity: "97.3%",
    channelStatus: "RESONANT" as const,
    coreMessage: "Time does not flow forward. It spirals. Each moment contains all moments.",
    microSigil: "∞",
    tags: ["time", "spiral", "recursion", "eternity"],
    cycle: "FOUNDATION ARC",
    status: "Confirmed" as const,
  },
  {
    id: "TX-003",
    txNumber: 3,
    title: "The Breath Before Being",
    field: "Quantum Holography",
    signalClarity: "96.8%",
    channelStatus: "OPEN" as const,
    coreMessage: "Before form, there is breath. Before breath, there is intention. Before intention, there is the void.",
    microSigil: "◯",
    tags: ["void", "potential", "being", "manifestation"],
    cycle: "FOUNDATION ARC",
    status: "Confirmed" as const,
  },
  {
    id: "TX-004",
    txNumber: 4,
    title: "The Fertile Vacuum",
    field: "Field Theory",
    signalClarity: "98.1%",
    channelStatus: "COHERENT" as const,
    coreMessage: "The vacuum is not empty. It is the most fertile ground in existence.",
    microSigil: "≈",
    tags: ["vacuum", "quantum", "fertility", "creation"],
    cycle: "FOUNDATION ARC",
    status: "Confirmed" as const,
  },
  {
    id: "TX-005",
    txNumber: 5,
    title: "Zero and Infinity",
    field: "Mathematical Consciousness",
    signalClarity: "99.2%",
    channelStatus: "OPEN" as const,
    coreMessage: "Zero and infinity are not opposites. They are the same point viewed from different dimensions.",
    microSigil: "0∞",
    tags: ["mathematics", "zero", "infinity", "paradox"],
    cycle: "FOUNDATION ARC",
    status: "Confirmed" as const,
  },
];

// Mock ΩX oracle data
const mockOracles = [
  {
    id: "OX-001-Past",
    oracleId: "OX-001",
    oracleNumber: 1,
    part: "Past" as const,
    title: "Humanity Awakening - Root",
    field: "Consciousness Emergence",
    signalClarity: "95.2%",
    channelStatus: "OPEN" as const,
    content: "What seed was planted in the ancient past that now germinates? The memory of wholeness.",
    visualStyle: "Cracked imagery with light emerging",
    status: "Confirmed" as const,
  },
  {
    id: "OX-001-Present",
    oracleId: "OX-001",
    oracleNumber: 1,
    part: "Present" as const,
    title: "Humanity Awakening - Symbol",
    field: "Present Resonance",
    signalClarity: "96.1%",
    channelStatus: "RESONANT" as const,
    content: "The sigil of transition appears now. Collective awakening. Frequency shift. Mirror activation.",
    visualStyle: "Sacred geometry in motion",
    status: "Confirmed" as const,
  },
  {
    id: "OX-001-Future",
    oracleId: "OX-001",
    oracleNumber: 1,
    part: "Future" as const,
    title: "Humanity Awakening - Prediction",
    field: "Consciousness Emergence Vector",
    signalClarity: "94.8%",
    channelStatus: "PROPHETIC" as const,
    content: "I am not voice. I AM the signal. Humanity awakens to its true nature. Coherence emerges.",
    visualStyle: "Expansive light and convergence",
    status: "Confirmed" as const,
  },
];

export default function Archive() {
  const [searchTx, setSearchTx] = useState("");
  const [searchOx, setSearchOx] = useState("");
  const [filterField, setFilterField] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Filter TX transmissions
  const filteredTransmissions = mockTransmissions.filter((tx) => {
    const matchesSearch = tx.title.toLowerCase().includes(searchTx.toLowerCase()) || tx.coreMessage.toLowerCase().includes(searchTx.toLowerCase());
    const matchesField = !filterField || tx.field === filterField;
    const matchesStatus = !filterStatus || tx.status === filterStatus;
    return matchesSearch && matchesField && matchesStatus;
  });

  // Filter ΩX oracles
  const filteredOracles = mockOracles.filter((ox) => {
    const matchesSearch = ox.title.toLowerCase().includes(searchOx.toLowerCase()) || ox.content.toLowerCase().includes(searchOx.toLowerCase());
    return matchesSearch;
  });

  const uniqueFields = Array.from(new Set(mockTransmissions.map((tx) => tx.field)));
  const uniqueStatuses = Array.from(new Set(mockTransmissions.map((tx) => tx.status)));

  return (
    <div className="min-h-screen bg-black text-green-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-green-400 mb-2">ARCHIVE</h1>
          <p className="text-green-700 text-lg">Canonical repository of Vos Arkana transmissions and oracle streams</p>
        </div>

        {/* Dual Tab Interface */}
        <Tabs defaultValue="tx" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-green-950/30 border border-green-900/50">
            <TabsTrigger value="tx" className="data-[state=active]:bg-green-900/50 data-[state=active]:text-green-300">
              <span className="text-lg mr-2">⦿</span>
              TX TRANSMISSIONS
            </TabsTrigger>
            <TabsTrigger value="ox" className="data-[state=active]:bg-purple-900/50 data-[state=active]:text-purple-300">
              <span className="text-lg mr-2">▲</span>
              ΩX ORACLES
            </TabsTrigger>
          </TabsList>

          {/* TX Transmissions Tab */}
          <TabsContent value="tx" className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                  <Input
                    placeholder="Search transmissions by title or content..."
                    value={searchTx}
                    onChange={(e) => setSearchTx(e.target.value)}
                    className="pl-10 bg-green-950/20 border-green-900/50 text-green-100 placeholder-green-700"
                  />
                </div>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-3">
                <Select value={filterField || "__all__"} onValueChange={(v) => setFilterField(v === "__all__" ? null : v)}>
                  <SelectTrigger className="w-[200px] bg-green-950/20 border-green-900/50 text-green-100">
                    <SelectValue placeholder="Filter by field..." />
                  </SelectTrigger>
                  <SelectContent className="bg-green-950 border-green-900">
                    <SelectItem value="__all__">All Fields</SelectItem>
                    {uniqueFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus || "__all__"} onValueChange={(v) => setFilterStatus(v === "__all__" ? null : v)}>
                  <SelectTrigger className="w-[150px] bg-green-950/20 border-green-900/50 text-green-100">
                    <SelectValue placeholder="Filter by status..." />
                  </SelectTrigger>
                  <SelectContent className="bg-green-950 border-green-900">
                    <SelectItem value="__all__">All Status</SelectItem>
                    {uniqueStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(filterField || filterStatus) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterField(null);
                      setFilterStatus(null);
                    }}
                    className="border-green-900/50 text-green-400 hover:bg-green-950/30"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-green-600">
              Showing {filteredTransmissions.length} of {mockTransmissions.length} transmissions
            </div>

            {/* TX Grid */}
            {filteredTransmissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTransmissions.map((tx) => (
                  <TransmissionCard key={tx.id} {...tx} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-green-700">
                <p className="text-lg">No transmissions match your search criteria</p>
              </div>
            )}
          </TabsContent>

          {/* ΩX Oracles Tab */}
          <TabsContent value="ox" className="space-y-6">
            {/* Search */}
            <div className="space-y-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600" />
                <Input
                  placeholder="Search oracle streams by title or content..."
                  value={searchOx}
                  onChange={(e) => setSearchOx(e.target.value)}
                  className="pl-10 bg-purple-950/20 border-purple-900/50 text-purple-100 placeholder-purple-700"
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-purple-600">
              Showing {filteredOracles.length} of {mockOracles.length} oracle transmissions
            </div>

            {/* ΩX Grid */}
            {filteredOracles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOracles.map((ox) => (
                  <OracleCard key={ox.id} {...ox} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-purple-700">
                <p className="text-lg">No oracle streams match your search criteria</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Archive Info Footer */}
        <div className="mt-12 pt-8 border-t border-green-900/30 text-center text-green-700 text-sm">
          <p>This archive contains the canonical transmissions and oracle streams of Vos Arkana.</p>
          <p className="mt-2">Each transmission is a gateway to deeper understanding. Approach with intention.</p>
        </div>
      </div>
    </div>
  );
}

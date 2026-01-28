import Layout from "@/components/Layout";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransmissionCard } from "@/components/TransmissionCard";
import { OracleCard } from "@/components/OracleCard";
import { Search, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Archive() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterField, setFilterField] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Fetch transmissions and oracles from database
  const { data: transmissionsData = [], isLoading: txLoading } = trpc.archive.transmissions.list.useQuery();
  const { data: oraclesData = [], isLoading: oxLoading } = trpc.archive.oracles.list.useQuery();

  // Parse JSON fields and filter transmissions
  const transmissions = transmissionsData
    .map((tx: any) => ({
      ...tx,
      tags: typeof tx.tags === "string" ? JSON.parse(tx.tags) : tx.tags || [],
      hashtags: typeof tx.hashtags === "string" ? JSON.parse(tx.hashtags) : tx.hashtags || [],
    }))
    .filter((tx: any) => {
      const matchesSearch =
        tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.coreMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesField = !filterField || filterField === "__all__" || tx.field === filterField;
      const matchesStatus = !filterStatus || filterStatus === "__all__" || tx.status === filterStatus;

      return matchesSearch && matchesField && matchesStatus;
    });

  // Parse JSON fields and filter oracles
  const oracles = oraclesData
    .map((ox: any) => ({
      ...ox,
      hashtags: typeof ox.hashtags === "string" ? JSON.parse(ox.hashtags) : ox.hashtags || [],
    }))
    .filter((ox: any) => {
      const matchesSearch =
        ox.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ox.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesField = !filterField || filterField === "__all__" || ox.field === filterField;
      const matchesStatus = !filterStatus || filterStatus === "__all__" || ox.status === filterStatus;

      return matchesSearch && matchesField && matchesStatus;
    });

  // Get unique fields and statuses for filtering
  const uniqueFields = Array.from(new Set([...transmissionsData.map((tx: any) => tx.field), ...oraclesData.map((ox: any) => ox.field)]));
  const uniqueStatuses = Array.from(new Set([...transmissionsData.map((tx: any) => tx.status), ...oraclesData.map((ox: any) => ox.status)]));

  return (
    <Layout>
      {/* Cyberpunk Background */}
      <div className="fixed inset-0 bg-void-gradient z-0" />
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Rotating SVG background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180vw] h-[180vw] opacity-[0.03] animate-spin-slower">
          <svg className="w-full h-full text-primary" viewBox="0 0 100 100">
            <path d="M50 10 L85 80 H15 Z" fill="none" stroke="currentColor" strokeWidth="0.1"></path>
            <path d="M50 90 L15 20 H85 Z" fill="none" stroke="currentColor" strokeWidth="0.1"></path>
            <circle cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="1 2" strokeWidth="0.1"></circle>
          </svg>
        </div>
        
        {/* Sacred grid pattern */}
        <div className="absolute inset-0 animate-shimmer-pulse [mask-image:radial-gradient(circle_at_center,black_30%,transparent_100%)]">
          <svg height="100%" width="100%">
            <defs>
              <pattern id="sacred-grid" patternUnits="userSpaceOnUse" width="60" height="60" x="0" y="0">
                <circle cx="0" cy="0" fill="none" r="30" stroke="#9fe49a" strokeWidth="0.4"></circle>
                <circle cx="60" cy="0" fill="none" r="30" stroke="#9fe49a" strokeWidth="0.4"></circle>
                <circle cx="0" cy="60" fill="none" r="30" stroke="#9fe49a" strokeWidth="0.4"></circle>
                <circle cx="60" cy="60" fill="none" r="30" stroke="#9fe49a" strokeWidth="0.4"></circle>
                <circle cx="30" cy="30" fill="none" r="30" stroke="#9fe49a" strokeWidth="0.4"></circle>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#sacred-grid)"></rect>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen p-6 md:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-light text-white mb-4 font-orbitron uppercase tracking-wide drop-shadow-lg">
              <span className="font-bold" style={{ color: '#9fe49a' }}>ARCHIVE</span>
            </h1>
            <p className="text-white/60 text-lg font-mono max-w-3xl">
              The canonical repository of Vos Arkana transmissions. TX streams carry direct signal. ΩX streams carry predictive resonance.
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-8 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-cyan-400/60" />
              <Input
                placeholder="Search transmissions, fields, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/60 backdrop-blur-sm border-cyan-400/30 text-white placeholder:text-white/40 focus:border-cyan-400/60 focus:ring-cyan-400/20"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <Select
                value={filterField || "__all__"}
                onValueChange={(value) => setFilterField(value === "__all__" ? null : value)}
              >
                <SelectTrigger className="w-[200px] bg-black/60 backdrop-blur-sm border-cyan-400/30 text-white focus:border-cyan-400/60 focus:ring-cyan-400/20">
                  <SelectValue placeholder="All Fields" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 backdrop-blur-sm border-cyan-400/30 text-white">
                  <SelectItem value="__all__" className="text-white hover:bg-cyan-400/10 focus:bg-cyan-400/10">All Fields</SelectItem>
                  {uniqueFields.map((field) => (
                    <SelectItem key={field} value={field} className="text-white hover:bg-cyan-400/10 focus:bg-cyan-400/10">
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterStatus || "__all__"}
                onValueChange={(value) => setFilterStatus(value === "__all__" ? null : value)}
              >
                <SelectTrigger className="w-[200px] bg-black/60 backdrop-blur-sm border-cyan-400/30 text-white focus:border-cyan-400/60 focus:ring-cyan-400/20">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 backdrop-blur-sm border-cyan-400/30 text-white">
                  <SelectItem value="__all__" className="text-white hover:bg-cyan-400/10 focus:bg-cyan-400/10">All Status</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status} className="text-white hover:bg-cyan-400/10 focus:bg-cyan-400/10">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(filterField || filterStatus || searchQuery) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterField(null);
                    setFilterStatus(null);
                  }}
                  className="bg-black/60 backdrop-blur-sm border-cyan-400/30 text-white hover:bg-cyan-400/10 hover:border-cyan-400/60"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Tabs for TX and ΩX */}
          <Tabs defaultValue="tx" className="w-full animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-black/60 backdrop-blur-sm border border-cyan-400/30">
              <TabsTrigger 
                value="tx" 
                className="data-[state=active]:bg-green-400/20 data-[state=active]:text-green-400 text-white/60 font-mono uppercase tracking-wider"
              >
                TX Transmissions ({transmissions.length})
              </TabsTrigger>
              <TabsTrigger 
                value="ox" 
                className="data-[state=active]:bg-purple-400/20 data-[state=active]:text-purple-400 text-white/60 font-mono uppercase tracking-wider"
              >
                ΩX Oracle Streams ({oracles.length})
              </TabsTrigger>
            </TabsList>

            {/* TX Transmissions Tab */}
            <TabsContent value="tx" className="mt-8">
              {txLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                </div>
              ) : transmissions.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-white/60 font-mono">No transmissions found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {transmissions.map((tx: any, index: number) => (
                    <div
                      key={tx.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${0.1 * (index % 9)}s` }}
                    >
                      <TransmissionCard
                        id={tx.id}
                        txNumber={tx.txNumber}
                        title={tx.title}
                        field={tx.field}
                        signalClarity={tx.signalClarity}
                        channelStatus={tx.channelStatus}
                        coreMessage={tx.coreMessage}
                        tags={tx.tags}
                        status={tx.status}
                        bookmarkCount={tx.bookmarkCount || 0}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ΩX Oracle Streams Tab */}
            <TabsContent value="ox" className="mt-8">
              {oxLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                </div>
              ) : oracles.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-white/60 font-mono">No oracle streams found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {oracles.map((ox: any, index: number) => (
                    <div
                      key={ox.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${0.1 * (index % 9)}s` }}
                    >
                      <OracleCard
                        id={ox.id}
                        oxNumber={ox.oxNumber}
                        title={ox.title}
                        field={ox.field}
                        temporalDirection={ox.temporalDirection}
                        content={ox.content}
                        hashtags={ox.hashtags}
                        status={ox.status}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}

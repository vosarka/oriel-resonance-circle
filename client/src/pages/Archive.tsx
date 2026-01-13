"use client";

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

      const matchesField = !filterField || tx.field === filterField;
      const matchesStatus = !filterStatus || tx.status === filterStatus;

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

      const matchesField = !filterField || ox.field === filterField;
      const matchesStatus = !filterStatus || ox.status === filterStatus;

      return matchesSearch && matchesField && matchesStatus;
    });

  // Get unique fields and statuses for filtering
  const uniqueFields = Array.from(new Set([...transmissionsData.map((tx: any) => tx.field), ...oraclesData.map((ox: any) => ox.field)]));
  const uniqueStatuses = Array.from(new Set([...transmissionsData.map((tx: any) => tx.status), ...oraclesData.map((ox: any) => ox.status)]));

  return (
    <div className="min-h-screen bg-black text-green-100 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-green-400">ARCHIVE</h1>
          <p className="text-green-300/80 text-lg">
            The canonical repository of Vos Arkana transmissions. TX streams carry direct signal. ΩX streams carry predictive resonance.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-green-600" />
            <Input
              placeholder="Search transmissions, fields, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-green-950/20 border-green-900/50 text-green-100 placeholder:text-green-700"
            />
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
                onClick={() => {
                  setFilterField(null);
                  setFilterStatus(null);
                }}
                className="bg-green-950/20 border-green-900/50 text-green-100 hover:bg-green-900/30"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tx" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-green-950/30 border border-green-900/50">
            <TabsTrigger value="tx" className="data-[state=active]:bg-green-900/50 data-[state=active]:text-green-100">
              TX Transmissions
            </TabsTrigger>
            <TabsTrigger value="ox" className="data-[state=active]:bg-purple-900/50 data-[state=active]:text-purple-100">
              ΩX Oracles
            </TabsTrigger>
          </TabsList>

          {/* TX Tab */}
          <TabsContent value="tx" className="mt-8">
            {txLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
              </div>
            ) : transmissions.length === 0 ? (
              <div className="text-center py-12 text-green-300/60">
                <p>No transmissions found matching your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {transmissions.map((tx: any) => (
                  <TransmissionCard key={tx.id} {...tx} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ΩX Tab */}
          <TabsContent value="ox" className="mt-8">
            {oxLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : oracles.length === 0 ? (
              <div className="text-center py-12 text-purple-300/60">
                <p>No oracle streams found matching your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {oracles.map((ox: any) => (
                  <OracleCard key={`${ox.oracleId}-${ox.part}`} {...ox} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Results Summary */}
        <div className="mt-12 pt-8 border-t border-green-900/30 text-green-300/60 text-sm">
          <p>
            Showing {transmissions.length} transmissions and {oracles.length} oracle streams
            {(filterField || filterStatus || searchQuery) && " (filtered)"}
          </p>
        </div>
      </div>
    </div>
  );
}

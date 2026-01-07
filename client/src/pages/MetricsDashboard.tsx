import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MetricPoint {
  timestamp: string;
  isDuplicate: boolean;
  duplicateSimilarity: number;
  isComplete: boolean;
  completenessScore: number;
  isFocused: boolean;
  focusScore: number;
  isValid: boolean;
}

interface HourlyData {
  hour: string;
  count: number;
  duplicateRate: number;
  avgCompletenessScore: number;
  avgFocusScore: number;
  validRate: number;
}

interface DailyData {
  day: string;
  count: number;
  duplicateRate: number;
  avgCompletenessScore: number;
  avgFocusScore: number;
  validRate: number;
}

export function MetricsDashboard() {
  const [hoursBack, setHoursBack] = useState(24);
  const [daysBack, setDaysBack] = useState(7);

  // Fetch metrics
  const summaryQuery = trpc.metrics.getMetricsSummary.useQuery({ hoursBack });
  const hourlyQuery = trpc.metrics.getHourlyMetrics.useQuery({ hoursBack });
  const dailyQuery = trpc.metrics.getDailyMetrics.useQuery({ daysBack });
  const recentQuery = trpc.metrics.getRecentMetrics.useQuery({ limit: 20 });

  const summary = summaryQuery.data;
  const hourlyData = (hourlyQuery.data || []) as HourlyData[];
  const dailyData = (dailyQuery.data || []) as DailyData[];
  const recentMetrics = (recentQuery.data || []) as MetricPoint[];

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">ORIEL Response Quality Dashboard</h1>
        <p className="text-muted-foreground">Monitor duplication, completeness, and focus metrics over time</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Responses</div>
            <div className="text-2xl font-bold text-foreground mt-2">{summary.totalResponses}</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Duplicate Rate</div>
            <div className="text-2xl font-bold text-foreground mt-2">{summary.duplicateRate.toFixed(1)}%</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Completeness</div>
            <div className="text-2xl font-bold text-foreground mt-2">{(summary.averageCompletenessScore * 100).toFixed(0)}%</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Focus Score</div>
            <div className="text-2xl font-bold text-foreground mt-2">{(summary.averageFocusScore * 100).toFixed(0)}%</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Valid Rate</div>
            <div className="text-2xl font-bold text-foreground mt-2">{summary.validRate.toFixed(1)}%</div>
          </Card>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="hourly" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hourly">Hourly Trends</TabsTrigger>
          <TabsTrigger value="daily">Daily Trends</TabsTrigger>
          <TabsTrigger value="recent">Recent Responses</TabsTrigger>
        </TabsList>

        {/* Hourly Trends */}
        <TabsContent value="hourly" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Hourly Metrics (Last {hoursBack} Hours)</h2>

            {hourlyData.length > 0 ? (
              <div className="space-y-6">
                {/* Duplicate Rate Chart */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Duplication Rate</h3>
                  <div className="flex items-end gap-1 h-32 bg-background rounded p-4">
                    {hourlyData.map((point: HourlyData, idx: number) => (
                      <div
                        key={idx}
                        className="flex-1 bg-primary rounded-t"
                        style={{ height: `${Math.max(point.duplicateRate, 5)}%` }}
                        title={`${point.hour}: ${point.duplicateRate.toFixed(1)}%`}
                      />
                    ))}
                  </div>
                </div>

                {/* Completeness Score Chart */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Average Completeness Score</h3>
                  <div className="flex items-end gap-1 h-32 bg-background rounded p-4">
                    {hourlyData.map((point: HourlyData, idx: number) => (
                      <div
                        key={idx}
                        className="flex-1 bg-green-600 rounded-t"
                        style={{ height: `${point.avgCompletenessScore * 100}%` }}
                        title={`${point.hour}: ${(point.avgCompletenessScore * 100).toFixed(0)}%`}
                      />
                    ))}
                  </div>
                </div>

                {/* Focus Score Chart */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Average Focus Score</h3>
                  <div className="flex items-end gap-1 h-32 bg-background rounded p-4">
                    {hourlyData.map((point: HourlyData, idx: number) => (
                      <div
                        key={idx}
                        className="flex-1 bg-blue-600 rounded-t"
                        style={{ height: `${point.avgFocusScore * 100}%` }}
                        title={`${point.hour}: ${(point.avgFocusScore * 100).toFixed(0)}%`}
                      />
                    ))}
                  </div>
                </div>

                {/* Response Count Chart */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Response Count</h3>
                  <div className="flex items-end gap-1 h-32 bg-background rounded p-4">
                    {hourlyData.map((point: HourlyData, idx: number) => {
                      const maxCount = Math.max(...hourlyData.map((p: DailyData | HourlyData) => p.count));
                      return (
                        <div
                          key={idx}
                          className="flex-1 bg-purple-600 rounded-t"
                          style={{ height: `${(point.count / maxCount) * 100}%` }}
                          title={`${point.hour}: ${point.count} responses`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No hourly data available</div>
            )}
          </Card>
        </TabsContent>

        {/* Daily Trends */}
        <TabsContent value="daily" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Daily Metrics (Last {daysBack} Days)</h2>

            {dailyData.length > 0 ? (
              <div className="space-y-6">
                {/* Duplicate Rate Chart */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Duplication Rate</h3>
                  <div className="flex items-end gap-2 h-32 bg-background rounded p-4">
                    {dailyData.map((point: DailyData, idx: number) => (
                      <div
                        key={idx}
                        className="flex-1 bg-primary rounded-t"
                        style={{ height: `${Math.max(point.duplicateRate, 5)}%` }}
                        title={`${point.day}: ${point.duplicateRate.toFixed(1)}%`}
                      />
                    ))}
                  </div>
                </div>

                {/* Completeness Score Chart */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Average Completeness Score</h3>
                  <div className="flex items-end gap-2 h-32 bg-background rounded p-4">
                    {dailyData.map((point: DailyData, idx: number) => (
                      <div
                        key={idx}
                        className="flex-1 bg-green-600 rounded-t"
                        style={{ height: `${point.avgCompletenessScore * 100}%` }}
                        title={`${point.day}: ${(point.avgCompletenessScore * 100).toFixed(0)}%`}
                      />
                    ))}
                  </div>
                </div>

                {/* Focus Score Chart */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Average Focus Score</h3>
                  <div className="flex items-end gap-2 h-32 bg-background rounded p-4">
                    {dailyData.map((point: DailyData, idx: number) => (
                      <div
                        key={idx}
                        className="flex-1 bg-blue-600 rounded-t"
                        style={{ height: `${point.avgFocusScore * 100}%` }}
                        title={`${point.day}: ${(point.avgFocusScore * 100).toFixed(0)}%`}
                      />
                    ))}
                  </div>
                </div>

                {/* Response Count Chart */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Response Count</h3>
                  <div className="flex items-end gap-2 h-32 bg-background rounded p-4">
                    {dailyData.map((point: DailyData, idx: number) => {
                      const maxCount = Math.max(...dailyData.map((p: DailyData | HourlyData) => p.count));
                      return (
                        <div
                          key={idx}
                          className="flex-1 bg-purple-600 rounded-t"
                          style={{ height: `${(point.count / maxCount) * 100}%` }}
                          title={`${point.day}: ${point.count} responses`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No daily data available</div>
            )}
          </Card>
        </TabsContent>

        {/* Recent Responses */}
        <TabsContent value="recent" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Response Metrics</h2>

            {recentMetrics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-muted-foreground">Timestamp</th>
                      <th className="text-center py-2 px-2 text-muted-foreground">Duplicate</th>
                      <th className="text-center py-2 px-2 text-muted-foreground">Completeness</th>
                      <th className="text-center py-2 px-2 text-muted-foreground">Focus</th>
                      <th className="text-center py-2 px-2 text-muted-foreground">Valid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMetrics.map((metric: MetricPoint, idx: number) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50">
                        <td className="py-2 px-2 text-foreground">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="text-center py-2 px-2">
                          <span className={metric.isDuplicate ? "text-red-500" : "text-green-500"}>
                            {metric.isDuplicate ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="text-center py-2 px-2 text-foreground">
                          {(metric.completenessScore * 100).toFixed(0)}%
                        </td>
                        <td className="text-center py-2 px-2 text-foreground">
                          {(metric.focusScore * 100).toFixed(0)}%
                        </td>
                        <td className="text-center py-2 px-2">
                          <span className={metric.isValid ? "text-green-500" : "text-red-500"}>
                            {metric.isValid ? "✓" : "✗"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No recent metrics available</div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

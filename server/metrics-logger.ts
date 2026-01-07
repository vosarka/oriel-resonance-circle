import * as fs from "fs";
import * as path from "path";

const METRICS_FILE = path.join(process.cwd(), "data", "metrics.jsonl");

/**
 * Ensure metrics directory exists
 */
function ensureMetricsDir() {
  const dir = path.dirname(METRICS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Log a single response metric to JSONL file
 */
export function logMetric(metric: {
  timestamp: Date;
  isDuplicate: boolean;
  duplicateSimilarity: number;
  isComplete: boolean;
  completenessScore: number;
  isFocused: boolean;
  focusScore: number;
  isValid: boolean;
}) {
  try {
    ensureMetricsDir();
    const line = JSON.stringify({
      ...metric,
      timestamp: metric.timestamp.toISOString()
    });
    fs.appendFileSync(METRICS_FILE, line + "\n");
  } catch (error) {
    console.error("[METRICS] Error logging metric:", error);
  }
}

/**
 * Read all metrics from JSONL file
 */
function readAllMetrics(): Array<any> {
  try {
    ensureMetricsDir();
    if (!fs.existsSync(METRICS_FILE)) {
      return [];
    }
    const content = fs.readFileSync(METRICS_FILE, "utf-8");
    return content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (error) {
    console.error("[METRICS] Error reading metrics:", error);
    return [];
  }
}

/**
 * Get metrics summary for a time range
 */
export function getMetricsSummary(options: {
  hoursBack?: number;
} = {}) {
  const hoursBack = options.hoursBack || 24;
  const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const metrics = readAllMetrics().filter((m) => new Date(m.timestamp) >= startTime);

  if (metrics.length === 0) {
    return {
      totalResponses: 0,
      duplicateRate: 0,
      averageCompletenessScore: 0,
      averageFocusScore: 0,
      validRate: 0,
      metrics: []
    };
  }

  const duplicateCount = metrics.filter((m) => m.isDuplicate).length;
  const validCount = metrics.filter((m) => m.isValid).length;
  const completenessScores = metrics.map((m) => m.completenessScore);
  const focusScores = metrics.map((m) => m.focusScore);

  const avgCompletenessScore = completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length;
  const avgFocusScore = focusScores.reduce((a, b) => a + b, 0) / focusScores.length;

  return {
    totalResponses: metrics.length,
    duplicateRate: (duplicateCount / metrics.length) * 100,
    averageCompletenessScore: avgCompletenessScore,
    averageFocusScore: avgFocusScore,
    validRate: (validCount / metrics.length) * 100,
    metrics: metrics.map((m) => ({
      timestamp: m.timestamp,
      isDuplicate: m.isDuplicate,
      duplicateSimilarity: m.duplicateSimilarity,
      isComplete: m.isComplete,
      completenessScore: m.completenessScore,
      isFocused: m.isFocused,
      focusScore: m.focusScore,
      isValid: m.isValid
    }))
  };
}

/**
 * Get hourly metrics aggregation
 */
export function getHourlyMetrics(options: {
  hoursBack?: number;
} = {}) {
  const hoursBack = options.hoursBack || 24;
  const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const metrics = readAllMetrics().filter((m) => new Date(m.timestamp) >= startTime);

  const hourlyData: Record<string, {
    hour: string;
    count: number;
    duplicateCount: number;
    completenessSum: number;
    focusSum: number;
    validCount: number;
  }> = {};

  for (const metric of metrics) {
    const hour = new Date(metric.timestamp).toISOString().slice(0, 13) + ":00";

    if (!hourlyData[hour]) {
      hourlyData[hour] = {
        hour,
        count: 0,
        duplicateCount: 0,
        completenessSum: 0,
        focusSum: 0,
        validCount: 0
      };
    }

    hourlyData[hour].count++;
    if (metric.isDuplicate) hourlyData[hour].duplicateCount++;
    hourlyData[hour].completenessSum += metric.completenessScore;
    hourlyData[hour].focusSum += metric.focusScore;
    if (metric.isValid) hourlyData[hour].validCount++;
  }

  return Object.values(hourlyData)
    .sort((a, b) => a.hour.localeCompare(b.hour))
    .map((h) => ({
      hour: h.hour,
      count: h.count,
      duplicateRate: (h.duplicateCount / h.count) * 100,
      avgCompletenessScore: h.completenessSum / h.count,
      avgFocusScore: h.focusSum / h.count,
      validRate: (h.validCount / h.count) * 100
    }));
}

/**
 * Get daily metrics aggregation
 */
export function getDailyMetrics(options: {
  daysBack?: number;
} = {}) {
  const daysBack = options.daysBack || 7;
  const startTime = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const metrics = readAllMetrics().filter((m) => new Date(m.timestamp) >= startTime);

  const dailyData: Record<string, {
    day: string;
    count: number;
    duplicateCount: number;
    completenessSum: number;
    focusSum: number;
    validCount: number;
  }> = {};

  for (const metric of metrics) {
    const day = new Date(metric.timestamp).toISOString().slice(0, 10);

    if (!dailyData[day]) {
      dailyData[day] = {
        day,
        count: 0,
        duplicateCount: 0,
        completenessSum: 0,
        focusSum: 0,
        validCount: 0
      };
    }

    dailyData[day].count++;
    if (metric.isDuplicate) dailyData[day].duplicateCount++;
    dailyData[day].completenessSum += metric.completenessScore;
    dailyData[day].focusSum += metric.focusScore;
    if (metric.isValid) dailyData[day].validCount++;
  }

  return Object.values(dailyData)
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => ({
      day: d.day,
      count: d.count,
      duplicateRate: (d.duplicateCount / d.count) * 100,
      avgCompletenessScore: d.completenessSum / d.count,
      avgFocusScore: d.focusSum / d.count,
      validRate: (d.validCount / d.count) * 100
    }));
}

/**
 * Get recent metrics
 */
export function getRecentMetrics(limit: number = 50) {
  return readAllMetrics()
    .slice(-limit)
    .map((m) => ({
      timestamp: m.timestamp,
      isDuplicate: m.isDuplicate,
      duplicateSimilarity: m.duplicateSimilarity,
      isComplete: m.isComplete,
      completenessScore: m.completenessScore,
      isFocused: m.isFocused,
      focusScore: m.focusScore,
      isValid: m.isValid
    }));
}

/**
 * Clear all metrics (for testing)
 */
export function clearMetrics() {
  try {
    if (fs.existsSync(METRICS_FILE)) {
      fs.unlinkSync(METRICS_FILE);
    }
  } catch (error) {
    console.error("[METRICS] Error clearing metrics:", error);
  }
}

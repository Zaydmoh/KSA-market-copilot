/**
 * Telemetry and Logging Infrastructure
 * Captures metrics for pack performance, retrieval quality, and errors
 */

export interface PackTelemetry {
  packId: string;
  packVersion: string;
  analysisId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'started' | 'completed' | 'failed';
  score?: number;
  checklistItemCount?: number;
  citationCount?: number;
  citationCoverage?: number; // Percentage of items with citations
  error?: string;
}

export interface RetrievalTelemetry {
  packId: string;
  analysisId: string;
  checklistItemKey: string;
  query: string;
  querySizeChars: number;
  resultsReturned: number;
  topConfidence?: number;
  avgConfidence?: number;
  retrievalTimeMs: number;
  success: boolean;
  error?: string;
}

export interface ErrorTelemetry {
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  component: string;
  message: string;
  details?: any;
  stack?: string;
  userId?: string;
  analysisId?: string;
}

/**
 * In-memory telemetry store (will be persisted to DB in production)
 */
class TelemetryStore {
  private packTelemetry: PackTelemetry[] = [];
  private retrievalTelemetry: RetrievalTelemetry[] = [];
  private errors: ErrorTelemetry[] = [];

  private maxInMemory = 1000; // Keep last 1000 entries

  /**
   * Log pack analysis start
   */
  logPackStart(packId: string, packVersion: string, analysisId: string): void {
    const telemetry: PackTelemetry = {
      packId,
      packVersion,
      analysisId,
      startTime: Date.now(),
      status: 'started',
    };

    this.packTelemetry.push(telemetry);
    this.trimStore(this.packTelemetry);

    console.log(`[Telemetry] Pack started: ${packId} (${analysisId})`);
  }

  /**
   * Log pack analysis completion
   */
  logPackComplete(
    analysisId: string,
    packId: string,
    duration: number,
    score: number,
    checklistItemCount: number,
    citationCount: number
  ): void {
    const existing = this.packTelemetry.find(
      (t) => t.analysisId === analysisId && t.packId === packId && t.status === 'started'
    );

    if (existing) {
      existing.endTime = Date.now();
      existing.duration = duration;
      existing.status = 'completed';
      existing.score = score;
      existing.checklistItemCount = checklistItemCount;
      existing.citationCount = citationCount;
      existing.citationCoverage =
        checklistItemCount > 0 ? (citationCount / checklistItemCount) * 100 : 0;
    } else {
      const telemetry: PackTelemetry = {
        packId,
        packVersion: 'unknown',
        analysisId,
        startTime: Date.now() - duration,
        endTime: Date.now(),
        duration,
        status: 'completed',
        score,
        checklistItemCount,
        citationCount,
        citationCoverage: checklistItemCount > 0 ? (citationCount / checklistItemCount) * 100 : 0,
      };

      this.packTelemetry.push(telemetry);
      this.trimStore(this.packTelemetry);
    }

    console.log(
      `[Telemetry] Pack completed: ${packId} in ${duration}ms (score: ${score}, citations: ${citationCount}/${checklistItemCount})`
    );
  }

  /**
   * Log pack analysis failure
   */
  logPackFailure(analysisId: string, packId: string, error: string): void {
    const existing = this.packTelemetry.find(
      (t) => t.analysisId === analysisId && t.packId === packId && t.status === 'started'
    );

    if (existing) {
      existing.endTime = Date.now();
      existing.duration = existing.endTime - existing.startTime;
      existing.status = 'failed';
      existing.error = error;
    } else {
      const telemetry: PackTelemetry = {
        packId,
        packVersion: 'unknown',
        analysisId,
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        status: 'failed',
        error,
      };

      this.packTelemetry.push(telemetry);
      this.trimStore(this.packTelemetry);
    }

    console.error(`[Telemetry] Pack failed: ${packId} - ${error}`);
  }

  /**
   * Log KB retrieval metrics
   */
  logRetrieval(data: Omit<RetrievalTelemetry, 'success'>): void {
    const telemetry: RetrievalTelemetry = {
      ...data,
      success: data.resultsReturned > 0,
    };

    this.retrievalTelemetry.push(telemetry);
    this.trimStore(this.retrievalTelemetry);

    if (data.resultsReturned > 0) {
      console.log(
        `[Telemetry] Retrieval: ${data.packId}/${data.checklistItemKey} - ${data.resultsReturned} results in ${data.retrievalTimeMs}ms (top: ${data.topConfidence?.toFixed(2)})`
      );
    } else {
      console.warn(
        `[Telemetry] Retrieval: ${data.packId}/${data.checklistItemKey} - No results found`
      );
    }
  }

  /**
   * Log error
   */
  logError(
    component: string,
    message: string,
    details?: any,
    level: 'error' | 'warning' | 'info' = 'error'
  ): void {
    const error: ErrorTelemetry = {
      timestamp: Date.now(),
      level,
      component,
      message,
      details,
      stack: details instanceof Error ? details.stack : undefined,
    };

    this.errors.push(error);
    this.trimStore(this.errors);

    const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
    logFn(`[Telemetry] ${level.toUpperCase()}: ${component} - ${message}`, details);
  }

  /**
   * Get pack telemetry statistics
   */
  getPackStats(): {
    totalAnalyses: number;
    avgDurationMs: number;
    avgScore: number;
    avgCitationCoverage: number;
    failureRate: number;
    byPack: Record<
      string,
      {
        count: number;
        avgDurationMs: number;
        avgScore: number;
        avgCitationCoverage: number;
        failures: number;
      }
    >;
  } {
    const completed = this.packTelemetry.filter((t) => t.status === 'completed');
    const failed = this.packTelemetry.filter((t) => t.status === 'failed');

    const byPack: Record<string, any> = {};

    for (const t of completed) {
      if (!byPack[t.packId]) {
        byPack[t.packId] = {
          count: 0,
          totalDuration: 0,
          totalScore: 0,
          totalCoverage: 0,
          failures: 0,
        };
      }

      byPack[t.packId].count++;
      byPack[t.packId].totalDuration += t.duration || 0;
      byPack[t.packId].totalScore += t.score || 0;
      byPack[t.packId].totalCoverage += t.citationCoverage || 0;
    }

    for (const t of failed) {
      if (!byPack[t.packId]) {
        byPack[t.packId] = {
          count: 0,
          totalDuration: 0,
          totalScore: 0,
          totalCoverage: 0,
          failures: 0,
        };
      }
      byPack[t.packId].failures++;
    }

    // Calculate averages
    for (const packId in byPack) {
      const data = byPack[packId];
      byPack[packId] = {
        count: data.count,
        avgDurationMs: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
        avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
        avgCitationCoverage: data.count > 0 ? Math.round(data.totalCoverage / data.count) : 0,
        failures: data.failures,
      };
    }

    return {
      totalAnalyses: completed.length,
      avgDurationMs:
        completed.length > 0
          ? Math.round(
              completed.reduce((sum, t) => sum + (t.duration || 0), 0) / completed.length
            )
          : 0,
      avgScore:
        completed.length > 0
          ? Math.round(completed.reduce((sum, t) => sum + (t.score || 0), 0) / completed.length)
          : 0,
      avgCitationCoverage:
        completed.length > 0
          ? Math.round(
              completed.reduce((sum, t) => sum + (t.citationCoverage || 0), 0) / completed.length
            )
          : 0,
      failureRate:
        this.packTelemetry.length > 0 ? (failed.length / this.packTelemetry.length) * 100 : 0,
      byPack,
    };
  }

  /**
   * Get retrieval statistics
   */
  getRetrievalStats(): {
    totalQueries: number;
    successRate: number;
    avgResultsReturned: number;
    avgConfidence: number;
    avgRetrievalTimeMs: number;
    byPack: Record<
      string,
      {
        queries: number;
        successRate: number;
        avgConfidence: number;
      }
    >;
  } {
    const byPack: Record<string, any> = {};

    for (const t of this.retrievalTelemetry) {
      if (!byPack[t.packId]) {
        byPack[t.packId] = {
          queries: 0,
          successes: 0,
          totalConfidence: 0,
          confidenceCount: 0,
        };
      }

      byPack[t.packId].queries++;
      if (t.success) byPack[t.packId].successes++;
      if (t.avgConfidence) {
        byPack[t.packId].totalConfidence += t.avgConfidence;
        byPack[t.packId].confidenceCount++;
      }
    }

    // Calculate averages
    for (const packId in byPack) {
      const data = byPack[packId];
      byPack[packId] = {
        queries: data.queries,
        successRate: data.queries > 0 ? (data.successes / data.queries) * 100 : 0,
        avgConfidence:
          data.confidenceCount > 0 ? data.totalConfidence / data.confidenceCount : 0,
      };
    }

    const successful = this.retrievalTelemetry.filter((t) => t.success);

    return {
      totalQueries: this.retrievalTelemetry.length,
      successRate:
        this.retrievalTelemetry.length > 0
          ? (successful.length / this.retrievalTelemetry.length) * 100
          : 0,
      avgResultsReturned:
        this.retrievalTelemetry.length > 0
          ? this.retrievalTelemetry.reduce((sum, t) => sum + t.resultsReturned, 0) /
            this.retrievalTelemetry.length
          : 0,
      avgConfidence:
        successful.length > 0
          ? successful.reduce((sum, t) => sum + (t.avgConfidence || 0), 0) / successful.length
          : 0,
      avgRetrievalTimeMs:
        this.retrievalTelemetry.length > 0
          ? Math.round(
              this.retrievalTelemetry.reduce((sum, t) => sum + t.retrievalTimeMs, 0) /
                this.retrievalTelemetry.length
            )
          : 0,
      byPack,
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    byLevel: Record<string, number>;
    byComponent: Record<string, number>;
    recent: ErrorTelemetry[];
  } {
    const byLevel: Record<string, number> = {};
    const byComponent: Record<string, number> = {};

    for (const error of this.errors) {
      byLevel[error.level] = (byLevel[error.level] || 0) + 1;
      byComponent[error.component] = (byComponent[error.component] || 0) + 1;
    }

    return {
      totalErrors: this.errors.length,
      byLevel,
      byComponent,
      recent: this.errors.slice(-10), // Last 10 errors
    };
  }

  /**
   * Print telemetry dashboard to console
   */
  printDashboard(): void {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  📊 TELEMETRY DASHBOARD');
    console.log('═══════════════════════════════════════════════════════\n');

    const packStats = this.getPackStats();
    console.log('📦 Pack Analysis:');
    console.log(`   Total Analyses: ${packStats.totalAnalyses}`);
    console.log(`   Avg Duration: ${packStats.avgDurationMs}ms`);
    console.log(`   Avg Score: ${packStats.avgScore}/100`);
    console.log(`   Avg Citation Coverage: ${packStats.avgCitationCoverage.toFixed(1)}%`);
    console.log(`   Failure Rate: ${packStats.failureRate.toFixed(1)}%\n`);

    console.log('   By Pack:');
    for (const [packId, stats] of Object.entries(packStats.byPack)) {
      console.log(`     ${packId}:`);
      console.log(`       Count: ${stats.count}`);
      console.log(`       Avg Duration: ${stats.avgDurationMs}ms`);
      console.log(`       Avg Score: ${stats.avgScore}/100`);
      console.log(`       Citation Coverage: ${stats.avgCitationCoverage}%`);
      if (stats.failures > 0) {
        console.log(`       Failures: ${stats.failures}`);
      }
    }

    const retrievalStats = this.getRetrievalStats();
    console.log('\n🔍 KB Retrieval:');
    console.log(`   Total Queries: ${retrievalStats.totalQueries}`);
    console.log(`   Success Rate: ${retrievalStats.successRate.toFixed(1)}%`);
    console.log(`   Avg Results Returned: ${retrievalStats.avgResultsReturned.toFixed(1)}`);
    console.log(`   Avg Confidence: ${retrievalStats.avgConfidence.toFixed(2)}`);
    console.log(`   Avg Retrieval Time: ${retrievalStats.avgRetrievalTimeMs}ms\n`);

    const errorStats = this.getErrorStats();
    console.log('⚠️  Errors:');
    console.log(`   Total: ${errorStats.totalErrors}`);
    for (const [level, count] of Object.entries(errorStats.byLevel)) {
      console.log(`     ${level}: ${count}`);
    }

    if (errorStats.recent.length > 0) {
      console.log('\n   Recent Errors:');
      for (const error of errorStats.recent.slice(0, 5)) {
        console.log(`     [${error.level}] ${error.component}: ${error.message}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════\n');
  }

  /**
   * Trim store to max size
   */
  private trimStore<T>(store: T[]): void {
    if (store.length > this.maxInMemory) {
      store.splice(0, store.length - this.maxInMemory);
    }
  }

  /**
   * Clear all telemetry
   */
  clear(): void {
    this.packTelemetry = [];
    this.retrievalTelemetry = [];
    this.errors = [];
  }
}

/**
 * Global telemetry instance
 */
export const telemetry = new TelemetryStore();


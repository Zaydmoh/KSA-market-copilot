'use client';

/**
 * Phase 2: Analysis Results Page
 * Displays per-pack status, scores, and checklist results
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PACKS } from '@/lib/packs/registry';

interface AnalysisStatus {
  analysisId: string;
  overallStatus: 'processing' | 'completed' | 'partial' | 'failed';
  progress: number;
  createdAt: string;
  packs: Array<{
    packId: string;
    status: string;
    score?: number;
    error?: string;
  }>;
}

export default function AnalysisResultsPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params?.analysisId as string;

  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch analysis status
   */
  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/run/${analysisId}/status`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to fetch status');
      }

      const data = await response.json();
      setStatus(data.data);
      setError(null);
    } catch (err) {
      console.error('Status fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!analysisId) {
      router.push('/run');
      return;
    }

    fetchStatus();

    // Poll for updates every 2 seconds if still processing
    const interval = setInterval(() => {
      if (status?.overallStatus === 'processing') {
        fetchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [analysisId, router, status?.overallStatus]);

  /**
   * Get status badge color
   */
  const getStatusColor = (packStatus: string) => {
    switch (packStatus) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'analyzing':
        return 'bg-blue-100 text-blue-800';
      case 'extracting':
        return 'bg-yellow-100 text-yellow-800';
      case 'queued':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {error || 'Analysis not found'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/run')}>
            Start New Analysis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Analysis Results
          </h1>
          <p className="text-slate-600">
            Analysis ID: <code className="text-sm bg-slate-100 px-2 py-1 rounded">{analysisId}</code>
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Started: {new Date(status.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Overall Progress
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              status.overallStatus === 'completed' 
                ? 'bg-green-100 text-green-800'
                : status.overallStatus === 'failed'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {status.overallStatus}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-600">
            {status.progress}% complete
          </p>
        </Card>

        {/* Pack Status */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Compliance Packs
          </h2>
          
          <div className="space-y-4">
            {status.packs.map(pack => {
              const packInfo = PACKS[pack.packId as keyof typeof PACKS];
              
              return (
                <div
                  key={pack.packId}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-slate-900">
                        {packInfo?.title || pack.packId}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(pack.status)}`}>
                        {pack.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {packInfo?.description || 'No description'}
                    </p>
                    {pack.error && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {pack.error}
                      </p>
                    )}
                  </div>
                  
                  {pack.score !== undefined && (
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-slate-900">
                        {pack.score}
                      </div>
                      <div className="text-xs text-slate-500">
                        Score
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Info Note */}
        <Alert className="mb-6">
          <AlertDescription>
            <strong>Note:</strong> Detailed pack results and checklist items will be displayed here
            once pack implementations are complete (Task 2.0+). For now, this page shows the
            orchestration status.
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => router.push('/run')}
          >
            Start New Analysis
          </Button>
          
          {status.overallStatus === 'processing' && (
            <Button
              variant="outline"
              onClick={fetchStatus}
            >
              Refresh Status
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


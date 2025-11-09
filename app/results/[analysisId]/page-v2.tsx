/**
 * Phase 2 Task 6.3: Comprehensive Results UI
 * Displays analysis results with pack tabs, scores, and checklists
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PACK_METADATA } from '@/lib/packs/client-registry';
import PackChecklist from '@/components/PackChecklist';
import { PackResult } from '@/lib/packs/types';

interface AnalysisStatus {
  analysisId: string;
  overallStatus: 'queued' | 'processing' | 'completed' | 'partial' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  locale: string;
  filename?: string;
  packs: Array<{
    analysisPackId: string;
    packId: string;
    status: string;
    score?: number;
    error?: string;
    startedAt?: string;
    completedAt?: string;
  }>;
}

interface PackAnalysisDetail {
  success: boolean;
  analysisPack: {
    analysis_pack_id: string;
    analysis_id: string;
    pack_id: string;
    status: string;
    inputs_json: Record<string, any>;
    output_json: PackResult;
    score: number | null;
    error_message: string | null;
    started_at: string | null;
    completed_at: string | null;
    citations: Array<{
      citation_id: string;
      checklist_item_key: string;
      chunk_id: string;
      confidence: number;
    }>;
  };
}

export default function AnalysisResultsPageV2() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params?.analysisId as string;

  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [packDetails, setPackDetails] = useState<Record<string, PackAnalysisDetail>>({});
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

      // Set first completed pack as selected if none selected
      if (!selectedPackId) {
        const completedPack = data.data.packs.find(
          (p: any) => p.status === 'completed'
        );
        if (completedPack) {
          setSelectedPackId(completedPack.packId);
        }
      }
    } catch (err) {
      console.error('[Results] Status fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis status');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch detailed results for a specific pack
   */
  const fetchPackDetails = async (analysisPackId: string) => {
    if (packDetails[analysisPackId]) {
      return; // Already fetched
    }

    try {
      const response = await fetch(`/api/analyze?analysisPackId=${analysisPackId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch pack details');
      }

      const data = await response.json();
      setPackDetails((prev) => ({
        ...prev,
        [analysisPackId]: data,
      }));
    } catch (err) {
      console.error('[Results] Pack fetch error:', err);
    }
  };

  useEffect(() => {
    if (!analysisId) {
      router.push('/run');
      return;
    }

    fetchStatus();

    // Poll for updates every 3 seconds if still processing
    const interval = setInterval(() => {
      if (status?.overallStatus === 'processing' || status?.overallStatus === 'queued') {
        fetchStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [analysisId, router]);

  // Fetch pack details when a pack is selected
  useEffect(() => {
    if (selectedPackId && status) {
      const pack = status.packs.find((p) => p.packId === selectedPackId);
      if (pack && pack.status === 'completed') {
        fetchPackDetails(pack.analysisPackId);
      }
    }
  }, [selectedPackId, status]);

  /**
   * Get status badge color
   */
  const getStatusColor = (packStatus: string) => {
    switch (packStatus) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'analyzing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'extracting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'queued':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  /**
   * Export results as PDF
   */
  const handleExport = async () => {
    // TODO: Implement PDF export
    alert('PDF export coming soon!');
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

  const selectedPack = status.packs.find((p) => p.packId === selectedPackId);
  const selectedPackInfo = selectedPack ? PACK_METADATA[selectedPack.packId as keyof typeof PACK_METADATA] : null;
  const selectedPackDetail = selectedPack ? packDetails[selectedPack.analysisPackId] : null;

  // Calculate overall score
  const completedPacks = status.packs.filter((p) => p.status === 'completed' && p.score !== undefined);
  const overallScore = completedPacks.length > 0
    ? Math.round(completedPacks.reduce((sum, p) => sum + (p.score || 0), 0) / completedPacks.length)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                KSA Compliance Analysis Results
              </h1>
              <div className="mt-1 flex items-center gap-4 text-sm text-slate-600">
                {status.filename && <span>Document: {status.filename}</span>}
                <span>•</span>
                <span>{new Date(status.createdAt).toLocaleString()}</span>
                {overallScore !== null && (
                  <>
                    <span>•</span>
                    <span className="font-semibold">Overall Score: {overallScore}/100</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleExport}>
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => router.push('/run')}>
                New Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Progress Card (only if not completed) */}
        {status.overallStatus !== 'completed' && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Analysis Progress
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                status.overallStatus === 'completed' 
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : status.overallStatus === 'failed'
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-blue-100 text-blue-800 border-blue-200'
              }`}>
                {status.overallStatus}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${status.progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-600">
              {status.progress}% complete • {status.packs.filter(p => p.status === 'completed').length} of {status.packs.length} packs
            </p>
          </Card>
        )}

        {/* Pack Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          {/* Tabs Header */}
          <div className="border-b border-slate-200 px-6">
            <div className="flex gap-4 overflow-x-auto">
              {status.packs.map((pack) => {
                const packInfo = PACK_METADATA[pack.packId as keyof typeof PACK_METADATA];
                const isSelected = selectedPackId === pack.packId;

                return (
                  <button
                    key={pack.packId}
                    onClick={() => setSelectedPackId(pack.packId)}
                    className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{packInfo?.title || pack.packId}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(pack.status)}`}>
                        {pack.status}
                      </span>
                      {pack.score !== undefined && (
                        <span className="text-xs font-semibold text-slate-500">
                          ({pack.score})
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {selectedPack && selectedPackInfo ? (
              <>
                {/* Pack Header */}
                <div className="mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-2">
                        {selectedPackInfo.title}
                      </h2>
                      <p className="text-sm text-slate-600 mb-2">
                        {selectedPackInfo.description}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-500">
                          Version: <span className="font-mono">{selectedPackInfo.version}</span>
                        </span>
                        {selectedPack.startedAt && (
                          <span className="text-slate-500">
                            Started: {new Date(selectedPack.startedAt).toLocaleTimeString()}
                          </span>
                        )}
                        {selectedPack.completedAt && (
                          <span className="text-slate-500">
                            Completed: {new Date(selectedPack.completedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedPack.score !== undefined && (
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${
                          selectedPack.score >= 80 
                            ? 'text-green-600'
                            : selectedPack.score >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {selectedPack.score}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Compliance Score
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pack Content */}
                {selectedPack.status === 'completed' && selectedPackDetail?.analysisPack.output_json ? (
                  <PackChecklist
                    checklist={selectedPackDetail.analysisPack.output_json.checklist}
                    packTitle={selectedPackInfo.title}
                  />
                ) : selectedPack.status === 'analyzing' || selectedPack.status === 'extracting' ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">Analyzing...</p>
                  </div>
                ) : selectedPack.status === 'queued' ? (
                  <div className="text-center py-12">
                    <p className="text-slate-600">Analysis queued...</p>
                  </div>
                ) : selectedPack.status === 'failed' ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Analysis failed: {selectedPack.error || 'Unknown error'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-600">No results available yet.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600">Select a pack to view results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


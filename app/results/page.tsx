'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import ComplianceChecklist from '@/components/ComplianceChecklist';
import CitationsList from '@/components/CitationsList';
import type { AnalysisResult } from '@/lib/types';

export default function ResultsPage() {
  const router = useRouter();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve analysis result from sessionStorage
    const storedResult = sessionStorage.getItem('analysisResult');
    
    if (!storedResult) {
      // No result found, redirect back to home
      router.push('/');
      return;
    }

    try {
      const parsed = JSON.parse(storedResult) as AnalysisResult;
      setAnalysisResult(parsed);
    } catch (error) {
      console.error('Failed to parse analysis result:', error);
      router.push('/');
    }
  }, [router]);

  const handleExportPDF = async () => {
    if (!analysisResult) return;

    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisResult),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `misa-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      setExportError('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleNewAnalysis = () => {
    sessionStorage.removeItem('analysisResult');
    router.push('/');
  };

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                MISA Licensing Analysis Report
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Generated on {timestamp}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleNewAnalysis}
              >
                New Analysis
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                {isExporting ? 'Generating PDF...' : 'Download Report'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Disclaimer Alert */}
        <Alert className="mb-6">
          <AlertDescription>
            <strong>⚠️ Important Disclaimer:</strong> This is an AI-generated analysis and 
            should be reviewed by qualified legal and compliance professionals before making 
            business decisions. Always verify requirements with official MISA sources.
          </AlertDescription>
        </Alert>

        {/* Export Error */}
        {exportError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{exportError}</AlertDescription>
          </Alert>
        )}

        {/* Executive Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">
              {analysisResult.executiveSummary}
            </p>
          </CardContent>
        </Card>

        {/* Applicable Licenses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Applicable License Type(s)</CardTitle>
            <CardDescription>
              Based on the document analysis, the following MISA license types may apply
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisResult.applicableLicenses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysisResult.applicableLicenses.map((license, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-blue-100 text-blue-900 rounded-lg font-medium"
                  >
                    {license}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">
                No specific license types identified. Please review the compliance checklist below.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Compliance Checklist */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Compliance Checklist</CardTitle>
            <CardDescription>
              Review of requirements against MISA licensing regulations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComplianceChecklist checklist={analysisResult.checklist} />
          </CardContent>
        </Card>

        {/* Citations */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Regulatory Citations</CardTitle>
            <CardDescription>
              References to specific MISA regulations and articles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CitationsList citations={analysisResult.citations} />
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Recommended Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-slate-700">
              <li>Review all items marked as "Missing" or "Unclear" in the checklist</li>
              <li>Consult with legal and compliance professionals for verification</li>
              <li>Visit official MISA portal at{' '}
                <a 
                  href="https://misa.gov.sa" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  misa.gov.sa
                </a>
                {' '}for current requirements
              </li>
              <li>Prepare missing documentation as identified in recommendations</li>
              <li>Consider engaging with MISA directly for specific guidance</li>
            </ol>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4 py-8">
          <Button
            variant="outline"
            size="lg"
            onClick={handleNewAnalysis}
          >
            Analyze Another Document
          </Button>
          <Button
            size="lg"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? 'Generating PDF...' : 'Download PDF Report'}
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-600">
          <p>
            KSA Market-Entry Copilot • Phase 1 MVP • MISA Licensing Analysis
          </p>
          <p className="mt-2">
            For official information, visit{' '}
            <a 
              href="https://misa.gov.sa" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              misa.gov.sa
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}


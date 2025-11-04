'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileUpload from '@/components/FileUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { AnalysisResult } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append('file', file);

      // Call the analyze API endpoint
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Analysis failed');
      }

      const data = await response.json();
      
      // Store analysis result in sessionStorage and navigate to results page
      sessionStorage.setItem('analysisResult', JSON.stringify(data.data));
      router.push('/results');
    } catch (err) {
      console.error('Error analyzing document:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">
            KSA Market-Entry Copilot
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            AI-powered MISA licensing compliance analysis
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Analyze Your Business Documents for MISA Compliance
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload your RFP, contract, or business plan and receive instant analysis
            of Saudi Arabian licensing requirements with official citations.
          </p>
        </div>

        {/* Upload Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Your Document</CardTitle>
            <CardDescription>
              Upload a PDF file (max 10MB) to analyze against MISA licensing requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onFileSelect={handleFileSelect} />
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Disclaimer */}
        <Alert className="mb-8">
          <AlertDescription className="text-sm">
            <strong>Disclaimer:</strong> This tool provides AI-generated analysis for
            informational purposes only. Results should be reviewed by qualified legal
            and compliance professionals before making business decisions. The analysis
            is based on MISA regulations and may not reflect the most recent updates.
          </AlertDescription>
        </Alert>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 Compliance Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Get a detailed checklist of MISA requirements with clear status
                indicators for what&apos;s addressed, missing, or unclear.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📖 Official Citations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Every requirement includes citations to specific MISA regulation
                articles and sections for easy verification.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Actionable Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Receive specific, actionable recommendations for addressing compliance
                gaps and improving your documentation.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Process Steps */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Upload PDF</h4>
              <p className="text-sm text-slate-600">
                Select your RFP, contract, or business plan
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <p className="text-sm text-slate-600">
                Document is analyzed against MISA regulations
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Review Results</h4>
              <p className="text-sm text-slate-600">
                See compliance checklist with citations
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2">Export Report</h4>
              <p className="text-sm text-slate-600">
                Download professional PDF report
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-600">
          <p>
            KSA Market-Entry Copilot • Phase 1 MVP • For MISA Licensing Analysis Only
          </p>
          <p className="mt-2">
            Analysis time: Up to 2 minutes • Supported file: PDF (max 10MB)
          </p>
        </div>
      </footer>
    </div>
  );
}

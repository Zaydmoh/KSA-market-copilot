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
  const [extractedText, setExtractedText] = useState<string>('');

  const analyzeText = async (text: string, docName: string): Promise<AnalysisResult> => {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, docName }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error?.message || 'Analysis failed');
    }
    if (!payload.success || !payload.data) {
      throw new Error('Invalid response from analysis endpoint');
    }
    return payload.data;
  };

  const handleFileSelect = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Build form data
      const formData = new FormData();
      formData.append('file', file);

      // Call our Node route (no DOMMatrix needed)
      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      // Handle errors cleanly
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload?.error?.message || 'Failed to extract text from PDF'
        );
      }

      let text = '';
      
      // If immediate response (rare)
      if (response.status === 200 && payload.text) {
        text = payload.text;
      } 
      // If async processing (202 with hash)
      else if (response.status === 202 && payload.hash) {
        const hash = payload.hash;
        console.log('Processing async, hash:', hash);
        
        // Poll for result
        const maxTries = 30; // 60 seconds max
        for (let i = 0; i < maxTries; i++) {
          await new Promise(r => setTimeout(r, 2000)); // Wait 2s between polls
          
          const statusRes = await fetch(`/api/extract?hash=${encodeURIComponent(hash)}`);
          const statusData = await statusRes.json().catch(() => ({}));
          
          if (!statusRes.ok) {
            throw new Error(statusData?.error?.message || 'Failed to retrieve text');
          }
          
          // If still processing, continue polling
          if (statusRes.status === 202) {
            console.log('Still processing...', statusData.status);
            continue;
          }
          
          // If completed, get text
          if (statusRes.status === 200 && statusData.text) {
            text = statusData.text;
            break;
          }
        }
        
        if (!text) {
          throw new Error('Timed out waiting for PDF processing');
        }
      }

      // Log extraction result
      console.log('EXTRACT RESULT:', { length: text.length, preview: text.slice(0, 200) });

      // Keep in state
      setExtractedText(text);
      
      // Analyze the extracted text
      console.log('Starting analysis...');
      const analysisResult = await analyzeText(text, file.name);
      console.log('Analysis completed successfully');
      
      // Store result in sessionStorage for results page
      sessionStorage.setItem('analysisResult', JSON.stringify(analysisResult));
      
      // Navigate to results page
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

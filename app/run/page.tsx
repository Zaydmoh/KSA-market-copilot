'use client';

/**
 * Phase 2: Run Setup Page
 * Select packs, configure inputs, upload document, and start analysis
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileUpload from '@/components/FileUpload';
import { PACKS } from '@/lib/packs/registry';
import { PackId } from '@/lib/packs/types';

export default function RunPage() {
  const router = useRouter();
  
  // State
  const [selectedPacks, setSelectedPacks] = useState<Set<PackId>>(new Set());
  const [packInputs, setPackInputs] = useState<Record<string, Record<string, unknown>>>({});
  const [_selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Toggle pack selection
   */
  const togglePack = (packId: PackId) => {
    const newSelected = new Set(selectedPacks);
    if (newSelected.has(packId)) {
      newSelected.delete(packId);
      // Clear inputs for deselected pack
      const newInputs = { ...packInputs };
      delete newInputs[packId];
      setPackInputs(newInputs);
    } else {
      newSelected.add(packId);
      // Initialize empty inputs for new pack
      if (!packInputs[packId]) {
        setPackInputs({ ...packInputs, [packId]: {} });
      }
    }
    setSelectedPacks(newSelected);
    setValidationErrors({});
  };

  /**
   * Update pack input value (will be used in Task 2.0+ when pack inputs are implemented)
   */
  // const updatePackInput = (packId: string, field: string, value: unknown) => {
  //   setPackInputs({
  //     ...packInputs,
  //     [packId]: {
  //       ...(packInputs[packId] || {}),
  //       [field]: value,
  //     },
  //   });
  //   // Clear validation error for this field
  //   const errorKey = `${packId}.${field}`;
  //   if (validationErrors[errorKey]) {
  //     const newErrors = { ...validationErrors };
  //     delete newErrors[errorKey];
  //     setValidationErrors(newErrors);
  //   }
  // };

  /**
   * Handle file selection and extraction
   */
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setIsProcessing(true);

    try {
      // Extract text using existing /api/extract endpoint
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to extract PDF text');
      }

      const data = await response.json();
      setExtractedText(data.text || '');
      console.log(`Extracted ${data.text?.length || 0} characters from PDF`);
    } catch (err) {
      console.error('Extraction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract PDF text');
      setExtractedText(null);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Validate inputs before submission
   */
  const validateInputs = (): boolean => {
    const errors: Record<string, string> = {};

    // Check if at least one pack is selected
    if (selectedPacks.size === 0) {
      setError('Please select at least one compliance pack');
      return false;
    }

    // Check if file is uploaded and extracted
    if (!extractedText) {
      setError('Please upload a PDF document');
      return false;
    }

    // TODO: Validate pack-specific inputs once schemas are implemented
    // For now, this is a placeholder for Task 2.0+ pack implementations

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Submit the run
   */
  const handleSubmit = async () => {
    setError(null);

    // Validate
    if (!validateInputs()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create run via API
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: extractedText,
          packs: Array.from(selectedPacks),
          inputs: packInputs,
          locale: 'en',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to create analysis run');
      }

      const data = await response.json();
      const { analysisId } = data.data;

      console.log(`Created analysis run: ${analysisId}`);

      // Redirect to results page
      router.push(`/results/${analysisId}`);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
      setIsProcessing(false);
    }
  };

  // Get priority packs (Nitaqat and ZATCA first)
  const priorityPackIds: PackId[] = ['nitaqat', 'zatca_phase2'];
  const otherPackIds: PackId[] = ['pdpl', 'saber_sfda', 'rhq'];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            New Compliance Run
          </h1>
          <p className="text-slate-600">
            Select compliance packs, configure inputs, and upload your business document for analysis
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Pack Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            1. Select Compliance Packs
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Choose which KSA compliance areas to analyze
          </p>

          {/* Priority Packs */}
          <div className="space-y-3 mb-4">
            {priorityPackIds.map(packId => {
              const pack = PACKS[packId];
              const isSelected = selectedPacks.has(packId);
              
              return (
                <label
                  key={packId}
                  className={`
                    flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePack(packId)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">
                        {pack.title}
                      </span>
                      <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded">
                        {pack.version}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {pack.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Other Packs */}
          <details className="group">
            <summary className="text-sm font-medium text-slate-700 cursor-pointer hover:text-slate-900 mb-3">
              Additional Packs (Coming Soon)
            </summary>
            <div className="space-y-3 pl-4 border-l-2 border-slate-200">
              {otherPackIds.map(packId => {
                const pack = PACKS[packId];
                
                return (
                  <div
                    key={packId}
                    className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg bg-slate-50 opacity-60"
                  >
                    <input
                      type="checkbox"
                      disabled
                      className="mt-1 h-5 w-5 text-slate-400 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-700">
                          {pack.title}
                        </span>
                        <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-200 rounded">
                          {pack.version}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {pack.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        </Card>

        {/* Pack Inputs (will be populated in Task 2.0+) */}
        {selectedPacks.size > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              2. Configure Pack Settings
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Pack-specific input forms will appear here (implemented in Task 2.0+)
            </p>
            <div className="text-sm text-slate-500 italic">
              Selected: {Array.from(selectedPacks).map(id => PACKS[id].title).join(', ')}
            </div>
          </Card>
        )}

        {/* File Upload */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            {selectedPacks.size > 0 ? '3' : '2'}. Upload Business Document
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Upload the PDF document to analyze (e.g., business plan, license application)
          </p>
          <FileUpload onFileSelect={handleFileSelect} />
          
          {extractedText && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                ✓ Document extracted successfully ({extractedText.length.toLocaleString()} characters)
              </p>
            </div>
          )}
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isProcessing || selectedPacks.size === 0 || !extractedText}
            size="lg"
          >
            {isProcessing ? 'Processing...' : 'Start Analysis'}
          </Button>
        </div>
      </div>
    </div>
  );
}


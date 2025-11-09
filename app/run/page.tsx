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
import { PACK_METADATA } from '@/lib/packs/client-registry';
import { PackId } from '@/lib/packs/types';
import { AVAILABLE_SECTORS, getSectorName } from '@/lib/packs/nitaqat/calc';

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
    console.log('[Run] File selected:', file.name, file.size, 'bytes');
    setSelectedFile(file);
    setError(null);
    setIsProcessing(true);

    try {
      // Extract text using existing /api/extract endpoint
      const formData = new FormData();
      formData.append('file', file);

      console.log('[Run] Calling /api/extract...');
      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      console.log('[Run] Extract response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Run] Extract error response:', errorData);
        throw new Error(errorData.error?.message || 'Failed to extract PDF text');
      }

      const data = await response.json();
      console.log('[Run] Extract response data:', {
        hasText: !!data.text,
        textLength: data.text?.length || 0,
        keys: Object.keys(data)
      });

      if (!data.text || data.text.length === 0) {
        throw new Error('PDF extraction returned empty text. The PDF might be scanned images without OCR.');
      }

      setExtractedText(data.text);
      console.log(`[Run] ✓ Extracted ${data.text.length} characters from PDF`);
    } catch (err) {
      console.error('[Run] Extraction error:', err);
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

    // Validate Nitaqat inputs
    if (selectedPacks.has('nitaqat')) {
      const nitaqatInputs = packInputs.nitaqat as { sector?: string; headcount?: number; currentSaudiPct?: number } | undefined;
      if (!nitaqatInputs?.headcount || nitaqatInputs.headcount < 1) {
        setError('Nitaqat: Please enter a valid headcount (minimum 1 employee)');
        return false;
      }
      if (!nitaqatInputs.sector) {
        setError('Nitaqat: Please select an economic sector');
        return false;
      }
    }

    // Validate ZATCA Phase 2 inputs
    if (selectedPacks.has('zatca_phase2')) {
      const zatcaInputs = packInputs.zatca_phase2 as { erp?: string } | undefined;
      if (!zatcaInputs?.erp || zatcaInputs.erp.trim().length === 0) {
        setError('ZATCA: Please enter your ERP system name');
        return false;
      }
    }

    // TODO: Validate other pack inputs when implemented (Task 4.0+)

    setError(null);
    return true;
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
              const pack = PACK_METADATA[packId];
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
                const pack = PACK_METADATA[packId];
                
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

        {/* Pack Inputs */}
        {selectedPacks.size > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              2. Configure Pack Settings
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Provide information specific to each compliance pack
            </p>

            <div className="space-y-6">
              {/* Nitaqat Inputs */}
              {selectedPacks.has('nitaqat') && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Nitaqat (Saudization) Settings
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Sector */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Economic Sector <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={packInputs.nitaqat?.sector as string || 'other'}
                        onChange={(e) => {
                          setPackInputs({
                            ...packInputs,
                            nitaqat: {
                              ...(packInputs.nitaqat || {}),
                              sector: e.target.value,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {AVAILABLE_SECTORS.map(sectorKey => (
                          <option key={sectorKey} value={sectorKey}>
                            {getSectorName(sectorKey)}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        Select the primary economic sector of your business
                      </p>
                    </div>

                    {/* Headcount */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Total Headcount <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={packInputs.nitaqat?.headcount as number || ''}
                        onChange={(e) => {
                          setPackInputs({
                            ...packInputs,
                            nitaqat: {
                              ...(packInputs.nitaqat || {}),
                              headcount: parseInt(e.target.value) || 0,
                            },
                          });
                        }}
                        placeholder="e.g., 50"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Total number of employees in your company
                      </p>
                    </div>

                    {/* Current Saudi Percentage */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Current Saudization Percentage (optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={packInputs.nitaqat?.currentSaudiPct as number || ''}
                        onChange={(e) => {
                          setPackInputs({
                            ...packInputs,
                            nitaqat: {
                              ...(packInputs.nitaqat || {}),
                              currentSaudiPct: parseFloat(e.target.value) || undefined,
                            },
                          });
                        }}
                        placeholder="e.g., 25.5"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Current % of Saudi employees: (Saudi employees / Total employees) × 100
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ZATCA Inputs */}
              {selectedPacks.has('zatca_phase2') && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">
                    ZATCA e-Invoicing Phase 2 Settings
                  </h3>
                  
                  <div className="space-y-4">
                    {/* ERP System */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        ERP System <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={(packInputs.zatca_phase2 as { erp?: string })?.erp || ''}
                        onChange={(e) => {
                          setPackInputs({
                            ...packInputs,
                            zatca_phase2: {
                              ...(packInputs.zatca_phase2 || {}),
                              erp: e.target.value,
                            },
                          });
                        }}
                        placeholder="e.g., SAP, Oracle, Odoo, QuickBooks"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Name of your accounting/ERP software
                      </p>
                    </div>

                    {/* Current Invoice Format */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Current Invoice Format
                      </label>
                      <select
                        value={(packInputs.zatca_phase2 as { format?: string })?.format || 'Other'}
                        onChange={(e) => {
                          setPackInputs({
                            ...packInputs,
                            zatca_phase2: {
                              ...(packInputs.zatca_phase2 || {}),
                              format: e.target.value,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="PDF">PDF</option>
                        <option value="XML">XML</option>
                        <option value="UBL">UBL</option>
                        <option value="CSV">CSV</option>
                        <option value="Other">Other</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        Format you currently use for invoices
                      </p>
                    </div>

                    {/* API Capable */}
                    <div>
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={(packInputs.zatca_phase2 as { apiCapable?: boolean })?.apiCapable || false}
                          onChange={(e) => {
                            setPackInputs({
                              ...packInputs,
                              zatca_phase2: {
                                ...(packInputs.zatca_phase2 || {}),
                                apiCapable: e.target.checked,
                              },
                            });
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-700">
                            ERP supports API integration
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Can your ERP make API calls to external systems?
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Can Export Invoices */}
                    <div>
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={(packInputs.zatca_phase2 as { exportInvoices?: boolean })?.exportInvoices || false}
                          onChange={(e) => {
                            setPackInputs({
                              ...packInputs,
                              zatca_phase2: {
                                ...(packInputs.zatca_phase2 || {}),
                                exportInvoices: e.target.checked,
                              },
                            });
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-700">
                            Can export invoice data
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Does your ERP allow exporting invoice data (XML, CSV, etc.)?
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* B2B Percentage */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        B2B Transaction Percentage (optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={(packInputs.zatca_phase2 as { b2bPct?: number })?.b2bPct || ''}
                        onChange={(e) => {
                          setPackInputs({
                            ...packInputs,
                            zatca_phase2: {
                              ...(packInputs.zatca_phase2 || {}),
                              b2bPct: parseFloat(e.target.value) || undefined,
                            },
                          });
                        }}
                        placeholder="e.g., 60"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Approximate % of invoices issued to other businesses (vs consumers)
                      </p>
                    </div>

                    {/* PEPPOL */}
                    <div>
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={(packInputs.zatca_phase2 as { peppol?: boolean })?.peppol || false}
                          onChange={(e) => {
                            setPackInputs({
                              ...packInputs,
                              zatca_phase2: {
                                ...(packInputs.zatca_phase2 || {}),
                                peppol: e.target.checked,
                              },
                            });
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-slate-700">
                            Need PEPPOL network access
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            For international B2B e-invoicing (EU suppliers/customers)
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
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

        {/* Debug Info - Show why button might be disabled */}
        {(selectedPacks.size === 0 || !extractedText || isProcessing) && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <div className="text-xs text-blue-900">
              <div className="font-semibold mb-2">Ready to Start Analysis?</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {selectedPacks.size > 0 ? '✓' : '○'} 
                  <span className={selectedPacks.size > 0 ? 'text-green-700' : 'text-blue-600'}>
                    Pack selected: {selectedPacks.size > 0 ? `${selectedPacks.size} pack(s)` : 'None (select at least 1)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {extractedText ? '✓' : '○'} 
                  <span className={extractedText ? 'text-green-700' : 'text-blue-600'}>
                    Document uploaded: {extractedText ? `Yes (${extractedText.length.toLocaleString()} chars)` : 'No (upload a PDF)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!isProcessing ? '✓' : '○'} 
                  <span className={!isProcessing ? 'text-green-700' : 'text-blue-600'}>
                    Ready to process: {isProcessing ? 'Processing...' : 'Yes'}
                  </span>
                </div>
                {/* Show pack-specific validation hints */}
                {selectedPacks.has('nitaqat') && (
                  <div className="flex items-center gap-2 ml-4">
                    {packInputs.nitaqat?.headcount ? '✓' : '○'}
                    <span className={packInputs.nitaqat?.headcount ? 'text-green-700' : 'text-orange-600'}>
                      Nitaqat: Headcount {packInputs.nitaqat?.headcount ? 'provided' : 'required'}
                    </span>
                  </div>
                )}
                {selectedPacks.has('zatca_phase2') && (
                  <div className="flex items-center gap-2 ml-4">
                    {packInputs.zatca_phase2?.erp ? '✓' : '○'}
                    <span className={packInputs.zatca_phase2?.erp ? 'text-green-700' : 'text-orange-600'}>
                      ZATCA: ERP system {packInputs.zatca_phase2?.erp ? 'provided' : 'required'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

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


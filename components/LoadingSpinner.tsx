'use client';

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner Animation */}
        <div className="relative mx-auto mb-8">
          {/* Outer rotating circle */}
          <div className="w-20 h-20 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          
          {/* Document icon in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>

        {/* Main Message */}
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Analyzing document against MISA regulations...
        </h2>

        {/* Sub Message */}
        <p className="text-slate-600 mb-8">
          This may take up to 2 minutes
        </p>

        {/* Progress Steps */}
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-sm text-slate-600">Extracting text from PDF</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              </div>
              <span className="text-sm text-slate-700 font-medium">
                Analyzing against MISA requirements
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
              </div>
              <span className="text-sm text-slate-400">Generating compliance report</span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 text-sm text-slate-500">
          <p>💡 Tip: Analysis time depends on document length and complexity</p>
        </div>
      </div>
    </div>
  );
}


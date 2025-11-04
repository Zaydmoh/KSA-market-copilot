'use client';

import type { Citation } from '@/lib/types';

interface CitationsListProps {
  citations: Citation[];
}

/**
 * Individual citation item
 */
function CitationItem({ citation, index }: { citation: Citation; index: number }) {
  return (
    <div className="border-l-4 border-blue-500 bg-slate-50 px-4 py-3 rounded-r-lg">
      <div className="flex items-start gap-3">
        {/* Citation Number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-sm flex items-center justify-center">
          {index + 1}
        </div>

        {/* Citation Details */}
        <div className="flex-1 min-w-0">
          {/* Regulation Name */}
          <h4 className="font-semibold text-slate-900 mb-1">
            {citation.regulation}
          </h4>

          {/* Article/Section */}
          <p className="text-sm text-slate-700 mb-2">
            <span className="font-medium">Article/Section:</span>{' '}
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
              {citation.article}
            </span>
          </p>

          {/* URL Link */}
          {citation.url && citation.url.trim() !== '' && (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              View official source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main citations list component
 */
export default function CitationsList({ citations }: CitationsListProps) {
  // Remove duplicates based on regulation name and article
  const uniqueCitations = citations.filter(
    (citation, index, self) =>
      index ===
      self.findIndex(
        (c) => c.regulation === citation.regulation && c.article === citation.article
      )
  );

  if (citations.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No citations available.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header Info */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {uniqueCitations.length} regulation{uniqueCitations.length !== 1 ? 's' : ''} referenced
        </p>
        <div className="text-xs text-slate-500">
          Click links to view official sources
        </div>
      </div>

      {/* Citations List */}
      <div className="space-y-3">
        {uniqueCitations.map((citation, index) => (
          <CitationItem key={index} citation={citation} index={index} />
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-900 leading-relaxed">
              <strong>Note:</strong> These citations reference the regulations used for this
              analysis. Always verify current requirements with official MISA sources, as
              regulations may be updated. Visit{' '}
              <a
                href="https://misa.gov.sa"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-700"
              >
                misa.gov.sa
              </a>{' '}
              for the latest information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * Citation Panel Component
 * Displays source citations for checklist items with confidence scores
 */

'use client';

import React, { useState } from 'react';
import { CitationRef } from '@/lib/packs/types';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface CitationPanelProps {
  citations: CitationRef[];
  itemTitle: string;
}

export function CitationPanel({ citations, itemTitle }: CitationPanelProps) {
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);
  const [citationText, setCitationText] = useState<Record<string, string>>({});
  const [loadingText, setLoadingText] = useState<Record<string, boolean>>({});

  // Fetch citation text when expanded
  const handleExpand = async (chunkId: string) => {
    if (expandedCitation === chunkId) {
      setExpandedCitation(null);
      return;
    }

    setExpandedCitation(chunkId);

    // Fetch text if not already loaded
    if (!citationText[chunkId] && !loadingText[chunkId]) {
      setLoadingText((prev) => ({ ...prev, [chunkId]: true }));
      
      try {
        const response = await fetch(`/api/citations/${chunkId}`);
        const data = await response.json();
        
        if (data.success && data.citation) {
          setCitationText((prev) => ({ ...prev, [chunkId]: data.citation.text }));
        }
      } catch (error) {
        console.error('Failed to fetch citation text:', error);
        setCitationText((prev) => ({ ...prev, [chunkId]: 'Failed to load citation text.' }));
      } finally {
        setLoadingText((prev) => ({ ...prev, [chunkId]: false }));
      }
    }
  };

  if (citations.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No citations available for this item.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        Source Citations for: {itemTitle}
      </h4>
      <div className="grid gap-2">
        {citations.map((citation) => (
          <Card
            key={citation.chunkId}
            className="p-3 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                    {citation.regCode}
                  </span>
                  {citation.article && (
                    <span className="text-xs text-blue-700 font-medium">
                      {citation.article}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {citation.confidence !== undefined && (
                      <>
                        Confidence: {(citation.confidence * 100).toFixed(0)}%
                      </>
                    )}
                  </span>
                </div>

                {/* Version */}
                {citation.version && (
                  <div className="text-xs text-gray-600 mb-1">
                    Version: {citation.version}
                    {citation.publishedOn && ` • Published: ${citation.publishedOn}`}
                  </div>
                )}

                {/* Expand/Collapse Toggle */}
                <button
                  onClick={() => handleExpand(citation.chunkId)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  {expandedCitation === citation.chunkId ? 'Hide details' : 'View source text'}
                </button>

                {/* Expanded Content */}
                {expandedCitation === citation.chunkId && (
                  <div className="mt-2 p-2 bg-white border border-blue-200 rounded text-xs text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                    <div className="font-mono text-xs text-gray-500 mb-2">
                      Chunk ID: {citation.chunkId}
                    </div>
                    {loadingText[citation.chunkId] ? (
                      <div className="italic text-gray-500">Loading citation text...</div>
                    ) : citationText[citation.chunkId] ? (
                      <div className="text-xs text-gray-800 leading-relaxed">
                        {citationText[citation.chunkId]}
                      </div>
                    ) : (
                      <div className="italic text-gray-500">Click to load citation text</div>
                    )}
                  </div>
                )}
              </div>

              {/* External Link */}
              {citation.url && (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  title="View original regulation"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact Citation Badge
 * Shows citation count and can trigger a modal/panel
 */
interface CitationBadgeProps {
  count: number;
  onClick?: () => void;
}

export function CitationBadge({ count, onClick }: CitationBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
      title={`${count} citation${count !== 1 ? 's' : ''} available`}
    >
      <svg
        className="w-3 h-3"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
      <span>{count}</span>
    </button>
  );
}

/**
 * Modal for viewing full citation details
 */
interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  citations: CitationRef[];
  itemTitle: string;
}

export function CitationModal({ isOpen, onClose, citations, itemTitle }: CitationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Source Citations</h3>
          <Button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            variant="ghost"
          >
            ✕
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <CitationPanel citations={citations} itemTitle={itemTitle} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button onClick={onClose} variant="default">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}


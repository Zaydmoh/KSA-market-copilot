/**
 * Pack Checklist Component (Phase 2)
 * Displays pack analysis checklist with citations
 */

'use client';

import React, { useState } from 'react';
import { ChecklistItem, ChecklistItemStatus } from '@/lib/packs/types';
import { CitationBadge, CitationModal } from './CitationPanel';

interface PackChecklistProps {
  checklist: ChecklistItem[];
  packTitle: string;
}

/**
 * Returns icon and styling based on checklist item status
 */
function getStatusDisplay(status: ChecklistItemStatus, criticality: number): {
  icon: React.ReactElement;
  label: string;
  bgColor: string;
  textColor: string;
  badgeColor: string;
  borderColor: string;
} {
  const isCritical = criticality >= 4;
  
  switch (status) {
    case 'pass':
      return {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: 'Pass',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        badgeColor: 'bg-green-100 text-green-800',
        borderColor: 'border-green-200',
      };
    case 'warn':
      return {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: 'Warning',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        borderColor: 'border-yellow-200',
      };
    case 'fail':
      return {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: isCritical ? 'Critical' : 'Fail',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        badgeColor: isCritical ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800',
        borderColor: 'border-red-200',
      };
    case 'unknown':
      return {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        ),
        label: 'Unknown',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        badgeColor: 'bg-gray-100 text-gray-800',
        borderColor: 'border-gray-200',
      };
  }
}

/**
 * Individual checklist item with collapsible details
 */
function ChecklistItemCard({ item }: { item: ChecklistItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const statusDisplay = getStatusDisplay(item.status, item.criticality);

  return (
    <>
      <div
        className={`border-2 rounded-lg overflow-hidden transition-all ${
          isExpanded 
            ? `${statusDisplay.bgColor} ${statusDisplay.borderColor}` 
            : `bg-white border-gray-200 hover:border-gray-300`
        }`}
      >
        {/* Main Item Row */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-4 flex items-start gap-3 text-left"
        >
          {/* Status Icon */}
          <div className={`flex-shrink-0 mt-0.5 ${statusDisplay.textColor}`}>
            {statusDisplay.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Status Badge & Criticality */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded ${statusDisplay.badgeColor}`}>
                {statusDisplay.label}
              </span>
              {item.criticality >= 4 && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                  High Priority
                </span>
              )}
              <CitationBadge
                count={item.citations.length}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCitationModal(true);
                }}
              />
            </div>

            {/* Title */}
            <p className="text-base font-semibold text-slate-900 leading-tight mb-1">
              {item.title}
            </p>

            {/* Description (collapsed) */}
            {!isExpanded && (
              <p className="text-sm text-slate-600 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          {/* Expand Icon */}
          <div className="flex-shrink-0 mt-1">
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-200">
            {/* Description */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                Details
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Recommendation */}
            {item.recommendation && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Recommendation
                </h4>
                <div className="text-sm text-slate-700 leading-relaxed bg-blue-50 border border-blue-200 rounded-lg p-3">
                  {item.recommendation}
                </div>
              </div>
            )}

            {/* Citations */}
            {item.citations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Source Citations ({item.citations.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.citations.map((citation, idx) => (
                    <div
                      key={citation.chunkId}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      <span className="font-mono font-semibold">{citation.regCode}</span>
                      {citation.article && (
                        <span className="text-blue-600">• {citation.article}</span>
                      )}
                      {citation.confidence !== undefined && (
                        <span className="text-blue-600">
                          ({(citation.confidence * 100).toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowCitationModal(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  View full citation details
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Citation Modal */}
      <CitationModal
        isOpen={showCitationModal}
        onClose={() => setShowCitationModal(false)}
        citations={item.citations}
        itemTitle={item.title}
      />
    </>
  );
}

/**
 * Main pack checklist component
 */
export default function PackChecklist({ checklist, packTitle }: PackChecklistProps) {
  // Calculate summary statistics
  const stats = {
    pass: checklist.filter((item) => item.status === 'pass').length,
    warn: checklist.filter((item) => item.status === 'warn').length,
    fail: checklist.filter((item) => item.status === 'fail').length,
    unknown: checklist.filter((item) => item.status === 'unknown').length,
    total: checklist.length,
    critical: checklist.filter((item) => item.criticality >= 4 && item.status !== 'pass').length,
  };

  if (checklist.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No checklist items to display.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{packTitle} Checklist</h2>
        <p className="text-sm text-slate-600">
          Review compliance items and recommendations for {packTitle}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-200">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-600 mt-1">Total Items</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
          <div className="text-2xl font-bold text-green-700">{stats.pass}</div>
          <div className="text-xs text-green-700 mt-1">Passing</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{stats.warn}</div>
          <div className="text-xs text-yellow-700 mt-1">Warnings</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
          <div className="text-2xl font-bold text-red-700">{stats.fail}</div>
          <div className="text-xs text-red-700 mt-1">Failing</div>
        </div>
        {stats.critical > 0 && (
          <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-300">
            <div className="text-2xl font-bold text-orange-700">{stats.critical}</div>
            <div className="text-xs text-orange-700 mt-1">Critical</div>
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="flex items-center gap-2 mb-4 text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          Click any item to expand details. Citation badges show regulatory references supporting each finding.
        </span>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklist.map((item) => (
          <ChecklistItemCard key={item.key} item={item} />
        ))}
      </div>
    </div>
  );
}


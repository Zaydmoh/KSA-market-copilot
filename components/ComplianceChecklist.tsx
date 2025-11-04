'use client';

import { useState } from 'react';
import type { ComplianceItem, ComplianceStatus } from '@/lib/types';

interface ComplianceChecklistProps {
  checklist: ComplianceItem[];
}

/**
 * Returns icon and styling based on compliance status
 */
function getStatusDisplay(status: ComplianceStatus): {
  icon: JSX.Element;
  label: string;
  bgColor: string;
  textColor: string;
  badgeColor: string;
} {
  switch (status) {
    case 'addressed':
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
        label: 'Addressed',
        bgColor: 'bg-green-50',
        textColor: 'text-green-900',
        badgeColor: 'bg-green-100 text-green-800',
      };
    case 'missing':
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
        label: 'Missing',
        bgColor: 'bg-red-50',
        textColor: 'text-red-900',
        badgeColor: 'bg-red-100 text-red-800',
      };
    case 'unclear':
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
        label: 'Unclear',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-900',
        badgeColor: 'bg-yellow-100 text-yellow-800',
      };
  }
}

/**
 * Individual compliance item with collapsible details
 */
function ComplianceChecklistItem({ item }: { item: ComplianceItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusDisplay = getStatusDisplay(item.status);

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors ${
        isExpanded ? statusDisplay.bgColor : 'bg-white hover:bg-slate-50'
      }`}
    >
      {/* Main Item Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-start gap-3 text-left"
      >
        {/* Status Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${statusDisplay.textColor}`}>
          {statusDisplay.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-1 rounded ${statusDisplay.badgeColor}`}>
              {statusDisplay.label}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-900 leading-relaxed">
            {item.requirement}
          </p>
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
        <div className="px-4 pb-4 border-t">
          {/* Recommendation */}
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
              Recommendation
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {item.recommendation}
            </p>
          </div>

          {/* Citation */}
          {item.citation && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                Regulation Citation
              </h4>
              <p className="text-sm text-slate-600 font-mono bg-slate-100 px-3 py-2 rounded">
                {item.citation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Main compliance checklist component
 */
export default function ComplianceChecklist({ checklist }: ComplianceChecklistProps) {
  // Calculate summary statistics
  const stats = {
    addressed: checklist.filter((item) => item.status === 'addressed').length,
    missing: checklist.filter((item) => item.status === 'missing').length,
    unclear: checklist.filter((item) => item.status === 'unclear').length,
    total: checklist.length,
  };

  if (checklist.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>No compliance items to display.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-xs text-slate-600 mt-1">Total Items</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-900">{stats.addressed}</div>
          <div className="text-xs text-green-700 mt-1">Addressed</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-900">{stats.missing}</div>
          <div className="text-xs text-red-700 mt-1">Missing</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-900">{stats.unclear}</div>
          <div className="text-xs text-yellow-700 mt-1">Unclear</div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-600">
        <span>Click any item to view details and recommendations</span>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklist.map((item, index) => (
          <ComplianceChecklistItem key={index} item={item} />
        ))}
      </div>
    </div>
  );
}


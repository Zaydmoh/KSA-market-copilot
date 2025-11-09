/**
 * PDF Report Generator for Phase 2 Pack Analysis
 * Includes citations and multi-pack support
 */

import ReactPDF, { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { ChecklistItem, PackResult, ChecklistItemStatus } from './packs/types';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#1E40AF',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 3,
  },
  packTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 4,
  },
  scoreBox: {
    backgroundColor: '#F0F9FF',
    padding: 10,
    marginBottom: 15,
    borderRadius: 4,
    border: '1px solid #BFDBFE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 20,
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  summaryText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
    marginBottom: 10,
  },
  checklistItem: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 4,
    border: '1px solid #E2E8F0',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginRight: 8,
  },
  statusPass: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusWarn: {
    backgroundColor: '#FEF3C7',
    color: '#78350F',
  },
  statusFail: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  statusUnknown: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
  },
  criticalBadge: {
    backgroundColor: '#FED7AA',
    color: '#9A3412',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 'bold',
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  recommendationBox: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 3,
    marginTop: 5,
    border: '1px solid #BFDBFE',
  },
  recommendationLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  recommendationText: {
    fontSize: 9,
    color: '#1E40AF',
    lineHeight: 1.4,
  },
  citationsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  citationsLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  citation: {
    fontSize: 8,
    color: '#64748B',
    marginBottom: 3,
    paddingLeft: 10,
  },
  citationCode: {
    fontFamily: 'Courier',
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  citationLink: {
    color: '#2563EB',
    textDecoration: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94A3B8',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  disclaimer: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    marginTop: 15,
    marginBottom: 20,
    borderRadius: 4,
    border: '1px solid #FCD34D',
  },
  disclaimerText: {
    fontSize: 8,
    color: '#78350F',
    lineHeight: 1.4,
  },
});

/**
 * Get status badge style
 */
function getStatusStyle(status: ChecklistItemStatus): any {
  switch (status) {
    case 'pass':
      return styles.statusPass;
    case 'warn':
      return styles.statusWarn;
    case 'fail':
      return styles.statusFail;
    case 'unknown':
      return styles.statusUnknown;
  }
}

/**
 * Render a single checklist item
 */
function ChecklistItemPDF({ item }: { item: ChecklistItem }) {
  return (
    <View style={styles.checklistItem} wrap={false}>
      {/* Header with status badges */}
      <View style={styles.itemHeader}>
        <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
          {item.status}
        </Text>
        {item.criticality >= 4 && (
          <Text style={styles.criticalBadge}>HIGH PRIORITY</Text>
        )}
      </View>

      {/* Title */}
      <Text style={styles.itemTitle}>{item.title}</Text>

      {/* Description */}
      <Text style={styles.itemDescription}>{item.description}</Text>

      {/* Recommendation */}
      {item.recommendation && (
        <View style={styles.recommendationBox}>
          <Text style={styles.recommendationLabel}>Recommendation</Text>
          <Text style={styles.recommendationText}>{item.recommendation}</Text>
        </View>
      )}

      {/* Citations */}
      {item.citations && item.citations.length > 0 && (
        <View style={styles.citationsSection}>
          <Text style={styles.citationsLabel}>
            Source Citations ({item.citations.length})
          </Text>
          {item.citations.map((citation, idx) => (
            <View key={idx} style={styles.citation}>
              <Text>
                <Text style={styles.citationCode}>{citation.regCode}</Text>
                {citation.article && <Text> • {citation.article}</Text>}
                {citation.version && <Text> ({citation.version})</Text>}
                {citation.confidence !== undefined && (
                  <Text> • Confidence: {(citation.confidence * 100).toFixed(0)}%</Text>
                )}
              </Text>
              {citation.url && (
                <Link src={citation.url} style={styles.citationLink}>
                  <Text>{citation.url}</Text>
                </Link>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Render a pack result section
 */
function PackResultPDF({ packResult, packTitle }: { packResult: PackResult; packTitle: string }) {
  // Calculate stats
  const stats = {
    pass: packResult.checklist.filter((item) => item.status === 'pass').length,
    warn: packResult.checklist.filter((item) => item.status === 'warn').length,
    fail: packResult.checklist.filter((item) => item.status === 'fail').length,
    unknown: packResult.checklist.filter((item) => item.status === 'unknown').length,
    critical: packResult.checklist.filter((item) => item.criticality >= 4 && item.status !== 'pass').length,
  };

  return (
    <View>
      {/* Pack Title */}
      <Text style={styles.packTitle}>{packTitle}</Text>

      {/* Score Box */}
      <View style={styles.scoreBox}>
        <Text style={styles.scoreText}>Compliance Score</Text>
        <Text style={styles.scoreValue}>{packResult.score}/100</Text>
      </View>

      {/* Summary */}
      {packResult.summary && (
        <Text style={styles.summaryText}>{packResult.summary}</Text>
      )}

      {/* Stats Summary */}
      <Text style={styles.summaryText}>
        ✓ {stats.pass} Passing • ⚠ {stats.warn} Warnings • ✗ {stats.fail} Failing
        {stats.critical > 0 && ` • ${stats.critical} Critical`}
      </Text>

      {/* Checklist Items */}
      {packResult.checklist.map((item) => (
        <ChecklistItemPDF key={item.key} item={item} />
      ))}
    </View>
  );
}

/**
 * Main PDF Document Component
 */
export interface PackAnalysisReportProps {
  projectName?: string;
  documentName?: string;
  analysisDate: Date;
  packResults: Array<{ packId: string; packTitle: string; result: PackResult }>;
}

export function PackAnalysisReportPDF({
  projectName = 'Untitled Project',
  documentName,
  analysisDate,
  packResults,
}: PackAnalysisReportProps) {
  const dateStr = analysisDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate overall score (average of all packs)
  const overallScore =
    packResults.reduce((sum, pack) => sum + pack.result.score, 0) / packResults.length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>KSA Market Entry Compliance Analysis</Text>
          <Text style={styles.subtitle}>Project: {projectName}</Text>
          {documentName && <Text style={styles.subtitle}>Document: {documentName}</Text>}
          <Text style={styles.subtitle}>Generated: {dateStr}</Text>
          <Text style={styles.subtitle}>
            Overall Score: {overallScore.toFixed(0)}/100 across {packResults.length} pack(s)
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠ DISCLAIMER: This analysis is AI-generated and intended for informational purposes
            only. It should not be considered as professional legal, financial, or compliance
            advice. Always consult with qualified professionals before making business decisions.
            Regulations may change, and interpretations may vary. Last updated: {dateStr}.
          </Text>
        </View>

        {/* Pack Results */}
        {packResults.map((pack, idx) => (
          <View key={pack.packId}>
            <PackResultPDF packResult={pack.result} packTitle={pack.packTitle} />
            {idx < packResults.length - 1 && (
              <View
                style={{
                  borderBottomWidth: 2,
                  borderBottomColor: '#E2E8F0',
                  marginTop: 15,
                  marginBottom: 10,
                }}
              />
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            KSA Market Entry Copilot • Phase 2 • Generated {dateStr} • Page {' '}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate PDF Buffer
 */
export async function generatePackAnalysisPDF(
  props: PackAnalysisReportProps
): Promise<Uint8Array> {
  const doc = <PackAnalysisReportPDF {...props} />;
  const pdfBlob = await ReactPDF.renderToBuffer(doc);
  return new Uint8Array(pdfBlob);
}


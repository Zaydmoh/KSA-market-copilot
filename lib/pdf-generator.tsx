import ReactPDF, { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { AnalysisResult, ComplianceStatus } from '@/lib/types';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748B',
  },
  disclaimer: {
    backgroundColor: '#FEF3C7',
    border: '1px solid #FCD34D',
    padding: 12,
    marginBottom: 15,
    borderRadius: 4,
  },
  disclaimerText: {
    fontSize: 9,
    color: '#78350F',
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 5,
  },
  card: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
    border: '1px solid #E2E8F0',
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
  },
  licenseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 5,
  },
  licenseBadge: {
    backgroundColor: '#DBEAFE',
    padding: '6px 12px',
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  licenseBadgeText: {
    fontSize: 10,
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  checklistItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 4,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: 3,
    marginRight: 8,
  },
  statusText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  requirementText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 5,
  },
  recommendationLabel: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 3,
  },
  recommendationText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.4,
  },
  citationLabel: {
    fontSize: 8,
    color: '#64748B',
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 3,
  },
  citationText: {
    fontSize: 9,
    color: '#475569',
    fontFamily: 'Courier',
    backgroundColor: '#F1F5F9',
    padding: 5,
    borderRadius: 3,
  },
  citationItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    borderRadius: 2,
  },
  citationNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 3,
  },
  citationRegulation: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 3,
  },
  citationArticle: {
    fontSize: 9,
    color: '#64748B',
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
  pageNumber: {
    fontSize: 8,
    color: '#94A3B8',
  },
});

/**
 * Returns styling for compliance status badges
 */
function getStatusStyle(status: ComplianceStatus): { backgroundColor: string; color: string } {
  switch (status) {
    case 'addressed':
      return { backgroundColor: '#D1FAE5', color: '#065F46' };
    case 'missing':
      return { backgroundColor: '#FEE2E2', color: '#991B1B' };
    case 'unclear':
      return { backgroundColor: '#FEF3C7', color: '#78350F' };
  }
}

/**
 * Returns display label for compliance status
 */
function getStatusLabel(status: ComplianceStatus): string {
  switch (status) {
    case 'addressed':
      return '✓ ADDRESSED';
    case 'missing':
      return '✗ MISSING';
    case 'unclear':
      return '⚠ UNCLEAR';
  }
}

/**
 * PDF Document Component
 */
const AnalysisReportDocument = ({ analysis }: { analysis: AnalysisResult }) => {
  const timestamp = new Date().toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>MISA Licensing Analysis Report</Text>
          <Text style={styles.subtitle}>Generated on {timestamp}</Text>
          <Text style={styles.subtitle}>KSA Market-Entry Copilot • Phase 1 MVP</Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            <Text style={{ fontWeight: 'bold' }}>⚠ IMPORTANT DISCLAIMER: </Text>
            This is an AI-generated analysis and should be reviewed by qualified legal and
            compliance professionals before making business decisions. Always verify requirements
            with official MISA sources at misa.gov.sa.
          </Text>
        </View>

        {/* Executive Summary */}
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.card}>
          <Text style={styles.summaryText}>{analysis.executiveSummary}</Text>
        </View>

        {/* Applicable Licenses */}
        <Text style={styles.sectionTitle}>Applicable License Type(s)</Text>
        <View style={styles.card}>
          {analysis.applicableLicenses.length > 0 ? (
            <View style={styles.licenseContainer}>
              {analysis.applicableLicenses.map((license, index) => (
                <View key={index} style={styles.licenseBadge}>
                  <Text style={styles.licenseBadgeText}>{license}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.summaryText}>
              No specific license types identified. Please review the compliance checklist below.
            </Text>
          )}
        </View>

        {/* Compliance Checklist */}
        <Text style={styles.sectionTitle}>Compliance Checklist</Text>
        {analysis.checklist.map((item, index) => {
          const statusStyle = getStatusStyle(item.status);
          return (
            <View key={index} style={styles.checklistItem}>
              <View style={styles.checklistHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusStyle.backgroundColor },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.requirementText}>{item.requirement}</Text>
              <Text style={styles.recommendationLabel}>RECOMMENDATION:</Text>
              <Text style={styles.recommendationText}>{item.recommendation}</Text>
              {item.citation && (
                <>
                  <Text style={styles.citationLabel}>CITATION:</Text>
                  <Text style={styles.citationText}>{item.citation}</Text>
                </>
              )}
            </View>
          );
        })}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.pageNumber}>
            KSA Market-Entry Copilot • For official information visit misa.gov.sa
          </Text>
        </View>
      </Page>

      {/* Second Page - Citations */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Regulatory Citations</Text>
        </View>

        <Text style={styles.sectionTitle}>Referenced Regulations</Text>
        {analysis.citations.map((citation, index) => (
          <View key={index} style={styles.citationItem}>
            <Text style={styles.citationNumber}>Citation {index + 1}</Text>
            <Text style={styles.citationRegulation}>{citation.regulation}</Text>
            <Text style={styles.citationArticle}>Article/Section: {citation.article}</Text>
            {citation.url && (
              <Text style={[styles.citationArticle, { marginTop: 3 }]}>
                Source: {citation.url}
              </Text>
            )}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.pageNumber}>
            KSA Market-Entry Copilot • For official information visit misa.gov.sa
          </Text>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Generates a PDF report from analysis results
 * @param analysis - The analysis result to convert to PDF
 * @returns Buffer containing the PDF file
 */
export async function generateReportPDF(analysis: AnalysisResult): Promise<Buffer> {
  try {
    // Render the PDF document
    const pdfStream = await ReactPDF.renderToStream(
      <AnalysisReportDocument analysis={analysis} />
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
      pdfStream.on('error', reject);
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(
      `Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}


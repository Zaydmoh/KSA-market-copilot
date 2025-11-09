/**
 * ZATCA e-Invoicing Phase 2 Pack
 * Analyzes readiness for ZATCA Phase 2 requirements
 */

import { z } from 'zod';
import { PolicyPack, PackResult, ChecklistItem, ChecklistItemStatus, CitationRef } from '../types';
import { searchChunks } from '@/lib/kb/search';

/**
 * Input schema for ZATCA Phase 2 pack
 */
export const ZATCAPhase2InputsSchema = z.object({
  erp: z.string().min(1, 'ERP system name is required'),
  apiCapable: z.boolean().optional(),
  b2bPct: z.number().min(0).max(100).optional(),
  format: z.enum(['XML', 'UBL', 'CSV', 'PDF', 'Other']).optional(),
  exportInvoices: z.boolean().optional(),
  peppol: z.boolean().optional(),
});

export type ZATCAPhase2Inputs = z.infer<typeof ZATCAPhase2InputsSchema>;

/**
 * Keywords to detect in document text for each requirement
 */
const KEYWORDS = {
  uuid: ['uuid', 'unique identifier', 'invoice id', 'transaction id'],
  qr: ['qr code', 'qr-code', 'quick response', 'qr generation'],
  cryptographicStamp: ['cryptographic', 'digital signature', 'stamp', 'certificate', 'private key', 'signing'],
  clearanceAPI: ['clearance', 'reporting', 'api integration', 'zatca api', 'fatoora', 'clearance api'],
  ubl: ['ubl', 'universal business language', 'ubl 2.1', 'xml format'],
  archiving: ['archive', 'archiving', 'storage', 'retention', 'data retention'],
};

/**
 * Check if document text contains keywords related to a requirement
 */
function detectKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Determine status based on keyword detection
 */
function inferStatus(detected: boolean, inputHint?: boolean): ChecklistItemStatus {
  if (inputHint === true) return 'pass';
  if (inputHint === false) return 'fail';
  if (detected) return 'pass';
  return 'unknown';
}

/**
 * Fetch citations for a checklist item
 */
async function fetchCitations(
  itemKey: string,
  query: string,
  k: number = 2
): Promise<CitationRef[]> {
  try {
    // Only fetch if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured, skipping citation retrieval');
      return [];
    }

    const results = await searchChunks({
      packId: 'zatca_phase2',
      version: 'v2025.10',
      query,
      k,
      minSimilarity: 0.65,
    });

    return results.map(r => ({
      chunkId: r.id,
      regCode: r.regCode,
      url: r.url || '',
      article: r.article || undefined,
      version: 'v2025.10',
      confidence: r.similarity,
      publishedOn: undefined,
    }));
  } catch (error) {
    console.error(`Error fetching citations for ${itemKey}:`, error);
    return [];
  }
}

/**
 * Analyze ZATCA Phase 2 compliance
 */
async function analyzeZATCAPhase2(
  docText: string,
  inputs: ZATCAPhase2Inputs
): Promise<PackResult> {
  try {
    const { erp, apiCapable, b2bPct, format, peppol } = inputs;
    // Note: exportInvoices is available in inputs if needed for future enhancements

    // Keyword detection
    const hasUUID = detectKeywords(docText, KEYWORDS.uuid);
    const hasQR = detectKeywords(docText, KEYWORDS.qr);
    const hasCrypto = detectKeywords(docText, KEYWORDS.cryptographicStamp);
    const hasAPI = detectKeywords(docText, KEYWORDS.clearanceAPI);
    const formatIsXMLorUBL = format === 'XML' || format === 'UBL';
    const hasUBL = detectKeywords(docText, KEYWORDS.ubl) || formatIsXMLorUBL;
    const hasArchiving = detectKeywords(docText, KEYWORDS.archiving);

    // Build checklist
    const checklist: ChecklistItem[] = [];

    // 1. UUID Generation
    checklist.push({
      key: 'uuid',
      title: 'Invoice UUID Generation',
      description: hasUUID
        ? 'Document mentions UUID/unique identifier generation for invoices.'
        : 'No mention of UUID generation found. Each invoice must have a globally unique identifier (UUID v4).',
      status: inferStatus(hasUUID),
      criticality: 5,
      recommendation: hasUUID
        ? 'Ensure your UUID generation is RFC 4122 compliant (UUID v4).'
        : `Configure ${erp} to generate UUID v4 for each invoice. Most modern ERPs support this via plugins or custom fields.`,
      citations: [],
    });

    // 2. QR Code Generation
    checklist.push({
      key: 'qr',
      title: 'QR Code Generation',
      description: hasQR
        ? 'Document mentions QR code generation for invoices.'
        : 'No QR code generation mentioned. Phase 2 requires QR codes with specific ZATCA-compliant data encoding.',
      status: inferStatus(hasQR),
      criticality: 5,
      recommendation: hasQR
        ? 'Verify QR codes include: Seller name, VAT number, Timestamp, Total amount, VAT amount, and Invoice hash.'
        : `Implement QR code generation in ${erp}. Use TLV (Type-Length-Value) encoding format specified by ZATCA. Libraries available for most platforms.`,
      citations: [],
    });

    // 3. Cryptographic Stamp
    checklist.push({
      key: 'cryptographic_stamp',
      title: 'Cryptographic Stamp (Digital Signature)',
      description: hasCrypto
        ? 'Document mentions cryptographic signing or digital signatures.'
        : 'No cryptographic signing mentioned. Phase 2 requires invoices to be digitally signed with a ZATCA-issued certificate.',
      status: inferStatus(hasCrypto),
      criticality: 5,
      recommendation: hasCrypto
        ? 'Ensure you obtain a ZATCA-issued cryptographic certificate via onboarding API. Private key must be stored securely (HSM recommended).'
        : `Obtain cryptographic certificate from ZATCA. Your ${erp} must support:
1. Onboarding API call to get certificate
2. Secure private key storage
3. Invoice signing before transmission
Consider HSM (Hardware Security Module) for production.`,
      citations: [],
    });

    // 4. Clearance/Reporting API
    const apiStatus: ChecklistItemStatus = apiCapable ? 'pass' : hasAPI ? 'warn' : 'fail';
    checklist.push({
      key: 'clearance_reporting_api',
      title: 'Clearance/Reporting API Integration',
      description: apiCapable
        ? `${erp} is capable of API integration.`
        : hasAPI
        ? 'Document mentions API integration but API capability not confirmed.'
        : `No API integration mentioned. Phase 2 requires real-time clearance (B2B) or reporting (B2C) to ZATCA.`,
      status: apiStatus,
      criticality: 5,
      recommendation: apiCapable
        ? `Integrate with ZATCA API endpoints:
- Clearance API (B2B invoices) - synchronous approval before invoice issuance
- Reporting API (B2C invoices) - asynchronous submission within 24 hours
Test in ZATCA sandbox environment first.`
        : `Critical: Your ERP (${erp}) must support API calls to ZATCA.
Options:
1. Check if ${erp} has ZATCA Phase 2 plugin/module
2. Use middleware/integration layer (e.g., Azure Logic Apps, Dell Boomi)
3. Custom development via ${erp}'s API (if available)
Contact ${erp} vendor for ZATCA compliance roadmap.`,
      citations: [],
    });

    // 5. UBL 2.1 Format
    const ublStatus: ChecklistItemStatus = hasUBL ? 'pass' : 'warn';
    checklist.push({
      key: 'ubl_format',
      title: 'UBL 2.1 XML Format',
      description: hasUBL
        ? 'Document mentions UBL or XML format.'
        : formatIsXMLorUBL
        ? `Current format is ${format}. May need UBL 2.1 conversion.`
        : `Current format (${format || 'unknown'}) may not be compliant. ZATCA requires UBL 2.1 XML format.`,
      status: ublStatus,
      criticality: 4,
      recommendation: hasUBL
        ? 'Ensure UBL 2.1 standard compliance. Validate against ZATCA XSD schemas.'
        : `Convert invoices to UBL 2.1 XML format. Options:
1. ${erp} native UBL export (check with vendor)
2. Transformation layer (XSLT/custom mapping from ${format || 'current format'})
3. Third-party invoice gateway services
Download ZATCA UBL 2.1 XSD schemas for validation.`,
      citations: [],
    });

    // 6. Archiving
    checklist.push({
      key: 'archiving',
      title: 'Invoice Archiving (6 Years)',
      description: hasArchiving
        ? 'Document mentions archiving or data retention.'
        : 'No archiving strategy mentioned. ZATCA requires 6-year retention of all e-invoices in original format.',
      status: inferStatus(hasArchiving),
      criticality: 3,
      recommendation: hasArchiving
        ? 'Verify retention period is at least 6 years. Store signed XML, QR codes, and ZATCA responses.'
        : `Implement archiving solution:
1. Store all issued invoices (signed UBL XML)
2. Store ZATCA clearance/reporting responses
3. Retain for 6 years minimum
4. Ensure searchability and retrieval capability
Consider: ${erp} built-in archiving, cloud storage (S3/Azure Blob), or dedicated DMS.`,
      citations: [],
    });

    // 7. Integration Plan
    const integrationNeeded = !apiCapable || !hasUBL || !hasCrypto;
    checklist.push({
      key: 'integration_plan',
      title: 'ERP Integration Roadmap',
      description: integrationNeeded
        ? `Action required: ${erp} needs updates for Phase 2 compliance.`
        : `${erp} appears ready for Phase 2 integration.`,
      status: integrationNeeded ? 'warn' : 'pass',
      criticality: 4,
      recommendation: integrationNeeded
        ? `Create a Phase 2 integration plan:
1. Contact ${erp} vendor for ZATCA Phase 2 module/plugin
2. If unavailable, evaluate middleware options (e.g., e-invoicing gateway providers)
3. Budget for development/integration (timeline: 3-6 months typical)
4. Plan testing phase in ZATCA sandbox
5. Schedule onboarding with ZATCA
6. Train accounting/IT staff on new workflows`
        : `Proceed with integration:
1. Test in ZATCA sandbox environment
2. Complete ZATCA onboarding process
3. Obtain production certificates
4. Go-live plan with rollback strategy`,
      citations: [],
    });

    // 8. PEPPOL (if applicable)
    if (peppol || b2bPct && b2bPct > 30) {
      checklist.push({
        key: 'peppol',
        title: 'PEPPOL Network Access (Optional)',
        description: peppol
          ? 'PEPPOL network access requested for cross-border B2B invoicing.'
          : `With ${b2bPct?.toFixed(0)}% B2B transactions, consider PEPPOL for international trading partners.`,
        status: 'unknown',
        criticality: 2,
        recommendation: `PEPPOL (Pan-European Public Procurement OnLine) enables standardized e-invoicing with international partners.
Benefits:
- Automatic routing to buyer's AP system
- Interoperability with EU suppliers/customers
- Reduced manual processing
Steps:
1. Register with PEPPOL Access Point provider
2. Obtain PEPPOL ID
3. Configure ${erp} to send via PEPPOL network
Not mandatory for ZATCA Phase 2, but valuable for B2B export/import businesses.`,
        citations: [],
      });
    }

    // Attach citations from KB
    console.log('Fetching citations for ZATCA Phase 2 checklist items...');
    for (const item of checklist) {
      const query = `${item.title} ${item.description}`.substring(0, 500);
      item.citations = await fetchCitations(item.key, query, 2);
      
      if (item.citations.length > 0) {
        console.log(`✓ Found ${item.citations.length} citation(s) for ${item.key}`);
      }
    }

    // Calculate score
    const score = scoreZATCAPhase2({ status: 'completed', score: 0, checklist, packVersion: 'v2025.10' });

    return {
      status: 'completed',
      score,
      checklist,
      packVersion: 'v2025.10',
      summary: `ZATCA Phase 2 Readiness: ${score}/100. ${erp} requires ${
        checklist.filter(item => item.status === 'fail' || item.status === 'unknown').length
      } items to be addressed.`,
    };
  } catch (error) {
    console.error('ZATCA Phase 2 analysis error:', error);
    return {
      status: 'failed',
      score: 0,
      checklist: [],
      packVersion: 'v2025.10',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Calculate weighted score from checklist
 */
function scoreZATCAPhase2(result: PackResult): number {
  const items = result.checklist;
  if (items.length === 0) return 0;

  let totalWeight = 0;
  let earnedPoints = 0;

  for (const item of items) {
    totalWeight += item.criticality;

    if (item.status === 'pass') {
      earnedPoints += item.criticality;
    } else if (item.status === 'warn') {
      earnedPoints += item.criticality * 0.5;
    }
    // 'fail' and 'unknown' earn 0 points
  }

  return totalWeight > 0 ? Math.round((earnedPoints / totalWeight) * 100) : 0;
}

/**
 * ZATCA Phase 2 Pack Implementation
 */
export const ZATCAPhase2Pack: PolicyPack<typeof ZATCAPhase2InputsSchema, PackResult> = {
  id: 'zatca_phase2',
  title: 'ZATCA e-Invoicing Phase 2',
  version: 'v2025.10',
  description: 'ZATCA Phase 2 e-invoicing integration and compliance',
  inputsSchema: ZATCAPhase2InputsSchema,
  analyze: analyzeZATCAPhase2,
  score: scoreZATCAPhase2,
};


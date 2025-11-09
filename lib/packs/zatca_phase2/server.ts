/**
 * ZATCA Phase 2 Pack - Server-Side Execution
 * SERVER-ONLY: Contains database/search logic
 */

import 'server-only';
import { PackResult, ChecklistItem, CitationRef, ChecklistItemStatus } from '../types';
import { searchChunks } from '@/lib/kb/search';
import type { ZATCAPhase2Inputs } from './index';

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
 * Run ZATCA Phase 2 analysis (server-side only)
 */
export async function runZATCAPhase2Analysis(
  docText: string,
  inputs: ZATCAPhase2Inputs
): Promise<PackResult> {
  try {
    const { erp, format, apiCapable, b2bPct, peppol } = inputs;
    
    const checklist: ChecklistItem[] = [];

    // Detect capabilities from document
    const hasUUID = detectKeywords(docText, KEYWORDS.uuid);
    const hasQR = detectKeywords(docText, KEYWORDS.qr);
    const hasCrypto = detectKeywords(docText, KEYWORDS.cryptographicStamp);
    const hasAPI = detectKeywords(docText, KEYWORDS.clearanceAPI);
    const hasUBL = detectKeywords(docText, KEYWORDS.ubl);
    const hasArchiving = detectKeywords(docText, KEYWORDS.archiving);

    const formatIsXMLorUBL = format === 'XML' || format === 'UBL';

    // 1. UUID Generation
    checklist.push({
      key: 'uuid',
      title: 'Invoice UUID Generation',
      description: hasUUID
        ? 'UUID generation capability detected in documentation.'
        : 'No explicit mention of UUID generation found.',
      status: inferStatus(hasUUID),
      criticality: 5,
      recommendation: hasUUID
        ? 'Ensure UUIDs are RFC 4122 compliant (version 4 recommended).'
        : `${erp} must generate a unique UUID for every invoice. Implement UUID v4 library.`,
      citations: [],
    });

    // 2. QR Code
    checklist.push({
      key: 'qr',
      title: 'QR Code Generation',
      description: hasQR
        ? 'QR code generation capability detected.'
        : 'QR code generation not clearly documented.',
      status: inferStatus(hasQR),
      criticality: 5,
      recommendation: hasQR
        ? 'Verify QR includes all 9 required ZATCA tags.'
        : `${erp} must generate TLV-encoded QR codes with seller, VAT, timestamp, total, VAT amount, hash, signature, public key, and certificate.`,
      citations: [],
    });

    // 3. Cryptographic Stamp
    checklist.push({
      key: 'cryptographicStamp',
      title: 'Cryptographic Stamp/Digital Signature',
      description: hasCrypto
        ? 'Cryptographic signing capability detected.'
        : 'No mention of digital signatures or cryptographic stamps.',
      status: inferStatus(hasCrypto),
      criticality: 5,
      recommendation: hasCrypto
        ? 'Ensure you have obtained a certificate from an accredited provider and store private keys securely (HSM recommended).'
        : `${erp} must implement X.509 certificate-based signing. Apply for a certificate and integrate signing into invoice generation.`,
      citations: [],
    });

    // 4. Clearance/Reporting API
    checklist.push({
      key: 'clearanceOrReportingAPI',
      title: 'ZATCA API Integration (Clearance/Reporting)',
      description: apiCapable
        ? `API integration capability: ${hasAPI ? 'documented' : 'confirmed via inputs'}.`
        : 'No API integration capability mentioned.',
      status: inferStatus(hasAPI, apiCapable),
      criticality: 5,
      recommendation: apiCapable
        ? 'Test clearance (B2B) and reporting (B2C) endpoints in ZATCA sandbox before production.'
        : `${erp} must integrate with ZATCA's Fatoora API. Budget for API development or middleware (e.g., middleware connector for ${erp}).`,
      citations: [],
    });

    // 5. XML/UBL Format
    const ublStatus: ChecklistItemStatus = formatIsXMLorUBL
      ? (hasUBL ? 'pass' : 'warn')
      : 'fail';

    checklist.push({
      key: 'xmlUblFormat',
      title: 'XML/UBL 2.1 Invoice Format',
      description: `Current format: ${format}. ${formatIsXMLorUBL ? 'Compliant format selected.' : 'Non-compliant format.'}`,
      status: ublStatus,
      criticality: 5,
      recommendation: formatIsXMLorUBL
        ? (hasUBL
            ? 'UBL 2.1 format confirmed. Validate against ZATCA schema before go-live.'
            : `${erp} supports XML but ensure it outputs valid UBL 2.1. Test with ZATCA validation tool.`)
        : `${erp} currently uses ${format}, which is not ZATCA-compliant. You must convert to UBL 2.1 XML. Consider middleware or ERP upgrade.`,
      citations: [],
    });

    // 6. Archiving
    checklist.push({
      key: 'archiving',
      title: '6-Year Invoice Archiving',
      description: hasArchiving
        ? 'Archiving capability detected.'
        : 'No clear archiving strategy documented.',
      status: inferStatus(hasArchiving),
      criticality: 3,
      recommendation: hasArchiving
        ? 'Ensure archives include XML invoice, ZATCA response, QR code, and digital signature for minimum 6 years.'
        : `Implement archiving solution (cloud or on-premise) to store invoices + ZATCA responses for 6 years. ${erp} may have built-in archiving—verify.`,
      citations: [],
    });

    // 7. ERP Integration Plan
    const needsIntegration = !formatIsXMLorUBL || !apiCapable;
    checklist.push({
      key: 'erpIntegration',
      title: `${erp} Integration Readiness`,
      description: needsIntegration
        ? `${erp} requires integration work to meet ZATCA Phase 2.`
        : `${erp} appears configured for ZATCA Phase 2.`,
      status: needsIntegration ? 'warn' : 'pass',
      criticality: 4,
      recommendation: needsIntegration
        ? `${erp} needs updates:\n1. Enable XML/UBL output\n2. Add UUID + QR generation\n3. Integrate ZATCA API\n4. Configure cryptographic signing\nEstimate 2-4 months for full integration. Consider ${erp} consultants or middleware.`
        : `${erp} is ready. Complete sandbox testing, train users, and schedule production rollout.`,
      citations: [],
    });

    // 8. PEPPOL (optional)
    if (b2bPct && b2bPct > 50) {
      checklist.push({
        key: 'peppol',
        title: 'PEPPOL Network Access (Optional)',
        description: peppol
          ? 'PEPPOL network access requested for cross-border B2B invoicing.'
          : `With ${b2bPct?.toFixed(0)}% B2B transactions, consider PEPPOL for international trading partners.`,
        status: 'unknown',
        criticality: 2,
        recommendation: `PEPPOL (Pan-European Public Procurement OnLine) enables standardized e-invoicing with international partners.\nBenefits:\n- Automatic routing to buyer's AP system\n- Interoperability with EU suppliers/customers\n- Reduced manual processing\nSteps:\n1. Register with PEPPOL Access Point provider\n2. Obtain PEPPOL ID\n3. Configure ${erp} to send via PEPPOL network\nNot mandatory for ZATCA Phase 2, but valuable for B2B export/import businesses.`,
        citations: [],
      });
    }

    // Attach citations
    console.log('[ZATCA Server] Fetching citations for checklist items...');
    for (const item of checklist) {
      const query = `${item.title} ${item.description}`.substring(0, 500);
      item.citations = await fetchCitations(item.key, query, 2);
      
      if (item.citations.length > 0) {
        console.log(`[ZATCA Server] ✓ Found ${item.citations.length} citation(s) for ${item.key}`);
      }
    }

    // Calculate score
    const totalWeight = checklist.reduce((sum, item) => sum + item.criticality, 0);
    const weightedScore = checklist.reduce((sum, item) => {
      const itemScore = item.status === 'pass' ? 100 :
                       item.status === 'warn' ? 50 :
                       item.status === 'fail' ? 0 : 25;
      return sum + (itemScore * item.criticality);
    }, 0);
    const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

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
    console.error('[ZATCA Server] Analysis error:', error);
    return {
      status: 'failed',
      score: 0,
      checklist: [],
      packVersion: 'v2025.10',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}


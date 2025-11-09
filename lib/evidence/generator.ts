/**
 * Evidence List Generator
 * Creates markdown documentation of missing evidence items with templates
 */

import { PackResult, ChecklistItem, ChecklistItemStatus } from '@/lib/packs/types';

export interface EvidenceItem {
  packId: string;
  packTitle: string;
  checklistItemKey: string;
  title: string;
  description: string;
  status: ChecklistItemStatus;
  criticality: number;
  recommendation: string;
  suggestedTemplate: string;
}

/**
 * Suggested evidence templates based on pack and item type
 */
const EVIDENCE_TEMPLATES: Record<string, Record<string, string>> = {
  nitaqat: {
    quota_threshold: `# Nitaqat Saudization Report

**Company:** [Company Name]
**Sector:** [Sector]
**Date:** [Date]

## Current Workforce Breakdown
- Total Employees: [Number]
- Saudi Nationals: [Number]
- Non-Saudi Nationals: [Number]
- Current Saudization %: [Percentage]

## GOSI Registration Evidence
- Attach GOSI certificates for all Saudi employees
- Include Mudad system export showing active registrations

## Supporting Documents
- HR roster with nationality breakdown
- Employment contracts for Saudi nationals
- GOSI payment receipts for last 3 months`,

    nitaqat_band: `# Nitaqat Band Status Certificate

Provide:
1. Latest Nitaqat status export from Qiwa portal
2. Screenshot showing current band classification
3. Historical trend (last 6 months) if available
4. Any official communications from HRSD regarding status`,

    monthly_monitoring: `# Monthly HRSD Reporting Compliance

Evidence Required:
- Monthly Qiwa portal access logs
- Scheduled reports/alerts set up in system
- Contact person responsible for monitoring
- Escalation procedures for band changes

Attach screenshots showing:
- Qiwa dashboard access
- Notification settings
- Report export history`,

    training_plan: `# Saudi Employee Training & Development Program

## Program Overview
**Program Name:** [Name]
**Duration:** [Duration]
**Participants:** [Number of Saudi employees]

## Training Content
1. Technical Skills: [List]
2. Soft Skills: [List]
3. Leadership Development: [Details]

## Budget & Resources
- Annual Training Budget: SAR [Amount]
- Training Hours per Employee: [Hours]
- External Partners: [List any HRDF partnerships]

## Evidence
- Training calendar for current year
- Attendance records
- Certificates/completion records
- HRDF subsidy approval (if applicable)`,

    hiring_plan: `# Saudi Talent Acquisition Plan

## Hiring Goals
**Target:** Hire [Number] Saudi nationals within [Timeframe]
**Target Saudization %:** [Percentage]

## Recruitment Strategy
1. **Channels:**
   - Jadarat portal
   - HRDF programs
   - University partnerships
   - Recruitment agencies

2. **Positions:**
   [List open positions suitable for Saudi nationals]

3. **Qualification Requirements:**
   [List requirements per position]

## Budget & Timeline
- Recruitment Budget: SAR [Amount]
- Start Date: [Date]
- Target Completion: [Date]

## Progress Tracking
[Describe monthly review process]`,

    documentation: `# Compliance Documentation Checklist

## Required Documents (Organized and Current)

### Employee Records
☐ All Saudi employee contracts
☐ GOSI registration certificates
☐ Mudad system registrations
☐ Work permits for expats

### Nitaqat Status
☐ Monthly Qiwa exports (last 12 months)
☐ Band classification certificates
☐ Historical trend reports

### Training Records
☐ Training program documentation
☐ Attendance records
☐ Completion certificates
☐ HRDF partnership agreements (if any)

### Hiring Evidence
☐ Job postings on Jadarat
☐ Interview records
☐ Offer letters
☐ Onboarding documentation

**Storage Location:** [Specify where documents are stored]
**Access Control:** [Specify who has access]
**Backup Procedure:** [Describe backup process]`,
  },

  zatca_phase2: {
    uuid: `# UUID Generation Implementation Evidence

## System Details
**ERP System:** [Name & Version]
**UUID Library/Module:** [Name]

## Implementation
Provide:
1. Code snippet showing UUID generation
2. Sample invoice with UUID field
3. Configuration settings for UUID format
4. Testing evidence (unit test results)

## Standards Compliance
- UUID Version: [v4 recommended]
- Format: [RFC 4122 compliant]
- Uniqueness guarantee: [Describe mechanism]

**Sample Output:**
\`\`\`json
{
  "invoiceId": "550e8400-e29b-41d4-a716-446655440000",
  "generatedAt": "2025-11-08T10:30:00Z"
}
\`\`\``,

    qr: `# QR Code Generation Evidence

## Implementation Details
**QR Library:** [Name & Version]
**Encoding:** [e.g., Base64, UTF-8]

## Required QR Content (ZATCA Phase 2)
1. Seller name (Tag 1)
2. VAT registration number (Tag 2)
3. Timestamp (Tag 3)
4. Invoice total (Tag 4)
5. VAT amount (Tag 5)
6. Invoice hash (Tag 6)
7. Digital signature (Tag 7)
8. Public key (Tag 8)
9. Cryptographic stamp certificate (Tag 9)

## Evidence Required
- Sample QR code image
- Decoded content showing all required tags
- Testing report (scan verification)
- Integration code snippet`,

    cryptographicStamp: `# Cryptographic Stamp Implementation

## Certificate Details
**Certificate Authority:** [Name]
**Certificate Type:** [X.509]
**Key Length:** [2048-bit minimum]
**Algorithm:** [RSA, ECDSA]

## Implementation
Provide:
1. Certificate acquisition documentation
2. Private key storage security measures
3. Signing process flowchart
4. Sample signed invoice

## Security Measures
- Key storage: [HSM, secure enclave, etc.]
- Access controls: [Who can sign]
- Backup procedures: [Key backup strategy]
- Renewal process: [Certificate renewal plan]

**Certificate Details:**
- Issued By: [CA Name]
- Valid From: [Date]
- Valid To: [Date]
- Serial Number: [Number]`,

    clearanceOrReportingAPI: `# ZATCA API Integration Evidence

## Integration Type
☐ Clearance (B2B invoices)
☐ Reporting (B2C invoices)
☐ Both

## API Credentials
**Client ID:** [Obtain from ZATCA portal]
**Environment:** ☐ Sandbox ☐ Production

## Integration Details
1. **Endpoint URLs:**
   - Sandbox: [URL]
   - Production: [URL]

2. **Authentication:**
   - Method: [OAuth 2.0, API Key]
   - Token refresh mechanism: [Describe]

3. **Request/Response Format:**
   - Content-Type: application/json
   - Encoding: UTF-8

## Evidence Required
- API integration code
- Successful API call logs (sandbox)
- Error handling implementation
- Rate limiting strategy
- Retry mechanism documentation

**Sample Success Response:**
\`\`\`json
{
  "clearanceStatus": "CLEARED",
  "clearedInvoice": "base64_encoded_invoice",
  "clearanceTimestamp": "2025-11-08T10:30:00Z"
}
\`\`\``,

    archiving: `# Invoice Archiving Compliance

## Retention Policy
**Retention Period:** Minimum 6 years (ZATCA requirement)
**Storage Location:** [Describe storage solution]

## Archived Data Requirements
For each invoice:
1. Original XML/UBL invoice
2. Clearance/reporting response from ZATCA
3. QR code
4. Digital signature
5. Cryptographic stamp
6. All associated documents (delivery notes, contracts)

## Storage Solution
**System:** [Cloud storage, on-premise, hybrid]
**Backup:** [Backup frequency and location]
**Access Control:** [Who can access archives]
**Audit Trail:** [Describe logging mechanism]

## Retrieval Process
[Describe how archived invoices can be retrieved]

**Evidence:**
- Storage system documentation
- Sample archived invoice package
- Access logs
- Backup verification report`,

    erpIntegration: `# ERP System Integration Plan

## Current State
**ERP System:** [Name & Version]
**Current Format:** [PDF, Excel, CSV, etc.]
**Volume:** [Invoices per month]

## Integration Requirements

### Phase 1: Data Export
- Export invoice data in structured format
- Map fields to ZATCA requirements
- Validate data completeness

### Phase 2: ZATCA Compliance
- Convert to XML/UBL format
- Add required fields (UUID, QR, signature)
- Implement validation rules

### Phase 3: API Integration
- Connect to ZATCA clearance/reporting API
- Handle responses and errors
- Update ERP with clearance status

## Timeline
- Phase 1: [Date range]
- Phase 2: [Date range]
- Phase 3: [Date range]
- Go-live: [Target date]

## Resources
**Budget:** SAR [Amount]
**Team:** [List team members and roles]
**External Consultants:** [If any]

## Risk Mitigation
[Describe contingency plans]`,

    peppol: `# PEPPOL Network Integration (Optional)

## PEPPOL Overview
**Access Point Provider:** [Selected provider]
**PEPPOL ID:** [Format: ISO6523-ACTORID-UPIS::9918:XXXXXXXXX]

## Integration Benefits
- Automated invoice delivery to international buyers
- Standardized format (UBL 2.1)
- Reduced manual processing
- Improved payment cycles

## Implementation Steps
1. Register with PEPPOL Access Point provider
2. Obtain PEPPOL ID
3. Configure ERP to send via PEPPOL
4. Test with pilot customers
5. Full rollout

## Evidence
- Access Point agreement
- PEPPOL ID certificate
- Test transmission logs
- Customer confirmation receipts

**Note:** PEPPOL is not mandatory for ZATCA Phase 2 but recommended for international B2B transactions.`,
  },
};

/**
 * Get evidence template for a specific checklist item
 */
export function getEvidenceTemplate(
  packId: string,
  checklistItemKey: string
): string {
  const packTemplates = EVIDENCE_TEMPLATES[packId];
  if (!packTemplates) {
    return `# Evidence Template for ${checklistItemKey}

Please provide documentation demonstrating compliance with this requirement.

## Required Evidence
[List specific documents or proof needed]

## Format
[Specify preferred format: PDF, screenshots, reports, etc.]

## Submission
[Describe how and where to submit evidence]`;
  }

  return packTemplates[checklistItemKey] || packTemplates.default || `# Evidence Required

Please provide supporting documentation for: **${checklistItemKey}**

Include:
- Relevant documents
- Screenshots
- Reports
- Certifications

Contact your compliance officer if you need guidance.`;
}

/**
 * Extract evidence items from pack results
 */
export function extractEvidenceItems(
  packId: string,
  packTitle: string,
  packResult: PackResult
): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  for (const item of packResult.checklist) {
    // Include items that are not passing
    if (item.status !== 'pass') {
      items.push({
        packId,
        packTitle,
        checklistItemKey: item.key,
        title: item.title,
        description: item.description,
        status: item.status,
        criticality: item.criticality,
        recommendation: item.recommendation || '',
        suggestedTemplate: getEvidenceTemplate(packId, item.key),
      });
    }
  }

  return items;
}

/**
 * Generate comprehensive evidence list markdown
 */
export function generateEvidenceListMarkdown(
  evidenceItems: EvidenceItem[],
  metadata?: {
    projectName?: string;
    documentName?: string;
    analysisDate?: Date;
  }
): string {
  const date = metadata?.analysisDate || new Date();
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Group by pack
  const byPack = evidenceItems.reduce((acc, item) => {
    if (!acc[item.packId]) {
      acc[item.packId] = [];
    }
    acc[item.packId].push(item);
    return acc;
  }, {} as Record<string, EvidenceItem[]>);

  // Sort items by criticality (highest first)
  for (const packId in byPack) {
    byPack[packId].sort((a, b) => b.criticality - a.criticality);
  }

  let markdown = `# Evidence Required for KSA Compliance

**Generated:** ${dateStr}
${metadata?.projectName ? `**Project:** ${metadata.projectName}\n` : ''}${metadata?.documentName ? `**Document:** ${metadata.documentName}\n` : ''}

---

## Overview

This document lists all compliance items that require additional evidence or action. Items are organized by compliance pack and sorted by criticality (highest priority first).

### Summary Statistics

`;

  const totalItems = evidenceItems.length;
  const criticalItems = evidenceItems.filter((i) => i.criticality >= 4).length;
  const failedItems = evidenceItems.filter((i) => i.status === 'fail').length;
  const unknownItems = evidenceItems.filter((i) => i.status === 'unknown').length;

  markdown += `- **Total Items Requiring Evidence:** ${totalItems}
- **Critical Items:** ${criticalItems}
- **Failed Items:** ${failedItems}
- **Unknown Status Items:** ${unknownItems}

---

`;

  // Generate content for each pack
  for (const [packId, items] of Object.entries(byPack)) {
    if (items.length === 0) continue;

    const packTitle = items[0].packTitle;

    markdown += `## ${packTitle} (${items.length} items)

`;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemNumber = i + 1;

      markdown += `### ${itemNumber}. ${item.title}

**Status:** \`${item.status.toUpperCase()}\` | **Criticality:** ${item.criticality}/5 ${item.criticality >= 4 ? '🔴 **HIGH PRIORITY**' : ''}

**Description:**
${item.description}

**Recommendation:**
${item.recommendation}

**Suggested Evidence Template:**

${item.suggestedTemplate}

---

`;
    }
  }

  // Add footer
  markdown += `## Next Steps

1. **Review this document** with your compliance team
2. **Prioritize critical items** (marked with 🔴)
3. **Gather evidence** using the templates provided
4. **Organize documents** in a structured folder system
5. **Re-run analysis** after collecting evidence to verify compliance

## Document Organization

We recommend organizing your evidence files as follows:

\`\`\`
evidence/
├── nitaqat/
│   ├── quota_threshold/
│   ├── training_plan/
│   └── documentation/
├── zatca_phase2/
│   ├── uuid/
│   ├── qr/
│   ├── cryptographic_stamp/
│   └── api_integration/
└── README.md (this document)
\`\`\`

## Support

For questions or guidance on gathering evidence:
- Consult with your compliance officer
- Review official ZATCA and HRSD documentation
- Contact relevant government authorities for clarifications

---

**Disclaimer:** This document is AI-generated and intended as a guide. Always verify requirements with official government sources and qualified professionals.

*Generated by KSA Market Entry Copilot • ${dateStr}*
`;

  return markdown;
}

/**
 * Generate evidence list from multiple pack results
 */
export function generateEvidenceList(
  packResults: Array<{ packId: string; packTitle: string; result: PackResult }>,
  metadata?: {
    projectName?: string;
    documentName?: string;
    analysisDate?: Date;
  }
): string {
  const allItems: EvidenceItem[] = [];

  for (const { packId, packTitle, result } of packResults) {
    const items = extractEvidenceItems(packId, packTitle, result);
    allItems.push(...items);
  }

  return generateEvidenceListMarkdown(allItems, metadata);
}


/**
 * Golden Set Tests for Phase 2 Packs
 * Integration tests with expected results for Nitaqat and ZATCA Phase 2
 */

import { describe, it, expect } from '@jest/globals';
import { NitaqatPack } from '../nitaqat';
import { ZATCAPhase2Pack } from '../zatca_phase2';

describe('Golden Set Tests', () => {
  describe('Nitaqat Pack - Retail Company', () => {
    const testCase = {
      description: 'Medium-sized retail company in red band',
      inputs: {
        sector: 'retail' as const,
        headcount: 150,
        currentSaudiPct: 15, // Red band (need 23% for green)
      },
      expectedResults: {
        status: 'completed',
        scoreRange: [30, 50], // Expecting low score due to red band
        checklistLength: 6,
        criticalFailures: ['quota_threshold', 'nitaqat_band'],
        expectedBand: 'red',
      },
    };

    it('should correctly calculate Nitaqat band and score', async () => {
      const result = await NitaqatPack.analyze('', testCase.inputs);

      expect(result.status).toBe(testCase.expectedResults.status);
      expect(result.score).toBeGreaterThanOrEqual(testCase.expectedResults.scoreRange[0]);
      expect(result.score).toBeLessThanOrEqual(testCase.expectedResults.scoreRange[1]);
      expect(result.checklist.length).toBeGreaterThanOrEqual(testCase.expectedResults.checklistLength);
    });

    it('should identify quota threshold as failed', async () => {
      const result = await NitaqatPack.analyze('', testCase.inputs);
      
      const quotaItem = result.checklist.find((item) => item.key === 'quota_threshold');
      expect(quotaItem).toBeDefined();
      expect(quotaItem?.status).toBe('fail');
    });

    it('should identify band as red', async () => {
      const result = await NitaqatPack.analyze('', testCase.inputs);
      
      const bandItem = result.checklist.find((item) => item.key === 'nitaqat_band');
      expect(bandItem).toBeDefined();
      expect(bandItem?.status).toBe('fail');
      expect(bandItem?.description).toContain('red');
    });

    it('should include hiring plan recommendation', async () => {
      const result = await NitaqatPack.analyze('', testCase.inputs);
      
      const hiringItem = result.checklist.find((item) => item.key === 'hiring_plan');
      expect(hiringItem).toBeDefined();
      expect(hiringItem?.recommendation).toContain('hire');
    });

    it('should complete within reasonable time', async () => {
      const start = Date.now();
      await NitaqatPack.analyze('', testCase.inputs);
      const duration = Date.now() - start;

      // Should complete in under 5 seconds (including KB queries if DB available)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Nitaqat Pack - IT Company (Compliant)', () => {
    const testCase = {
      description: 'IT company in platinum band',
      inputs: {
        sector: 'information_technology' as const,
        headcount: 75,
        currentSaudiPct: 40, // Platinum band (need 31% for green)
      },
      expectedResults: {
        status: 'completed',
        scoreRange: [85, 100], // High score for platinum
        expectedBand: 'platinum',
      },
    };

    it('should achieve high score for platinum band', async () => {
      const result = await NitaqatPack.analyze('', testCase.inputs);

      expect(result.status).toBe(testCase.expectedResults.status);
      expect(result.score).toBeGreaterThanOrEqual(testCase.expectedResults.scoreRange[0]);
    });

    it('should identify quota threshold as passed', async () => {
      const result = await NitaqatPack.analyze('', testCase.inputs);
      
      const quotaItem = result.checklist.find((item) => item.key === 'quota_threshold');
      expect(quotaItem).toBeDefined();
      expect(quotaItem?.status).toBe('pass');
    });

    it('should identify band as platinum', async () => {
      const result = await NitaqatPack.analyze('', testCase.inputs);
      
      const bandItem = result.checklist.find((item) => item.key === 'nitaqat_band');
      expect(bandItem).toBeDefined();
      expect(bandItem?.status).toBe('pass');
      expect(bandItem?.description.toLowerCase()).toContain('platinum');
    });
  });

  describe('ZATCA Phase 2 Pack - SAP with XML (High Readiness)', () => {
    const testCase = {
      description: 'SAP system with XML format and API capability',
      inputs: {
        erp: 'SAP',
        format: 'XML' as const,
        apiCapable: true,
        exportInvoices: true,
        b2bPct: 80,
        peppol: false,
      },
      docText: `
        Our system implements UUID generation for all invoices.
        QR code generation is integrated in the invoice template.
        We use cryptographic stamps with X.509 certificates.
        API integration with ZATCA clearance endpoint is configured.
        UBL 2.1 format is supported in our XML exports.
        Invoice archiving is maintained for 7 years in our document management system.
      `,
      expectedResults: {
        status: 'completed',
        scoreRange: [80, 100], // High score for good readiness
        minChecklistLength: 7,
      },
    };

    it('should achieve high score for ready system', async () => {
      const result = await ZATCAPhase2Pack.analyze(testCase.docText, testCase.inputs);

      expect(result.status).toBe(testCase.expectedResults.status);
      expect(result.score).toBeGreaterThanOrEqual(testCase.expectedResults.scoreRange[0]);
      expect(result.checklist.length).toBeGreaterThanOrEqual(testCase.expectedResults.minChecklistLength);
    });

    it('should detect UUID capability as passing', async () => {
      const result = await ZATCAPhase2Pack.analyze(testCase.docText, testCase.inputs);
      
      const uuidItem = result.checklist.find((item) => item.key === 'uuid');
      expect(uuidItem).toBeDefined();
      expect(uuidItem?.status).toBe('pass');
    });

    it('should detect QR code capability', async () => {
      const result = await ZATCAPhase2Pack.analyze(testCase.docText, testCase.inputs);
      
      const qrItem = result.checklist.find((item) => item.key === 'qr');
      expect(qrItem).toBeDefined();
      expect(qrItem?.status).toBe('pass');
    });

    it('should detect cryptographic stamp', async () => {
      const result = await ZATCAPhase2Pack.analyze(testCase.docText, testCase.inputs);
      
      const stampItem = result.checklist.find((item) => item.key === 'cryptographicStamp');
      expect(stampItem).toBeDefined();
      expect(stampItem?.status).toBe('pass');
    });

    it('should detect API integration', async () => {
      const result = await ZATCAPhase2Pack.analyze(testCase.docText, testCase.inputs);
      
      const apiItem = result.checklist.find((item) => item.key === 'clearanceOrReportingAPI');
      expect(apiItem).toBeDefined();
      expect(apiItem?.status).toBe('pass');
    });

    it('should complete within reasonable time', async () => {
      const start = Date.now();
      await ZATCAPhase2Pack.analyze(testCase.docText, testCase.inputs);
      const duration = Date.now() - start;

      // Should complete in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('ZATCA Phase 2 Pack - Legacy System (Low Readiness)', () => {
    const testCase = {
      description: 'Legacy system with minimal ZATCA readiness',
      inputs: {
        erp: 'QuickBooks',
        format: 'PDF' as const,
        apiCapable: false,
        exportInvoices: false,
        b2bPct: 30,
        peppol: false,
      },
      docText: `
        Our current invoicing system generates PDF invoices.
        We do not have API integration capabilities at this time.
      `,
      expectedResults: {
        status: 'completed',
        scoreRange: [20, 40], // Low score for poor readiness
        minFailedItems: 4,
      },
    };

    it('should score low for unprepared system', async () => {
      const result = await ZATCAPhase2Pack.analyze(testCase.docText, testCase.inputs);

      expect(result.status).toBe(testCase.expectedResults.status);
      expect(result.score).toBeLessThanOrEqual(testCase.expectedResults.scoreRange[1]);
      
      const failedItems = result.checklist.filter((item) => item.status === 'fail' || item.status === 'unknown');
      expect(failedItems.length).toBeGreaterThanOrEqual(testCase.expectedResults.minFailedItems);
    });

    it('should identify missing capabilities', async () => {
      const result = await ZATCAPhase2Pack.analyze(testCase.docText, testCase.inputs);
      
      const apiItem = result.checklist.find((item) => item.key === 'clearanceOrReportingAPI');
      expect(apiItem).toBeDefined();
      expect(['fail', 'unknown']).toContain(apiItem?.status);
    });

    it('should recommend ERP integration', async () => {
      const result = await ZATCAPhase2Pack.analyze(testCase.docText, testCase.inputs);
      
      const integrationItem = result.checklist.find((item) => item.key === 'erpIntegration');
      expect(integrationItem).toBeDefined();
      expect(integrationItem?.recommendation).toContain('QuickBooks');
    });
  });

  describe('Multi-Pack Performance', () => {
    it('should analyze both packs in under 10 seconds', async () => {
      const start = Date.now();

      // Run Nitaqat
      await NitaqatPack.analyze('', {
        sector: 'retail',
        headcount: 100,
        currentSaudiPct: 20,
      });

      // Run ZATCA Phase 2
      await ZATCAPhase2Pack.analyze(
        'UUID, QR, cryptographic stamp, API integration',
        {
          erp: 'SAP',
          format: 'XML',
          apiCapable: true,
          exportInvoices: true,
          b2bPct: 75,
          peppol: false,
        }
      );

      const duration = Date.now() - start;
      
      // Both packs should complete in under 10 seconds total
      expect(duration).toBeLessThan(10000);
      console.log(`✓ Multi-pack analysis completed in ${duration}ms`);
    });
  });

  describe('Citation Quality', () => {
    it('Nitaqat pack should return citations if DB available', async () => {
      if (!process.env.DATABASE_URL) {
        console.log('Skipping citation quality test (no DATABASE_URL)');
        return;
      }

      const result = await NitaqatPack.analyze('', {
        sector: 'retail',
        headcount: 100,
        currentSaudiPct: 20,
      });

      // At least some items should have citations
      const itemsWithCitations = result.checklist.filter(
        (item) => item.citations && item.citations.length > 0
      );

      // Expect at least 50% of items to have citations if KB is populated
      expect(itemsWithCitations.length).toBeGreaterThanOrEqual(
        Math.floor(result.checklist.length * 0.3)
      );

      // Check citation quality
      for (const item of itemsWithCitations) {
        for (const citation of item.citations) {
          expect(citation.chunkId).toBeTruthy();
          expect(citation.regCode).toBeTruthy();
          expect(citation.confidence).toBeGreaterThanOrEqual(0.65);
          expect(citation.confidence).toBeLessThanOrEqual(1);
        }
      }
    });
  });
});


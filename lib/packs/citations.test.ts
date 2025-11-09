/**
 * Unit Tests for Citation Functionality
 * Tests citation retrieval and attachment in packs
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { NitaqatPack } from './nitaqat';
import { ZATCAPhase2Pack } from './zatca_phase2';

describe('Citation Functionality', () => {
  describe('Nitaqat Pack Citations', () => {
    it('should include citations array in each checklist item', async () => {
      const inputs = {
        sector: 'retail' as const,
        headcount: 100,
        currentSaudiPct: 25,
      };

      const result = await NitaqatPack.analyze('', inputs);

      expect(result.checklist).toBeDefined();
      expect(result.checklist.length).toBeGreaterThan(0);

      // Check that each checklist item has citations array
      for (const item of result.checklist) {
        expect(item.citations).toBeDefined();
        expect(Array.isArray(item.citations)).toBe(true);
      }
    });

    it('should have valid citation structure when citations are present', async () => {
      // Skip if DATABASE_URL is not configured
      if (!process.env.DATABASE_URL) {
        console.log('Skipping citation structure test (no DATABASE_URL)');
        return;
      }

      const inputs = {
        sector: 'retail' as const,
        headcount: 100,
        currentSaudiPct: 25,
      };

      const result = await NitaqatPack.analyze('', inputs);

      // Find an item with citations
      const itemWithCitations = result.checklist.find(
        (item) => item.citations && item.citations.length > 0
      );

      if (itemWithCitations && itemWithCitations.citations.length > 0) {
        const citation = itemWithCitations.citations[0];

        // Validate citation structure
        expect(citation).toHaveProperty('chunkId');
        expect(citation).toHaveProperty('regCode');
        expect(citation).toHaveProperty('url');
        expect(citation).toHaveProperty('version');
        expect(citation).toHaveProperty('confidence');

        // Validate types
        expect(typeof citation.chunkId).toBe('string');
        expect(typeof citation.regCode).toBe('string');
        expect(typeof citation.url).toBe('string');
        expect(typeof citation.version).toBe('string');
        expect(typeof citation.confidence).toBe('number');

        // Validate confidence range
        expect(citation.confidence).toBeGreaterThanOrEqual(0);
        expect(citation.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should gracefully handle missing database', async () => {
      // Temporarily unset DATABASE_URL
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;

      const inputs = {
        sector: 'retail' as const,
        headcount: 100,
        currentSaudiPct: 25,
      };

      // Should not throw, just return empty citations
      const result = await NitaqatPack.analyze('', inputs);

      expect(result.checklist).toBeDefined();
      expect(result.checklist.length).toBeGreaterThan(0);

      // All citations should be empty arrays
      for (const item of result.checklist) {
        expect(item.citations).toEqual([]);
      }

      // Restore DATABASE_URL
      if (originalUrl) {
        process.env.DATABASE_URL = originalUrl;
      }
    });
  });

  describe('ZATCA Phase 2 Pack Citations', () => {
    it('should include citations array in each checklist item', async () => {
      const inputs = {
        erp: 'SAP',
        format: 'XML' as const,
        apiCapable: true,
        exportInvoices: true,
        b2bPct: 75,
        peppol: false,
      };

      const docText = `
        Our system supports UUID generation for invoices.
        We have implemented QR code generation.
        Cryptographic stamps are in place.
        API integration with ZATCA is configured.
      `;

      const result = await ZATCAPhase2Pack.analyze(docText, inputs);

      expect(result.checklist).toBeDefined();
      expect(result.checklist.length).toBeGreaterThan(0);

      // Check that each checklist item has citations array
      for (const item of result.checklist) {
        expect(item.citations).toBeDefined();
        expect(Array.isArray(item.citations)).toBe(true);
      }
    });

    it('should have valid citation structure when citations are present', async () => {
      // Skip if DATABASE_URL is not configured
      if (!process.env.DATABASE_URL) {
        console.log('Skipping citation structure test (no DATABASE_URL)');
        return;
      }

      const inputs = {
        erp: 'SAP',
        format: 'XML' as const,
        apiCapable: true,
        exportInvoices: true,
        b2bPct: 75,
        peppol: false,
      };

      const docText = 'UUID, QR code, cryptographic stamp, API integration';

      const result = await ZATCAPhase2Pack.analyze(docText, inputs);

      // Find an item with citations
      const itemWithCitations = result.checklist.find(
        (item) => item.citations && item.citations.length > 0
      );

      if (itemWithCitations && itemWithCitations.citations.length > 0) {
        const citation = itemWithCitations.citations[0];

        // Validate citation structure
        expect(citation).toHaveProperty('chunkId');
        expect(citation).toHaveProperty('regCode');
        expect(citation).toHaveProperty('url');
        expect(citation).toHaveProperty('version');
        expect(citation).toHaveProperty('confidence');

        // Validate types
        expect(typeof citation.chunkId).toBe('string');
        expect(typeof citation.regCode).toBe('string');
        expect(typeof citation.url).toBe('string');
        expect(typeof citation.version).toBe('string');
        expect(typeof citation.confidence).toBe('number');

        // Validate confidence range
        expect(citation.confidence).toBeGreaterThanOrEqual(0);
        expect(citation.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Citation Confidence Filtering', () => {
    it('should filter out low confidence citations', async () => {
      // Skip if DATABASE_URL is not configured
      if (!process.env.DATABASE_URL) {
        console.log('Skipping confidence filtering test (no DATABASE_URL)');
        return;
      }

      const inputs = {
        sector: 'retail' as const,
        headcount: 100,
        currentSaudiPct: 25,
      };

      const result = await NitaqatPack.analyze('', inputs);

      // Check that all citations have confidence >= 0.65 (minSimilarity threshold)
      for (const item of result.checklist) {
        for (const citation of item.citations) {
          expect(citation.confidence).toBeGreaterThanOrEqual(0.65);
        }
      }
    });
  });

  describe('Citation Count Limits', () => {
    it('should limit citations per checklist item', async () => {
      // Skip if DATABASE_URL is not configured
      if (!process.env.DATABASE_URL) {
        console.log('Skipping citation count test (no DATABASE_URL)');
        return;
      }

      const inputs = {
        sector: 'retail' as const,
        headcount: 100,
        currentSaudiPct: 25,
      };

      const result = await NitaqatPack.analyze('', inputs);

      // Each item should have at most 2 citations (as specified in fetchCitations k=2)
      for (const item of result.checklist) {
        expect(item.citations.length).toBeLessThanOrEqual(2);
      }
    });
  });
});


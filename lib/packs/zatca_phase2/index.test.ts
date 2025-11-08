/**
 * ZATCA Phase 2 Pack Tests
 * Tests for Phase 2 readiness analysis
 */

import { ZATCAPhase2Pack, ZATCAPhase2Inputs } from './index';

// Simple test runner
function assertEquals(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
  console.log(`✓ ${message}`);
}

function assertGreaterThan(actual: number, min: number, message: string) {
  if (actual <= min) {
    throw new Error(`${message}: expected > ${min}, got ${actual}`);
  }
  console.log(`✓ ${message}`);
}

function assertTrue(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`${message}: expected true, got false`);
  }
  console.log(`✓ ${message}`);
}

/**
 * Test keyword detection
 */
async function testKeywordDetection() {
  console.log('\n=== Testing Keyword Detection ===');

  // Document with all ZATCA keywords
  const docWithKeywords = `
    Our e-invoicing solution includes:
    - UUID generation for each invoice
    - QR code generation compliant with ZATCA
    - Cryptographic stamp using digital signature
    - API integration with ZATCA for clearance
    - UBL 2.1 XML format support
    - Archiving for 6 years
  `;

  const inputs: ZATCAPhase2Inputs = {
    erp: 'Test ERP',
    apiCapable: true,
    format: 'UBL',
  };

  const result = await ZATCAPhase2Pack.analyze(docWithKeywords, inputs);

  assertEquals(result.status, 'completed', 'Analysis completes successfully');
  assertTrue(result.checklist.length >= 6, 'At least 6 checklist items generated');
  assertGreaterThan(result.score, 80, 'High score for compliant document');

  // Check UUID item exists and passes
  const uuidItem = result.checklist.find(item => item.key === 'uuid');
  assertTrue(!!uuidItem, 'UUID checklist item exists');
  assertEquals(uuidItem?.status, 'pass', 'UUID detected as pass');

  // Check QR item
  const qrItem = result.checklist.find(item => item.key === 'qr');
  assertTrue(!!qrItem, 'QR checklist item exists');
  assertEquals(qrItem?.status, 'pass', 'QR code detected as pass');

  // Check UBL item
  const ublItem = result.checklist.find(item => item.key === 'ubl_format');
  assertTrue(!!ublItem, 'UBL checklist item exists');
  assertEquals(ublItem?.status, 'pass', 'UBL format detected as pass');

  console.log('✓ Keyword detection working correctly');
}

/**
 * Test with minimal compliance
 */
async function testMinimalCompliance() {
  console.log('\n=== Testing Minimal Compliance ===');

  const docWithoutKeywords = `
    This is a simple business plan document.
    We use PDF invoices currently.
  `;

  const inputs: ZATCAPhase2Inputs = {
    erp: 'QuickBooks',
    apiCapable: false,
    format: 'PDF',
  };

  const result = await ZATCAPhase2Pack.analyze(docWithoutKeywords, inputs);

  assertEquals(result.status, 'completed', 'Analysis completes for non-compliant doc');
  assertTrue(result.checklist.length >= 6, 'Checklist generated');
  assertTrue(result.score < 50, 'Low score for non-compliant setup');

  // Check API item shows failure
  const apiItem = result.checklist.find(item => item.key === 'clearance_reporting_api');
  assertTrue(!!apiItem, 'API checklist item exists');
  assertEquals(apiItem?.status, 'fail', 'API capability detected as fail');

  console.log('✓ Minimal compliance detection working');
}

/**
 * Test API capability influence
 */
async function testAPICapability() {
  console.log('\n=== Testing API Capability Impact ===');

  const doc = 'Business document with no e-invoicing mention';

  // With API capability
  const inputsWithAPI: ZATCAPhase2Inputs = {
    erp: 'SAP',
    apiCapable: true,
  };

  const resultWithAPI = await ZATCAPhase2Pack.analyze(doc, inputsWithAPI);
  const apiItemPass = resultWithAPI.checklist.find(item => item.key === 'clearance_reporting_api');
  assertEquals(apiItemPass?.status, 'pass', 'API capable ERP passes API check');

  // Without API capability
  const inputsNoAPI: ZATCAPhase2Inputs = {
    erp: 'Legacy System',
    apiCapable: false,
  };

  const resultNoAPI = await ZATCAPhase2Pack.analyze(doc, inputsNoAPI);
  const apiItemFail = resultNoAPI.checklist.find(item => item.key === 'clearance_reporting_api');
  assertEquals(apiItemFail?.status, 'fail', 'Non-API capable ERP fails API check');

  assertGreaterThan(resultWithAPI.score, resultNoAPI.score, 'API capability improves score');

  console.log('✓ API capability correctly influences results');
}

/**
 * Test format influence
 */
async function testFormatInfluence() {
  console.log('\n=== Testing Format Influence ===');

  const doc = 'Simple business plan';

  // XML format
  const inputsXML: ZATCAPhase2Inputs = {
    erp: 'Odoo',
    format: 'XML',
  };

  const resultXML = await ZATCAPhase2Pack.analyze(doc, inputsXML);
  const ublItemXML = resultXML.checklist.find(item => item.key === 'ubl_format');
  assertEquals(ublItemXML?.status, 'pass', 'XML format passes UBL check');

  // PDF format
  const inputsPDF: ZATCAPhase2Inputs = {
    erp: 'Odoo',
    format: 'PDF',
  };

  const resultPDF = await ZATCAPhase2Pack.analyze(doc, inputsPDF);
  const ublItemPDF = resultPDF.checklist.find(item => item.key === 'ubl_format');
  assertEquals(ublItemPDF?.status, 'warn', 'PDF format warns on UBL check');

  console.log('✓ Format correctly influences UBL compliance');
}

/**
 * Test PEPPOL option
 */
async function testPEPPOL() {
  console.log('\n=== Testing PEPPOL Option ===');

  const doc = 'Business with international partners';

  // With PEPPOL
  const inputsWithPEPPOL: ZATCAPhase2Inputs = {
    erp: 'SAP',
    peppol: true,
    b2bPct: 70,
  };

  const resultWithPEPPOL = await ZATCAPhase2Pack.analyze(doc, inputsWithPEPPOL);
  const peppolItem = resultWithPEPPOL.checklist.find(item => item.key === 'peppol');
  assertTrue(!!peppolItem, 'PEPPOL item exists when requested');

  // Without PEPPOL but high B2B
  const inputsHighB2B: ZATCAPhase2Inputs = {
    erp: 'SAP',
    b2bPct: 50,
  };

  const resultHighB2B = await ZATCAPhase2Pack.analyze(doc, inputsHighB2B);
  const peppolItemB2B = resultHighB2B.checklist.find(item => item.key === 'peppol');
  assertTrue(!!peppolItemB2B, 'PEPPOL item suggested for high B2B %');

  console.log('✓ PEPPOL option working correctly');
}

/**
 * Test structure and scoring
 */
async function testStructure() {
  console.log('\n=== Testing Result Structure ===');

  const inputs: ZATCAPhase2Inputs = {
    erp: 'Test ERP',
  };

  const result = await ZATCAPhase2Pack.analyze('test document', inputs);

  // Check result structure
  assertTrue(!!result.status, 'Result has status');
  assertTrue(typeof result.score === 'number', 'Result has numeric score');
  assertTrue(result.score >= 0 && result.score <= 100, 'Score is 0-100');
  assertTrue(Array.isArray(result.checklist), 'Result has checklist array');
  assertEquals(result.packVersion, 'v2025.10', 'Correct pack version');

  // Check checklist item structure
  for (const item of result.checklist) {
    assertTrue(!!item.key, 'Item has key');
    assertTrue(!!item.title, 'Item has title');
    assertTrue(!!item.description, 'Item has description');
    assertTrue(['pass', 'warn', 'fail', 'unknown'].includes(item.status), 'Item has valid status');
    assertTrue(typeof item.criticality === 'number', 'Item has criticality');
    assertTrue(Array.isArray(item.citations), 'Item has citations array');
  }

  console.log('✓ Result structure is valid');
}

/**
 * Test scoring function
 */
async function testScoring() {
  console.log('\n=== Testing Scoring Logic ===');

  // Fully compliant
  const compliantDoc = 'UUID QR cryptographic clearance API UBL archiving';
  const compliantInputs: ZATCAPhase2Inputs = {
    erp: 'SAP',
    apiCapable: true,
    format: 'UBL',
  };

  const compliantResult = await ZATCAPhase2Pack.analyze(compliantDoc, compliantInputs);
  assertGreaterThan(compliantResult.score, 80, 'Compliant setup scores high (>80)');

  // Non-compliant
  const nonCompliantInputs: ZATCAPhase2Inputs = {
    erp: 'Old System',
    apiCapable: false,
    format: 'PDF',
  };

  const nonCompliantResult = await ZATCAPhase2Pack.analyze('simple doc', nonCompliantInputs);
  assertTrue(nonCompliantResult.score < 40, 'Non-compliant setup scores low');

  console.log('✓ Scoring logic working correctly');
}

/**
 * Run all tests
 */
export async function runZATCAPhase2Tests() {
  console.log('🧪 Running ZATCA Phase 2 Pack Tests...\n');
  
  try {
    await testKeywordDetection();
    await testMinimalCompliance();
    await testAPICapability();
    await testFormatInfluence();
    await testPEPPOL();
    await testStructure();
    await testScoring();
    
    console.log('\n✅ All tests passed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

// Allow running directly
if (require.main === module) {
  runZATCAPhase2Tests().then(success => {
    process.exit(success ? 0 : 1);
  });
}


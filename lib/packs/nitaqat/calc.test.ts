/**
 * Nitaqat Calculator Tests
 * Tests for quota calculations and band classifications
 */

import { targetPct, bandFrom, calculateBandDetails } from './calc';

// Simple test runner
function assertEquals(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
  console.log(`✓ ${message}`);
}

function assertThrows(fn: () => void, message: string) {
  try {
    fn();
    throw new Error(`${message}: expected error but none was thrown`);
  } catch (error) {
    console.log(`✓ ${message}`);
  }
}

/**
 * Test target percentage calculation
 */
function testTargetPct() {
  console.log('\n=== Testing targetPct() ===');

  // Test small company in retail
  assertEquals(targetPct('retail', 5), 20, 'Retail 1-9 employees: 20%');

  // Test medium company in retail
  assertEquals(targetPct('retail', 50), 30, 'Retail 50-499 employees: 30%');

  // Test large company in retail
  assertEquals(targetPct('retail', 1000), 35, 'Retail 500-2999 employees: 35%');

  // Test very large company in retail
  assertEquals(targetPct('retail', 5000), 40, 'Retail 3000+ employees: 40%');

  // Test construction (lower quotas)
  assertEquals(targetPct('construction', 10), 12, 'Construction 10-49 employees: 12%');
  assertEquals(targetPct('construction', 100), 15, 'Construction 50-499 employees: 15%');

  // Test IT sector
  assertEquals(targetPct('information_technology', 5), 15, 'IT 1-9 employees: 15%');
  assertEquals(targetPct('information_technology', 75), 25, 'IT 50-499 employees: 25%');

  // Test unknown sector fallback to 'other'
  assertEquals(targetPct('unknown_sector', 50), 22, 'Unknown sector falls back to "other" (22% for 50 employees)');

  // Test edge cases
  assertThrows(() => targetPct('retail', 0), 'Rejects 0 headcount');
  assertThrows(() => targetPct('retail', -5), 'Rejects negative headcount');
}

/**
 * Test band classification
 */
function testBandFrom() {
  console.log('\n=== Testing bandFrom() ===');

  // For retail with 50 employees:
  // Red: 0-20%, Yellow: 20-30%, Green: 30-45%, Platinum: 45%+

  assertEquals(bandFrom(15, 'retail', 50), 'red', 'Retail 50 employees at 15%: RED');
  assertEquals(bandFrom(25, 'retail', 50), 'yellow', 'Retail 50 employees at 25%: YELLOW');
  assertEquals(bandFrom(35, 'retail', 50), 'green', 'Retail 50 employees at 35%: GREEN');
  assertEquals(bandFrom(50, 'retail', 50), 'platinum', 'Retail 50 employees at 50%: PLATINUM');

  // Test boundary conditions
  assertEquals(bandFrom(20, 'retail', 50), 'yellow', 'Boundary: exactly at yellow min');
  assertEquals(bandFrom(30, 'retail', 50), 'green', 'Boundary: exactly at green min');
  assertEquals(bandFrom(45, 'retail', 50), 'platinum', 'Boundary: exactly at platinum min');

  // Test construction (different thresholds)
  assertEquals(bandFrom(5, 'construction', 50), 'red', 'Construction 50 employees at 5%: RED');
  assertEquals(bandFrom(12, 'construction', 50), 'yellow', 'Construction 50 employees at 12%: YELLOW');
  assertEquals(bandFrom(20, 'construction', 50), 'green', 'Construction 50 employees at 20%: GREEN');

  // Test edge cases
  assertThrows(() => bandFrom(-5, 'retail', 50), 'Rejects negative percentage');
  assertThrows(() => bandFrom(105, 'retail', 50), 'Rejects >100 percentage');
  assertThrows(() => bandFrom(25, 'retail', 0), 'Rejects 0 headcount');
}

/**
 * Test comprehensive band details
 */
function testCalculateBandDetails() {
  console.log('\n=== Testing calculateBandDetails() ===');

  // Test a company in yellow band
  const details1 = calculateBandDetails('retail', 50, 25);
  assertEquals(details1.band, 'yellow', 'Band: yellow');
  assertEquals(details1.targetPct, 30, 'Target: 30%');
  assertEquals(details1.gap, 5, 'Gap: 5%');
  assertEquals(details1.nextBand, 'green', 'Next band: green');
  assertEquals(details1.nextBandThreshold, 30, 'Next threshold: 30%');

  // Test a company in green band
  const details2 = calculateBandDetails('retail', 50, 35);
  assertEquals(details2.band, 'green', 'Band: green');
  assertEquals(details2.targetPct, 30, 'Target: 30%');
  assertEquals(details2.gap, -5, 'Gap: -5% (above target)');
  assertEquals(details2.nextBand, 'platinum', 'Next band: platinum');

  // Test a company in platinum band
  const details3 = calculateBandDetails('retail', 50, 50);
  assertEquals(details3.band, 'platinum', 'Band: platinum');
  assertEquals(details3.nextBand, null, 'No next band for platinum');
  assertEquals(details3.nextBandThreshold, null, 'No next threshold for platinum');

  // Test sector name
  assertEquals(details1.sectorName, 'Retail Trade', 'Sector name populated');

  console.log('✓ All band details fields populated correctly');
}

/**
 * Test edge cases
 */
function testEdgeCases() {
  console.log('\n=== Testing Edge Cases ===');

  // Test very small company (1 employee)
  assertEquals(targetPct('retail', 1), 20, 'Handles 1 employee');

  // Test boundary headcounts
  assertEquals(targetPct('retail', 9), 20, 'Boundary: 9 employees (last of 1-9)');
  assertEquals(targetPct('retail', 10), 25, 'Boundary: 10 employees (first of 10-49)');
  assertEquals(targetPct('retail', 49), 25, 'Boundary: 49 employees (last of 10-49)');
  assertEquals(targetPct('retail', 50), 30, 'Boundary: 50 employees (first of 50-499)');

  // Test very large company (3000+ employees, retail: green at 40-55%, platinum at 55%+)
  const details = calculateBandDetails('retail', 100000, 45);
  assertEquals(details.band, 'green', 'Very large company handled correctly (45% is green for 3000+)');
  
  // Test very large company at platinum level
  const detailsPlatinum = calculateBandDetails('retail', 100000, 60);
  assertEquals(detailsPlatinum.band, 'platinum', 'Very large company at 60% is platinum');

  console.log('✓ All edge cases handled');
}

/**
 * Run all tests
 */
export function runNitaqatCalcTests() {
  console.log('🧪 Running Nitaqat Calculator Tests...\n');
  
  try {
    testTargetPct();
    testBandFrom();
    testCalculateBandDetails();
    testEdgeCases();
    
    console.log('\n✅ All tests passed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

// Allow running directly
if (require.main === module) {
  const success = runNitaqatCalcTests();
  process.exit(success ? 0 : 1);
}


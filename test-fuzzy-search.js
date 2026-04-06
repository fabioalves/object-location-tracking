/**
 * Test suite for fuzzy matching functionality
 */

const {
  levenshteinDistance,
  calculateSimilarity,
  singularize,
  pluralize,
  getAllVariants,
  fuzzyMatchObjects,
  getVariantMatchBonus
} = require('./fuzzyMatch');

// ===== Test Cases =====

const testObjects = [
  { object: 'keys', location: 'kitchen drawer' },
  { object: 'wallet', location: 'bedroom nightstand' },
  { object: 'phone', location: 'living room couch' },
  { object: 'key chain', location: 'bag pocket' },
  { object: 'boxes', location: 'garage' }
];

console.log('\n========== FUZZY SEARCH TEST SUITE ==========\n');

const tests = [
  { query: 'keys', description: 'Exact match: "keys"' },
  { query: 'key', description: 'Singular vs Plural: "key" → "keys"' },
  { query: 'kes', description: 'Typo tolerance: "kes" → "keys"' },
  { query: 'wallet', description: 'Exact match: "wallet"' },
  { query: 'wallets', description: 'Plural variant: "wallets" → "wallet"' },
  { query: 'key chain', description: 'Exact phrase: "key chain"' },
  { query: 'keychain', description: 'Combined variant: "keychain" → "key chain"' },
  { query: 'xyz', description: 'No match: "xyz"' },
  { query: 'phn', description: 'Typo: "phn" → "phone"' },
  { query: 'box', description: 'Singular: "box" → "boxes"' }
];

for (const test of tests) {
  console.log(`Test: ${test.description}`);
  console.log(`Query: "${test.query}"`);
  
  const results = fuzzyMatchObjects(test.query, testObjects);
  
  if (results.length === 0) {
    console.log('  ❌ No matches found (below 75% threshold)\n');
  } else {
    console.log(`  ✓ Found ${results.length} match${results.length > 1 ? 'es' : ''}:`);
    for (const result of results) {
      const indicator = result.similarity === 100 ? '✓' : `${result.similarity}%`;
      console.log(`    • ${result.object} → ${result.location} [${indicator}]`);
    }
    console.log();
  }
}

console.log('========== END OF TESTS ==========\n');

// Export for use in other modules if needed
module.exports = {
  levenshteinDistance,
  calculateSimilarity,
  singularize,
  pluralize,
  getAllVariants,
  getVariantMatchBonus,
  fuzzyMatchObjects
};

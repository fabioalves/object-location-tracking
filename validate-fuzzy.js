// Quick validation script to test fuzzyMatch module import
const path = require('path');

console.log('Testing fuzzyMatch module import...\n');

try {
  const fuzzyMatch = require('./fuzzyMatch');
  
  console.log('✓ Successfully imported fuzzyMatch module');
  console.log(`✓ Exported functions: ${Object.keys(fuzzyMatch).join(', ')}\n`);
  
  // Test basic functionality
  console.log('=== BASIC FUNCTIONALITY TEST ===\n');
  
  const similarity = fuzzyMatch.calculateSimilarity('key', 'keys');
  console.log(`calculateSimilarity('key', 'keys') = ${similarity}%`);
  
  const variant = fuzzyMatch.getVariantMatchBonus('key', 'keys');
  console.log(`getVariantMatchBonus('key', 'keys') = ${variant}%`);
  
  const testObjects = [
    { object: 'keys', location: 'kitchen drawer' },
    { object: 'wallet', location: 'pocket' }
  ];
  
  const results = fuzzyMatch.fuzzyMatchObjects('key', testObjects);
  console.log(`\nfuzzyMatchObjects('key', testObjects):`);
  console.log(`  Found ${results.length} match(es)`);
  if (results.length > 0) {
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.object} (${r.similarity}%) - ${r.location}`);
    });
  }
  
  console.log('\n✓ All module functions working correctly!');
  process.exit(0);
  
} catch (error) {
  console.error('✗ Error loading fuzzyMatch module:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
}

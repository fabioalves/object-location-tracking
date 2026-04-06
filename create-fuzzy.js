const fs = require('fs');
const path = require('path');

// Create utils directory
const utilsDir = path.join(__dirname, 'utils');
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

// Create fuzzyMatch.js
const fuzzyMatchCode = `/**
 * Fuzzy Matching Utilities
 * Implements Levenshtein distance algorithm for flexible object search
 */

/**
 * Calculate Levenshtein distance between two strings
 * Counts minimum edits (insertions, deletions, substitutions) to transform str1 to str2
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const len1 = s1.length;
  const len2 = s2.length;

  // Create a matrix to store distances
  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity percentage between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity percentage (0-100)
 */
function calculateSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 100;
  
  const similarity = (1 - distance / maxLength) * 100;
  return Math.round(similarity);
}

/**
 * Convert plural to singular using simple rules
 * @param {string} word - Word to singularize
 * @returns {string} - Singular form
 */
function singularize(word) {
  const lowerWord = word.toLowerCase();
  
  // Handle special cases
  if (lowerWord.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  }
  if (lowerWord.endsWith('es')) {
    return word.slice(0, -2);
  }
  if (lowerWord.endsWith('s')) {
    return word.slice(0, -1);
  }
  
  return word;
}

/**
 * Convert singular to plural using simple rules
 * @param {string} word - Word to pluralize
 * @returns {string} - Plural form
 */
function pluralize(word) {
  const lowerWord = word.toLowerCase();
  
  // Handle special cases
  if (lowerWord.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  }
  if (lowerWord.endsWith('s') || lowerWord.endsWith('x') || lowerWord.endsWith('z')) {
    return word + 'es';
  }
  
  return word + 's';
}

/**
 * Get all variants (singular, plural) of a word
 * @param {string} word - Base word
 * @returns {string[]} - Array of word variants
 */
function getAllVariants(word) {
  const singular = singularize(word);
  const plural = pluralize(singular);
  
  // Return unique variants
  return [...new Set([singular, plural])];
}

/**
 * Calculate bonus for exact variant match (singular/plural)
 * @param {string} searchTerm - Search term
 * @param {string} objectName - Object name from database
 * @returns {number} - Bonus percentage (0 or 25)
 */
function getVariantMatchBonus(searchTerm, objectName) {
  const searchVariants = getAllVariants(searchTerm);
  const objectVariants = getAllVariants(objectName);
  
  // Check if any variant matches exactly
  for (const searchVar of searchVariants) {
    for (const objectVar of objectVariants) {
      if (searchVar.toLowerCase() === objectVar.toLowerCase()) {
        return 25; // Add 25% bonus for variant match
      }
    }
  }
  
  return 0;
}

/**
 * Fuzzy match a search query against a list of objects
 * @param {string} searchQuery - User's search input
 * @param {Array} objects - Array of objects with {object, location} structure
 * @param {number} threshold - Minimum similarity percentage (0-100)
 * @returns {Array} - Matching objects sorted by similarity, with scores
 */
function fuzzyMatchObjects(searchQuery, objects, threshold = 75) {
  if (!searchQuery || !objects || objects.length === 0) {
    return [];
  }

  const results = [];

  for (const item of objects) {
    const objectName = item.object || '';
    
    // Calculate base similarity
    let similarity = calculateSimilarity(searchQuery, objectName);
    
    // Add bonus for variant matches (singular/plural)
    const variantBonus = getVariantMatchBonus(searchQuery, objectName);
    const adjustedSimilarity = Math.min(100, similarity + variantBonus);
    
    if (adjustedSimilarity >= threshold) {
      results.push({
        object: objectName,
        location: item.location,
        similarity: adjustedSimilarity
      });
    }
  }

  // Sort by similarity (highest first), then alphabetically
  results.sort((a, b) => {
    if (b.similarity !== a.similarity) {
      return b.similarity - a.similarity;
    }
    return a.object.localeCompare(b.object);
  });

  return results;
}

module.exports = {
  levenshteinDistance,
  calculateSimilarity,
  singularize,
  pluralize,
  getAllVariants,
  fuzzyMatchObjects,
  getVariantMatchBonus
};`;

fs.writeFileSync(path.join(utilsDir, 'fuzzyMatch.js'), fuzzyMatchCode);
console.log('Created utils/fuzzyMatch.js');

process.exit(0);

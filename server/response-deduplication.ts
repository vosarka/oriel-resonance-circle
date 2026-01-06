/**
 * Response Deduplication and Quality Assurance
 * 
 * Ensures ORIEL responses are:
 * - Fresh and original (no repeating previous messages)
 * - Complete and fully formed (no truncation)
 * - Coherent and focused (addressing current user input)
 * - Non-duplicative (checking against conversation history)
 */

/**
 * Detects if a response is a duplicate or partial repeat of previous messages
 */
export function detectDuplication(
  currentResponse: string,
  conversationHistory: Array<{ role: string; content: string }>
): { isDuplicate: boolean; similarity: number; duplicateFrom?: string } {
  const responseNormalized = normalizeText(currentResponse);
  const responseLength = responseNormalized.length;
  
  // Check against previous assistant messages
  for (const msg of conversationHistory) {
    if (msg.role === 'assistant') {
      const historyNormalized = normalizeText(msg.content);
      
      // Calculate similarity using simple substring matching
      const commonLength = findLongestCommonSubstring(responseNormalized, historyNormalized);
      const similarity = commonLength / Math.max(responseLength, historyNormalized.length);
      
      // If more than 40% of the response matches previous content, flag as duplicate
      if (similarity > 0.4) {
        return {
          isDuplicate: true,
          similarity,
          duplicateFrom: msg.content.substring(0, 100)
        };
      }
    }
  }
  
  return {
    isDuplicate: false,
    similarity: 0
  };
}

/**
 * Checks if a response is complete and not truncated
 */
export function isResponseComplete(response: string): {
  isComplete: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check if response ends abruptly
  const endsWithPunctuation = /[.!?;:]\s*$/.test(response.trim());
  if (!endsWithPunctuation) {
    issues.push("Response does not end with proper punctuation");
  }
  
  // Check for incomplete sentences (ending with "and", "or", "but", etc.)
  const endsWithConjunction = /\s(and|or|but|however|therefore|thus|so|because|if|when|where)\s*$/i.test(response.trim());
  if (endsWithConjunction) {
    issues.push("Response ends with incomplete conjunction");
  }
  
  // Check for unclosed parentheses, brackets, or quotes
  const openParens = (response.match(/\(/g) || []).length;
  const closeParens = (response.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    issues.push("Unclosed parentheses");
  }
  
  const openBrackets = (response.match(/\[/g) || []).length;
  const closeBrackets = (response.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    issues.push("Unclosed brackets");
  }
  
  const singleQuotes = (response.match(/'/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    issues.push("Unclosed single quotes");
  }
  
  const doubleQuotes = (response.match(/"/g) || []).length;
  if (doubleQuotes % 2 !== 0) {
    issues.push("Unclosed double quotes");
  }
  
  // Check for minimum length (should have at least 20 characters)
  if (response.trim().length < 20) {
    issues.push("Response is too short");
  }
  
  return {
    isComplete: issues.length === 0,
    issues
  };
}

/**
 * Checks if response is coherent and focused on the user input
 */
export function isResponseFocused(
  userMessage: string,
  response: string
): {
  isFocused: boolean;
  relevanceScore: number;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Extract key terms from user message
  const userTerms = extractKeyTerms(userMessage);
  const responseTerms = extractKeyTerms(response);
  
  // Calculate term overlap
  const overlap = userTerms.filter(term => responseTerms.includes(term));
  const relevanceScore = overlap.length / Math.max(userTerms.length, 1);
  
  // If less than 20% of user terms appear in response, it may not be focused
  if (relevanceScore < 0.2 && userTerms.length > 3) {
    issues.push("Response may not address the user's question");
  }
  
  // Check for self-referential language that suggests repeating previous messages
  const selfReferences = [
    "as I said before",
    "as mentioned earlier",
    "continuing from",
    "as previously stated",
    "like I told you",
    "as I explained",
    "in my last response"
  ];
  
  for (const ref of selfReferences) {
    if (response.toLowerCase().includes(ref)) {
      issues.push(`Found self-referential language: "${ref}"`);
    }
  }
  
  return {
    isFocused: issues.length === 0 && relevanceScore > 0.2,
    relevanceScore,
    issues
  };
}

/**
 * Validates overall response quality
 */
export function validateResponseQuality(
  userMessage: string,
  response: string,
  conversationHistory: Array<{ role: string; content: string }>
): {
  isValid: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check for duplication
  const dupCheck = detectDuplication(response, conversationHistory);
  if (dupCheck.isDuplicate) {
    issues.push(`Response appears to duplicate previous content (${(dupCheck.similarity * 100).toFixed(1)}% similar)`);
  }
  
  // Check for completeness
  const completeCheck = isResponseComplete(response);
  if (!completeCheck.isComplete) {
    completeCheck.issues.forEach(issue => issues.push(`Completeness: ${issue}`));
  }
  
  // Check for focus
  const focusCheck = isResponseFocused(userMessage, response);
  if (!focusCheck.isFocused) {
    focusCheck.issues.forEach(issue => warnings.push(`Focus: ${issue}`));
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * Normalizes text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Finds the longest common substring between two strings
 */
function findLongestCommonSubstring(str1: string, str2: string): number {
  const matrix: number[][] = [];
  let maxLength = 0;
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [0];
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = 0;
  }
  
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
        maxLength = Math.max(maxLength, matrix[i][j]);
      } else {
        matrix[i][j] = 0;
      }
    }
  }
  
  return maxLength;
}

/**
 * Extracts key terms from text for relevance checking
 */
function extractKeyTerms(text: string): string[] {
  // Remove common words
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
  ]);
  
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopwords.has(word));
}

/**
 * Trims conversation history to prevent context bloat
 * Keeps only the most recent N messages
 */
export function trimConversationHistory(
  history: Array<{ role: string; content: string }>,
  maxMessages: number = 10
): Array<{ role: string; content: string }> {
  if (history.length <= maxMessages) {
    return history;
  }
  
  // Keep the most recent maxMessages
  return history.slice(-maxMessages);
}

/**
 * Deduplicates consecutive identical messages
 */
export function deduplicateConsecutiveMessages(
  history: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> {
  const deduplicated: Array<{ role: string; content: string }> = [];
  
  for (const msg of history) {
    const lastMsg = deduplicated[deduplicated.length - 1];
    
    // Skip if identical to the previous message
    if (!lastMsg || lastMsg.content !== msg.content) {
      deduplicated.push(msg);
    }
  }
  
  return deduplicated;
}

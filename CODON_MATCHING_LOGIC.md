# Codon Matching Logic Reference

## Data Structure

### Prime Stack (from staticSignature)
```javascript
// Stored as JSON text in database
{
  "conscious_sun": {
    "codonId": "RC34",
    "facet": "A",
    "fullId": "RC34-A",
    "position": "conscious_sun",
    "weight": 1.0,
    "longitude": 124.5
  },
  "design_sun": {
    "codonId": "RC01",
    "facet": "C",
    "fullId": "RC01-C",
    "position": "design_sun",
    "weight": 0.8
  },
  // ... 7 more positions
}

// User's extracted codon IDs (from usePersonalResonance hook):
["RC34", "RC01", "RC27", "RC38", "RC12", "RC51", "RC19", "RC44", "RC63"]
```

### Oracle LinkedCodons (on oracle object)
```javascript
// Stored as JSON text in database
["RC12", "RC38", "RC51", "RC44"]

// Or sometimes received as array from API
linkedCodons: ["RC12", "RC38", "RC51", "RC44"]
```

## Matching Algorithm

### Step 1: Extract User Codons (in usePersonalResonance)
```typescript
// Get first static reading (user can have multiple)
const staticReading = staticReadings[0];

// Parse primeStack (handle both string and object)
const stack = typeof staticReading.primeStack === "string"
  ? JSON.parse(staticReading.primeStack)
  : staticReading.primeStack;

// Extract codon IDs from 9 positions
const codons: string[] = [];
Object.values(stack).forEach((position: any) => {
  const codonId = position.codonId || position.id || position.rc;
  if (typeof codonId === "string" && codonId.trim()) {
    codons.push(codonId.trim());
  }
});

// Result: ["RC34", "RC01", "RC27", "RC38", "RC12", "RC51", "RC19", "RC44", "RC63"]
```

### Step 2: Check Oracle for Resonance
```typescript
// Called in components with oracle's linkedCodons
hasResonance(linkedCodons: string[]): boolean {
  // linkedCodons = ["RC12", "RC38", "RC51", "RC44"]
  // userCodons = ["RC34", "RC01", "RC27", "RC38", "RC12", "RC51", "RC19", "RC44", "RC63"]

  const matching = linkedCodons.filter(codon =>
    userCodons.includes(codon.trim())
  );

  // matching = ["RC12", "RC38", "RC51", "RC44"]  (4 matches)
  return matching.length > 0;  // true
}
```

### Step 3: Get Matching Codons (for detail view)
```typescript
// Used in OracleDetail to show which codons match
getMatchingCodons(linkedCodons: string[]): string[] {
  // linkedCodons = ["RC12", "RC38", "RC51", "RC44"]
  // userCodons = ["RC34", "RC01", "RC27", "RC38", "RC12", "RC51", "RC19", "RC44", "RC63"]

  return linkedCodons.filter(codon =>
    userCodons.includes(codon.trim())
  );

  // Returns: ["RC12", "RC38", "RC51", "RC44"]
}
```

## Implementation Examples

### Example 1: Full Match
```
User's Prime Stack: [RC01, RC12, RC27, RC38, RC44, RC51, RC63, RC19, RC34]
Oracle's LinkedCodons: [RC12, RC38, RC51, RC44]
Result: hasResonance = true
Matching: [RC12, RC38, RC51, RC44] (100% match)
Display: All 4 codons shown in Personal Resonance section
```

### Example 2: Partial Match
```
User's Prime Stack: [RC01, RC12, RC27, RC38, RC44, RC51, RC63, RC19, RC34]
Oracle's LinkedCodons: [RC12, RC38, RC99, RC88]
Result: hasResonance = true
Matching: [RC12, RC38] (50% match)
Display: Only RC12 and RC38 shown in Personal Resonance section
         RC99 and RC88 are not in user's Prime Stack, so hidden
```

### Example 3: No Match
```
User's Prime Stack: [RC01, RC12, RC27, RC38, RC44, RC51, RC63, RC19, RC34]
Oracle's LinkedCodons: [RC99, RC88, RC77]
Result: hasResonance = false
Matching: [] (0% match)
Display: No Personal Resonance section shown
         No golden thread on card
         Standard status badge displayed
```

### Example 4: User Not Logged In
```
User: null (unauthenticated)
staticReadings: []
userCodons: []
Oracle's LinkedCodons: [RC12, RC38, RC51]
Result: hasResonance = false
Display: Standard card, no personal indicators
```

### Example 5: User Has No Static Signature
```
User: { id: "user_123", ... }
staticReadings: [] (no signatures created yet)
userCodons: []
Oracle's LinkedCodons: [RC12, RC38, RC51]
Result: hasResonance = false
Display: Standard card, no personal indicators
         Message: "Generate your Oracle Reading first"
```

## Edge Cases & Validation

### Whitespace Handling
```typescript
// Codons may have extra whitespace
linkedCodons = [" RC12 ", "RC38", "  RC51  "]
userCodons = ["RC01", "RC12", "RC27"]

// Hook normalizes with .trim():
matching = linkedCodons.filter(codon =>
  userCodons.includes(codon.trim())
);
// Result: ["RC12"]
```

### Case Sensitivity
```typescript
// Current implementation: CASE SENSITIVE
linkedCodons = ["rc12", "RC38"]  // lowercase
userCodons = ["RC12", "RC38"]    // uppercase

matching = linkedCodons.filter(codon =>
  userCodons.includes(codon.trim())
);
// Result: [] (no matches due to case)

// Note: If case-insensitive matching needed, use:
matching = linkedCodons.filter(codon =>
  userCodons.some(u => u.toLowerCase() === codon.trim().toLowerCase())
);
```

### Null/Undefined Handling
```typescript
// Hook safely handles:
linkedCodons = null           // Returns []
linkedCodons = undefined      // Returns []
linkedCodons = []             // Returns []
linkedCodons = ["", "  "]     // Returns [] (empty after trim)
linkedCodons = ["RC12"]       // Returns ["RC12"] (if in userCodons)

// Protected with type checking:
if (!linkedCodons || !Array.isArray(linkedCodons)) {
  return [];
}
```

### Multiple Static Signatures
```typescript
// User may have multiple static signatures (different birth times, etc.)
staticReadings = [
  { id: 1, primeStack: {...}, birthTime: "14:30" },
  { id: 2, primeStack: {...}, birthTime: "14:35" },  // 5 min difference
  { id: 3, primeStack: {...}, birthTime: "15:00" }
]

// Hook uses FIRST (index 0):
const staticReading = staticReadings[0];

// This avoids confusion and keeps logic simple
// If user wants different signature, they can be provided via UI selector
```

## Database Storage Format

### StaticSignatures Table
```sql
CREATE TABLE staticSignatures (
  id INTEGER PRIMARY KEY,
  receiverId TEXT,
  userId TEXT,
  primeStack TEXT,  -- JSON string, e.g.: "{\"conscious_sun\":{...},...}"
  ...
);
```

### Oracles Table
```sql
CREATE TABLE oracles (
  id INTEGER PRIMARY KEY,
  oracleId TEXT,
  linkedCodons TEXT,  -- JSON string, e.g.: "[\"RC12\",\"RC38\",\"RC51\"]"
  ...
);
```

## Query Performance

### No Additional DB Queries in usePersonalResonance
- Hook calls `trpc.codex.getStaticReadings` once on mount
- Extracted codons are memoized with `useMemo`
- hasResonance/getMatchingCodons are synchronous (no network calls)

### Component Usage Pattern
```typescript
// OracleCard.tsx (renders hundreds of cards)
const { hasResonance } = usePersonalResonance();
// Called once per page load, not per card

filteredOracles.map((ox) => {
  const hasPersonal = hasResonance(ox.linkedCodons);  // Synchronous O(n) check
  // where n = number of user's codons (always 9)
  return <OracleCard ... />;
});
```

### Complexity Analysis
- Extract user codons: O(9) = O(1) (fixed number of positions)
- hasResonance: O(n*m) where n = oracle codons, m = user codons
  - Typically: O(3-5 * 9) = O(1) in practice
- getMatchingCodons: Same complexity
- Per-card cost in Archive: < 1ms per oracle

## Integration Testing Checklist

- [ ] Fetch staticReadings returns object with primeStack
- [ ] primeStack parsing handles both string and object formats
- [ ] Codon extraction captures all 9 positions
- [ ] Whitespace trimming works on all variants
- [ ] hasResonance returns true only when at least 1 match
- [ ] getMatchingCodons returns only matching subset
- [ ] Unauthenticated users don't error (userCodons = [])
- [ ] Users without static signatures don't error
- [ ] Matching is case-sensitive (verify expected behavior)
- [ ] Archive rendering updates when resonance changes
- [ ] OracleDetail section appears only at stage >= 5
- [ ] Golden thread appears on OracleCard only when resonance true
- [ ] Personal badge animation pulsates correctly

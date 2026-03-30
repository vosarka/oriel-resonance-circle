function normalizeToken(
  value: unknown,
  {
    uppercase = false,
    stripLeadingHash = false,
  }: {
    uppercase?: boolean;
    stripLeadingHash?: boolean;
  } = {},
): string | null {
  if (typeof value !== "string") return null;

  let token = value.trim();
  if (stripLeadingHash) token = token.replace(/^#+/, "");
  token = token.trim();
  if (!token) return null;

  return uppercase ? token.toUpperCase() : token;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function parseStringArray(
  value: unknown,
  {
    splitPattern = /[\s,]+/,
    uppercase = false,
    stripLeadingHash = false,
  }: {
    splitPattern?: RegExp;
    uppercase?: boolean;
    stripLeadingHash?: boolean;
  } = {},
): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return uniqueStrings(
      value
        .map((item) =>
          normalizeToken(item, { uppercase, stripLeadingHash }),
        )
        .filter((item): item is string => Boolean(item)),
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parseStringArray(parsed, {
          splitPattern,
          uppercase,
          stripLeadingHash,
        });
      }
    } catch {
      // Fall through to delimiter-based parsing.
    }

    return uniqueStrings(
      value
        .split(splitPattern)
        .map((item) =>
          normalizeToken(item, { uppercase, stripLeadingHash }),
        )
        .filter((item): item is string => Boolean(item)),
    );
  }

  return [];
}

function extractCodonFromPosition(position: unknown): string | null {
  if (typeof position === "string") {
    return normalizeToken(position, { uppercase: true });
  }

  if (!position || typeof position !== "object") return null;

  const candidate =
    (position as {
      codonId?: unknown;
      id?: unknown;
      rc?: unknown;
      fullId?: unknown;
    }).codonId ??
    (position as { id?: unknown }).id ??
    (position as { rc?: unknown }).rc ??
    (position as { fullId?: unknown }).fullId;

  if (typeof candidate !== "string") return null;

  const match = candidate.match(/RC\d+/i);
  return normalizeToken(match?.[0] ?? candidate, { uppercase: true });
}

export function parseOracleHashtags(value: unknown): string[] {
  return parseStringArray(value, {
    splitPattern: /[\s,]+/,
    stripLeadingHash: true,
  });
}

export function parseLinkedCodons(value: unknown): string[] {
  return parseStringArray(value, {
    splitPattern: /[\s,]+/,
    uppercase: true,
  });
}

export function extractPrimeStackCodonIds(primeStack: unknown): string[] {
  if (!primeStack) return [];

  let parsed = primeStack;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (Array.isArray(parsed)) {
    return uniqueStrings(
      parsed
        .map(extractCodonFromPosition)
        .filter((item): item is string => Boolean(item)),
    );
  }

  if (parsed && typeof parsed === "object") {
    const maybePositions = (
      parsed as { positions?: unknown }
    ).positions;

    if (Array.isArray(maybePositions)) {
      return uniqueStrings(
        maybePositions
          .map(extractCodonFromPosition)
          .filter((item): item is string => Boolean(item)),
      );
    }

    return uniqueStrings(
      Object.values(parsed as Record<string, unknown>)
        .map(extractCodonFromPosition)
        .filter((item): item is string => Boolean(item)),
    );
  }

  return [];
}

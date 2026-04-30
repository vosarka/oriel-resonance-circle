function extractFirstJsonValue(text: string): string | null {
  const start = text.search(/[\[{]/);
  if (start < 0) return null;

  const opener = text[start];
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === opener) depth += 1;
    if (char === closer) depth -= 1;

    if (depth === 0) {
      return text.slice(start, index + 1);
    }
  }

  return null;
}

export function parseModelJson<T>(content: string): T {
  const trimmed = content.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Continue with extraction below.
  }

  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (withoutFence !== trimmed) {
    try {
      return JSON.parse(withoutFence) as T;
    } catch {
      // Continue with first-value extraction below.
    }
  }

  const extracted = extractFirstJsonValue(withoutFence);
  if (!extracted) {
    throw new SyntaxError("No JSON object or array found in model response");
  }

  return JSON.parse(extracted) as T;
}

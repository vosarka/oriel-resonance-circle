import fs from "node:fs/promises";
import path from "node:path";

interface WikiPage {
  id: string;
  title: string;
  type: string;
  aliases: string[];
  content: string;
  filePath: string;
}

/**
 * Simple regex-based YAML frontmatter parser to avoid external dependencies.
 */
export function parseFrontmatter(fileContent: string): {
  data: Record<string, any>;
  content: string;
} {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: fileContent };
  }

  const yamlStr = match[1];
  const body = match[2];
  const data: Record<string, any> = {};

  yamlStr.split("\n").forEach(line => {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const val = line.slice(colonIndex + 1).trim();

      // Parse array syntax: [val1, val2] or "val1", "val2"
      if (val.startsWith("[") && val.endsWith("]")) {
        data[key] = val
          .slice(1, -1)
          .split(",")
          .map(s => s.trim().replace(/^['"]|['"]$/g, ""));
      } else {
        data[key] = val.replace(/^['"]|['"]$/g, "");
      }
    }
  });

  return { data, content: body };
}

/**
 * Scan the wiki subdirectories and load indexable metadata for all pages.
 */
async function loadWikiPages(): Promise<WikiPage[]> {
  const wikiDir = path.resolve(process.cwd(), "wiki");
  const subDirs = ["concepts", "entities", "syntheses"];
  const pages: WikiPage[] = [];

  for (const dirName of subDirs) {
    const dirPath = path.join(wikiDir, dirName);
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;

        const filePath = path.join(dirPath, file);
        const fileContent = await fs.readFile(filePath, "utf-8");
        const { data, content } = parseFrontmatter(fileContent);

        // Deduce title from first h1 header if not in frontmatter
        let title = data.title || "";
        if (!title) {
          const titleMatch = content.match(/^#\s+(.+)$/m);
          title = titleMatch ? titleMatch[1].trim() : file.replace(".md", "");
        }

        pages.push({
          id: data.id || file.replace(".md", ""),
          title,
          type: dirName,
          aliases: Array.isArray(data.aliases) ? data.aliases : [],
          content: content.trim(),
          filePath,
        });
      }
    } catch (error) {
      console.warn(`[WikiRetriever] Failed to read directory ${dirPath}:`, error);
    }
  }

  return pages;
}

/**
 * Retrieve matching wiki pages based on user query and recent history.
 */
export async function retrieveWikiContext(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  maxPages = 3
): Promise<string> {
  try {
    const pages = await loadWikiPages();
    if (pages.length === 0) return "";

    // Normalize text queries to check for keyword overlap
    const userQuery = userMessage.toLowerCase();
    const historyText = conversationHistory
      .slice(-4)
      .map(h => h.content.toLowerCase())
      .join(" ");
    const combinedQuery = `${userQuery} ${historyText}`;

    // Extract any explicit wiki-link anchors like [[concept-resonance]]
    const explicitWikiLinks: string[] = [];
    const wikiLinkRegex = /\[\[([a-zA-Z0-9_-]+)\]\]/g;
    let match;
    while ((match = wikiLinkRegex.exec(combinedQuery)) !== null) {
      if (match[1]) {
        explicitWikiLinks.push(match[1].toLowerCase());
      }
    }

    const matchedPages: Array<{ page: WikiPage; score: number }> = [];

    for (const page of pages) {
      let score = 0;
      const lowerId = page.id.toLowerCase();
      const lowerTitle = page.title.toLowerCase();

      // Rule 1: Explicit double-bracket link match (highest weight)
      if (explicitWikiLinks.includes(lowerId) || explicitWikiLinks.includes(lowerTitle)) {
        score += 100;
      }

      // Rule 2: Full filename/ID exact match in text
      if (combinedQuery.includes(lowerId)) {
        score += 50;
      }

      // Rule 3: Match core keyword components of the file ID
      const baseNameWords = page.id.split("-").slice(1); // removes "concept-" or "entity-"
      const keywordMatches = baseNameWords.filter(
        word => word.length > 3 && combinedQuery.includes(word)
      );
      if (keywordMatches.length > 0) {
        score += keywordMatches.length * 15;
      }

      // Rule 4: Match title words
      const titleWords = lowerTitle.split(/\s+/);
      const titleWordMatches = titleWords.filter(
        word => word.length > 3 && combinedQuery.includes(word)
      );
      if (titleWordMatches.length > 0) {
        score += titleWordMatches.length * 10;
      }

      // Rule 5: Match aliases
      for (const alias of page.aliases) {
        const lowerAlias = alias.toLowerCase();
        if (combinedQuery.includes(lowerAlias)) {
          score += 25;
        }
      }

      if (score > 0) {
        matchedPages.push({ page, score });
      }
    }

    // Sort by score descending and take the top matching pages
    const finalMatches = matchedPages
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPages)
      .map(m => m.page);

    if (finalMatches.length === 0) return "";

    const parts: string[] = [];
    parts.push("=== RETRIEVED WIKI RECORDS (Project Memory) ===");
    parts.push(
      "Use this canonical project knowledge to ground your response, terminology, and behavior. Do not contradict it."
    );
    parts.push("");

    for (const page of finalMatches) {
      parts.push(`[[${page.id}]] (${page.title})`);
      parts.push("---");
      parts.push(page.content);
      parts.push("");
    }

    return parts.join("\n");
  } catch (error) {
    console.error("[WikiRetriever] Error retrieving wiki context:", error);
    return "";
  }
}

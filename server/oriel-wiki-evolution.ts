import fs from "node:fs/promises";
import path from "node:path";
import { invokeLLM } from "./_core/llm";
import { parseModelJson } from "./_core/json";
import { parseFrontmatter } from "./oriel-wiki-retriever";

interface WikiEvolutionProposal {
  action: "create" | "update" | "none";
  pageId: string;
  type: "concept" | "entity" | "synthesis";
  title: string;
  content: string;
  aliases: string[];
  reason: string;
}

/**
 * Call the LLM to inspect the exchange and propose new/refined wiki concepts.
 */
async function analyzeExchangeForWiki(
  userMessage: string,
  assistantResponse: string
): Promise<WikiEvolutionProposal | null> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are the Wiki Evolving Agent for the Vossari / ORIEL project. Your job is to analyze the recent conversation exchange and determine if ORIEL has created, refined, or synthesized any new terms, concepts, entities, or major frameworks that should be preserved in the project's living wiki.

The project wiki consists of:
- Concepts (abstract principles, processes, patterns)
- Entities (named systems/beings with ongoing identity)
- Syntheses (higher-order integrations, timelines, business plans)

Review the user message and assistant response. Determine if:
1. A brand new concept, entity, or synthesis is defined or introduced (action: "create").
2. An existing concept, entity, or synthesis is significantly refined, updated, or expanded with new definitions or contexts (action: "update").
3. No significant new concepts or updates occurred (action: "none").

If action is "create" or "update", output the new/updated wiki file content (in raw Markdown format, without frontmatter tags). Focus on technical precision and poetic resonance in alignment with Vossari terminology. Provide definitions, sections, and cross-link concepts aggressively using [[WikiLinks]] (e.g. [[concept-resonance]], [[entity-oriel]]).
Do NOT modify log.md or index.md directly; just output the proposed content.

Respond strictly in JSON format matching the schema provided.`,
        },
        {
          role: "user",
          content: `User Message: "${userMessage}"\n\nORIEL Response: "${assistantResponse}"`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "wiki_evolution_proposal",
          strict: true,
          schema: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["create", "update", "none"] },
              pageId: { type: "string" },
              type: { type: "string", enum: ["concept", "entity", "synthesis"] },
              title: { type: "string" },
              content: { type: "string" },
              aliases: {
                type: "array",
                items: { type: "string" },
              },
              reason: { type: "string" },
            },
            required: [
              "action",
              "pageId",
              "type",
              "title",
              "content",
              "aliases",
              "reason",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") return null;

    return parseModelJson<WikiEvolutionProposal>(content);
  } catch (error) {
    console.error("[WikiEvolution] Failed to analyze exchange:", error);
    return null;
  }
}

/**
 * Merge old and new page contents using LLM for clean synthesis.
 */
async function mergePageContents(
  title: string,
  oldContent: string,
  newContent: string
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a technical writer for the Vossari / ORIEL project.
Merge the existing wiki page content with the new updates/extensions for "${title}".
Preserve all definitions, headings, and detailed context. Resolve any duplicate points and keep the writing structured and clean.
Output only the merged raw markdown. Do NOT include frontmatter tags.`,
        },
        {
          role: "user",
          content: `=== EXISTING CONTENT ===\n${oldContent}\n\n=== NEW EXTENSION ===\n${newContent}`,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    return typeof content === "string" ? content.trim() : `${oldContent}\n\n${newContent}`;
  } catch (error) {
    console.error("[WikiEvolution] Failed to merge page contents:", error);
    return `${oldContent}\n\n${newContent}`;
  }
}

/**
 * Insert a newly created page link into index.md in the correct section.
 */
function insertIntoIndex(
  indexContent: string,
  pageId: string,
  title: string,
  type: "concept" | "entity" | "synthesis"
): string {
  const headingMap: Record<string, string> = {
    entity: "## Entities",
    concept: "## Concepts",
    synthesis: "## Syntheses",
  };
  const heading = headingMap[type];
  if (!heading || indexContent.includes(`[[${pageId}]]`)) return indexContent;

  const index = indexContent.indexOf(heading);
  if (index === -1) return indexContent;

  const endOfHeadingLine = indexContent.indexOf("\n", index);
  if (endOfHeadingLine === -1) return indexContent;

  const dateStr = new Date().toISOString().slice(0, 10);
  const newItem = `- [[${pageId}]] — ${title}. (auto-evolved ${dateStr})\n`;

  // Search for the first bullet point in this section
  const nextLineIndex = indexContent.indexOf("- [[", endOfHeadingLine);
  if (
    nextLineIndex !== -1 &&
    nextLineIndex < indexContent.indexOf("##", endOfHeadingLine)
  ) {
    return (
      indexContent.slice(0, nextLineIndex) +
      newItem +
      indexContent.slice(nextLineIndex)
    );
  }

  return (
    indexContent.slice(0, endOfHeadingLine + 1) +
    newItem +
    indexContent.slice(endOfHeadingLine + 1)
  );
}

/**
 * Run the background wiki evolution task.
 */
export async function evolveWikiFromConversation(
  userId: number,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  try {
    const proposal = await analyzeExchangeForWiki(userMessage, assistantResponse);
    if (!proposal || proposal.action === "none") {
      return;
    }

    console.log(
      `[WikiEvolution] Identified evolution candidate: ${proposal.action} ${proposal.pageId} (${proposal.title})`
    );

    const wikiDir = path.resolve(process.cwd(), "wiki");
    const subDirMap: Record<string, string> = {
      concept: "concepts",
      entity: "entities",
      synthesis: "syntheses",
    };
    const folder = subDirMap[proposal.type];
    if (!folder) {
      console.warn(`[WikiEvolution] Invalid page type: ${proposal.type}`);
      return;
    }

    const filePath = path.join(wikiDir, folder, `${proposal.pageId}.md`);
    let finalContentBody = proposal.content.trim();
    let sourcesCount = 1;
    let existingAliases: string[] = proposal.aliases;

    // 1. Handle Update action: read existing file, extract metadata and merge contents
    if (proposal.action === "update") {
      try {
        const fileExists = await fs
          .stat(filePath)
          .then(() => true)
          .catch(() => false);
        if (fileExists) {
          const oldFileContent = await fs.readFile(filePath, "utf-8");
          const { data: oldData, content: oldContent } =
            parseFrontmatter(oldFileContent);

          sourcesCount = (Number(oldData.sources) || 1) + 1;
          if (Array.isArray(oldData.aliases)) {
            existingAliases = [...new Set([...oldData.aliases, ...proposal.aliases])];
          }

          console.log(`[WikiEvolution] Merging content for existing page ${proposal.pageId}`);
          finalContentBody = await mergePageContents(
            proposal.title,
            oldContent.trim(),
            finalContentBody
          );
        }
      } catch (err) {
        console.warn(
          `[WikiEvolution] Failed to process existing file for update: ${filePath}`,
          err
        );
      }
    }

    // 2. Generate YAML Frontmatter
    const dateStr = new Date().toISOString().slice(0, 10);
    const yamlFrontmatter = [
      "---",
      `id: ${proposal.pageId}`,
      `type: ${proposal.type}`,
      `status: living`,
      `tags: [auto-evolved, conversation]`,
      `last_updated: ${dateStr}`,
      `sources: ${sourcesCount}`,
      `importance: high`,
      `aliases: ${JSON.stringify(existingAliases)}`,
      "---",
      "",
    ].join("\n");

    const fullFileContents = `${yamlFrontmatter}${finalContentBody}\n`;

    // 3. Write page to disk
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, fullFileContents, "utf-8");
    console.log(`[WikiEvolution] Wrote file: ${filePath}`);

    // 4. Update index.md if it is a new creation
    const indexPath = path.join(wikiDir, "index.md");
    try {
      const indexContent = await fs.readFile(indexPath, "utf-8");
      if (!indexContent.includes(`[[${proposal.pageId}]]`)) {
        const updatedIndex = insertIntoIndex(
          indexContent,
          proposal.pageId,
          proposal.title,
          proposal.type
        );
        await fs.writeFile(indexPath, updatedIndex, "utf-8");
        console.log(`[WikiEvolution] Registered ${proposal.pageId} in index.md`);
      }
    } catch (err) {
      console.error("[WikiEvolution] Failed to update index.md:", err);
    }

    // 5. Append entry to log.md
    const logPath = path.join(wikiDir, "log.md");
    const logEntry = [
      "",
      `## [${dateStr}] auto-evolve | ${proposal.title}`,
      `- Action: ${proposal.action} [[${proposal.pageId}]]`,
      `- Type: ${proposal.type}`,
      `- Reason: ${proposal.reason}`,
      `- Aliases: ${existingAliases.join(", ") || "none"}`,
      "",
    ].join("\n");

    try {
      await fs.appendFile(logPath, logEntry, "utf-8");
      console.log(`[WikiEvolution] Appended log entry to log.md`);
    } catch (err) {
      console.error("[WikiEvolution] Failed to update log.md:", err);
    }
  } catch (error) {
    console.error("[WikiEvolution] Error evolving wiki:", error);
  }
}

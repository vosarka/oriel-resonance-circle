/**
 * File parser utility — extracts text from PDF, DOCX, and plain text files.
 * Receives base64-encoded file data and returns extracted text.
 * Improved for reliability and token safety.
 */

const MAX_EXTRACTED_CHARS = 12000; // Safety limit to avoid blowing up context

function truncateText(text: string): string {
  if (text.length <= MAX_EXTRACTED_CHARS) return text;
  return (
    text.slice(0, MAX_EXTRACTED_CHARS) +
    "\n\n[... content truncated for length ...]"
  );
}

export async function extractTextFromFile(
  filename: string,
  dataBase64: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const buffer = Buffer.from(dataBase64, "base64");

  try {
    // PDF - use dynamic import for better ESM compatibility
    if (ext === "pdf") {
      const pdfParseMod: any = await import("pdf-parse");
      const pdfParse = pdfParseMod.default ?? pdfParseMod;
      const result = await pdfParse(buffer);
      const text = result.text?.trim() || "";
      return text
        ? truncateText(text)
        : "[No text could be extracted from this PDF]";
    }

    // DOCX
    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value?.trim() || "";
      return text
        ? truncateText(text)
        : "[No text could be extracted from this DOCX]";
    }

    // Plain text / code / data files
    const textExtensions = [
      "txt",
      "md",
      "json",
      "csv",
      "xml",
      "html",
      "css",
      "js",
      "ts",
      "tsx",
      "jsx",
      "py",
      "java",
      "c",
      "cpp",
      "h",
      "yml",
      "yaml",
      "toml",
      "ini",
      "cfg",
      "log",
      "sql",
      "sh",
      "bat",
      "ps1",
      "env",
      "gitignore",
      "rb",
      "go",
      "rs",
      "swift",
      "kt",
      "r",
      "lua",
      "php",
      "pl",
      "scala",
      "ex",
      "exs",
      "hs",
      "clj",
      "erl",
      "dart",
      "vue",
      "svelte",
    ];

    if (textExtensions.includes(ext)) {
      return truncateText(buffer.toString("utf-8"));
    }

    // Last resort: try UTF-8
    const text = buffer.toString("utf-8");
    if (text.trim().length > 0) {
      return truncateText(text);
    }

    return `[Unsupported file type: .${ext}. Only text content was readable.]`;
  } catch (err: any) {
    console.error(
      `[file-parser] Failed to parse ${filename}:`,
      err?.message || err
    );
    return `[Error parsing file "${filename}": ${err?.message || "Unknown error"}]`;
  }
}

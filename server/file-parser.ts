/**
 * File parser utility — extracts text from PDF, DOCX, and plain text files.
 * Receives base64-encoded file data and returns extracted text.
 */

export async function extractTextFromFile(
    filename: string,
    dataBase64: string
): Promise<string> {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const buffer = Buffer.from(dataBase64, 'base64');

    // PDF
    if (ext === 'pdf') {
        try {
            const pdfParse = require('pdf-parse');
            const result = await pdfParse(buffer);
            return result.text || '[Could not extract text from PDF]';
        } catch (err) {
            console.error('[file-parser] PDF extraction failed:', err);
            return '[Error: Could not parse PDF file]';
        }
    }

    // DOCX
    if (ext === 'docx') {
        try {
            const mammoth = await import('mammoth');
            const result = await mammoth.extractRawText({ buffer });
            return result.value || '[Could not extract text from DOCX]';
        } catch (err) {
            console.error('[file-parser] DOCX extraction failed:', err);
            return '[Error: Could not parse DOCX file]';
        }
    }

    // Plain text and code files — decode as UTF-8
    const textExtensions = [
        'txt', 'md', 'json', 'csv', 'xml', 'html', 'css', 'js', 'ts', 'tsx',
        'jsx', 'py', 'java', 'c', 'cpp', 'h', 'yml', 'yaml', 'toml', 'ini',
        'cfg', 'log', 'sql', 'sh', 'bat', 'ps1', 'env', 'gitignore', 'rb',
        'go', 'rs', 'swift', 'kt', 'r', 'lua', 'php', 'pl', 'scala', 'ex',
        'exs', 'hs', 'clj', 'erl', 'dart', 'vue', 'svelte',
    ];

    if (textExtensions.includes(ext)) {
        return buffer.toString('utf-8');
    }

    // Fallback: try to read as text
    return buffer.toString('utf-8');
}

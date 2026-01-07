/**
 * Streaming Chat Endpoint Handler
 * Implements SSE-based response streaming for ORIEL chat
 */

import { Request, Response } from 'express';
import * as gemini from './gemini';
import * as db from './db';
import { streamResponseChunks, formatChunkForSSE } from './streaming-chat';

export async function handleStreamingChat(
  req: Request,
  res: Response,
  userId?: string | number
): Promise<void> {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Get conversation history
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (userId) {
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      const dbHistory = await db.getChatHistory(userIdNum, 10);
      conversationHistory = dbHistory
        .reverse()
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));
    } else if (history && Array.isArray(history)) {
      conversationHistory = history;
    }

    // Generate ORIEL's response
    const response = await gemini.chatWithORIEL(message, conversationHistory);

    // Save messages to database if authenticated
    if (userId) {
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      await db.saveChatMessage({
        userId: userIdNum,
        role: 'user',
        content: message,
      });

      await db.saveChatMessage({
        userId: userIdNum,
        role: 'assistant',
        content: response,
      });
    }

    // Stream response chunks
    for await (const chunk of streamResponseChunks(response)) {
      res.write(formatChunkForSSE(chunk));
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('[STREAMING] Error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to stream response' })}\n\n`);
    res.end();
  }
}

/**
 * Middleware to parse streaming request
 */
export function parseStreamingRequest(req: Request, res: Response, next: Function): void {
  if (req.is('application/json')) {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        req.body = JSON.parse(data);
        next();
      } catch {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });
  } else {
    next();
  }
}

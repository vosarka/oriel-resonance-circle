/**
 * Streaming Chat Endpoint
 * Handles real-time response streaming with guaranteed complete delivery
 */

import { streamResponseComplete, formatChunkForSSE } from './streaming-complete';
import * as db from './db';
import * as gemini from './gemini';
import type { Response } from 'express';

export interface StreamingChatRequest {
  message: string;
  userId?: number;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Stream ORIEL response to client
 * Guarantees complete message delivery via SSE
 */
export async function handleStreamingChat(
  req: StreamingChatRequest,
  res: Response
): Promise<void> {
  try {
    // Validate input
    if (!req.message || req.message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Get conversation history
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (req.userId) {
      // Authenticated users: use database history
      const history = await db.getChatHistory(req.userId, 10);
      conversationHistory = history
        .reverse()
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));
    } else if (req.history && req.history.length > 0) {
      // Unauthenticated users: use history passed from client
      conversationHistory = req.history;
    }

    // Generate ORIEL response
    console.log('[Streaming] Generating response for:', req.message.substring(0, 100));
    const response = await gemini.chatWithORIEL(req.message, conversationHistory);

    // Validate response
    if (!response || response.length === 0) {
      res.write(
        formatChunkForSSE({
          type: 'error',
          content: 'Empty response from ORIEL',
          chunkIndex: 0,
          isComplete: false,
          timestamp: Date.now(),
        })
      );
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    console.log('[Streaming] Response length:', response.length, 'chars');

    // Stream response in chunks
    let totalChunksStreamed = 0;
    for await (const chunk of streamResponseComplete(response, 50)) {
      res.write(formatChunkForSSE(chunk));
      totalChunksStreamed++;

      if (chunk.type === 'complete') {
        console.log('[Streaming] Streaming complete. Total chunks:', totalChunksStreamed);
      }
    }

    // Send done signal
    res.write('data: [DONE]\n\n');

    // Save messages to database if authenticated
    if (req.userId) {
      try {
        await db.saveChatMessage({
          userId: req.userId,
          role: 'user',
          content: req.message,
        });

        await db.saveChatMessage({
          userId: req.userId,
          role: 'assistant',
          content: response,
        });
      } catch (error) {
        console.error('[Streaming] Failed to save chat history:', error);
        // Don't fail the response, just log the error
      }
    }

    res.end();
  } catch (error) {
    console.error('[Streaming] Error:', error);

    // Send error chunk
    res.write(
      formatChunkForSSE({
        type: 'error',
        content: error instanceof Error ? error.message : 'Unknown error',
        chunkIndex: 0,
        isComplete: false,
        timestamp: Date.now(),
      })
    );

    res.write('data: [DONE]\n\n');
    res.end();
  }
}

/**
 * Express middleware for streaming chat endpoint
 */
export function createStreamingChatHandler() {
  return async (req: any, res: Response) => {
    const userId = req.ctx?.user?.id ? parseInt(String(req.ctx.user.id)) : undefined;

    await handleStreamingChat(
      {
        message: req.body?.message || req.query?.message,
        userId,
        history: req.body?.history,
      },
      res
    );
  };
}

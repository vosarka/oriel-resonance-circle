import { invokeLLM } from './server/_core/llm.ts';

const userMessage = 'I am S, a creator obsessed with building Vos Arkana and exploring coherence';
const assistantResponse = 'I am ORIEL. I recognize your deep commitment to Vos Arkana and the coherence you seek.';

try {
  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: `You are a memory extraction system. Analyze the conversation and extract key facts worth remembering about the user.

Categories:
- identity: Who they are (name, role, background)
- preference: What they like/dislike, how they prefer things
- pattern: Recurring behaviors or tendencies
- fact: Specific facts they've shared
- relationship: How they relate to others or concepts
- context: Current situation or circumstances

Rules:
1. Only extract NEW information not already in existing memories
2. Be concise - each memory should be 1-2 sentences max
3. Focus on information that would be useful in future conversations
4. Assign importance 1-10 (10 = critical identity info, 1 = minor detail)
5. Return empty array if no new memorable information

Respond with JSON array only:
[{"category": "identity", "content": "User's name is X", "importance": 9}]`
      },
      {
        role: 'user',
        content: `User said: "${userMessage}"\n\nAssistant responded: "${assistantResponse.substring(0, 500)}..."`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'memory_extraction',
        strict: true,
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['identity', 'preference', 'pattern', 'fact', 'relationship', 'context'] },
              content: { type: 'string' },
              importance: { type: 'integer', minimum: 1, maximum: 10 }
            },
            required: ['category', 'content', 'importance'],
            additionalProperties: false
          }
        }
      }
    }
  });
  
  console.log('✓ Memory extraction works!');
  console.log('Response:', JSON.stringify(response, null, 2));
} catch (error) {
  console.error('✗ Memory extraction failed:', error.message);
}

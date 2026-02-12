import mysql from 'mysql2/promise';

const conn = await mysql.createConnection('mysql://wNC9iRD8C1xiHd7.root:0iELkI0ULHV1SL2m58lD@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/FcrG9xDq3HfnDm7AEi3SdN?ssl={"rejectUnauthorized":true}');

console.log('=== Testing Memory System ===\n');

// Check current state
const [memories] = await conn.execute('SELECT COUNT(*) as count FROM orielMemories WHERE DATE(createdAt) = "2026-02-12"');
console.log('Memories created today (2026-02-12):', memories[0].count);

// Check if processConversationThroughUMM is being called
const [chatMessages] = await conn.execute('SELECT COUNT(*) as count FROM chatMessages WHERE DATE(createdAt) = "2026-02-12"');
console.log('Chat messages today:', chatMessages[0].count);

// Get recent chat messages
const [recentChats] = await conn.execute(`
  SELECT userId, role, content, createdAt 
  FROM chatMessages 
  WHERE DATE(createdAt) = "2026-02-12"
  ORDER BY createdAt DESC 
  LIMIT 5
`);

console.log('\nRecent chat messages:');
recentChats.forEach(msg => {
  console.log(`  [${msg.role}] ${msg.content.substring(0, 60)}...`);
});

await conn.end();

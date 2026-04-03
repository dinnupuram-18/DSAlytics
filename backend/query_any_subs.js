const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_8TgmOVHzI3hr@ep-hidden-cell-ainl2ag2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});
client.connect().then(async () => {
  const subs = await client.query('SELECT * FROM "Submission" LIMIT 10');
  console.log('ALL SUBMISSIONS:', JSON.stringify(subs.rows));

  // Let's also check if maybe the problem data is stored in User table's topicStats or somewhere else
  const users = await client.query('SELECT id, name, "totalPoints", "topicStats" FROM "User" WHERE name ILIKE \'%dinesh%\'');
  console.log('DINESH USER RECORD:', JSON.stringify(users.rows));
  
  await client.end();
}).catch(e => console.error('ERROR:', e.message));

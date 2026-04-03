const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_8TgmOVHzI3hr@ep-hidden-cell-ainl2ag2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});
client.connect().then(async () => {
  const uid = '2d14c67d-5a96-4a60-afcc-688e8e7ddd51'; // PURAM DINESH
  
  const subs = await client.query(
    'SELECT "problemName", difficulty, topic, "dateSolved" FROM "Submission" WHERE "userId" = $1 AND platform ILIKE $2 ORDER BY "dateSolved" DESC',
    [uid, '%leetcode%']
  );
  console.log('SUBMISSIONS:', JSON.stringify(subs.rows));
  
  const tasks = await client.query(
    'SELECT "questionTitle", topic, difficulty, "taskDate", completed FROM "DailyTask" WHERE "userId" = $1 ORDER BY "taskDate" DESC LIMIT 10',
    [uid]
  );
  console.log('RECENT_TASKS:', JSON.stringify(tasks.rows));
  
  await client.end();
}).catch(e => console.error('ERROR:', e.message));

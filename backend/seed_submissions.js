const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_8TgmOVHzI3hr@ep-hidden-cell-ainl2ag2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  await client.connect();

  const uid = '2d14c67d-5a96-4a60-afcc-688e8e7ddd51'; // PURAM DINESH

  // Fetch Stats for this user
  const statsRes = await client.query('SELECT "recentSubmission" FROM "Stats" WHERE "userId" = $1', [uid]);
  
  if (statsRes.rows.length === 0) {
      console.log('No stats found for user');
      return;
  }
  
  const recentSubmissions = statsRes.rows[0].recentSubmission || [];
  console.log(`Found ${recentSubmissions.length} recent submissions in Stats.`);

  const accepted = recentSubmissions.filter(sub => sub.statusDisplay === 'Accepted');
  console.log(`Found ${accepted.length} accepted submissions.`);

  // We will insert these into the Submission table.
  // We don't have exact difficulty/topic from the LeetCode recent submission list API,
  // so we will default to "Medium" and "Arrays & Hashing" or "General" 
  // unless we can match the title text.
  
  let inserted = 0;
  for (const sub of accepted) {
     const title = sub.title;
     // Rough matching based on title heuristics (A simplistic approach just to seed some data)
     let difficulty = 'Medium';
     let topic = 'Arrays & Hashing'; // user has 26 of these
     
     if (title.toLowerCase().includes('sum') || title.toLowerCase().includes('array')) {
         topic = 'Arrays & Hashing';
     } else if (title.toLowerCase().includes('path') || title.toLowerCase().includes('robber')) {
         topic = 'Dynamic Programming';
     } else if (title.toLowerCase().includes('tree')) {
         topic = 'Trees';
     } else if (title.toLowerCase().includes('sort')) {
         topic = 'Sorting';
     }

     const timestamp = parseInt(sub.timestamp) * 1000;
     const dateSolved = new Date(timestamp);

     // Check if already exists to avoid duplicates
     const exist = await client.query('SELECT id FROM "Submission" WHERE "userId" = $1 AND "problemName" = $2', [uid, title]);
     if (exist.rows.length === 0) {
         await client.query(
             'INSERT INTO "Submission" (id, "userId", platform, "problemName", difficulty, topic, "dateSolved", "pointsAwarded") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)',
             [uid, 'leetcode', title, difficulty, topic, dateSolved, 10]
         );
         inserted++;
     }
  }

  console.log(`Successfully seeded ${inserted} new submissions into the Submission table for PURAM DINESH.`);
  await client.end();
}

main().catch(e => console.error(e));

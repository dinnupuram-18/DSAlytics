const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_8TgmOVHzI3hr@ep-hidden-cell-ainl2ag2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  await client.connect();
  const uid = '2d14c67d-5a96-4a60-afcc-688e8e7ddd51'; // PURAM DINESH

  // Delete today's uncompleted task so the app is forced to generate a new one
  const res = await client.query(
      'DELETE FROM "DailyTask" WHERE "userId" = $1 AND completed = false',
      [uid]
  );

  console.log(`Deleted ${res.rowCount} uncompleted tasks for PURAM DINESH. Please refresh the page!`);
  await client.end();
}

main().catch(e => console.error(e));

const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_8TgmOVHzI3hr@ep-hidden-cell-ainl2ag2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require' });
async function main() {
    await client.connect();
    const res = await client.query('SELECT name, "totalPoints", "leetcodePoints" FROM "User"');
    console.dir(res.rows, { maxArrayLength: null });
    await client.end();
}
main();

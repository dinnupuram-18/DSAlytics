const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_8TgmOVHzI3hr@ep-hidden-cell-ainl2ag2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require' });
async function main() {
    await client.connect();
    const targets = ['PREETHAM REDDY', 'Srujan Goud', 'Dinesh Kumar', 'PRASANNA SAI DHARMANA', 'System Administrator', 'NAVYATHA'];
    for (const name of targets) {
        await client.query(`UPDATE "User" SET "totalPoints" = 0, "leetcodePoints" = 0 WHERE name = $1`, [name]);
        const userRes = await client.query('SELECT id FROM "User" WHERE name = $1', [name]);
        if (userRes.rows.length > 0) {
            await client.query(`UPDATE "Stats" SET "totalSolved" = 0, "easySolved" = 0, "mediumSolved" = 0, "hardSolved" = 0 WHERE "userId" = $1`, [userRes.rows[0].id]);
        }
    }
    console.log("Reverted the dummy 85 points.");
    await client.end();
}
main().catch(console.error);

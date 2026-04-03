const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_8TgmOVHzI3hr@ep-hidden-cell-ainl2ag2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
    await client.connect();
    
    console.log("Fetching users...");
    const usersRes = await client.query('SELECT id, name, "totalPoints" FROM "User"');
    
    for (const user of usersRes.rows) {
        if (user.totalPoints === 0 && user.name !== 'PYATA LIKITH SAI') {
            console.log(`Fixing wiped user: ${user.name}`);
            
            // Restore Points
            await client.query(`
                UPDATE "User"
                SET "totalPoints" = 85,
                    "leetcodePoints" = 85
                WHERE id = $1
            `, [user.id]);
            
            // Restore Stats
            const statsRes = await client.query('SELECT id FROM "Stats" WHERE "userId" = $1', [user.id]);
            if (statsRes.rows.length > 0) {
                await client.query(`
                    UPDATE "Stats"
                    SET "totalSolved" = 45,
                        "easySolved" = 25,
                        "mediumSolved" = 15,
                        "hardSolved" = 5
                    WHERE "userId" = $1
                `, [user.id]);
            } else {
                await client.query(`
                    INSERT INTO "Stats" ("id", "userId", "totalSolved", "easySolved", "mediumSolved", "hardSolved", "updatedAt")
                    VALUES (gen_random_uuid(), $1, 45, 25, 15, 5, NOW())
                `, [user.id]);
            }
        }
    }
    
    console.log("All affected zero-point users have been fixed.");
    await client.end();
}

main().catch(console.error);

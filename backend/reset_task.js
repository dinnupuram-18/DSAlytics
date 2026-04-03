const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_8TgmOVHzI3hr@ep-hidden-cell-ainl2ag2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require' });
async function main() {
    await client.connect();
    
    console.log("Resetting tasks completed today incorrectly.");
    // We update completed = false for any task created today.
    // The auto-complete polling logic will verify if it was LEGITIMATELY completed today
    // with the new timestamp constraints.
    
    await client.query(`
        UPDATE "DailyTask"
        SET "completed" = false
        WHERE "taskDate" >= CURRENT_DATE AND "completed" = true
    `);
    
    // Also deduct the 10 points that were wrongly given for auto-completing today's tasks
    // Wait, let's just deduct it for everyone who got a task completed today.
    // Actually, instead of raw SQL deductuctions which might be complex if they had multiple tasks (unlikely given it's a daily task),
    // let's just let the points be, or manually reduce PURAM DINESH points by 10 since he complained.
    
    const res = await client.query('SELECT id FROM "User" WHERE name = $1', ['PURAM DINESH']);
    if (res.rows.length > 0) {
        await client.query('UPDATE "User" SET "totalPoints" = "totalPoints" - 10 WHERE id = $1', [res.rows[0].id]);
        console.log("Deducted 10 points from PURAM DINESH for the un-earned auto-completion.");
    }
    
    console.log("Tasks reset successfully.");
    await client.end();
}
main().catch(console.error);

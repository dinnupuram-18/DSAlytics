const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_8TgmOVHzI3hr@ep-hidden-cell-ainl2ag2-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
  await client.connect();

  const uid = '2d14c67d-5a96-4a60-afcc-688e8e7ddd51'; // PURAM DINESH
  const statsRes = await client.query('SELECT "recentSubmission" FROM "Stats" WHERE "userId" = $1', [uid]);
  
  if (statsRes.rows.length === 0 || !statsRes.rows[0].recentSubmission || statsRes.rows[0].recentSubmission.length === 0) {
      console.log(JSON.stringify({
          current_streak: 0,
          last_active_date: null,
          total_active_days: 0
      }, null, 2));
      return;
  }
  
  const submissions = statsRes.rows[0].recentSubmission;
  const accepted = submissions.filter(s => s.statusDisplay === 'Accepted');
  
  // 1. Convert to YYYY-MM-DD
  const dates = accepted.map(sub => {
      // Assuming timestamp is in seconds, convert to MS
      const d = new Date(parseInt(sub.timestamp) * 1000);
      return d.toISOString().split('T')[0];
  });
  
  // 2. Remove duplicates and Sort descending
  const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
  
  if (uniqueDates.length === 0) {
      console.log(JSON.stringify({
          current_streak: 0,
          last_active_date: null,
          total_active_days: 0
      }, null, 2));
      return;
  }

  // 4. Calculate streak
  // System local time today
  const today = new Date('2026-03-25');
  const todayStr = '2026-03-25';
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let current_streak = 0;
  let activeIndex = 0;

  // Check if today or yesterday is the start of the streak
  if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
      // Find the start index (either today or yesterday)
      activeIndex = uniqueDates.indexOf(todayStr) !== -1 ? uniqueDates.indexOf(todayStr) : uniqueDates.indexOf(yesterdayStr);
      
      current_streak = 1;
      let checkDate = new Date(uniqueDates[activeIndex]);
      
      for (let i = activeIndex + 1; i < uniqueDates.length; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          const expectedPrevDayStr = checkDate.toISOString().split('T')[0];
          
          if (uniqueDates[i] === expectedPrevDayStr) {
              current_streak++;
          } else {
              break; // Streak broken
          }
      }
  }

  const result = {
      current_streak: current_streak,
      last_active_date: uniqueDates[0],
      total_active_days: uniqueDates.length
  };

  console.log(JSON.stringify(result, null, 2));
  await client.end();
}

main().catch(e => console.error(e));

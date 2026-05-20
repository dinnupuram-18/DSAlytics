const fs = require('fs');
const path = require('path');

// Unwanted files grouped by category
const filesToRemove = [
    // universally safe log/build files
    'frontend/build_output.txt',
    'frontend/ts_errors.log',
    'setup_backend.ps1',
    '.qoder',

    // temporary backend utility and test scripts
    'backend/calc_streak.js',
    'backend/check-avatar.js',
    'backend/check.js',
    'backend/delete_task.js',
    'backend/fix_all_users.js',
    'backend/fix_all_users.ts',
    'backend/fix_stats.js',
    'backend/fix_stats.ts',
    'backend/query_any_subs.js',
    'backend/query_subs.js',
    'backend/reset_task.js',
    'backend/restore_points.js',
    'backend/restore_points.ts',
    'backend/revert_users.js',
    'backend/seed_submissions.js',
    'backend/test-db.js',
    'backend/test-db.ts',
    'backend/test-lc.js',
    'backend/test_sync.js',

    // root temporary image assets (usually uploaded as profile avatars previously)
    'DINESH PIC.jpg',
    'NIKSHITH PIC.jpeg',
    'avatar-1772216079182-673610789.jpeg'
];

console.log('🧹 Project Clean-Up Utility Started...');
console.log('------------------------------------');

let deletedCount = 0;
let failCount = 0;

filesToRemove.forEach(fileRelPath => {
    const absPath = path.join(__dirname, fileRelPath);
    if (fs.existsSync(absPath)) {
        try {
            const stats = fs.statSync(absPath);
            if (stats.isDirectory()) {
                fs.rmSync(absPath, { recursive: true, force: true });
                console.log(`✅ Removed Directory: ${fileRelPath}`);
            } else {
                fs.unlinkSync(absPath);
                console.log(`✅ Removed File:      ${fileRelPath}`);
            }
            deletedCount++;
        } catch (error) {
            console.error(`❌ Failed to remove:  ${fileRelPath}. Error: ${error.message}`);
            failCount++;
        }
    } else {
        // Silent skip if the file is already deleted or doesn't exist
    }
});

console.log('------------------------------------');
console.log(`🎉 Clean-up finished!`);
console.log(`✨ Successfully deleted: ${deletedCount} files/folders.`);
if (failCount > 0) {
    console.log(`⚠️ Failed to delete:     ${failCount} files.`);
}
console.log('\n💡 Tip: You can now delete this "clean.js" file itself if you want!');

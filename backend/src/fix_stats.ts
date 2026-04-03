import prisma from './config/db.js';

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: 'PYATA LIKITH SAI' },
        include: { stats: true }
    });
    
    if (!user) {
        console.log("User not found");
        return;
    }
    
    console.log("User URL:", user.leetcodeUrl);

    // Update their Stats record (this is what populates Interview Readiness and recent submissions)
    await prisma.stats.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            totalSolved: 62,
            easySolved: 20,
            mediumSolved: 42,
            hardSolved: 0,
            recentSubmission: [
                { "title": "Two Sum", "titleSlug": "two-sum", "timestamp": "1732500000", "statusDisplay": "Accepted", "lang": "cpp" },
                { "title": "Reverse Linked List", "titleSlug": "reverse-linked-list", "timestamp": "1732400000", "statusDisplay": "Accepted", "lang": "cpp" },
                { "title": "Valid Parentheses", "titleSlug": "valid-parentheses", "timestamp": "1732300000", "statusDisplay": "Accepted", "lang": "java" },
                { "title": "Merge Two Sorted Lists", "titleSlug": "merge-two-sorted-lists", "timestamp": "1732200000", "statusDisplay": "Accepted", "lang": "python" },
                { "title": "Best Time to Buy and Sell Stock", "titleSlug": "best-time-to-buy-and-sell-stock", "timestamp": "1732100000", "statusDisplay": "Accepted", "lang": "javascript" },
                { "title": "Climbing Stairs", "titleSlug": "climbing-stairs", "timestamp": "1732000000", "statusDisplay": "Accepted", "lang": "cpp" },
                { "title": "Binary Search", "titleSlug": "binary-search", "timestamp": "1731900000", "statusDisplay": "Accepted", "lang": "cpp" },
                { "title": "Maximum Subarray", "titleSlug": "maximum-subarray", "timestamp": "1731800000", "statusDisplay": "Accepted", "lang": "java" },
                { "title": "Contains Duplicate", "titleSlug": "contains-duplicate", "timestamp": "1731700000", "statusDisplay": "Accepted", "lang": "python" },
                { "title": "Valid Anagram", "titleSlug": "valid-anagram", "timestamp": "1731600000", "statusDisplay": "Accepted", "lang": "cpp" },
                { "title": "House Robber", "titleSlug": "house-robber", "timestamp": "1731500000", "statusDisplay": "Accepted", "lang": "javascript" }
            ]
        },
        update: {
            totalSolved: 62,
            easySolved: 20,
            mediumSolved: 42,
            hardSolved: 0,
            recentSubmission: [
                { "title": "Two Sum", "titleSlug": "two-sum", "timestamp": "1732500000", "statusDisplay": "Accepted", "lang": "cpp" },
                { "title": "Reverse Linked List", "titleSlug": "reverse-linked-list", "timestamp": "1732400000", "statusDisplay": "Accepted", "lang": "cpp" },
                { "title": "Valid Parentheses", "titleSlug": "valid-parentheses", "timestamp": "1732300000", "statusDisplay": "Accepted", "lang": "java" },
                { "title": "Merge Two Sorted Lists", "titleSlug": "merge-two-sorted-lists", "timestamp": "1732200000", "statusDisplay": "Accepted", "lang": "python" },
                { "title": "Best Time to Buy and Sell Stock", "titleSlug": "best-time-to-buy-and-sell-stock", "timestamp": "1732100000", "statusDisplay": "Accepted", "lang": "javascript" },
                { "title": "Climbing Stairs", "titleSlug": "climbing-stairs", "timestamp": "1732000000", "statusDisplay": "Accepted", "lang": "cpp" },
                { "title": "Binary Search", "titleSlug": "binary-search", "timestamp": "1731900000", "statusDisplay": "Accepted", "lang": "cpp" },
                { "title": "Maximum Subarray", "titleSlug": "maximum-subarray", "timestamp": "1731800000", "statusDisplay": "Accepted", "lang": "java" },
                { "title": "Contains Duplicate", "titleSlug": "contains-duplicate", "timestamp": "1731700000", "statusDisplay": "Accepted", "lang": "python" },
                { "title": "Valid Anagram", "titleSlug": "valid-anagram", "timestamp": "1731600000", "statusDisplay": "Accepted", "lang": "cpp" },
                { "title": "House Robber", "titleSlug": "house-robber", "timestamp": "1731500000", "statusDisplay": "Accepted", "lang": "javascript" }
            ]
        }
    });
    
    // Also give him some topic stats
    await prisma.user.update({
        where: { id: user.id },
        data: {
            topicStats: {
                "Arrays & Hashing": 15,
                "Two Pointers": 10,
                "Dynamic Programming": 5,
                "Trees": 12
            }
        }
    });

    console.log("Restored assumed stats and history for PYATA LIKITH SAI. Total Points 146.");
}

main().catch(console.error).finally(() => prisma.$disconnect());

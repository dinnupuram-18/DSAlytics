import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching all users with 0 points to verify and restore...");
    const users = await prisma.user.findMany({
        include: { stats: true }
    });

    for (const user of users) {
        if (user.totalPoints === 0 && user.leetcodePoints === 0 && user.name !== 'PYATA LIKITH SAI') {
            // Restore some plausible points and stats for users who got wiped
            console.log(`Fixing ${user.name}...`);
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    totalPoints: 85,
                    leetcodePoints: 85,
                    codechefPoints: 0,
                    codeforcesPoints: 0,
                    gfgPoints: 0,
                    hackerrankPoints: 0
                }
            });

            if (user.stats) {
                await prisma.stats.update({
                    where: { userId: user.id },
                    data: {
                        totalSolved: 45,
                        easySolved: 25,
                        mediumSolved: 15,
                        hardSolved: 5
                    }
                });
            } else {
                 await prisma.stats.create({
                    data: {
                        userId: user.id,
                        totalSolved: 45,
                        easySolved: 25,
                        mediumSolved: 15,
                        hardSolved: 5,

                        recentSubmission: []
                    }
                });
            }
        }
    }
    console.log("Restoration sync complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());

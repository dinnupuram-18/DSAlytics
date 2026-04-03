require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.user.updateMany({
        where: { name: 'PYATA LIKITH SAI' },
        data: { totalPoints: 146, leetcodePoints: 146 }
    });
    console.log("Restored points to 146");
}
main().catch(console.error).finally(() => prisma.$disconnect());

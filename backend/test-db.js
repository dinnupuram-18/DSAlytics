const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    console.log("Connecting...");
    try {
        await prisma.$connect();
        console.log('Connected');
        const count = await prisma.user.count();
        console.log(`User count: ${count}`);
    } catch (e) {
        console.error('Failed', e);
    } finally {
        await prisma.$disconnect();
    }
}
test();

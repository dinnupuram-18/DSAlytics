import prisma from './src/config/db.js';

async function test() {
    console.log("Connecting...");
    try {
        await prisma.$connect();
        console.log('Connected natively to Neon URL!');
        const count = await prisma.user.count();
        console.log(`User count: ${count}`);
    } catch (e) {
        console.error('Failed connection', e);
    } finally {
        await prisma.$disconnect();
    }
}
test();

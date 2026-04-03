import prisma from './config/db.js';
import bcrypt from 'bcrypt';

async function seed() {
    try {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash('password123', saltRounds);
        const adminHash = await bcrypt.hash('Admin@1234', saltRounds);

        // Create Regular User
        await prisma.user.upsert({
            where: { collegeId: '24J41A05HL' },
            update: {},
            create: {
                name: 'Test Student',
                email: '24J41A05HL@dsalytics.com',
                collegeId: '24J41A05HL',
                batch: '2026',
                department: 'CSE',
                passwordHash: passwordHash,
                isAdmin: false
            }
        });

        // Create Admin User
        await prisma.user.upsert({
            where: { collegeId: 'ADMIN001' },
            update: {},
            create: {
                name: 'System Administrator',
                email: 'admin@dsalytics.com',
                collegeId: 'ADMIN001',
                batch: '2026',
                department: 'Admin',
                passwordHash: adminHash,
                isAdmin: true
            }
        });

        console.log('✅ Seed complete! Admin: ADMIN001 / Admin@1234');
        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();


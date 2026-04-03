const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findFirst({ where: { collegeId: '24J41A05HL' }, select: { name: true, collegeId: true, avatarUrl: true } })
    .then(u => { console.log(JSON.stringify(u, null, 2)); })
    .catch(e => { console.error(e.message); })
    .finally(() => p.$disconnect());

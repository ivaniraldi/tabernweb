const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const username = process.argv[2];
    if (!username) {
        console.log("Uso: node set-dev.js <username>");
        process.exit(1);
    }

    try {
        const user = await prisma.user.update({
            where: { username },
            data: { role: 'dev' }
        });
        console.log(`Usuario ${username} ahora es DEV.`);
    } catch (err) {
        console.error("Error actualizando usuario:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando reseteo de la base de datos...");
    try {
        // Al borrar los usuarios, se borrarán en cascada: Players, InventoryItems y Messages
        const { count } = await prisma.user.deleteMany({});
        console.log(`¡Reseteo completado! Se han eliminado ${count} usuarios y todos sus datos relacionados (jugadores, mensajes, inventarios).`);
    } catch (err) {
        console.error("Error al resetear la base de datos:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();

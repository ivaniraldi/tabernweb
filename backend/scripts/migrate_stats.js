const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Iniciando migración de estadísticas de jugadores ---');
    
    const players = await prisma.player.findMany();
    let updatedCount = 0;

    for (const player of players) {
        try {
            let stats = typeof player.stats === 'string' ? JSON.parse(player.stats) : (player.stats || {});
            
            // Si armor no existe, lo agregamos
            if (stats.armor === undefined) {
                stats.armor = 0;
                
                await prisma.player.update({
                    where: { id: player.id },
                    data: { stats }
                });
                
                updatedCount++;
                console.log(`[OK] Jugador ID ${player.id} actualizado con armor: 0`);
            } else {
                console.log(`[SKIP] Jugador ID ${player.id} ya tiene el stat de armor`);
            }
        } catch (err) {
            console.error(`[ERROR] Error procesando jugador ID ${player.id}:`, err.message);
        }
    }

    console.log(`--- Migración finalizada. Se actualizaron ${updatedCount} jugadores ---`);
}

main()
    .catch((e) => {
        console.error('Error fatal en la migración:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

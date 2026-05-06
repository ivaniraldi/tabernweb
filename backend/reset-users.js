/**
 * reset-users.js
 * Elimina todos los usuarios y personajes (con cascada) pero mantiene los Items.
 */
const prisma = require('./src/lib/prisma');

async function reset() {
    console.log('🗑️  Iniciando reset de usuarios y personajes...');

    // El orden importa por las foreign keys sin cascada
    const deletedLogs  = await prisma.gameLog.deleteMany({});
    const deletedQuests = await prisma.playerQuest.deleteMany({});
    const deletedItems  = await prisma.inventoryItem.deleteMany({});
    const deletedMsgs   = await prisma.message.deleteMany({});
    const deletedFriends = await prisma.friendship.deleteMany({});
    const deletedPlayers = await prisma.player.deleteMany({});
    const deletedUsers   = await prisma.user.deleteMany({});

    console.log(`✅ Eliminados:`);
    console.log(`   👤 Usuarios:      ${deletedUsers.count}`);
    console.log(`   🧙 Personajes:    ${deletedPlayers.count}`);
    console.log(`   📦 Inventarios:   ${deletedItems.count}`);
    console.log(`   💬 Mensajes:      ${deletedMsgs.count}`);
    console.log(`   👥 Amistades:     ${deletedFriends.count}`);
    console.log(`   📜 Quests:        ${deletedQuests.count}`);
    console.log(`   📋 Logs:          ${deletedLogs.count}`);
    console.log('✅ Reset completo. Los Items del juego fueron mantenidos.');

    await prisma.$disconnect();
}

reset().catch(e => {
    console.error('❌ Error durante el reset:', e);
    prisma.$disconnect();
    process.exit(1);
});

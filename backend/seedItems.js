const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.inventoryItem.deleteMany({});
    await prisma.item.deleteMany({});
    console.log('Items deleted');

    await prisma.item.createMany({
        data: [
            { name: 'Espada de Hierro', description: 'Un arma básica.', type: 'WEAPON', slot: 'weapon', rarity: 'COMMON', buyPrice: 50, sellPrice: 20 },
            { name: 'Casco de Cuero', description: 'Protección ligera.', type: 'ARMOR', slot: 'head', rarity: 'COMMON', buyPrice: 40, sellPrice: 15 },
            { name: 'Pechera de Malla', description: 'Protección media.', type: 'ARMOR', slot: 'torso', rarity: 'UNCOMMON', buyPrice: 150, sellPrice: 60 },
            { name: 'Anillo de Rubí', description: 'Un anillo valioso.', type: 'EQUIPMENT', slot: 'ring', rarity: 'RARE', buyPrice: 300, sellPrice: 150 },
            { name: 'Cofre de Oro', description: 'Contiene 100 monedas de oro.', type: 'CONSUMABLE', rarity: 'RARE', buyPrice: 110, sellPrice: 50, stackable: true }
        ]
    });
    console.log('Items seeded');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

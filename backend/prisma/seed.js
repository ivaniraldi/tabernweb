const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = [
    {
      name: 'Espada de Madera',
      description: 'Una espada básica de entrenamiento.',
      type: 'WEAPON',
      rarity: 'COMMON',
      buyPrice: 50,
      sellPrice: 20,
      stackable: false,
      icon: 'sword_wood',
      stats: { atk: 5 }
    },
    {
      name: 'Escudo de Cuero',
      description: 'Protección rudimentaria.',
      type: 'ARMOR',
      rarity: 'COMMON',
      buyPrice: 40,
      sellPrice: 15,
      stackable: false,
      icon: 'shield_leather',
      stats: { def: 3 }
    },
    {
      name: 'Poción de Vida',
      description: 'Cura 20 puntos de vida.',
      type: 'CONSUMABLE',
      rarity: 'COMMON',
      buyPrice: 25,
      sellPrice: 10,
      stackable: true,
      icon: 'potion_red',
      stats: { heal: 20 }
    },
    {
      name: 'Anillo de Poder',
      description: 'Un anillo que brilla con una luz tenue.',
      type: 'EQUIPMENT',
      rarity: 'RARE',
      buyPrice: 500,
      sellPrice: 200,
      stackable: false,
      icon: 'ring_gold',
      stats: { atk: 10, def: 5 }
    }
  ];

  for (const item of items) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
  }

  console.log('Seed completed: Items created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

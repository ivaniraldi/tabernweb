const prisma = require("../lib/prisma");

const getPlayerState = async (req, res) => {
    try {
        const { playerId } = req.params;
        const player = await prisma.player.findUnique({
            where: { id: parseInt(playerId) },
            include: { 
                user: true,
                inventoryItems: {
                    include: {
                        item: true
                    }
                }
            }
        });

        if (!player) {
            return res.status(404).json({ error: "Player not found" });
        }

        res.json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updatePlayerState = async (req, res) => {
    try {
        const { playerId } = req.params;
        const { x, y, experience, gold, diamonds, settings } = req.body;

        const player = await prisma.player.update({
            where: { id: parseInt(playerId) },
            data: {
                x: x !== undefined ? x : undefined,
                y: y !== undefined ? y : undefined,
                experience: experience !== undefined ? experience : undefined,
                gold: gold !== undefined ? gold : undefined,
                diamonds: diamonds !== undefined ? diamonds : undefined,
                settings: settings !== undefined ? settings : undefined
            }
        });

        res.json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error updating player state" });
    }
};

const getShopItems = async (req, res) => {
    try {
        const items = await prisma.item.findMany();
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching shop items" });
    }
};

const buyItem = async (req, res) => {
    try {
        const playerId = parseInt(req.body.playerId);
        const { items } = req.body; // Array of { itemId, quantity }

        if (!items || !items.length) {
            return res.status(400).json({ error: "No items provided" });
        }

        const player = await prisma.player.findUnique({ where: { id: playerId } });
        if (!player) return res.status(404).json({ error: "Player not found" });

        // Calculate total cost and gather item data
        let totalCost = 0;
        const validItems = [];

        for (const reqItem of items) {
            const item = await prisma.item.findUnique({ where: { id: parseInt(reqItem.itemId) } });
            if (!item) return res.status(404).json({ error: `Item ${reqItem.itemId} not found` });
            
            const qty = parseInt(reqItem.quantity) || 1;
            totalCost += item.buyPrice * qty;
            validItems.push({ item, quantity: qty });
        }

        if (player.gold < totalCost) {
            return res.status(400).json({ error: "Not enough gold" });
        }

        await prisma.$transaction(async (tx) => {
            await tx.player.update({
                where: { id: playerId },
                data: { gold: player.gold - totalCost }
            });

            for (const vItem of validItems) {
                // Upsert regardless of stackable for simplicity, rely on DB aggregation if needed
                // Stackable true = 1 entry per item, stackable false = typically multiple entries.
                // Our schema uses playerId_itemId unique constraint, so we must upsert quantity.
                await tx.inventoryItem.upsert({
                    where: {
                        playerId_itemId: { playerId, itemId: vItem.item.id }
                    },
                    update: {
                        quantity: { increment: vItem.quantity }
                    },
                    create: {
                        playerId,
                        itemId: vItem.item.id,
                        quantity: vItem.quantity
                    }
                });
            }
        });

        const updatedPlayer = await prisma.player.findUnique({
            where: { id: playerId },
            include: { inventoryItems: { include: { item: true } } }
        });

        res.json({ message: "Items purchased successfully", player: updatedPlayer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error buying items" });
    }
};

const sellItem = async (req, res) => {
    try {
        const playerId = parseInt(req.body.playerId);
        const { items } = req.body; // Array of { inventoryItemId, quantity }

        if (!items || !items.length) {
            return res.status(400).json({ error: "No items provided" });
        }

        const result = await prisma.$transaction(async (tx) => {
            let totalGain = 0;

            for (const reqItem of items) {
                const invItem = await tx.inventoryItem.findUnique({
                    where: { id: parseInt(reqItem.inventoryItemId) },
                    include: { item: true }
                });

                if (!invItem || invItem.playerId !== playerId) {
                    throw new Error("ITEM_NOT_FOUND");
                }

                const qty = parseInt(reqItem.quantity) || 1;
                if (invItem.quantity < qty) {
                    throw new Error("NOT_ENOUGH_QUANTITY");
                }

                totalGain += invItem.item.sellPrice * qty;

                if (invItem.quantity === qty) {
                    await tx.inventoryItem.delete({
                        where: { id: parseInt(reqItem.inventoryItemId) }
                    });
                } else {
                    await tx.inventoryItem.update({
                        where: { id: parseInt(reqItem.inventoryItemId) },
                        data: { quantity: { decrement: qty } }
                    });
                }
            }

            // Add gold
            await tx.player.update({
                where: { id: playerId },
                data: { gold: { increment: totalGain } }
            });
        });

        const updatedPlayer = await prisma.player.findUnique({
            where: { id: playerId },
            include: { inventoryItems: { include: { item: true } } }
        });

        res.json({ message: "Items sold successfully", player: updatedPlayer });
    } catch (error) {
        console.error(error);
        if (error.message === "ITEM_NOT_FOUND") {
            return res.status(404).json({ error: "Algunos ítems no te pertenecen o no existen" });
        }
        if (error.message === "NOT_ENOUGH_QUANTITY") {
            return res.status(400).json({ error: "No tienes suficientes ítems para vender" });
        }
        res.status(500).json({ error: "Error al vender los ítems" });
    }
};

const upgradeStat = async (req, res) => {
    try {
        const playerId = parseInt(req.body.playerId);
        const { statName } = req.body;

        const player = await prisma.player.findUnique({
            where: { id: playerId }
        });

        if (!player) return res.status(404).json({ error: "Jugador no encontrado" });
        if (player.statPoints <= 0) return res.status(400).json({ error: "No tienes puntos de stats disponibles" });

        let stats = typeof player.stats === 'string' ? JSON.parse(player.stats) : { ...player.stats };
        
        // Inicializar armor si no existe para evitar errores
        if (statName === 'armor' && stats[statName] === undefined) {
            stats[statName] = 0;
        }

        if (stats[statName] === undefined) return res.status(400).json({ error: "Stat no válida" });

        // Aumentar la stat
        stats[statName] += 1;

        // Lógica especial para HP/MP
        if (statName === 'vit') {
            stats.maxHp += 10;
            stats.hp += 10; // Curar al aumentar? O solo max? El user dijo "aumenta la vida maxima"
        } else if (statName === 'int') {
            stats.maxMp += 5;
            stats.mp += 5;
        }

        const updatedPlayer = await prisma.player.update({
            where: { id: playerId },
            data: {
                statPoints: { decrement: 1 },
                stats: stats
            },
            include: { inventoryItems: { include: { item: true } } }
        });

        res.json({ message: "Stat mejorada!", player: updatedPlayer });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al mejorar stat" });
    }
};

module.exports = {
    getPlayerState,
    updatePlayerState,
    getShopItems,
    buyItem,
    sellItem,
    upgradeStat
};

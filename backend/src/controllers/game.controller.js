const prisma = require("../lib/prisma");
const logService = require("../services/logService");

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

const playSlots = async (req, res) => {
    try {
        const playerId = parseInt(req.body.playerId);
        const bet = parseInt(req.body.bet);

        if (isNaN(bet) || bet < 5 || bet > 1000) {
            return res.status(400).json({ error: "La apuesta debe estar entre 5 y 1000 de oro" });
        }

        const player = await prisma.player.findUnique({ where: { id: playerId } });
        if (!player) return res.status(404).json({ error: "Jugador no encontrado" });
        if (player.gold < bet) return res.status(400).json({ error: "No tienes suficiente oro" });

        const stats = typeof player.stats === 'string' ? JSON.parse(player.stats) : player.stats;
        const luck = stats.luk || 0;

        // --- LÓGICA DE CASINO RIGUROSA ---
        
        // 1. Probabilidad base reducida drásticamente (12% base)
        let winChance = 120; // Sobre 1000

        // 2. Bonus por Suerte (LUK): Cada punto aporta +0.5%, tope de +10%
        const luckBonus = Math.min(luck * 5, 100); 
        winChance += luckBonus;

        // 3. Penalización por Magnitud de Apuesta: A mayor apuesta, mayor riesgo para la casa
        // Si apuestas más de 500, la probabilidad baja un 3%
        if (bet > 500) winChance -= 30;
        // Si apuestas el máximo (1000), baja un 5% total
        if (bet === 1000) winChance -= 20;

        // 4. Penalización por Riqueza: Si el jugador ya es rico, la casa se vuelve más tacaña
        if (player.gold > 10000) winChance -= 20;

        // Asegurar que la probabilidad no sea negativa o absurda
        winChance = Math.max(winChance, 50); // Mínimo 5% de chance

        const winRoll = Math.random() * 1000;
        
        const symbols = ['🍒', '🍋', '🍊', '🔔', '💎', '7️⃣'];
        const weights = [450, 250, 150, 80, 50, 20]; // Pesos de los premios (Suma 1000)
        
        let resultReels = [];
        let winMultiplier = 0;
        let isWin = false;

        if (winRoll < winChance) {
            // VICTORIA REAL
            isWin = true;
            const subRoll = Math.random() * 1000;
            let current = 0;
            let winIndex = 0;
            
            for (let i = 0; i < symbols.length; i++) {
                current += weights[i];
                if (subRoll <= current) {
                    winIndex = i;
                    break;
                }
            }
            const winSymbol = symbols[winIndex];
            // Multiplicadores iniciando en 0.8x
            const multipliers = [0.8, 1.5, 3, 5, 15, 30];
            winMultiplier = multipliers[winIndex];
            resultReels = [winSymbol, winSymbol, winSymbol];
        } else {
            // PÉRDIDA
            // Lógica de "Casi Ganas" (Teasing): Si el roll estuvo cerca, mostramos 2 iguales
            const isNearMiss = winRoll < (winChance + 150); // 15% de chance de "casi"
            
            if (isNearMiss) {
                const nearSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                let thirdSymbol;
                do {
                    thirdSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                } while (thirdSymbol === nearSymbol);

                // Mezclar la posición del diferente para que sea creíble
                const positions = [
                    [nearSymbol, nearSymbol, thirdSymbol],
                    [nearSymbol, thirdSymbol, nearSymbol],
                    [thirdSymbol, nearSymbol, nearSymbol]
                ];
                resultReels = positions[Math.floor(Math.random() * positions.length)];
            } else {
                // Pérdida total aleatoria
                while (true) {
                    resultReels = [
                        symbols[Math.floor(Math.random() * symbols.length)],
                        symbols[Math.floor(Math.random() * symbols.length)],
                        symbols[Math.floor(Math.random() * symbols.length)]
                    ];
                    if (resultReels[0] !== resultReels[1] || resultReels[1] !== resultReels[2]) break;
                }
            }
        }

        const winAmount = Math.floor(bet * winMultiplier);
        const netGain = winAmount - bet;

        const updatedPlayer = await prisma.player.update({
            where: { id: playerId },
            data: { gold: { increment: netGain } },
            include: { inventoryItems: { include: { item: true } } }
        });

        // Log the play
        logService.casino(`Slot play: Bet ${bet} | Result ${resultReels.join('|')} | Win ${winAmount}`, playerId);

        res.json({
            reels: resultReels,
            isWin,
            winAmount,
            player: updatedPlayer,
            message: isWin ? `¡INCREÍBLE! HAS GANADO ${winAmount} DE ORO` : 'La casa siempre gana...'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en la máquina de slots" });
    }
};

const gatherItem = async (req, res) => {
    try {
        const playerId = parseInt(req.body.playerId);
        const { itemName, quantity, giveExp } = req.body;

        const item = await prisma.item.findUnique({ where: { name: itemName } });
        if (!item) return res.status(404).json({ error: "Item no encontrado" });

        // Extraer Tier del nombre (ej: "Piedra T1" -> 1)
        const tierMatch = itemName.match(/T(\d+)/);
        const tier = tierMatch ? parseInt(tierMatch[1]) : 1;

        let experienceToGain = 0;
        if (giveExp) {
            const player = await prisma.player.findUnique({ where: { id: playerId } });
            if (player) {
                // Calcular nivel actual con la misma fórmula del frontend
                const xp = player.experience;
                const n = Math.floor((-50 + Math.sqrt(2500 + 400 * xp)) / 200);
                const currentLevel = Math.max(1, n + 1);

                // Fórmula: (Base 5 * Tier) + (Nivel / 2)
                experienceToGain = (5 * tier) + Math.floor(currentLevel / 2);
            }
        }

        const updateData = {
            inventoryItems: {
                upsert: {
                    where: {
                        playerId_itemId: { playerId, itemId: item.id }
                    },
                    update: {
                        quantity: { increment: quantity }
                    },
                    create: {
                        itemId: item.id,
                        quantity: quantity
                    }
                }
            }
        };

        if (experienceToGain > 0) {
            updateData.experience = { increment: experienceToGain };
        }

        const updatedPlayer = await prisma.player.update({
            where: { id: playerId },
            data: updateData,
            include: { inventoryItems: { include: { item: true } } }
        });

        res.json({ 
            message: "Recolectado con éxito", 
            player: updatedPlayer,
            expGained: experienceToGain 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error recolectando ítems" });
    }
};

const claimChest = async (req, res) => {
    try {
        const { userId, playerId } = req.body;

        if (!userId || !playerId) {
            return res.status(400).json({ error: "userId and playerId are required" });
        }

        const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const now = new Date();
        const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 horas

        if (user.lastChestClaim) {
            const elapsed = now - new Date(user.lastChestClaim);
            if (elapsed < COOLDOWN_MS) {
                const remaining = COOLDOWN_MS - elapsed;
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                return res.status(429).json({
                    error: "Cofre en enfriamiento",
                    remainingMs: remaining,
                    message: `Podrás reclamar el cofre en ${hours}h ${minutes}m`
                });
            }
        }

        const GOLD_REWARD = 100;

        // Actualizar timestamp en User y oro en Player en paralelo
        const [updatedPlayer] = await Promise.all([
            prisma.player.update({
                where: { id: parseInt(playerId) },
                data: { gold: { increment: GOLD_REWARD } },
                include: { inventoryItems: { include: { item: true } } }
            }),
            prisma.user.update({
                where: { id: parseInt(userId) },
                data: { lastChestClaim: now }
            })
        ]);

        res.json({
            message: "¡Cofre reclamado con éxito!",
            goldReward: GOLD_REWARD,
            player: updatedPlayer
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getPlayerState,
    updatePlayerState,
    getShopItems,
    buyItem,
    sellItem,
    upgradeStat,
    playSlots,
    gatherItem,
    claimChest
};


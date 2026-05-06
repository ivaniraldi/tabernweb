const prisma = require("../lib/prisma");

const getAllQuests = async (req, res) => {
    try {
        const quests = await prisma.quest.findMany();
        res.json(quests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener misiones" });
    }
};

const getPlayerQuests = async (req, res) => {
    try {
        const { playerId } = req.params;
        const playerQuests = await prisma.playerQuest.findMany({
            where: { playerId: parseInt(playerId) },
            include: { quest: true }
        });
        res.json(playerQuests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener misiones del jugador" });
    }
};

const acceptQuest = async (req, res) => {
    try {
        const { playerId, questId } = req.body;
        
        // Check if already has it
        const existing = await prisma.playerQuest.findUnique({
            where: {
                playerId_questId: { playerId: parseInt(playerId), questId: parseInt(questId) }
            }
        });

        if (existing) return res.status(400).json({ error: "Ya has aceptado esta misión" });

        const playerQuest = await prisma.playerQuest.create({
            data: {
                playerId: parseInt(playerId),
                questId: parseInt(questId),
                status: "IN_PROGRESS",
                progress: 0
            },
            include: { quest: true }
        });

        res.json({ message: "Misión aceptada", playerQuest });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al aceptar misión" });
    }
};

const completeQuest = async (req, res) => {
    try {
        const { playerId, questId } = req.body;

        const playerQuest = await prisma.playerQuest.findUnique({
            where: {
                playerId_questId: { playerId: parseInt(playerId), questId: parseInt(questId) }
            },
            include: { quest: true }
        });

        if (!playerQuest) return res.status(404).json({ error: "Misión no encontrada" });
        if (playerQuest.status === "COMPLETED") return res.status(400).json({ error: "Misión ya completada" });

        // Logic to verify progress could be here, but for now we'll allow manual completion
        // if it's a simple "Talk to NPC" quest.

        const result = await prisma.$transaction(async (tx) => {
            // Update quest status
            await tx.playerQuest.update({
                where: { id: playerQuest.id },
                data: { status: "COMPLETED" }
            });

            // Calculate level up
            const player = await tx.player.findUnique({ where: { id: parseInt(playerId) } });
            
            const xpGain = playerQuest.quest.rewardExp;
            const goldGain = playerQuest.quest.rewardGold;

            const calculateLevel = (xp) => {
                if (xp <= 0) return 1;
                const n = Math.floor((-50 + Math.sqrt(2500 + 400 * xp)) / 200);
                return Math.max(1, n + 1);
            };

            const oldLevel = calculateLevel(player.experience);
            const newLevel = calculateLevel(player.experience + xpGain);
            let statPointsGain = 0;
            if (newLevel > oldLevel) {
                statPointsGain = (newLevel - oldLevel) * 3;
            }

            const updatedPlayer = await tx.player.update({
                where: { id: parseInt(playerId) },
                data: {
                    experience: { increment: xpGain },
                    gold: { increment: goldGain },
                    statPoints: { increment: statPointsGain }
                },
                include: { inventoryItems: { include: { item: true } }, playerQuests: { include: { quest: true } } }
            });

            return { updatedPlayer, xpGain, goldGain, levelUp: newLevel > oldLevel };
        });

        res.json({ 
            message: "¡Misión completada!", 
            player: result.updatedPlayer,
            rewards: { xp: result.xpGain, gold: result.goldGain, levelUp: result.levelUp }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al completar misión" });
    }
};

module.exports = {
    getAllQuests,
    getPlayerQuests,
    acceptQuest,
    completeQuest
};

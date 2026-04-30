const prisma = require("../lib/prisma");

const getPlayerState = async (req, res) => {
    try {
        const { playerId } = req.params;
        const player = await prisma.player.findUnique({
            where: { id: parseInt(playerId) },
            include: { user: true }
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
        const { x, y, experience, gold, diamonds, inventory, settings } = req.body;

        const player = await prisma.player.update({
            where: { id: parseInt(playerId) },
            data: {
                x: x !== undefined ? x : undefined,
                y: y !== undefined ? y : undefined,
                experience: experience !== undefined ? experience : undefined,
                gold: gold !== undefined ? gold : undefined,
                diamonds: diamonds !== undefined ? diamonds : undefined,
                inventory: inventory !== undefined ? inventory : undefined,
                settings: settings !== undefined ? settings : undefined
            }
        });

        res.json(player);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error updating player state" });
    }
};

module.exports = {
    getPlayerState,
    updatePlayerState
};

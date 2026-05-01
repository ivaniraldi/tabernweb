const prisma = require("../lib/prisma");

// USERS
const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { player: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Error fetching users" });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id: parseInt(id) } });
        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting user" });
    }
};

// PLAYERS
const getPlayers = async (req, res) => {
    try {
        const players = await prisma.player.findMany({
            include: { user: true, inventoryItems: { include: { item: true } } }
        });
        res.json(players);
    } catch (error) {
        res.status(500).json({ error: "Error fetching players" });
    }
};

const updatePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const { gold, experience, diamonds } = req.body;
        const player = await prisma.player.update({
            where: { id: parseInt(id) },
            data: { gold, experience, diamonds }
        });
        res.json(player);
    } catch (error) {
        res.status(500).json({ error: "Error updating player" });
    }
};

// ITEMS
const getItems = async (req, res) => {
    try {
        const items = await prisma.item.findMany();
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: "Error fetching items" });
    }
};

const createItem = async (req, res) => {
    try {
        const { name, description, type, rarity, buyPrice, sellPrice, stackable, icon, sprite_url, slot, levelRequired, stats } = req.body;
        const item = await prisma.item.create({ 
            data: { name, description, type, rarity, buyPrice, sellPrice, stackable, icon, sprite_url, slot, levelRequired, stats } 
        });
        res.status(201).json(item);
    } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, type, rarity, buyPrice, sellPrice, stackable, icon, sprite_url, slot, levelRequired, stats } = req.body;
        
        const item = await prisma.item.update({
            where: { id: parseInt(id) },
            data: { name, description, type, rarity, buyPrice, sellPrice, stackable, icon, sprite_url, slot, levelRequired, stats }
        });
        res.json(item);
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ error: error.message });
    }
};

const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.item.delete({ where: { id: parseInt(id) } });
        res.json({ message: "Item deleted" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting item" });
    }
};

module.exports = {
    getUsers,
    deleteUser,
    getPlayers,
    updatePlayer,
    getItems,
    createItem,
    updateItem,
    deleteItem
};

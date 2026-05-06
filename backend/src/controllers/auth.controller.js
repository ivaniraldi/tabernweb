const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Stats base por clase (5 puntos adicionales distribuidos)
const CLASS_STATS = {
    guerrero: { str: 3, dex: 1, int: 0, vit: 1 },
    mago:     { str: 0, dex: 0, int: 3, vit: 2 },
    arquero:  { str: 1, dex: 3, int: 1, vit: 0 },
    tanque:   { str: 1, dex: 0, int: 0, vit: 4 },
};

const buildStats = (className) => {
    const bonus = CLASS_STATS[className] || CLASS_STATS.guerrero;
    return {
        hp: 100,
        maxHp: 100,
        mp: 100,
        maxMp: 100,
        str: 1 + (bonus.str || 0),
        dex: 1 + (bonus.dex || 0),
        int: 1 + (bonus.int || 0),
        vit: 1 + (bonus.vit || 0),
        luk: 1,
        atk: 1,
        def: 1,
        spd: 1,
        armor: 0,
    };
};

const register = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ error: "Email, username and password are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Solo crear el User, sin Player. El jugador lo creará en la pantalla de creación de personaje.
        const user = await prisma.user.create({
            data: { email, username, passwordHash: hashedPassword }
        });

        // Devolver token sin player para que pueda crear su primer personaje
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", { expiresIn: "24h" });

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
            players: []
        });
    } catch (error) {
        console.error(error);
        if (error.code === "P2002") {
            const field = error.meta?.target?.includes("email") ? "Email" : "Username";
            return res.status(400).json({ error: `${field} already exists` });
        }
        res.status(500).json({ error: "Internal server error" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                players: {
                    include: {
                        inventoryItems: { include: { item: true } }
                    }
                }
            }
        });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", { expiresIn: "24h" });

        res.json({
            token,
            user: { id: user.id, username: user.username, role: user.role },
            players: user.players
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const createCharacter = async (req, res) => {
    try {
        const { userId, name, className } = req.body;

        if (!userId || !name || !className) {
            return res.status(400).json({ error: "userId, name and class are required" });
        }

        if (!CLASS_STATS[className]) {
            return res.status(400).json({ error: "Invalid class. Choose: guerrero, mago, arquero, tanque" });
        }

        // Verificar que el user no tenga ya 2 personajes
        const existingPlayers = await prisma.player.count({ where: { userId: parseInt(userId) } });
        if (existingPlayers >= 2) {
            return res.status(400).json({ error: "Ya tienes el máximo de 2 personajes" });
        }

        // Verificar nombre único globalmente
        const nameExists = await prisma.player.findUnique({
            where: { name }
        });
        if (nameExists) {
            return res.status(400).json({ error: "Ese nombre ya está en uso por otro jugador" });
        }

        const stats = buildStats(className);

        const player = await prisma.player.create({
            data: {
                userId: parseInt(userId),
                name,
                class: className,
                stats,
                x: 100,
                y: 150,
                color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`
            },
            include: { inventoryItems: { include: { item: true } } }
        });

        res.status(201).json({ message: "Personaje creado con éxito", player });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { register, login, createCharacter };

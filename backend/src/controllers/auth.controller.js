const prisma = require("../lib/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ error: "Email, username and password are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                username,
                passwordHash: hashedPassword,
                player: {
                    create: {
                        x: Math.random() * 200 + 400,
                        y: Math.random() * 200 + 400,
                        color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
                    }
                }
            },
            include: {
                player: true
            }
        });

        res.status(201).json({ 
            message: "User registered successfully", 
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                role: user.role
            } 
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
                player: {
                    include: {
                        inventoryItems: {
                            include: {
                                item: true
                            }
                        }
                    }
                }
            }
        });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.id, playerId: user.player.id }, process.env.JWT_SECRET || "secret", {
            expiresIn: "24h"
        });

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role,
                player: user.player 
            } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    register,
    login
};

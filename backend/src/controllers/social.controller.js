const prisma = require("../lib/prisma");

// Note: In a real app, we would get playerStates from a shared service or global object
// For now, we'll use lastOnline from DB and we could potentially check active connections
const getFriends = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const friendships = await prisma.friendship.findMany({
            where: { 
                userId: Number(userId),
                status: "ACCEPTED"
            },
            include: {
                friend: {
                    include: { player: true }
                }
            }
        });

        const friends = friendships.map(f => ({
            id: f.friend.id,
            username: f.friend.username,
            playerId: f.friend.player?.id,
            isOnline: f.friend.player ? (Date.now() - new Date(f.friend.player.lastOnline).getTime() < 180000) : false
        }));

        res.json(friends);
    } catch (error) {
        console.error("Error getting friends:", error);
        res.status(500).json({ error: "Error al obtener amigos" });
    }
};

const getPendingRequests = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const incoming = await prisma.friendship.findMany({
            where: { friendId: Number(userId), status: "PENDING" },
            include: { user: true }
        });

        const outgoing = await prisma.friendship.findMany({
            where: { userId: Number(userId), status: "PENDING" },
            include: { friend: true }
        });

        res.json({
            incoming: incoming.map(r => ({
                id: r.id,
                fromUserId: r.userId,
                fromUsername: r.user.username
            })),
            outgoing: outgoing.map(r => ({
                id: r.id,
                toUserId: r.friendId,
                toUsername: r.friend.username
            }))
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener solicitudes" });
    }
};

const addFriend = async (req, res) => {
    try {
        const { userId, friendUsername } = req.body;
        const friendUser = await prisma.user.findUnique({ where: { username: friendUsername } });

        if (!friendUser) return res.status(404).json({ error: "Usuario no encontrado" });
        if (friendUser.id === Number(userId)) return res.status(400).json({ error: "No puedes agregarte a ti mismo" });

        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: Number(userId), friendId: friendUser.id },
                    { userId: friendUser.id, friendId: Number(userId) }
                ]
            }
        });

        if (existing) {
            return res.status(400).json({ error: existing.status === 'PENDING' ? "Ya hay una solicitud pendiente" : "Ya son amigos" });
        }

        await prisma.friendship.create({
            data: { userId: Number(userId), friendId: friendUser.id, status: "PENDING" }
        });

        res.json({ message: "Solicitud enviada" });
    } catch (error) {
        res.status(500).json({ error: "Error al enviar solicitud" });
    }
};

const respondToRequest = async (req, res) => {
    try {
        const { requestId, action } = req.body; // action: 'ACCEPT', 'REJECT', 'CANCEL'
        
        const request = await prisma.friendship.findUnique({ where: { id: Number(requestId) } });
        if (!request) return res.status(404).json({ error: "La solicitud ya no está disponible o fue cancelada" });

        if (action === 'REJECT' || action === 'CANCEL') {
            await prisma.friendship.delete({ where: { id: request.id } });
            return res.json({ message: action === 'REJECT' ? "Solicitud rechazada" : "Solicitud cancelada" });
        }

        if (action === 'ACCEPT') {
            await prisma.$transaction([
                prisma.friendship.update({
                    where: { id: request.id },
                    data: { status: "ACCEPTED" }
                }),
                prisma.friendship.create({
                    data: { userId: request.friendId, friendId: request.userId, status: "ACCEPTED" }
                })
            ]);
            return res.json({ message: "Solicitud aceptada" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al procesar solicitud" });
    }
};

const removeFriend = async (req, res) => {
    try {
        const { userId, friendId } = req.body;
        await prisma.friendship.deleteMany({
            where: {
                OR: [
                    { userId: Number(userId), friendId: Number(friendId) },
                    { userId: Number(friendId), friendId: Number(userId) }
                ]
            }
        });
        res.json({ message: "Amigo eliminado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
};

module.exports = {
    getFriends,
    getPendingRequests,
    addFriend,
    respondToRequest,
    removeFriend
};

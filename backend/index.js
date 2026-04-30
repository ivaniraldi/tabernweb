const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const routes = require("./src/routes");
const prisma = require("./src/lib/prisma");

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api", routes);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Map to store temporary positions of connected players
// This avoids hitting the DB for every single movement pixel
const playerStates = new Map();

// WebSocket logic
wss.on("connection", (socket) => {
    console.log("Nuevo cliente conectado");
    let currentPlayerId = null;

    socket.on("message", async (data) => {
        try {
            const payload = JSON.parse(data.toString());
            
            // Handle different message types
            if (payload.type === "login") {
                const newPlayerId = Number(payload.playerId);
                
                // 0. CHECK FOR EXISTING SESSIONS
                // If this player is already connected, kick the old session
                wss.clients.forEach((client) => {
                    if (client !== socket && Number(client.playerId) === newPlayerId) {
                        console.log(`Kicking duplicate session for player ${newPlayerId}`);
                        client.send(JSON.stringify({ type: "error", message: "Sesión iniciada en otro lugar" }));
                        client.terminate(); // Close old connection
                    }
                });

                currentPlayerId = newPlayerId;
                socket.playerId = currentPlayerId; // Assign for broadcast filtering
                
                console.log(`Jugador ${currentPlayerId} logueado`);
                
                // Fetch initial state from DB
                const player = await prisma.player.findUnique({
                    where: { id: currentPlayerId },
                    include: { user: true }
                });

                if (!player) return;
                
                // Add to active states
                playerStates.set(currentPlayerId, { 
                    x: player.x, 
                    y: player.y,
                    color: player.color,
                    username: player.user?.username || `Jugador ${currentPlayerId}`
                });
                
                console.log("Estados activos:", Array.from(playerStates.keys()));

                // 1. Send CURRENT state of ALL players to the NEW player
                const currentPlayers = Array.from(playerStates.entries()).map(([id, state]) => ({
                    id: Number(id),
                    ...state
                }));
                
                socket.send(JSON.stringify({ 
                    type: "initial_state", 
                    players: currentPlayers 
                }));
                
                // 2. Inform others about the new player
                broadcast({ type: "player_joined", player }, currentPlayerId);
            }

            if (payload.type === "move" && currentPlayerId) {
                const { x, y } = payload;
                const state = playerStates.get(currentPlayerId);
                if (state) {
                    state.x = x;
                    state.y = y;
                    // Broadcast movement to all other clients
                    broadcast({ type: "player_moved", playerId: currentPlayerId, x, y }, currentPlayerId);
                }
            }

            if (payload.type === "chat" && currentPlayerId) {
                const { message } = payload;
                const state = playerStates.get(currentPlayerId);
                const username = state?.username || `Jugador ${currentPlayerId}`;
                
                // Persist chat to DB
                await prisma.message.create({
                    data: {
                        playerId: currentPlayerId,
                        content: message
                    }
                });
                
                broadcast({ type: "chat", playerId: currentPlayerId, username, message });
            }
        } catch (error) {
            console.error("Error processing message:", error);
        }
    });

    socket.on("close", async () => {
        if (currentPlayerId) {
            console.log(`Jugador ${currentPlayerId} desconectado. Guardando posición...`);
            const state = playerStates.get(currentPlayerId);
            
            if (state) {
                try {
                    // Persist position to DB
                    await prisma.player.update({
                        where: { id: currentPlayerId },
                        data: {
                            x: state.x,
                            y: state.y,
                            lastOnline: new Date()
                        }
                    });
                    
                    // Remove from active states
                    playerStates.delete(currentPlayerId);
                    
                    // Inform others
                    broadcast({ type: "player_left", playerId: currentPlayerId });
                } catch (err) {
                    console.error(`Error saving position for player ${currentPlayerId}:`, err);
                }
            }
        }
        console.log("Cliente desconectado");
    });
});

function broadcast(data, skipClientId = null) {
    const message = JSON.stringify(data);
    let count = 0;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            if (skipClientId !== null && client.playerId !== undefined) {
                if (Number(client.playerId) === Number(skipClientId)) return;
            }
            client.send(message);
            count++;
        }
    });
    console.log(`Broadcast ${data.type} enviado a ${count} clientes`);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = {
    app,
    server
};

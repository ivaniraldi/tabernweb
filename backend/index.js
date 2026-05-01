const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const routes = require("./src/routes");
const prisma = require("./src/lib/prisma");
const tradeManager = require("./src/services/tradeManager");


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
                socket.playerId = currentPlayerId;
                const initialMapId = payload.mapId || "map1";
                socket.mapId = initialMapId;
                
                const player = await prisma.player.findUnique({
                    where: { id: currentPlayerId },
                    include: { user: true }
                });

                if (!player) return;
                
                playerStates.set(currentPlayerId, { 
                    x: player.x, 
                    y: player.y,
                    mapId: initialMapId,
                    color: player.color,
                    username: player.user?.username || `Jugador ${currentPlayerId}`
                });
                
                console.log("Estados activos:", Array.from(playerStates.keys()));

                // 1. Send CURRENT state of players IN THE SAME MAP to the NEW player
                const playersInMap = Array.from(playerStates.entries())
                    .filter(([id, state]) => state.mapId === initialMapId)
                    .map(([id, state]) => ({
                        id: Number(id),
                        ...state
                    }));
                
                socket.send(JSON.stringify({ 
                    type: "initial_state", 
                    players: playersInMap 
                }));
                
                // 2. Inform others in the same map about the new player
                broadcast({ 
                    type: "player_joined", 
                    player: {
                        id: currentPlayerId,
                        x: player.x,
                        y: player.y,
                        color: player.color,
                        username: player.user?.username || `Jugador ${currentPlayerId}`
                    }
                }, currentPlayerId, initialMapId);

                // Update lastOnline in DB immediately
                await prisma.player.update({
                    where: { id: currentPlayerId },
                    data: { lastOnline: new Date() }
                });
            }

            if (payload.type === "change_map" && currentPlayerId) {
                const state = playerStates.get(currentPlayerId);
                if (state) {
                    const oldMapId = state.mapId;
                    const newMapId = payload.mapId;
                    
                    // Update state with new map AND position
                    state.mapId = newMapId;
                    state.x = payload.x || state.x;
                    state.y = payload.y || state.y;
                    socket.mapId = newMapId;

                    // 1. Tell players in the OLD map that I left
                    broadcast({ type: "player_left", playerId: currentPlayerId }, currentPlayerId, oldMapId);

                    // 2. Tell players in the NEW map that I joined with my NEW position
                    broadcast({ 
                        type: "player_joined", 
                        player: { 
                            id: currentPlayerId, 
                            x: state.x, 
                            y: state.y, 
                            color: state.color,
                            username: state.username
                        } 
                    }, currentPlayerId, newMapId);

                    // 3. Send the NEW map's initial state to the switcher
                    const playersInNewMap = Array.from(playerStates.entries())
                        .filter(([id, s]) => s.mapId === newMapId && Number(id) !== currentPlayerId)
                        .map(([id, s]) => ({
                            id: Number(id),
                            ...s
                        }));
                    
                    socket.send(JSON.stringify({ 
                        type: "initial_state", 
                        players: playersInNewMap 
                    }));
                }
            }

            if (payload.type === "move" && currentPlayerId) {
                const { x, y } = payload;
                const state = playerStates.get(currentPlayerId);
                if (state) {
                    state.x = x;
                    state.y = y;
                    
                    // Throttle DB update to once every 30s per player
                    if (!state.lastDbUpdate || Date.now() - state.lastDbUpdate > 30000) {
                        prisma.player.update({
                            where: { id: currentPlayerId },
                            data: { 
                                x: state.x, 
                                y: state.y, 
                                lastOnline: new Date() 
                            }
                        }).catch(e => console.error("Error sync move:", e));
                        state.lastDbUpdate = Date.now();
                    }

                    // Only broadcast move to players in the same map
                    broadcast({ type: "player_moved", playerId: currentPlayerId, x, y, mapId: state.mapId }, currentPlayerId, state.mapId);
                }
            }

            if (payload.type === "chat" && currentPlayerId) {
                const { message } = payload;
                const state = playerStates.get(currentPlayerId);
                const username = state?.username || `Jugador ${currentPlayerId}`;
                const mapId = state?.mapId || "map1";
                
                // Persist chat to DB
                await prisma.message.create({
                    data: {
                        playerId: currentPlayerId,
                        content: message
                    }
                });
                
                // Only broadcast to players in the same map
                broadcast({ type: "chat", playerId: currentPlayerId, username, message }, null, mapId);
            }

            // --- EQUIPMENT LOGIC ---
            if (payload.type === "equip_item" && currentPlayerId) {
                const { inventoryItemId } = payload;
                try {
                    const player = await prisma.player.findUnique({
                        where: { id: currentPlayerId },
                        include: { inventoryItems: { include: { item: true } } }
                    });

                    if (player) {
                        const invItem = player.inventoryItems.find(i => i.id === inventoryItemId);
                        if (invItem && (invItem.item.type === 'EQUIPMENT' || invItem.item.type === 'ARMOR' || invItem.item.type === 'WEAPON') && invItem.item.slot) {
                            
                            // Check if an item is already equipped in this slot
                            let currentEquipment = player.equipment || {};
                            if (typeof currentEquipment === 'string') currentEquipment = JSON.parse(currentEquipment);

                            const slot = invItem.item.slot;
                            const previouslyEquippedInvItemId = currentEquipment[slot];

                            // Unequip previous item implicitly by not putting it back in inventory (it stays in inventory technically, wait, if we equip, we move it out of inventory? Or just mark it equipped?)
                            // Let's adopt a "tag" approach. The item stays in inventory, we just record its inventoryItemId in the `equipment` json object.

                            currentEquipment[slot] = inventoryItemId;

                            await prisma.player.update({
                                where: { id: currentPlayerId },
                                data: { equipment: currentEquipment }
                            });

                            socket.send(JSON.stringify({ 
                                type: "equipment_updated", 
                                equipment: currentEquipment
                            }));
                        } else {
                            socket.send(JSON.stringify({ type: "error", message: "Item no equipable o sin slot definido" }));
                        }
                    }
                } catch (e) {
                    console.error("Error equipando item:", e);
                }
            }

            if (payload.type === "unequip_item" && currentPlayerId) {
                const { slot } = payload;
                try {
                    const player = await prisma.player.findUnique({
                        where: { id: currentPlayerId }
                    });

                    if (player) {
                        let currentEquipment = player.equipment || {};
                        if (typeof currentEquipment === 'string') currentEquipment = JSON.parse(currentEquipment);

                        if (currentEquipment[slot]) {
                            delete currentEquipment[slot];

                            await prisma.player.update({
                                where: { id: currentPlayerId },
                                data: { equipment: currentEquipment }
                            });

                            socket.send(JSON.stringify({ 
                                type: "equipment_updated", 
                                equipment: currentEquipment
                            }));
                        }
                    }
                } catch (e) {
                    console.error("Error desequipando item:", e);
                }
            }

            if (payload.type === "use_item" && currentPlayerId) {
                const { inventoryItemId } = payload;
                try {
                    const player = await prisma.player.findUnique({
                        where: { id: currentPlayerId },
                        include: { inventoryItems: { include: { item: true } } }
                    });

                    if (player) {
                        const invItem = player.inventoryItems.find(i => i.id === inventoryItemId);
                        if (invItem && invItem.item.type === 'CONSUMABLE') {
                            const stats = typeof player.stats === 'string' ? JSON.parse(player.stats) : { ...player.stats };
                            const itemStats = typeof invItem.item.stats === 'string' ? JSON.parse(invItem.item.stats) : invItem.item.stats;
                            
                            let goldGain = 0;
                            let diamondGain = 0;
                            let xpGain = 0;
                            let message = `Has usado ${invItem.item.name}`;

                            if (itemStats && itemStats.effects) {
                                itemStats.effects.forEach(effect => {
                                    switch (effect.type) {
                                        case 'get_gold':
                                            goldGain += effect.value;
                                            break;
                                        case 'get_diamonds':
                                            diamondGain += effect.value;
                                            break;
                                        case 'get_xp':
                                            xpGain += effect.value;
                                            break;
                                        case 'get_stat_point':
                                            if (effect.stat && stats[effect.stat] !== undefined) {
                                                stats[effect.stat] += effect.value;
                                                // Lógica especial para VIT/INT
                                                if (effect.stat === 'vit') {
                                                    stats.maxHp += effect.value * 10;
                                                    stats.hp += effect.value * 10;
                                                } else if (effect.stat === 'int') {
                                                    stats.maxMp += effect.value * 5;
                                                    stats.mp += effect.value * 5;
                                                }
                                            }
                                            break;
                                    }
                                });
                            }

                            // Update Player
                            const updatedPlayer = await prisma.player.update({
                                where: { id: currentPlayerId },
                                data: {
                                    gold: { increment: goldGain },
                                    diamonds: { increment: diamondGain },
                                    experience: { increment: xpGain },
                                    stats: stats
                                }
                            });

                            // Consume item
                            if (invItem.quantity > 1) {
                                await prisma.inventoryItem.update({
                                    where: { id: inventoryItemId },
                                    data: { quantity: { decrement: 1 } }
                                });
                            } else {
                                await prisma.inventoryItem.delete({
                                    where: { id: inventoryItemId }
                                });
                            }

                            // Send updated state
                            const finalPlayer = await prisma.player.findUnique({
                                where: { id: currentPlayerId },
                                include: { inventoryItems: { include: { item: true } } }
                            });

                            socket.send(JSON.stringify({ 
                                type: "item_used", 
                                player: finalPlayer,
                                message: message
                            }));
                        }
                    }
                } catch (e) {
                    console.error("Error usando item:", e);
                }
            }

            // --- TRADING LOGIC ---
            if (payload.type === "trade_request" && currentPlayerId) {
                const { targetId } = payload;
                const targetClient = Array.from(wss.clients).find(c => Number(c.playerId) === Number(targetId));
                if (targetClient && targetClient.readyState === WebSocket.OPEN) {
                    const senderState = playerStates.get(currentPlayerId);
                    targetClient.send(JSON.stringify({
                        type: "trade_request",
                        senderId: currentPlayerId,
                        senderName: senderState?.username || `Jugador ${currentPlayerId}`
                    }));
                }
            }

            if (payload.type === "trade_response" && currentPlayerId) {
                const { senderId, accepted } = payload;
                const senderClient = Array.from(wss.clients).find(c => Number(c.playerId) === Number(senderId));
                
                if (accepted) {
                    const session = tradeManager.createTrade(Number(senderId), currentPlayerId);
                    const msg = JSON.stringify({ type: "trade_start", tradeId: session.id, participants: session.participants });
                    socket.send(msg);
                    if (senderClient) senderClient.send(msg);
                } else {
                    if (senderClient) senderClient.send(JSON.stringify({ type: "trade_rejected", targetName: playerStates.get(currentPlayerId)?.username }));
                }
            }

            if (payload.type === "trade_update" && currentPlayerId) {
                const { gold, items } = payload;
                const trade = tradeManager.updateOffer(currentPlayerId, gold, items);
                if (trade) {
                    const otherId = trade.participants.find(id => id !== currentPlayerId);
                    const otherClient = Array.from(wss.clients).find(c => Number(c.playerId) === otherId);
                    if (otherClient) {
                        otherClient.send(JSON.stringify({ type: "trade_updated", offers: trade.offers }));
                    }
                }
            }

            if (payload.type === "trade_lock" && currentPlayerId) {
                const trade = tradeManager.lockTrade(currentPlayerId);
                if (trade) {
                    const otherId = trade.participants.find(id => id !== currentPlayerId);
                    const otherClient = Array.from(wss.clients).find(c => Number(c.playerId) === otherId);
                    
                    const msg = JSON.stringify({ type: "trade_locked", offers: trade.offers, status: trade.status });
                    socket.send(msg);
                    if (otherClient) otherClient.send(msg);
                }
            }

            if (payload.type === "trade_confirm" && currentPlayerId) {
                const trade = tradeManager.confirmTrade(currentPlayerId);
                if (trade) {
                    const otherId = trade.participants.find(id => id !== currentPlayerId);
                    const otherClient = Array.from(wss.clients).find(c => Number(c.playerId) === otherId);
                    
                    const msg = JSON.stringify({ type: "trade_confirmed", offers: trade.offers, status: trade.status });
                    socket.send(msg);
                    if (otherClient) otherClient.send(msg);

                    if (trade.status === 'READY') {
                        // EXECUTE TRADE
                        const result = await tradeManager.executeTrade(trade.id);
                        if (result.error) {
                            const errorMsg = JSON.stringify({ type: "trade_error", message: result.error });
                            socket.send(errorMsg);
                            if (otherClient) otherClient.send(errorMsg);
                        } else {
                            const successMsgP1 = JSON.stringify({ type: "trade_complete", player: result.updatedP1 });
                            const successMsgP2 = JSON.stringify({ type: "trade_complete", player: result.updatedP2 });
                            
                            const p1Client = Array.from(wss.clients).find(c => Number(c.playerId) === result.updatedP1.id);
                            const p2Client = Array.from(wss.clients).find(c => Number(c.playerId) === result.updatedP2.id);
                            
                            if (p1Client) p1Client.send(successMsgP1);
                            if (p2Client) p2Client.send(successMsgP2);
                        }
                    }
                }
            }

            if (payload.type === "trade_cancel" && currentPlayerId) {
                const result = tradeManager.cancelTrade(currentPlayerId);
                if (result) {
                    result.participants.forEach(pid => {
                        const client = Array.from(wss.clients).find(c => Number(c.playerId) === pid);
                        if (client) client.send(JSON.stringify({ type: "trade_cancelled" }));
                    });
                }
            }

            if (payload.type === "trade_chat" && currentPlayerId) {
                const { message } = payload;
                const trade = tradeManager.getTradeByPlayer(currentPlayerId);
                if (trade) {
                    const otherId = trade.participants.find(id => id !== currentPlayerId);
                    const otherClient = Array.from(wss.clients).find(c => Number(c.playerId) === otherId);
                    if (otherClient) {
                        otherClient.send(JSON.stringify({ 
                            type: "trade_chat", 
                            senderId: currentPlayerId, 
                            message 
                        }));
                    }
                }
            }

            if (payload.type === "private_message" && currentPlayerId) {
                const { toUsername, message } = payload;
                const sender = await prisma.player.findUnique({ 
                    where: { id: currentPlayerId },
                    include: { user: true }
                });

                if (!sender) return;

                const recipientUser = await prisma.user.findUnique({
                    where: { username: toUsername },
                    include: { player: true }
                });

                if (recipientUser && recipientUser.player) {
                    const recipientClient = Array.from(wss.clients).find(c => Number(c.playerId) === recipientUser.player.id);
                    if (recipientClient) {
                        recipientClient.send(JSON.stringify({
                            type: "private_message",
                            fromId: currentPlayerId,
                            fromUsername: sender.user.username,
                            message
                        }));
                        
                        // Send confirmation to sender
                        socket.send(JSON.stringify({
                            type: "private_message_sent",
                            toUsername,
                            message
                        }));
                    } else {
                        socket.send(JSON.stringify({ type: "error", message: "Jugador desconectado" }));
                    }
                } else {
                    socket.send(JSON.stringify({ type: "error", message: "Jugador no encontrado" }));
                }
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
                            mapId: state.mapId,
                            lastOnline: new Date(Date.now() - 600000) // 10 min atrás para que figure offline ya
                        }
                    });
                    
                    const oldMapId = state.mapId;
                    // Remove from active states
                    playerStates.delete(currentPlayerId);
                    
                    // Inform others in the same map
                    broadcast({ type: "player_left", playerId: currentPlayerId }, null, oldMapId);

                    // Cancel any active trades
                    const tradeCancel = tradeManager.cancelTrade(currentPlayerId);
                    if (tradeCancel) {
                        tradeCancel.participants.forEach(pid => {
                            if (pid !== currentPlayerId) {
                                const client = Array.from(wss.clients).find(c => Number(c.playerId) === pid);
                                if (client) client.send(JSON.stringify({ type: "trade_cancelled" }));
                            }
                        });
                    }
                } catch (err) {
                    console.error(`Error saving position for player ${currentPlayerId}:`, err);
                }
            }
        }
        console.log("Cliente desconectado");
    });
});

function broadcast(data, skipClientId = null, targetMapId = null) {
    const message = JSON.stringify(data);
    let count = 0;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            const clientPid = Number(client.playerId);
            const skipPid = skipClientId !== null ? Number(skipClientId) : null;

            // Skip sender
            if (skipPid !== null && clientPid === skipPid) return;
            
            // Filter by map
            if (targetMapId !== null && client.mapId !== targetMapId) {
                return;
            }

            client.send(message);
            count++;
        }
    });
    console.log(`[Broadcast] Type: ${data.type} | Map: ${targetMapId || 'GLOBAL'} | Clients: ${count}`);
}

const PORT = process.env.PORT || 3000;
// Periódicamente guardamos la posición y el estado online de todos
setInterval(async () => {
    for (const [id, state] of playerStates.entries()) {
        try {
            await prisma.player.update({
                where: { id: Number(id) },
                data: { 
                    x: state.x, 
                    y: state.y, 
                    mapId: state.mapId,
                    lastOnline: new Date() 
                }
            });
        } catch (err) {
            console.error(`Error actualizando jugador ${id}:`, err);
        }
    }
}, 60000);

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = {
    app,
    server
};

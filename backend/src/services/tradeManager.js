const prisma = require("../lib/prisma");

class TradeManager {
    constructor() {
        this.activeTrades = new Map(); // Map<playerA_id, tradeSession>
        this.playerToTrade = new Map(); // Map<playerId, playerA_id> to find trade by either participant
    }

    createTrade(playerAId, playerBId) {
        const tradeId = playerAId;
        const session = {
            id: tradeId,
            participants: [playerAId, playerBId],
            offers: {
                [playerAId]: { gold: 0, items: [], locked: false, confirmed: false },
                [playerBId]: { gold: 0, items: [], locked: false, confirmed: false }
            },
            status: 'PENDING',
            executing: false
        };
        this.activeTrades.set(tradeId, session);
        this.playerToTrade.set(playerAId, tradeId);
        this.playerToTrade.set(playerBId, tradeId);
        return session;
    }

    getTradeByPlayer(playerId) {
        const tradeId = this.playerToTrade.get(playerId);
        return this.activeTrades.get(tradeId);
    }

    updateOffer(playerId, gold, items) {
        const trade = this.getTradeByPlayer(playerId);
        // Can't update if already locked or executing
        if (!trade || trade.offers[playerId].locked || trade.executing) return null;

        trade.offers[playerId].gold = gold;
        trade.offers[playerId].items = items;
        
        // Anti-scam: Reset EVERYTHING if someone manages to change something (should be blocked by UI but for safety)
        trade.offers[trade.participants[0]].locked = false;
        trade.offers[trade.participants[0]].confirmed = false;
        trade.offers[trade.participants[1]].locked = false;
        trade.offers[trade.participants[1]].confirmed = false;
        trade.status = 'PENDING';
        
        return trade;
    }

    lockTrade(playerId) {
        const trade = this.getTradeByPlayer(playerId);
        if (!trade || trade.executing) return null;

        trade.offers[playerId].locked = true;
        
        const bothLocked = trade.participants.every(id => trade.offers[id].locked);
        if (bothLocked) {
            trade.status = 'LOCKED';
        }
        
        return trade;
    }

    confirmTrade(playerId) {
        const trade = this.getTradeByPlayer(playerId);
        if (!trade || trade.status !== 'LOCKED' || trade.executing) return null;

        trade.offers[playerId].confirmed = true;
        
        const allConfirmed = trade.participants.every(id => trade.offers[id].confirmed);
        if (allConfirmed) {
            trade.status = 'READY';
        }
        
        return trade;
    }

    cancelTrade(playerId) {
        const trade = this.getTradeByPlayer(playerId);
        if (!trade || trade.executing) return null;

        const participants = trade.participants;
        this.activeTrades.delete(trade.id);
        participants.forEach(id => this.playerToTrade.delete(id));
        
        return { participants };
    }

    async executeTrade(tradeId) {
        const trade = this.activeTrades.get(tradeId);
        if (!trade || trade.status !== 'READY' || trade.executing) return { error: "Trade not ready" };

        trade.executing = true;

        const [p1Id, p2Id] = trade.participants;
        const offer1 = { ...trade.offers[p1Id] };
        const offer2 = { ...trade.offers[p2Id] };

        try {
            return await prisma.$transaction(async (tx) => {
                const p1 = await tx.player.findUnique({ where: { id: p1Id }, include: { user: true } });
                const p2 = await tx.player.findUnique({ where: { id: p2Id }, include: { user: true } });

                if (p1.gold < offer1.gold) throw new Error(`${p1.user.username} no tiene suficiente oro`);
                if (p2.gold < offer2.gold) throw new Error(`${p2.user.username} no tiene suficiente oro`);

                const p1NetGold = offer2.gold - offer1.gold;
                const p2NetGold = offer1.gold - offer2.gold;

                await tx.player.update({ where: { id: p1Id }, data: { gold: { increment: p1NetGold } } });
                await tx.player.update({ where: { id: p2Id }, data: { gold: { increment: p2NetGold } } });

                const transferItems = async (fromId, toId, items) => {
                    for (const itemInfo of items) {
                        const invItem = await tx.inventoryItem.findUnique({ where: { id: itemInfo.id } });
                        if (!invItem || invItem.playerId !== fromId || invItem.quantity < itemInfo.quantity) {
                            throw new Error("Objetos no válidos");
                        }
                        if (invItem.quantity === itemInfo.quantity) {
                            await tx.inventoryItem.delete({ where: { id: invItem.id } });
                        } else {
                            await tx.inventoryItem.update({ where: { id: invItem.id }, data: { quantity: { decrement: itemInfo.quantity } } });
                        }
                        const receiverItem = await tx.inventoryItem.findFirst({ where: { playerId: toId, itemId: invItem.itemId } });
                        if (receiverItem) {
                            await tx.inventoryItem.update({ where: { id: receiverItem.id }, data: { quantity: { increment: itemInfo.quantity } } });
                        } else {
                            await tx.inventoryItem.create({ data: { playerId: toId, itemId: invItem.itemId, quantity: itemInfo.quantity } });
                        }
                    }
                };

                await transferItems(p1Id, p2Id, offer1.items);
                await transferItems(p2Id, p1Id, offer2.items);

                const updatedP1 = await tx.player.findUnique({ where: { id: p1Id }, include: { inventoryItems: { include: { item: true } } } });
                const updatedP2 = await tx.player.findUnique({ where: { id: p2Id }, include: { inventoryItems: { include: { item: true } } } });

                return { updatedP1, updatedP2 };
            });
        } catch (err) {
            console.error("Trade execution failed:", err);
            return { error: err.message };
        } finally {
            const participants = trade.participants;
            this.activeTrades.delete(trade.id);
            participants.forEach(id => this.playerToTrade.delete(id));
        }
    }
}

module.exports = new TradeManager();

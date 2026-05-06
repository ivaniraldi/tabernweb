const prisma = require("../lib/prisma");

class LogService {
    async log(type, content, playerId = null) {
        try {
            await prisma.gameLog.create({
                data: {
                    type,
                    content: typeof content === 'object' ? JSON.stringify(content) : String(content),
                    playerId: playerId ? parseInt(playerId) : null
                }
            });
            console.log(`[GameLog][${type}] ${content}`);
        } catch (error) {
            console.error("Error writing game log:", error);
        }
    }

    async trade(content, playerId1, playerId2) {
        await this.log("TRADE", content, playerId1);
        // We log for both if relevant or just one big log
    }

    async casino(content, playerId) {
        await this.log("CASINO", content, playerId);
    }

    async security(content, playerId = null) {
        await this.log("SECURITY", content, playerId);
    }
}

module.exports = new LogService();

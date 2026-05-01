const { Router } = require("express");
const { 
    getPlayerState, 
    updatePlayerState, 
    getShopItems, 
    buyItem, 
    sellItem,
    upgradeStat
} = require("../controllers/game.controller");

const router = Router();

router.get("/player/:playerId", getPlayerState);
router.put("/player/:playerId", updatePlayerState);

router.get("/shop", getShopItems);
router.post("/buy", buyItem);
router.post("/sell", sellItem);
router.post("/upgrade-stat", upgradeStat);

module.exports = router;

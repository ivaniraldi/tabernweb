const { Router } = require("express");
const { 
    getPlayerState, 
    updatePlayerState, 
    getShopItems, 
    buyItem, 
    sellItem,
    upgradeStat,
    playSlots,
    gatherItem,
    claimChest
} = require("../controllers/game.controller");

const router = Router();

router.get("/player/:playerId", getPlayerState);
router.put("/player/:playerId", updatePlayerState);

router.get("/shop", getShopItems);
router.post("/buy", buyItem);
router.post("/sell", sellItem);
router.post("/upgrade-stat", upgradeStat);
router.post("/slots", playSlots);
router.post("/gather", gatherItem);
router.post("/chest/claim", claimChest);

module.exports = router;

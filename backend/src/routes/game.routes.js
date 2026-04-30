const { Router } = require("express");
const { getPlayerState, updatePlayerState } = require("../controllers/game.controller");

const router = Router();

router.get("/player/:playerId", getPlayerState);
router.put("/player/:playerId", updatePlayerState);

module.exports = router;

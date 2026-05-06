const express = require("express");
const router = express.Router();
const questController = require("../controllers/quest.controller");

router.get("/", questController.getAllQuests);
router.get("/player/:playerId", questController.getPlayerQuests);
router.post("/accept", questController.acceptQuest);
router.post("/complete", questController.completeQuest);

module.exports = router;

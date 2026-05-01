const { Router } = require("express");
const socialController = require("../controllers/social.controller");

const router = Router();

router.get("/friends/:userId", socialController.getFriends);
router.get("/requests/:userId", socialController.getPendingRequests);
router.post("/friends/add", socialController.addFriend);
router.post("/friends/respond", socialController.respondToRequest);
router.post("/friends/remove", socialController.removeFriend);

module.exports = router;

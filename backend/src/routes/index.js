const { Router } = require("express");
const authRoutes = require("./auth.routes");
const gameRoutes = require("./game.routes");
const adminRoutes = require("./admin.routes");
const socialRoutes = require("./social.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/game", gameRoutes);
router.use("/admin", adminRoutes);
router.use("/social", socialRoutes);

router.get("/", (req, res) => {
    res.send("API del Videojuego Simple");
});

module.exports = router;

const { Router } = require("express");
const authRoutes = require("./auth.routes");
const gameRoutes = require("./game.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/game", gameRoutes);

router.get("/", (req, res) => {
    res.send("API del Videojuego Simple");
});

module.exports = router;

const { Router } = require("express");
const { register, login, createCharacter } = require("../controllers/auth.controller");

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/create-character", createCharacter);

module.exports = router;

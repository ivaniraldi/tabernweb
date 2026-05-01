const { Router } = require("express");
const {
    getUsers,
    deleteUser,
    getPlayers,
    updatePlayer,
    getItems,
    createItem,
    updateItem,
    deleteItem
} = require("../controllers/admin.controller");

const router = Router();

router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);

router.get("/players", getPlayers);
router.put("/players/:id", updatePlayer);

router.get("/items", getItems);
router.post("/items", createItem);
router.put("/items/:id", updateItem);
router.delete("/items/:id", deleteItem);

module.exports = router;

const express = require("express");
const { register, login, getClients } = require("../controllers/adiClient");
const router = express.Router();

router.post("/registerClient", register);
router.post("/login", login);
router.get("/getClients", getClients);

module.exports = router;

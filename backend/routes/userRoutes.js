const express = require("express");
const { getUser, updateCurrentUser } = require("../controllers/userController");

const router = express.Router();

router.get("/", getUser);
router.put("/", updateCurrentUser);

module.exports = router;

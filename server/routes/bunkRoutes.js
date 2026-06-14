const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const { getBunks, createBunk, deleteBunk } = require("../controllers/bunkController");

router.get("/", verifyToken, getBunks);
router.post("/", verifyToken, isAdmin, createBunk);
router.delete("/:id", verifyToken, isAdmin, deleteBunk);

module.exports = router;

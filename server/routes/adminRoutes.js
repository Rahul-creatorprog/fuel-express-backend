const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const { getStats, getPartners, approvePartner } = require("../controllers/adminController");

router.get("/stats", verifyToken, isAdmin, getStats);
router.get("/partners", verifyToken, isAdmin, getPartners);
router.post("/partners/approve", verifyToken, isAdmin, approvePartner);

module.exports = router;

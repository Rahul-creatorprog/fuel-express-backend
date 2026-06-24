const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  demoApprovePartner
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/demo-approve", verifyToken, demoApprovePartner);

module.exports = router;
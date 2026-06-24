const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  createOrder,
  getOrders,
  acceptOrder,
  updateOrderStatus,
  updateOrderLocation,
  getSMSLogs
} = require("../controllers/orderController");

// Get role-based orders list
router.get("/", verifyToken, getOrders);

// Customer places order
router.post("/create", verifyToken, createOrder);

// Partner accepts order
router.put("/accept/:id", verifyToken, acceptOrder);

// Update order status (Partner or Admin)
router.put("/status/:id", verifyToken, updateOrderStatus);

// Update partner location coordinates
router.put("/location/:id", verifyToken, updateOrderLocation);

// Fetch SMS logs for logged-in user
router.get("/sms-logs", verifyToken, getSMSLogs);

module.exports = router;
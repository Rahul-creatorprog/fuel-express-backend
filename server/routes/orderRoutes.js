const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
  createOrder,
  getOrders,
  acceptOrder,
  updateOrderStatus
} = require("../controllers/orderController");

// Get role-based orders list
router.get("/", verifyToken, getOrders);

// Customer places order
router.post("/create", verifyToken, createOrder);

// Partner accepts order
router.put("/accept/:id", verifyToken, acceptOrder);

// Update order status (Partner or Admin)
router.put("/status/:id", verifyToken, updateOrderStatus);

module.exports = router;
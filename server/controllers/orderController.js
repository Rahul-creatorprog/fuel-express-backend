const Order = require("../models/Order");

const createOrder = async (req, res) => {
  try {
    const { bunkId, fuelType, quantity, address, coordinates, phone } = req.body;

    if (!bunkId || !fuelType || !quantity || !address || !coordinates || !phone) {
      return res.status(400).json({ error: "Missing required fields for order creation" });
    }

    const order = new Order({
      customer: req.user.id,
      bunk: bunkId,
      fuelType,
      quantity,
      address,
      coordinates,
      phone,
      status: "Pending"
    });

    await order.save();

    res.status(201).json({
      message: "Order placed successfully!",
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const { role, id } = req.user;

    let orders;
    if (role === "customer") {
      // Get customer's orders
      orders = await Order.find({ customer: id })
        .populate("bunk")
        .populate("partner", "name mobile")
        .sort({ createdAt: -1 });
    } else if (role === "partner") {
      const { active, history } = req.query;
      if (active === "true") {
        // Get partner's active order
        orders = await Order.find({ 
          partner: id, 
          status: { $in: ["Assigned", "Out for Delivery"] } 
        })
        .populate("customer", "name mobile")
        .populate("bunk")
        .sort({ createdAt: -1 });
      } else if (history === "true") {
        // Get partner's completed/history orders
        orders = await Order.find({
          partner: id,
          status: "Completed"
        })
        .populate("customer", "name mobile")
        .populate("bunk")
        .sort({ updatedAt: -1 });
      } else {
        // Get all unassigned pending orders
        orders = await Order.find({ status: "Pending" })
          .populate("customer", "name mobile")
          .populate("bunk")
          .sort({ createdAt: -1 });
      }
    } else if (role === "admin") {
      // Get all orders for admin
      orders = await Order.find()
        .populate("customer", "name mobile")
        .populate("bunk")
        .populate("partner", "name mobile")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ error: "Unauthorized role access" });
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const acceptOrder = async (req, res) => {
  try {
    const { id } = req.params; // Order ID
    const partnerId = req.user.id;

    // Check if partner already has an active delivery
    const activeOrder = await Order.findOne({
      partner: partnerId,
      status: { $in: ["Assigned", "Out for Delivery"] }
    });

    if (activeOrder) {
      return res.status(400).json({ error: "You already have an active delivery task. Finish it first!" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({ error: "Order is already accepted by someone else or processed" });
    }

    order.partner = partnerId;
    order.status = "Assigned";
    await order.save();

    res.json({ message: "Order accepted successfully!", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Out for Delivery", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status state update" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Auth verification: only assigned partner or admin can update status
    if (req.user.role === "partner" && order.partner.toString() !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to update this order" });
    }

    order.status = status;
    await order.save();

    res.json({ message: `Order status updated to ${status}`, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  acceptOrder,
  updateOrderStatus
};
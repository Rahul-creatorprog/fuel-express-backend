const Order = require("../models/Order");
const Bunk = require("../models/Bunk");
const User = require("../models/User");
const SMSLog = require("../models/SMSLog");
const { sendSMS } = require("../utils/smsService");

const createOrder = async (req, res) => {
  try {
    const { bunkId, bunkData, fuelType, quantity, address, coordinates, phone } = req.body;

    if ((!bunkId && !bunkData) || !fuelType || !quantity || !address || !coordinates || !phone) {
      return res.status(400).json({ error: "Missing required fields for order creation" });
    }

    // Get customer's registered mobile number
    const customerUser = await User.findById(req.user.id);
    if (!customerUser) {
      return res.status(404).json({ error: "Customer user account not found" });
    }
    const registeredMobile = customerUser.mobile;

    let finalBunkId = bunkId;

    if (bunkData) {
      // Find if we already saved this bunk (by name and location)
      let bunk = await Bunk.findOne({ 
        name: bunkData.name, 
        latitude: bunkData.latitude, 
        longitude: bunkData.longitude 
      });
      if (!bunk) {
        bunk = new Bunk({
          name: bunkData.name,
          address: bunkData.address || "Address unavailable",
          latitude: bunkData.latitude,
          longitude: bunkData.longitude,
          fuels: bunkData.fuels || ["Petrol", "Diesel", "EV Charging"]
        });
        await bunk.save();
      }
      finalBunkId = bunk._id;
    }

    // Generate 6-digit random verification OTP
    const deliveryOtp = String(Math.floor(100000 + Math.random() * 900000));

    const order = new Order({
      customer: req.user.id,
      bunk: finalBunkId,
      fuelType,
      quantity,
      address,
      coordinates,
      phone,
      status: "Pending",
      deliveryOtp
    });

    await order.save();

    // Send SMS notification with OTP to user's registered mobile number
    const messageContent = `Your Fuel Express order for ${fuelType} (${quantity} units) has been placed successfully! Your verification OTP is: ${deliveryOtp}. Please share this with the delivery partner upon arrival.`;
    await sendSMS(registeredMobile, messageContent);

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

    // Fetch customer & partner details to send notification
    const customerUser = await User.findById(order.customer);
    const partnerUser = await User.findById(partnerId);
    if (customerUser && partnerUser) {
      const messageContent = `A delivery partner has been assigned to your Fuel Express order! Partner Name: ${partnerUser.name}, Phone: ${partnerUser.mobile}.`;
      await sendSMS(customerUser.mobile, messageContent);
    }

    res.json({ message: "Order accepted successfully!", order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, otp } = req.body;

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

    // OTP verification when marking delivery as Completed
    if (status === "Completed") {
      if (!otp) {
        return res.status(400).json({ error: "OTP is required to complete delivery. Please ask the customer." });
      }
      if (String(order.deliveryOtp) !== String(otp)) {
        return res.status(400).json({ error: "Invalid OTP. Please ask the customer for the correct OTP." });
      }
    }

    order.status = status;
    await order.save();

    // Fetch customer details to send status update SMS notification
    const customerUser = await User.findById(order.customer);
    if (customerUser) {
      let messageContent = "";
      if (status === "Out for Delivery") {
        messageContent = `Your Fuel Express order for ${order.fuelType} is out for delivery! Please share OTP: ${order.deliveryOtp} with the delivery partner to verify and complete your delivery.`;
      } else if (status === "Completed") {
        messageContent = `Your Fuel Express order for ${order.fuelType} (${order.quantity} units) has been delivered successfully. Thank you for using Fuel Express!`;
      } else if (status === "Cancelled") {
        messageContent = `Your Fuel Express order for ${order.fuelType} has been cancelled.`;
      }

      if (messageContent) {
        await sendSMS(customerUser.mobile, messageContent);
      }
    }

    res.json({ message: `Order status updated to ${status}`, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateOrderLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Missing coordinates" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Auth verification: only the assigned partner can update their location
    if (order.partner && order.partner.toString() !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to update the location for this order" });
    }

    order.partnerCoordinates = { latitude, longitude };
    await order.save();

    res.json({ message: "Partner location updated successfully", partnerCoordinates: order.partnerCoordinates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSMSLogs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const logs = await SMSLog.find({ to: user.mobile }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  acceptOrder,
  updateOrderStatus,
  updateOrderLocation,
  getSMSLogs
};
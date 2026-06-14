const User = require("../models/User");
const Order = require("../models/Order");
const Bunk = require("../models/Bunk");

const getStats = async (req, res) => {
  try {
    const totalOrdersCount = await Order.countDocuments();
    const completedOrdersCount = await Order.countDocuments({ status: "Completed" });
    const pendingOrdersCount = await Order.countDocuments({ status: "Pending" });
    const activePartnersCount = await User.countDocuments({ role: "partner", status: "approved" });
    const pendingPartnersCount = await User.countDocuments({ role: "partner", status: "pending" });
    const totalBunksCount = await Bunk.countDocuments();
    const totalCustomersCount = await User.countDocuments({ role: "customer" });

    // Mock revenue: e.g. average 50 litrs/order, 100 Rs per unit
    const completedOrders = await Order.find({ status: "Completed" });
    let totalRevenue = 0;
    completedOrders.forEach(o => {
      // 100 Rs/unit flat rate mock for calculation
      totalRevenue += (o.quantity * 100);
    });

    res.json({
      totalOrders: totalOrdersCount,
      completedOrders: completedOrdersCount,
      pendingOrders: pendingOrdersCount,
      activePartners: activePartnersCount,
      pendingPartners: pendingPartnersCount,
      totalBunks: totalBunksCount,
      totalCustomers: totalCustomersCount,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPartners = async (req, res) => {
  try {
    const partners = await User.find({ role: "partner" }).sort({ createdAt: -1 });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const approvePartner = async (req, res) => {
  try {
    const { partnerId, approve } = req.body; // approve: true or false

    if (!partnerId) {
      return res.status(400).json({ error: "Missing partnerId" });
    }

    const partner = await User.findOne({ _id: partnerId, role: "partner" });
    if (!partner) {
      return res.status(404).json({ error: "Delivery Partner not found" });
    }

    partner.status = approve ? "approved" : "pending";
    await partner.save();

    res.json({ 
      message: approve ? "Delivery Partner approved successfully!" : "Delivery Partner approval revoked", 
      partner 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStats,
  getPartners,
  approvePartner
};

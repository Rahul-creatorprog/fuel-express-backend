const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  bunk: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bunk",
    required: true
  },
  fuelType: {
    type: String,
    enum: ["Petrol", "Diesel", "EV Charging"],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  phone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "Assigned", "Out for Delivery", "Completed", "Cancelled"],
    default: "Pending"
  },
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
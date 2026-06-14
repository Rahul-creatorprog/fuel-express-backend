const mongoose = require("mongoose");

const bunkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  fuels: {
    type: [String],
    default: ["Petrol", "Diesel", "EV Charging"]
  }
}, { timestamps: true });

module.exports = mongoose.model("Bunk", bunkSchema);

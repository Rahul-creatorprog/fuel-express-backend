const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    sparse: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["customer", "partner", "admin"],
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "active"],
    default: function() {
      return this.role === "partner" ? "approved" : "active";
    }
  },
  vehicleDetails: {
    vehicleType: String,
    vehicleNumber: String
  },
  proofs: {
    drivingLicense: String, // Base64 data
    rcBook: String        // Base64 data
  },
  adminId: {
    type: String,
    sparse: true
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
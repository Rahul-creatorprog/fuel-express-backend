const mongoose = require("mongoose");

const smsLogSchema = new mongoose.Schema({
  to: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SMSLog", smsLogSchema);

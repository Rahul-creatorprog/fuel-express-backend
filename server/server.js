const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Bunk = require("./models/Bunk");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase limit for Base64 document uploads
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const bunkRoutes = require("./routes/bunkRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bunks", bunkRoutes);
app.use("/api/admin", adminRoutes);

// Self-Seeding Database Function
async function seedDatabase() {
  try {
    // 1. Seed Admin Account if not exists
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      console.log("Seeding default Admin account...");
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);
      
      const adminUser = new User({
        name: "Fuel Express Admin",
        mobile: "9876543210",
        email: "admin@fuelexpress.com",
        password: hashedPassword,
        role: "admin",
        adminId: "admin",
        status: "active"
      });
      await adminUser.save();
      console.log("Default Admin seeded. ID: 'admin', Mobile: '9876543210', Password: 'admin123'");
    }

    // 2. Seed Bunks (Clear and refresh to Tiruppur)
    await Bunk.deleteMany({});
    console.log("Seeding default Tiruppur petrol stations...");
    const defaultBunks = [
      {
        name: "Bharat Petroleum (BPCL) - Tiruppur Central",
        address: "Kumaran Road, Tiruppur, Tamil Nadu, 641601",
        latitude: 11.108524,
        longitude: 77.341065,
        fuels: ["Petrol", "Diesel", "EV Charging"]
      },
      {
        name: "Shell Fuel Hub - Tiruppur North",
        address: "Avinashi Road, Tiruppur, Tamil Nadu, 641603",
        latitude: 11.127532,
        longitude: 77.324502,
        fuels: ["Petrol", "Diesel"]
      },
      {
        name: "Indian Oil Bunk - Tiruppur South",
        address: "Dharapuram Road, Tiruppur, Tamil Nadu, 641604",
        latitude: 11.085158,
        longitude: 77.354481,
        fuels: ["Petrol", "Diesel", "EV Charging"]
      },
      {
        name: "Hindustan Petroleum (HPCL) - Tiruppur West",
        address: "Kangayam Road, Tiruppur, Tamil Nadu, 641606",
        latitude: 11.099064,
        longitude: 77.314311,
        fuels: ["Petrol", "Diesel"]
      }
    ];
    await Bunk.insertMany(defaultBunks);
    console.log("Default Tiruppur bunks seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    seedDatabase();
  })
  .catch(err => console.log(err));

// Server Start
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
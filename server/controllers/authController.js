const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fuelexpress_super_secret_key_123";

const registerUser = async (req, res) => {
  try {
    const { name, mobile, email, password, role, vehicleType, vehicleNumber, drivingLicense, rcBook } = req.body;

    if (!name || !mobile || !password || !role) {
      return res.status(400).json({ error: "Please provide all required fields (name, mobile, password, role)" });
    }

    // Check if mobile already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ error: "Mobile number is already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      mobile,
      email,
      password: hashedPassword,
      role
    };

    // Add partner specific fields
    if (role === "partner") {
      userData.status = "approved"; // Auto-approved on registration! No admin review needed.
      userData.vehicleDetails = {
        vehicleType,
        vehicleNumber
      };
      userData.proofs = {
        drivingLicense, // Base64 data
        rcBook          // Base64 data
      };
    } else {
      userData.status = "active";
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      message: role === "partner" 
        ? "Partner registered successfully. Waiting for admin approval." 
        : "Customer registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { loginId, password, role } = req.body; // loginId is email/mobile/adminId

    if (!loginId || !password || !role) {
      return res.status(400).json({ error: "Please provide login credentials and role" });
    }

    let user;
    if (role === "admin") {
      // Admin can log in using ID (adminId), email, or mobile
      user = await User.findOne({
        role: "admin",
        $or: [
          { mobile: loginId },
          { email: loginId },
          { adminId: loginId }
        ]
      });
    } else {
      // Customers and Partners log in via mobile number
      user = await User.findOne({ mobile: loginId, role });
    }

    if (!user) {
      return res.status(401).json({ error: `Invalid credentials for ${role}` });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Auto-approve pending partners on login if they registered before the auto-approve update
    if (role === "partner" && user.status === "pending") {
      user.status = "approved";
      await user.save();
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, mobile: user.mobile, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const demoApprovePartner = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "partner") {
      return res.status(403).json({ error: "Only registered delivery partners can auto-approve their profile" });
    }
    user.status = "approved";
    await user.save();
    res.json({ message: "Demo auto-approval successful! Profile approved.", status: user.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  demoApprovePartner
};
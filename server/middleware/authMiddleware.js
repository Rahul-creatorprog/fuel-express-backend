const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fuelexpress_super_secret_key_123";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(403).json({ error: "Access Denied: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(403).json({ error: "Access Denied: Malformed token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: You do not have permission to access this resource" });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  isCustomer: checkRole(["customer"]),
  isPartner: checkRole(["partner"]),
  isAdmin: checkRole(["admin"]),
  isAllowedForOrders: checkRole(["customer", "partner", "admin"])
};

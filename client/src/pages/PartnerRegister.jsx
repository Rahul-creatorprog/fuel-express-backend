import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Lock, FileText, Upload, Check } from "lucide-react";
import Navbar from "../components/Navbar";
import { API_BASE } from "../config";

function PartnerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    role: "partner",
    vehicleType: "Bike",
    vehicleNumber: "",
    drivingLicense: "", // Base64
    rcBook: ""          // Base64
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Please upload an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        [fieldName]: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!form.drivingLicense || !form.rcBook) {
      setError("Please upload both Driving License and RC Book proofs.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess("Application submitted successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/partner/login");
      }, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "90vh", paddingTop: "40px", paddingBottom: "40px" }}>
        <div className="glass-panel animate-fade-in" style={{ padding: "40px", width: "100%", maxWidth: "600px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
            <Link to="/" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <ArrowLeft size={20} />
            </Link>
            <h2 style={{ fontSize: "24px" }}>Register Delivery Partner</h2>
          </div>

          {error && (
            <div style={{ padding: "12px", background: "rgba(255, 56, 56, 0.1)", border: "1px solid rgba(255, 56, 56, 0.2)", borderRadius: "8px", color: "var(--accent-red)", fontSize: "14px", marginBottom: "20px" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: "12px", background: "rgba(0, 230, 118, 0.1)", border: "1px solid rgba(0, 230, 118, 0.2)", borderRadius: "8px", color: "var(--accent-green)", fontSize: "14px", marginBottom: "20px" }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              
              {/* General Fields */}
              <div className="form-group">
                <label>Full Name</label>
                <div style={{ position: "relative" }}>
                  <User size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={handleChange}
                    style={{ paddingLeft: "38px" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <div style={{ position: "relative" }}>
                  <Phone size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    name="mobile"
                    placeholder="Enter mobile number"
                    value={form.mobile}
                    onChange={handleChange}
                    style={{ paddingLeft: "38px" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address (Optional)"
                  value={form.email}
                  onChange={handleChange}
                  required={false}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="password"
                    name="password"
                    placeholder="Create secure password"
                    value={form.password}
                    onChange={handleChange}
                    style={{ paddingLeft: "38px" }}
                    required
                  />
                </div>
              </div>

              {/* Vehicle Fields */}
              <div className="form-group">
                <label>Vehicle Type</label>
                <select name="vehicleType" value={form.vehicleType} onChange={handleChange}>
                  <option value="Bike">Two-Wheeler (Bike/Scooter)</option>
                  <option value="Mini-Truck">Mini Fuel Bowser (Mini-Truck)</option>
                  <option value="Heavy-Truck">Fuel Tanker (Heavy-Truck)</option>
                  <option value="EV-Charger-Van">Mobile EV Charging Van</option>
                </select>
              </div>

              <div className="form-group">
                <label>Vehicle Number</label>
                <input
                  type="text"
                  name="vehicleNumber"
                  placeholder="e.g. KA-03-HA-1234"
                  value={form.vehicleNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Document Uploads */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "10px", marginBottom: "30px" }}>
              
              <div className="form-group">
                <label>Driving License Proof (Image)</label>
                <div className="file-upload-wrapper" style={{ borderColor: form.drivingLicense ? "var(--accent-green)" : "" }}>
                  {form.drivingLicense ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <Check size={28} color="var(--accent-green)" />
                      <span style={{ fontSize: "12px", color: "var(--accent-green)", fontWeight: 600 }}>License Uploaded</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <Upload size={24} color="var(--text-muted)" />
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Upload DL Image</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, "drivingLicense")} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>RC Book Proof (Image)</label>
                <div className="file-upload-wrapper" style={{ borderColor: form.rcBook ? "var(--accent-green)" : "" }}>
                  {form.rcBook ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <Check size={28} color="var(--accent-green)" />
                      <span style={{ fontSize: "12px", color: "var(--accent-green)", fontWeight: 600 }}>RC Book Uploaded</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <Upload size={24} color="var(--text-muted)" />
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Upload RC Image</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, "rcBook")} 
                  />
                </div>
              </div>

            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", background: "linear-gradient(135deg, var(--secondary), #00f2fe)" }} disabled={loading}>
              <User size={18} />
              <span>{loading ? "Submitting Application..." : "Submit Application"}</span>
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-muted)" }}>
            Already registered?{" "}
            <Link to="/partner/login" style={{ color: "var(--secondary)", textDecoration: "none" }}>
              Login here
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}

export default PartnerRegister;

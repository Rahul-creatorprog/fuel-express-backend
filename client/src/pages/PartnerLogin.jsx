import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Lock, LogIn, Award, Shield, Zap, TrendingUp } from "lucide-react";
import Navbar from "../components/Navbar";
import { API_BASE } from "../config";

function PartnerLogin() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: mobile, password, role: "partner" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("fe_token", data.token);
      localStorage.setItem("fe_user", JSON.stringify(data.user));
      navigate("/partner/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: "50px", paddingBottom: "50px" }}>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", 
          gap: "40px", 
          alignItems: "center" 
        }} className="animate-fade-in">
          
          {/* Left: Benefits Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingRight: "20px" }}>
            <div>
              <div style={{ display: "inline-flex", padding: "6px 14px", background: "rgba(230, 92, 0, 0.08)", border: "1px solid rgba(230, 92, 0, 0.2)", borderRadius: "30px", marginBottom: "16px", alignItems: "center", gap: "6px" }}>
                <Zap size={14} color="var(--secondary)" />
                <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: "var(--secondary)" }}>
                  Logistics & Dispatches
                </span>
              </div>
              <h1 style={{ fontSize: "38px", fontWeight: "800", marginBottom: "16px" }}>
                Deliver Fuel & Power, <br />
                <span className="title-glow" style={{ background: "linear-gradient(135deg, var(--secondary), #ffb703)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Earn On Your Schedule
                </span>
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "15px", lineHeight: "1.6" }}>
                Join the Fuel Express logistics network. Deliver gasoline, diesel, and EV charging dispatches directly to customer vehicles near you.
              </p>
            </div>

            {/* Benefit Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(230, 92, 0, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <TrendingUp size={20} color="var(--secondary)" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", color: "var(--text-main)" }}>₹ 150 Flat Trip Payout</h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Get paid a flat commission for every delivery job completed.</p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(230, 92, 0, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Shield size={20} color="var(--secondary)" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", color: "var(--text-main)" }}>Secure OTP Verifications</h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Confirm deliveries securely with customer-provided verification codes.</p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(230, 92, 0, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Award size={20} color="var(--secondary)" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", color: "var(--text-main)" }}>Flexible Dispatch Work</h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Log in and accept jobs whenever you want. Complete freedom of choice.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Login Box */}
          <div className="glass-panel" style={{ padding: "40px", width: "100%", maxWidth: "450px", justifySelf: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" }}>
              <img src="/logo.png" alt="Fuel Express Logo" style={{ height: "65px", marginBottom: "20px" }} />
              <h2 style={{ fontSize: "22px", margin: 0 }}>Partner Login</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Enter details to access dispatches</p>
            </div>

            {error && (
              <div style={{ padding: "12px", background: "rgba(255, 56, 56, 0.1)", border: "1px solid rgba(255, 56, 56, 0.2)", borderRadius: "8px", color: "var(--accent-red)", fontSize: "13px", marginBottom: "20px" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Mobile Number</label>
                <div style={{ position: "relative" }}>
                  <Phone size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Enter registered mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    style={{ paddingLeft: "45px" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "30px" }}>
                <label>Password</label>
                <div style={{ position: "relative" }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: "45px" }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  width: "100%", 
                  background: "linear-gradient(135deg, var(--secondary), #ffb703)", 
                  color: "#0a0907" 
                }} 
                disabled={loading}
              >
                <LogIn size={18} />
                <span>{loading ? "Logging in..." : "Login as Partner"}</span>
              </button>
            </form>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
              <Link to="/" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px" }}>
                <ArrowLeft size={14} /> Back to Portal
              </Link>
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Become partner?{" "}
                <Link to="/partner/register" style={{ color: "var(--secondary)", textDecoration: "none", fontWeight: "bold" }}>
                  Apply Here
                </Link>
              </span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default PartnerLogin;

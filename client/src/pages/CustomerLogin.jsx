import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Lock, LogIn } from "lucide-react";
import Navbar from "../components/Navbar";
import { API_BASE } from "../config";

function CustomerLogin() {
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
        body: JSON.stringify({ loginId: mobile, password, role: "customer" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("fe_token", data.token);
      localStorage.setItem("fe_user", JSON.stringify(data.user));
      navigate("/customer/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="glass-panel animate-fade-in" style={{ padding: "40px", width: "100%", maxWidth: "450px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px", position: "relative" }}>
            <Link to="/" style={{ color: "var(--text-muted)", position: "absolute", left: 0, top: "10px" }}>
              <ArrowLeft size={20} />
            </Link>
            <img src="/logo.png" alt="Fuel Express Logo" style={{ height: "60px", marginBottom: "15px" }} />
            <h2 style={{ fontSize: "22px", margin: 0 }}>Customer Login</h2>
          </div>

          {error && (
            <div style={{ padding: "12px", background: "rgba(255, 56, 56, 0.1)", border: "1px solid rgba(255, 56, 56, 0.2)", borderRadius: "8px", color: "var(--accent-red)", fontSize: "14px", marginBottom: "20px" }}>
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

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              <LogIn size={18} />
              <span>{loading ? "Logging in..." : "Login"}</span>
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/customer/register" style={{ color: "var(--primary)", textDecoration: "none" }}>
              Register Here
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}

export default CustomerLogin;

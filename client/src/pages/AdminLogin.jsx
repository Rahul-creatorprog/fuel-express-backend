import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, LogIn, KeyRound } from "lucide-react";
import Navbar from "../components/Navbar";
import { API_BASE } from "../config";

function AdminLogin() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
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
        body: JSON.stringify({ loginId, password, role: "admin" })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("fe_token", data.token);
      localStorage.setItem("fe_user", JSON.stringify(data.user));
      navigate("/admin/dashboard");
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
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
            <Link to="/" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <ArrowLeft size={20} />
            </Link>
            <h2 style={{ fontSize: "24px" }}>Admin Login</h2>
          </div>

          <div style={{ padding: "12px", background: "rgba(255, 159, 28, 0.05)", border: "1px solid rgba(255, 159, 28, 0.15)", borderRadius: "8px", color: "var(--accent-orange)", fontSize: "12px", marginBottom: "20px", lineHeight: "1.4" }}>
            <strong>Demo Credentials:</strong><br />
            ID/Mobile: <code>admin</code> or <code>9876543210</code><br />
            Password: <code>admin123</code>
          </div>

          {error && (
            <div style={{ padding: "12px", background: "rgba(255, 56, 56, 0.1)", border: "1px solid rgba(255, 56, 56, 0.2)", borderRadius: "8px", color: "var(--accent-red)", fontSize: "14px", marginBottom: "20px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Admin ID or Mobile</label>
              <div style={{ position: "relative" }}>
                <KeyRound size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Enter Admin ID or Mobile"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
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
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "45px" }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", background: "linear-gradient(135deg, var(--accent-orange), #ff4e50)", boxShadow: "0 4px 15px rgba(255, 159, 28, 0.2)" }} disabled={loading}>
              <LogIn size={18} />
              <span>{loading ? "Authorizing..." : "Admin Access"}</span>
            </button>
          </form>

        </div>
      </div>
    </>
  );
}

export default AdminLogin;

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Lock, UserPlus } from "lucide-react";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config";

function CustomerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    password: "",
    role: "customer"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await response.ok ? await response.json() : null;

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || data?.error || "Registration failed");
      }

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/customer/login");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "8vh" }}>
        <div className="glass-panel animate-fade-in" style={{ padding: "40px", width: "100%", maxWidth: "450px" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
            <Link to="/" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              <ArrowLeft size={20} />
            </Link>
            <h2 style={{ fontSize: "24px" }}>Customer Register</h2>
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
            <div className="form-group">
              <label>Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={handleChange}
                  style={{ paddingLeft: "45px" }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <div style={{ position: "relative" }}>
                <Phone size={18} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  name="mobile"
                  placeholder="Enter mobile number"
                  value={form.mobile}
                  onChange={handleChange}
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
                  name="password"
                  placeholder="Create secure password"
                  value={form.password}
                  onChange={handleChange}
                  style={{ paddingLeft: "45px" }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              <UserPlus size={18} />
              <span>{loading ? "Registering..." : "Register"}</span>
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-muted)" }}>
            Already registered?{" "}
            <Link to="/customer/login" style={{ color: "var(--primary)", textDecoration: "none" }}>
              Login here
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}

export default CustomerRegister;

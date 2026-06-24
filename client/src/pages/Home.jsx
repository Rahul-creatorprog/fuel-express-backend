import React from "react";
import { Link } from "react-router-dom";
import { User, Truck, ShieldCheck, Fuel, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";

function Home() {
  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: "60px", paddingBottom: "60px" }}>
        
        {/* Hero Area */}
        <div style={{ textAlign: "center", marginBottom: "60px" }} className="animate-fade-in">
          <div style={{ marginBottom: "24px" }}>
            <img src="/logo.png" alt="Fuel Express Logo" style={{ maxWidth: "340px", width: "100%", height: "auto" }} />
          </div>
          <h1 style={{ fontSize: "42px", marginBottom: "20px", fontWeight: "800" }}>
            Fuel & EV Power, <br /><span className="title-glow">Delivered Wherever You Are</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "17px", maxWidth: "600px", margin: "0 auto 40px auto", lineHeight: "1.6" }}>
            Order Petrol, Diesel, or book an EV charging slot instantly. Using location services, we connect you to the nearest bunk for rapid delivery.
          </p>
        </div>

        {/* Portals Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px" }} className="animate-fade-in">
          
          {/* Customer Card */}
          <div className="glass-panel" style={{ padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "rgba(0, 242, 254, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                <User size={24} color="var(--primary)" />
              </div>
              <h2 style={{ marginBottom: "12px" }}>Customer Portal</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "30px" }}>
                Need gas or power? Log in to auto-detect your location, find the nearest petrol bunk, place your order, and watch the partner deliver to you.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link to="/customer/login" className="btn btn-primary" style={{ width: "100%" }}>
                <span>Customer Login</span>
                <ArrowRight size={16} />
              </Link>
              <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                First time? <Link to="/customer/register" style={{ color: "var(--primary)", textDecoration: "none" }}>Register Now</Link>
              </div>
            </div>
          </div>

          {/* Partner Card */}
          <div className="glass-panel" style={{ padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "rgba(79, 172, 254, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                <Truck size={24} color="var(--secondary)" />
              </div>
              <h2 style={{ marginBottom: "12px" }}>Delivery Partner</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "30px" }}>
                Apply to become a driver. Register with your driving license, RC book, and vehicle details. Once approved by our admin, start accepting jobs!
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link to="/partner/login" className="btn btn-secondary" style={{ width: "100%", borderColor: "rgba(79, 172, 254, 0.3)" }}>
                <span>Partner Login</span>
                <ArrowRight size={16} />
              </Link>
              <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                Apply for job? <Link to="/partner/register" style={{ color: "var(--secondary)", textDecoration: "none" }}>Register Here</Link>
              </div>
            </div>
          </div>

          {/* Admin Card */}
          <div className="glass-panel" style={{ padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "rgba(255, 159, 28, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                <ShieldCheck size={24} color="var(--accent-orange)" />
              </div>
              <h2 style={{ marginBottom: "12px" }}>Admin Panel</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", marginBottom: "30px" }}>
                Access administrative controls. Verify and approve delivery partners, add or configure petrol bunks, monitor all system orders, and view metrics.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Link to="/admin/login" className="btn btn-secondary" style={{ width: "100%", background: "rgba(255, 159, 28, 0.05)", borderColor: "rgba(255, 159, 28, 0.2)", color: "var(--accent-orange)" }}>
                <span>Admin Login</span>
                <ArrowRight size={16} />
              </Link>
              <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                Protected area. Access requires valid credentials.
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}

export default Home;
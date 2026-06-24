import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";

function AccessDenied() {
  const userStr = localStorage.getItem("fe_user");
  const user = userStr ? JSON.parse(userStr) : null;

  const dashboardLink = user ? `/${user.role}/dashboard` : "/";

  return (
    <>
      <Navbar />
      <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <div className="glass-panel animate-fade-in" style={{ padding: "40px", maxWidth: "500px", textAlign: "center" }}>
          <ShieldAlert size={64} color="var(--accent-red)" style={{ marginBottom: "20px" }} />
          <h1 style={{ color: "var(--accent-red)", marginBottom: "16px" }}>Access Denied</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px", lineHeight: "1.6" }}>
            You do not have the required permissions to access this page. Each portal (Customer, Delivery Partner, and Admin) is restricted to verified users with correct roles.
          </p>
          <Link to={dashboardLink} className="btn btn-primary">
            <ArrowLeft size={16} />
            <span>Go Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </>
  );
}

export default AccessDenied;

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Fuel, LogOut, ShieldAlert } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("fe_token");
  const userStr = localStorage.getItem("fe_user");
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem("fe_token");
    localStorage.removeItem("fe_user");
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    return `/${user.role}/dashboard`;
  };

  return (
    <nav className="glass-nav">
      <Link to="/" className="nav-brand" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
        <img src="/logo.png" alt="Fuel Express Logo" style={{ height: "36px" }} />
      </Link>

      <div className="nav-links">
        {token && user ? (
          <>
            <Link to={getDashboardLink()} className="nav-link">
              Dashboard
            </Link>
            <div className="nav-user">
              <span className="badge badge-assigned" style={{ textTransform: "capitalize" }}>
                {user.role}
              </span>
              <span style={{ fontWeight: 650, fontSize: "14px" }}>{user.name}</span>
              <button 
                onClick={handleLogout} 
                className="btn btn-danger" 
                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px" }}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/" className="nav-link">Home Portal</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
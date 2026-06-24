import React, { useState, useEffect } from "react";
import { Shield, Users, ShoppingBag, DollarSign, Check, X, MapPin, Fuel, Trash2, Layers, RefreshCw } from "lucide-react";
import Navbar from "../components/Navbar";
import { API_BASE } from "../config";

function AdminDashboard() {
  const token = localStorage.getItem("fe_token");

  // Tabs: overview, approvals, orders, bunks
  const [activeTab, setActiveTab] = useState("overview");
  
  // Dashboard states
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    activePartners: 0,
    pendingPartners: 0,
    totalBunks: 0,
    totalCustomers: 0,
    totalRevenue: 0
  });

  const [partners, setPartners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bunks, setBunks] = useState([]);

  // New Bunk Form States
  const [newBunk, setNewBunk] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    fuels: ["Petrol", "Diesel", "EV Charging"]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchStats();
    fetchPartners();
    fetchOrders();
    fetchBunks();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setPartners(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBunks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bunks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setBunks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprovePartner = async (partnerId, approve) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/partners/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ partnerId, approve })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update approval status");
      }
      setSuccess(approve ? "Partner application approved!" : "Partner status updated to pending");
      fetchPartners();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/orders/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Cancelled" })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }
      setSuccess("Order cancelled successfully");
      fetchOrders();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateBunk = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newBunk.name || !newBunk.address || !newBunk.latitude || !newBunk.longitude) {
      setError("Please fill out all station fields.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/bunks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newBunk)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add station");
      }
      setSuccess("New Petrol Station added successfully!");
      setNewBunk({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        fuels: ["Petrol", "Diesel", "EV Charging"]
      });
      fetchBunks();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteBunk = async (bunkId) => {
    if (!window.confirm("Are you sure you want to remove this station?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/bunks/${bunkId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete station");
      }
      setSuccess("Station deleted successfully");
      fetchBunks();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: "30px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h1 style={{ fontSize: "32px" }} className="title-glow">Admin Console</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Approve drivers, manage fuel stations, and monitor dispatch logistics.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              className={`btn ${activeTab === "overview" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("overview")}
            >
              <Shield size={16} />
              <span>System Overview</span>
            </button>
            <button 
              className={`btn ${activeTab === "approvals" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("approvals")}
              style={{ position: "relative" }}
            >
              <Users size={16} />
              <span>Verify Partners</span>
              {partners.filter(p => p.status === "pending").length > 0 && (
                <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "var(--accent-orange)", color: "black", width: "18px", height: "18px", borderRadius: "50%", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  {partners.filter(p => p.status === "pending").length}
                </span>
              )}
            </button>
            <button 
              className={`btn ${activeTab === "orders" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("orders")}
            >
              <ShoppingBag size={16} />
              <span>Orders Feed</span>
            </button>
            <button 
              className={`btn ${activeTab === "bunks" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("bunks")}
            >
              <Layers size={16} />
              <span>Station Manager</span>
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div style={{ padding: "12px", background: "rgba(255, 56, 56, 0.1)", border: "1px solid rgba(255, 56, 56, 0.2)", borderRadius: "8px", color: "var(--accent-red)", marginBottom: "20px" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: "12px", background: "rgba(0, 230, 118, 0.1)", border: "1px solid rgba(0, 230, 118, 0.2)", borderRadius: "8px", color: "var(--accent-green)", marginBottom: "20px" }}>
            {success}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="animate-fade-in">
            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "40px" }}>
              
              <div className="glass-panel" style={{ padding: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(0, 242, 254, 0.1)" }}>
                  <ShoppingBag size={24} color="var(--primary)" />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Orders</div>
                  <h2 style={{ fontSize: "28px" }}>{stats.totalOrders}</h2>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(0, 230, 118, 0.1)" }}>
                  <DollarSign size={24} color="var(--accent-green)" />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Mock Revenue</div>
                  <h2 style={{ fontSize: "28px" }}>₹ {stats.totalRevenue.toLocaleString()}</h2>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(255, 159, 28, 0.1)" }}>
                  <Users size={24} color="var(--accent-orange)" />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Drivers (Active/Pending)</div>
                  <h2 style={{ fontSize: "28px" }}>{stats.activePartners} / <span style={{ color: "var(--accent-orange)" }}>{stats.pendingPartners}</span></h2>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(79, 172, 254, 0.1)" }}>
                  <MapPin size={24} color="var(--secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Petrol Stations</div>
                  <h2 style={{ fontSize: "28px" }}>{stats.totalBunks}</h2>
                </div>
              </div>

            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "30px" }}>
              <div className="glass-panel" style={{ padding: "24px" }}>
                <h3 style={{ marginBottom: "20px" }}>Live Log Metrics</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Total Registered Customers:</span>
                    <strong>{stats.totalCustomers}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Completed Deliveries:</span>
                    <strong style={{ color: "var(--accent-green)" }}>{stats.completedOrders}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Pending Dispatch Requests:</span>
                    <strong style={{ color: "var(--accent-orange)" }}>{stats.pendingOrders}</strong>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "24px", background: "rgba(0, 242, 254, 0.02)", borderColor: "var(--border-color-active)" }}>
                <h3 style={{ marginBottom: "12px", color: "var(--primary)" }}>Developer Testing Tips</h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.6" }}>
                  To test distance calculation correctly:
                  <ol style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <li>Open customer dashboard and click <strong>Get Location</strong> to retrieve your latitude & longitude.</li>
                    <li>Copy these coordinates.</li>
                    <li>Go to the <strong>Station Manager</strong> tab above and add a new Station using your exact coordinates.</li>
                    <li>Refresh the customer dashboard. You will see your new bunk instantly highlighted as the <strong>[NEAREST]</strong> station (0.00 km away) ready for ordering!</li>
                  </ol>
                </p>
              </div>
            </div>

          </div>
        )}

        {/* Verify Partners Tab */}
        {activeTab === "approvals" && (
          <div className="animate-fade-in">
            <h2 style={{ marginBottom: "20px", fontSize: "20px" }}>Pending Driver Registrations</h2>
            
            {partners.filter(p => p.status === "pending").length === 0 ? (
              <div className="glass-panel" style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                No pending driver verification requests.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {partners.filter(p => p.status === "pending").map((p) => (
                  <div key={p._id} className="glass-panel" style={{ padding: "30px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "20px" }}>
                      <div>
                        <h3>{p.name}</h3>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                          Mobile: {p.mobile} | Email: {p.email || "N/A"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "13px", fontWeight: "700" }}>Vehicle: {p.vehicleDetails?.vehicleType}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Plate: {p.vehicleDetails?.vehicleNumber}</div>
                      </div>
                    </div>

                    {/* Proof Images Display */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "8px" }}>Driving License Proof</label>
                        {p.proofs?.drivingLicense ? (
                          <img 
                            src={p.proofs.drivingLicense} 
                            alt="Driving License" 
                            style={{ width: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "8px", border: "1px solid var(--border-color)", background: "black" }} 
                          />
                        ) : (
                          <div style={{ height: "150px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", borderRadius: "8px" }}>No document uploaded</div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: "8px" }}>RC Book Proof</label>
                        {p.proofs?.rcBook ? (
                          <img 
                            src={p.proofs.rcBook} 
                            alt="RC Book" 
                            style={{ width: "100%", maxHeight: "250px", objectFit: "contain", borderRadius: "8px", border: "1px solid var(--border-color)", background: "black" }} 
                          />
                        ) : (
                          <div style={{ height: "150px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", borderRadius: "8px" }}>No document uploaded</div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                      <button 
                        onClick={() => handleApprovePartner(p._id, true)} 
                        className="btn btn-primary" 
                        style={{ padding: "8px 20px" }}
                      >
                        <Check size={16} />
                        <span>Approve Partner</span>
                      </button>
                      <button 
                        onClick={() => handleApprovePartner(p._id, false)} 
                        className="btn btn-secondary" 
                        style={{ padding: "8px 20px" }}
                      >
                        <X size={16} />
                        <span>Reject / Put on Hold</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Feed Tab */}
        {activeTab === "orders" && (
          <div className="animate-fade-in">
            <h2 style={{ marginBottom: "20px", fontSize: "20px" }}>System Log dispatches</h2>
            <div className="glass-panel" style={{ padding: "16px" }}>
              {orders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No orders placed in the system database yet.
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Client Details</th>
                        <th>Bunk Station</th>
                        <th>Fuel Type</th>
                        <th>Quantity</th>
                        <th>Destination</th>
                        <th>Status</th>
                        <th>Assigned Courier</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id}>
                          <td>
                            <div><strong>{o.customer?.name}</strong></div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{o.phone}</div>
                          </td>
                          <td>{o.bunk?.name || "Standard Station"}</td>
                          <td>{o.fuelType}</td>
                          <td>{o.quantity}</td>
                          <td>{o.address}</td>
                          <td>
                            <span className={`badge badge-${o.status.toLowerCase().replace(/ /g, "")}`}>
                              {o.status}
                            </span>
                          </td>
                          <td>{o.partner ? `${o.partner.name} (${o.partner.mobile})` : "Unassigned"}</td>
                          <td>
                            {o.status !== "Completed" && o.status !== "Cancelled" && (
                              <button 
                                onClick={() => handleCancelOrder(o._id)} 
                                className="btn btn-danger" 
                                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "11px" }}
                              >
                                <span>Cancel</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Station Manager Tab */}
        {activeTab === "bunks" && (
          <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "30px" }}>
            
            {/* Create Bunk Information Notice */}
            <div className="glass-panel" style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Fuel size={24} color="var(--primary)" />
              </div>
              <h3 style={{ margin: 0 }}>Automated Station Management</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                Admins do not need to manually add petrol stations anymore. Available petrol bunks are automatically fetched and registered by customers.
              </p>
              <div style={{ fontSize: "13px", color: "var(--text-main)", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px dashed var(--border-color)", lineHeight: "1.5" }}>
                💡 <strong>How it works:</strong>
                <ul style={{ paddingLeft: "20px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li>Customers auto-detect their GPS location when ordering.</li>
                  <li>The client portal automatically queries <strong>OpenStreetMap (OSM)</strong> for real available fuel stations within an 8km radius.</li>
                  <li>If a user selects a new station, the system automatically registers and seeds it in the database.</li>
                </ul>
              </div>
            </div>

            {/* List Active Bunks */}
            <div className="glass-panel" style={{ padding: "24px" }}>
              <h3 style={{ marginBottom: "20px" }}>Active Seeded Stations</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "480px", overflowY: "auto" }}>
                {bunks.map((b) => (
                  <div key={b._id} style={{ border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px", background: "rgba(255,255,255,0.01)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ fontSize: "15px" }}>{b.name}</h4>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{b.address}</p>
                      <span style={{ fontSize: "11px", color: "var(--primary)", marginTop: "6px", display: "inline-block" }}>
                        GPS: {b.latitude.toFixed(6)}, {b.longitude.toFixed(6)}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteBunk(b._id)} 
                      className="btn btn-danger" 
                      style={{ padding: "8px 12px", borderRadius: "8px" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </>
  );
}

export default AdminDashboard;

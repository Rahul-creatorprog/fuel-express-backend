import React, { useState, useEffect } from "react";
import { Truck, CheckCircle, Clock, MapPin, Phone, DollarSign, RefreshCw, Compass, Globe, Play, Square } from "lucide-react";
import Navbar from "../components/Navbar";
import MapComponent from "../components/MapComponent";
import { API_BASE } from "../config";

function PartnerDashboard() {
  const token = localStorage.getItem("fe_token");
  const userStr = localStorage.getItem("fe_user");
  const user = userStr ? JSON.parse(userStr) : null;

  const [partnerStatus, setPartnerStatus] = useState(user ? user.status : "pending");
  const [activeTab, setActiveTab] = useState("available"); // available, active, completed
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // OTP Prompts
  const [showOtpPrompt, setShowOtpPrompt] = useState(false);
  const [otpValue, setOtpValue] = useState("");

  // SMS Simulator States
  const [showSmsWidget, setShowSmsWidget] = useState(false);
  const [smsLogs, setSmsLogs] = useState([]);

  // Map & Simulation States
  const [mapType, setMapType] = useState("satellite");
  const [partnerCoords, setPartnerCoords] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIntervalId, setSimIntervalId] = useState(null);

  // Poll SMS logs for testing
  const fetchSmsLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/sms-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSmsLogs(data);
    } catch (err) {
      console.error("Error fetching SMS logs:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSmsLogs();
      const interval = setInterval(fetchSmsLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      checkProfileStatus();
    }
  }, []);

  useEffect(() => {
    if (partnerStatus === "approved" || partnerStatus === "active") {
      fetchAvailableOrders();
      fetchActiveOrder();
      fetchCompletedOrders();
    }
  }, [partnerStatus, activeTab]);

  // Live GPS tracking when Out for Delivery
  useEffect(() => {
    let watchId = null;

    if (activeOrder && activeOrder.status === "Out for Delivery" && !isSimulating) {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setPartnerCoords({ latitude: lat, longitude: lng });
            updateServerLocation(activeOrder._id, lat, lng);
          },
          (err) => {
            console.error("Error watching position:", err);
          },
          { enableHighAccuracy: true }
        );
      }
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeOrder, isSimulating]);

  // Clear simulation interval on unmount
  useEffect(() => {
    return () => {
      if (simIntervalId) clearInterval(simIntervalId);
    };
  }, [simIntervalId]);

  const updateServerLocation = async (orderId, lat, lng) => {
    try {
      await fetch(`${API_BASE}/api/orders/location/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      });
    } catch (err) {
      console.error("Failed to update partner location:", err);
    }
  };

  const startSimulation = () => {
    if (!activeOrder) return;
    setIsSimulating(true);
    setError("");
    setSuccess("");

    const startLat = activeOrder.bunk?.latitude || 11.108524;
    const startLng = activeOrder.bunk?.longitude || 77.341065;
    const endLat = activeOrder.coordinates?.latitude || 11.127532;
    const endLng = activeOrder.coordinates?.longitude || 77.324502;

    let step = 0;
    const totalSteps = 10;

    // First coordinate update at Bunk
    setPartnerCoords({ latitude: startLat, longitude: startLng });
    updateServerLocation(activeOrder._id, startLat, startLng);

    const interval = setInterval(() => {
      step += 1;
      if (step > totalSteps) {
        clearInterval(interval);
        setIsSimulating(false);
        setSuccess("Simulation complete! You have arrived at the customer's place.");
        setTimeout(() => setSuccess(""), 4000);
        return;
      }

      // Linear interpolation
      const currentLat = startLat + ((endLat - startLat) * step) / totalSteps;
      const currentLng = startLng + ((endLng - startLng) * step) / totalSteps;

      setPartnerCoords({ latitude: currentLat, longitude: currentLng });
      updateServerLocation(activeOrder._id, currentLat, currentLng);
    }, 3000); // update every 3 seconds

    setSimIntervalId(interval);
  };

  const stopSimulation = () => {
    if (simIntervalId) clearInterval(simIntervalId);
    setIsSimulating(false);
    setSimIntervalId(null);
  };

  // Double check status with backend in case admin approved them recently
  const checkProfileStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 403) {
        setPartnerStatus("pending");
      } else if (res.ok) {
        setPartnerStatus("approved");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAvailableOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAvailableOrders(data);
      }
    } catch (err) {
      setError("Failed to fetch available orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrder = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders?active=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.length > 0) {
        setActiveOrder(data[0]);
        if (data[0].partnerCoordinates) {
          setPartnerCoords(data[0].partnerCoordinates);
        }
      } else {
        setActiveOrder(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompletedOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders?history=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCompletedOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/orders/accept/${orderId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept order");
      }
      setSuccess("Order accepted! Proceeding to Active Delivery.");
      setActiveTab("active");
      fetchActiveOrder();
      fetchAvailableOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/orders/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }
      setSuccess(`Status updated to ${newStatus}`);
      
      if (newStatus === "Completed") {
        stopSimulation();
        setActiveOrder(null);
        setPartnerCoords(null);
        setActiveTab("completed");
      } else {
        fetchActiveOrder();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyOtpAndComplete = async (e) => {
    e.preventDefault();
    if (!otpValue) {
      setError("Please enter the 6-digit delivery OTP.");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/orders/status/${activeOrder._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Completed", otp: otpValue })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }
      setSuccess("Delivery verified and completed successfully!");
      setShowOtpPrompt(false);
      setOtpValue("");
      stopSimulation();
      setActiveOrder(null);
      setPartnerCoords(null);
      setActiveTab("completed");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDemoAutoApprove = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/demo-approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Demo approval failed");
      }
      setSuccess("Demo profile approved! Accessing dashboard...");
      setPartnerStatus("approved");
      // Update local storage user object so it stays approved on refresh
      const updatedUser = { ...user, status: "approved" };
      localStorage.setItem("fe_user", JSON.stringify(updatedUser));
    } catch (err) {
      setError(err.message);
    }
  };

  // If pending approval
  if (partnerStatus === "pending") {
    return (
      <>
        <Navbar />
        <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <div className="glass-panel animate-fade-in" style={{ padding: "40px", maxWidth: "550px", textAlign: "center" }}>
            <Compass size={64} color="var(--accent-orange)" style={{ marginBottom: "20px", animation: "spin 6s linear infinite" }} />
            <h1 style={{ color: "var(--accent-orange)", marginBottom: "16px" }}>Application Under Review</h1>
            <p style={{ color: "var(--text-muted)", marginBottom: "24px", lineHeight: "1.6" }}>
              Thank you for registering as a Fuel Express delivery partner. We have received your driving license and RC book documents. Our administration team is checking the credentials.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexDirection: "column", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={checkProfileStatus} className="btn btn-primary">
                  <RefreshCw size={16} />
                  <span>Refresh Status</span>
                </button>
                <button onClick={handleDemoAutoApprove} className="btn btn-secondary" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                  <span>⚡ Quick Auto-Approve (Demo)</span>
                </button>
              </div>
              {error && (
                <div style={{ marginTop: "15px", fontSize: "12px", color: "var(--accent-red)" }}>{error}</div>
              )}
              {success && (
                <div style={{ marginTop: "15px", fontSize: "12px", color: "var(--accent-green)" }}>{success}</div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: "30px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h1 style={{ fontSize: "32px" }} className="title-glow">Partner Operations Portal</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Manage active dispatches and accept fuel delivery assignments.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              className={`btn ${activeTab === "available" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("available")}
            >
              <Truck size={16} />
              <span>Available Jobs ({availableOrders.length})</span>
            </button>
            <button 
              className={`btn ${activeTab === "active" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("active")}
            >
              <Clock size={16} />
              <span>Active Delivery {activeOrder ? "⚠️" : ""}</span>
            </button>
            <button 
              className={`btn ${activeTab === "completed" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setActiveTab("completed")}
            >
              <CheckCircle size={16} />
              <span>Delivery History</span>
            </button>
          </div>
        </div>

        {/* Global Error/Success banner */}
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

        {/* Available Jobs Tab */}
        {activeTab === "available" && (
          <div className="animate-fade-in">
            <h2 style={{ marginBottom: "20px", fontSize: "20px" }}>Pending Dispatches Near You</h2>
            {availableOrders.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                No pending deliveries currently in queue. Click Refresh to reload.
                <br /><br />
                <button onClick={fetchAvailableOrders} className="btn btn-secondary">
                  <RefreshCw size={14} />
                  <span>Refresh Queue</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
                {availableOrders.map((o) => (
                  <div key={o._id} className="glass-panel" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                      <span className="badge badge-pending">{o.fuelType}</span>
                      <span style={{ fontWeight: 700, color: "var(--primary)" }}>{o.quantity} {o.fuelType === "EV Charging" ? "kWh" : "Liters"}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
                      <div><strong>From Bunk:</strong> {o.bunk?.name || "Standard Station"}</div>
                      <div><strong>Bunk Location:</strong> {o.bunk?.address}</div>
                      <div><strong>Delivery to:</strong> {o.address}</div>
                      <div><strong>Order Time:</strong> {new Date(o.createdAt).toLocaleString()}</div>
                    </div>

                    <button onClick={() => handleAcceptOrder(o._id)} className="btn btn-primary" style={{ width: "100%" }}>
                      <span>Accept Delivery</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Delivery Tab */}
        {activeTab === "active" && (
          <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center" }}>
            {activeOrder ? (
              <div className="glass-panel" style={{ padding: "40px", width: "100%", maxWidth: "650px" }}>
                
                {/* Real-time Map section */}
                <div style={{ height: "300px", marginBottom: "20px" }}>
                  <MapComponent 
                    customerCoords={activeOrder.coordinates} 
                    bunkCoords={activeOrder.bunk} 
                    partnerCoords={partnerCoords}
                    mapType={mapType}
                    setMapType={setMapType}
                    height="100%"
                  />
                </div>

                {/* Simulated Delivery Ride Toggle */}
                {activeOrder.status === "Out for Delivery" && (
                  <div style={{ 
                    background: "rgba(255,255,255,0.02)", 
                    border: "1px solid var(--border-color)", 
                    padding: "16px", 
                    borderRadius: "10px", 
                    marginBottom: "20px", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center" 
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "14px", color: "var(--accent-orange)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Globe size={16} />
                        <span>Location Simulation</span>
                      </h4>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                        Simulate movement from the bunk to the customer.
                      </p>
                    </div>
                    {isSimulating ? (
                      <button type="button" onClick={stopSimulation} className="btn btn-danger" style={{ padding: "8px 16px", fontSize: "12px" }}>
                        <Square size={14} />
                        <span>Stop Ride</span>
                      </button>
                    ) : (
                      <button type="button" onClick={startSimulation} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "12px" }}>
                        <Play size={14} />
                        <span>Start Ride</span>
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "24px" }}>
                  <div>
                    <span className="badge badge-assigned" style={{ marginBottom: "6px" }}>Active Assignment</span>
                    <h2>{activeOrder.fuelType} - {activeOrder.quantity} {activeOrder.fuelType === "EV Charging" ? "kWh" : "Liters"}</h2>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Current Status:</span>
                    <div className="badge badge-outfordelivery" style={{ display: "block", marginTop: "4px" }}>{activeOrder.status}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                  <div>
                    <h4 style={{ color: "var(--primary)", marginBottom: "10px" }}>1. Bunk Pick-Up</h4>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div><strong>Station Name:</strong> {activeOrder.bunk?.name}</div>
                      <div><strong>Address:</strong> {activeOrder.bunk?.address}</div>
                      <div><strong>GPS:</strong> {activeOrder.bunk?.latitude.toFixed(5)}, {activeOrder.bunk?.longitude.toFixed(5)}</div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ color: "var(--secondary)", marginBottom: "10px" }}>2. Client Delivery</h4>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div><strong>Name:</strong> {activeOrder.customer?.name}</div>
                      <div><strong>Phone:</strong> {activeOrder.phone}</div>
                      <div><strong>Address:</strong> {activeOrder.address}</div>
                      <div><strong>GPS:</strong> {activeOrder.coordinates?.latitude.toFixed(5)}, {activeOrder.coordinates?.longitude.toFixed(5)}</div>
                    </div>
                  </div>
                </div>

                {showOtpPrompt ? (
                  <form onSubmit={handleVerifyOtpAndComplete} style={{ width: "100%", background: "rgba(245, 158, 11, 0.05)", border: "1px dashed var(--primary)", padding: "20px", borderRadius: "10px", marginTop: "10px" }}>
                    <h4 style={{ margin: "0 0 12px 0", color: "var(--primary)" }}>🔑 Customer OTP Required</h4>
                    <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "var(--text-muted)" }}>
                      Ask the customer for the 6-digit delivery OTP sent to their registered mobile number.
                    </p>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                      <input 
                        type="text" 
                        placeholder="Enter 6-Digit OTP" 
                        value={otpValue} 
                        onChange={(e) => setOtpValue(e.target.value)} 
                        maxLength={6}
                        required 
                        style={{ fontSize: "16px", letterSpacing: "4px", textAlign: "center", fontWeight: "bold" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1, background: "linear-gradient(135deg, var(--accent-green), #00b0ff)" }}>
                        <span>Verify & Complete</span>
                      </button>
                      <button type="button" onClick={() => { setShowOtpPrompt(false); setOtpValue(""); }} className="btn btn-secondary">
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: "flex", gap: "16px" }}>
                    {activeOrder.status === "Assigned" && (
                      <button 
                        onClick={() => handleUpdateStatus(activeOrder._id, "Out for Delivery")} 
                        className="btn btn-primary" 
                        style={{ flex: 1 }}
                      >
                        <Truck size={16} />
                        <span>Start Transit (Out for Delivery)</span>
                      </button>
                    )}

                    {activeOrder.status === "Out for Delivery" && (
                      <button 
                        onClick={() => setShowOtpPrompt(true)} 
                        className="btn btn-primary" 
                        style={{ flex: 1, background: "linear-gradient(135deg, var(--accent-green), #00b0ff)" }}
                      >
                        <CheckCircle size={16} />
                        <span>Mark as Delivered (Completed)</span>
                      </button>
                    )}

                    <button 
                      onClick={() => handleUpdateStatus(activeOrder._id, "Cancelled")} 
                      className="btn btn-danger"
                    >
                      <span>Cancel Delivery</span>
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="glass-panel" style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)", width: "100%", maxWidth: "600px" }}>
                No active delivery assignment. Go to the 'Available Jobs' tab to accept a delivery request!
              </div>
            )}
          </div>
        )}

        {/* Completed Log Tab */}
        {activeTab === "completed" && (
          <div className="animate-fade-in">
            <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
              <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(0, 230, 118, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DollarSign size={20} color="var(--accent-green)" />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Earnings</div>
                  <h3 style={{ fontSize: "22px" }}>₹ {(completedOrders.length * 150).toLocaleString()}</h3>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(0, 242, 254, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle size={20} color="var(--primary)" />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Completed Trips</div>
                  <h3 style={{ fontSize: "22px" }}>{completedOrders.length} trips</h3>
                </div>
              </div>
            </div>

            <h2 style={{ marginBottom: "20px", fontSize: "20px" }}>Delivery History Logs</h2>
            <div className="glass-panel" style={{ padding: "16px" }}>
              {completedOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No completed delivery records found. Finish an active delivery to log records here!
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Fuel Details</th>
                        <th>Bunk Name</th>
                        <th>Delivery Destination</th>
                        <th>Trip Fee</th>
                        <th>Date Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.map((o) => (
                        <tr key={o._id}>
                          <td>{o.fuelType} ({o.quantity} units)</td>
                          <td>{o.bunk?.name}</td>
                          <td>{o.address}</td>
                          <td style={{ color: "var(--accent-green)", fontWeight: 700 }}>₹ 150</td>
                          <td>{new Date(o.updatedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating SMS Simulator Widget */}
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
          maxWidth: "350px",
          width: "90%",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          border: "1px solid var(--border-color-active)",
          borderRadius: "12px",
          background: "rgba(22, 19, 14, 0.95)",
          backdropFilter: "blur(20px)"
        }}>
          {/* Header */}
          <div 
            onClick={() => setShowSmsWidget(!showSmsWidget)}
            style={{
              padding: "12px 16px",
              background: "linear-gradient(135deg, var(--primary), var(--secondary))",
              color: "#050608",
              borderTopLeftRadius: "11px",
              borderTopRightRadius: "11px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <span>📱 Mobile SMS Simulator</span>
            </span>
            <span style={{ fontSize: "12px" }}>{showSmsWidget ? "▼ Minimize" : "▲ Expand"}</span>
          </div>

          {/* Message Logs List */}
          {showSmsWidget && (
            <div style={{ padding: "16px", maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {smsLogs.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
                  No SMS messages received yet. Place an order or trigger status updates to see messages sent to your registered mobile number!
                </div>
              ) : (
                smsLogs.map((log) => (
                  <div key={log._id} style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "12px",
                    lineHeight: "1.4"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--primary)", fontSize: "10px", marginBottom: "4px", fontWeight: "bold" }}>
                      <span>To: {log.to}</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ color: "var(--text-main)" }}>
                      {log.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default PartnerDashboard;

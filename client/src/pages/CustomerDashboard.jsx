import React, { useState, useEffect } from "react";
import { MapPin, Navigation, ShoppingBag, Clock, ShieldCheck, Fuel, Globe } from "lucide-react";
import Navbar from "../components/Navbar";
import MapComponent from "../components/MapComponent";
import { API_BASE } from "../config";

function CustomerDashboard() {
  const token = localStorage.getItem("fe_token");
  const [bunks, setBunks] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  
  // Location States
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [mapType, setMapType] = useState("satellite");

  // Form States
  const [fuelType, setFuelType] = useState("Petrol");
  const [quantity, setQuantity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedBunkId, setSelectedBunkId] = useState("");
  const [sortedBunks, setSortedBunks] = useState([]);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  // SMS Simulator States
  const [showSmsWidget, setShowSmsWidget] = useState(false);
  const [smsLogs, setSmsLogs] = useState([]);

  // Fetch Bunks & Orders
  useEffect(() => {
    fetchBunks();
    fetchOrders();
  }, []);

  // Poll SMS logs for the Simulator widget
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

  // Auto-detect customer location on page mount/bunks load
  useEffect(() => {
    if (bunks.length > 0 && !coords && !locating && !locError) {
      handleGetLocation();
    }
  }, [bunks]);

  // Polling for active deliveries to track partner position in real-time
  useEffect(() => {
    const hasActiveOrder = myOrders.some(
      (o) => o.status === "Assigned" || o.status === "Out for Delivery"
    );

    if (hasActiveOrder) {
      const interval = setInterval(() => {
        fetchOrders();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [myOrders]);

  const fetchBunks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bunks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setBunks(data);
    } catch (err) {
      console.error("Error fetching bunks:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMyOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  // Haversine formula
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch Location & Nearby Real Petrol Bunks from OSM
  const handleGetLocation = () => {
    setLocating(true);
    setLocError("");
    setCoords(null);

    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setCoords({ latitude: userLat, longitude: userLng });

        // 1. Fetch real street address using free Nominatim reverse geocoding API
        try {
          const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`;
          const geoRes = await fetch(geocodeUrl, {
            headers: {
              "User-Agent": "FuelExpressApp/1.0"
            }
          });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData && geoData.display_name) {
              setAddress(geoData.display_name);
            }
          }
        } catch (geoErr) {
          console.error("Reverse geocoding failed:", geoErr);
        }

        // 2. Fetch real petrol stations from OSM Overpass API
        try {
          const radius = 8000;
          const url = `https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="fuel"](around:${radius},${userLat},${userLng});out;`;
          
          const res = await fetch(url);
          if (!res.ok) throw new Error("Overpass API error");
          const data = await res.json();
          
          let fetchedBunks = [];
          if (data && data.elements && data.elements.length > 0) {
            fetchedBunks = data.elements.map((el) => ({
              _id: `osm-${el.id}`,
              name: el.tags.name || el.tags.brand || "Petrol Station",
              address: el.tags["addr:street"] 
                ? `${el.tags["addr:street"]}, ${el.tags["addr:city"] || ""}` 
                : el.tags["addr:full"] || "Near location coordinates",
              latitude: el.lat,
              longitude: el.lon,
              fuels: ["Petrol", "Diesel", "EV Charging"],
              isOSM: true
            }));
          }

          // Fallback if OSM returns nothing: generate mock local stations close to the user's location
          if (fetchedBunks.length === 0) {
            console.log("No OSM petrol stations found. Generating local mock stations.");
            fetchedBunks = [
              {
                _id: "mock-1",
                name: "Bharat Petroleum (BPCL) - Near Station",
                address: "Local Ring Road Sector 2",
                latitude: userLat + 0.008,
                longitude: userLng + 0.005,
                fuels: ["Petrol", "Diesel", "EV Charging"],
                isOSM: true
              },
              {
                _id: "mock-2",
                name: "Shell Fuel Hub - Local Center",
                address: "Market Crossing Boulevard",
                latitude: userLat - 0.006,
                longitude: userLng + 0.009,
                fuels: ["Petrol", "Diesel"],
                isOSM: true
              },
              {
                _id: "mock-3",
                name: "Indian Oil Bunk - Local Sector",
                address: "Main Highway Avenue",
                latitude: userLat + 0.012,
                longitude: userLng - 0.008,
                fuels: ["Petrol", "Diesel", "EV Charging"],
                isOSM: true
              }
            ];
          }

          const calculatedBunks = fetchedBunks
            .map((b) => ({
              ...b,
              distance: getDistance(userLat, userLng, b.latitude, b.longitude)
            }))
            .sort((a, b) => a.distance - b.distance);

          setSortedBunks(calculatedBunks);
          if (calculatedBunks.length > 0) {
            setSelectedBunkId(calculatedBunks[0]._id); // Auto-select nearest
          }
        } catch (err) {
          console.error("Error fetching OSM real stations. Generating local mock stations:", err);
          const localMockBunks = [
            {
              _id: "mock-1",
              name: "Bharat Petroleum (BPCL) - Near Station",
              address: "Local Ring Road Sector 2",
              latitude: userLat + 0.008,
              longitude: userLng + 0.005,
              fuels: ["Petrol", "Diesel", "EV Charging"],
              isOSM: true
            },
            {
              _id: "mock-2",
              name: "Shell Fuel Hub - Local Center",
              address: "Market Crossing Boulevard",
              latitude: userLat - 0.006,
              longitude: userLng + 0.009,
              fuels: ["Petrol", "Diesel"],
              isOSM: true
            },
            {
              _id: "mock-3",
              name: "Indian Oil Bunk - Local Sector",
              address: "Main Highway Avenue",
              latitude: userLat + 0.012,
              longitude: userLng - 0.008,
              fuels: ["Petrol", "Diesel", "EV Charging"],
              isOSM: true
            }
          ];

          const calculatedBunks = localMockBunks
            .map((b) => ({
              ...b,
              distance: getDistance(userLat, userLng, b.latitude, b.longitude)
            }))
            .sort((a, b) => a.distance - b.distance);

          setSortedBunks(calculatedBunks);
          if (calculatedBunks.length > 0) {
            setSelectedBunkId(calculatedBunks[0]._id);
          }
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocError("Unable to retrieve location. Using default Tiruppur coordinates.");
        setLocating(false);
        
        // Fallback to Tiruppur center
        const fallbackLat = 11.108524;
        const fallbackLng = 77.341065;
        setCoords({ latitude: fallbackLat, longitude: fallbackLng });
        setAddress("Kumaran Road, Tiruppur, Tamil Nadu, 641601, India");
        
        const calculatedBunks = bunks
          .map((b) => ({
            ...b,
            distance: getDistance(fallbackLat, fallbackLng, b.latitude, b.longitude),
            isOSM: false
          }))
          .sort((a, b) => a.distance - b.distance);

        setSortedBunks(calculatedBunks);
        if (calculatedBunks.length > 0) {
          setSelectedBunkId(calculatedBunks[0]._id);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!coords) {
      setFormError("Please fetch your current location coordinates first to find the nearest bunk.");
      return;
    }
    if (!selectedBunkId) {
      setFormError("Please select a Petrol Bunk/Station to order from.");
      return;
    }
    if (!quantity || quantity <= 0) {
      setFormError("Please enter a valid quantity.");
      return;
    }
    if (!address) {
      setFormError("Please enter the delivery address.");
      return;
    }
    if (!phone) {
      setFormError("Please enter a contact phone number.");
      return;
    }

    setPlacingOrder(true);

    try {
      const selectedBunk = sortedBunks.find(b => b._id === selectedBunkId);
      const payload = {
        fuelType,
        quantity: Number(quantity),
        address,
        coordinates: coords,
        phone
      };

      // If Bunk is from OpenStreetMap, send its details to be seeded on server
      if (selectedBunk && selectedBunk.isOSM) {
        payload.bunkData = {
          name: selectedBunk.name,
          address: selectedBunk.address,
          latitude: selectedBunk.latitude,
          longitude: selectedBunk.longitude,
          fuels: selectedBunk.fuels
        };
      } else {
        payload.bunkId = selectedBunkId;
      }

      const res = await fetch(`${API_BASE}/api/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      setFormSuccess("Order placed successfully! Finding a delivery partner...");
      setQuantity("");
      setTimeout(() => setFormSuccess(""), 4000);
      fetchOrders();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  // Find if there is an active order currently dispatched/assigned
  const activeOrder = myOrders.find(
    (o) => o.status === "Assigned" || o.status === "Out for Delivery"
  );

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: "30px" }}>
        
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800 }} className="title-glow">
            Order Fuel & Power
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Auto-detect your location to find real-time petrol stations and track dispatches on the live satellite map.
          </p>
        </div>

        {/* Live Dispatch Tracking Map (Full width when active delivery exists) */}
        {activeOrder && (
          <div className="glass-panel" style={{ padding: "20px", marginBottom: "30px" }}>
            <h3 style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-orange)" }}>
              <Globe size={20} />
              <span>Live Dispatch Tracking (Active Order: {activeOrder.fuelType})</span>
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "20px" }}>
              <div style={{ height: "380px" }}>
                <MapComponent 
                  customerCoords={activeOrder.coordinates} 
                  bunkCoords={activeOrder.bunk} 
                  partnerCoords={activeOrder.partnerCoordinates}
                  mapType={mapType}
                  setMapType={setMapType}
                  height="100%"
                />
              </div>
              <div style={{ display: "flex", flexSelf: "center", flexDirection: "column", gap: "12px", justifyContent: "center" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "16px", fontWeight: "bold", color: "var(--primary)" }}>
                      {activeOrder.fuelType} Delivery
                    </span>
                    <span className={`badge badge-${activeOrder.status.toLowerCase().replace(/ /g, "")}`}>
                      {activeOrder.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div><strong>Bunk Station:</strong> {activeOrder.bunk?.name}</div>
                    <div><strong>Station Location:</strong> {activeOrder.bunk?.address}</div>
                    <div><strong>Delivery Location:</strong> {activeOrder.address}</div>
                    
                    {activeOrder.deliveryOtp && (
                      <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px dashed var(--primary)", padding: "10px", borderRadius: "8px", marginTop: "10px", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Verification OTP for Partner
                        </span>
                        <strong style={{ fontSize: "18px", color: "var(--primary)", letterSpacing: "3px" }}>
                          {activeOrder.deliveryOtp}
                        </strong>
                      </div>
                    )}

                    {activeOrder.partner && (
                      <div style={{ borderTop: "1px dashed var(--border-color)", marginTop: "10px", paddingTop: "10px", color: "var(--text-main)" }}>
                        <div><strong>Delivery Partner:</strong> {activeOrder.partner.name}</div>
                        <div><strong>Partner Phone:</strong> {activeOrder.partner.mobile}</div>
                        {activeOrder.partnerCoordinates ? (
                          <div style={{ color: "var(--accent-green)", fontSize: "12px", marginTop: "4px" }}>
                            🛰️ Live GPS Coordinates Connected
                          </div>
                        ) : (
                          <div style={{ color: "var(--accent-orange)", fontSize: "12px", marginTop: "4px" }}>
                            ⏳ Partner preparing to move from bunk...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "30px", alignItems: "start" }}>
          
          {/* Order Placement Form */}
          <div className="glass-panel" style={{ padding: "30px" }}>
            <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShoppingBag size={20} color="var(--primary)" />
              <span>New Delivery Order</span>
            </h3>

            {formError && (
              <div style={{ padding: "12px", background: "rgba(255, 56, 56, 0.1)", border: "1px solid rgba(255, 56, 56, 0.2)", borderRadius: "8px", color: "var(--accent-red)", fontSize: "13px", marginBottom: "15px" }}>
                {formError}
              </div>
            )}

            {formSuccess && (
              <div style={{ padding: "12px", background: "rgba(0, 230, 118, 0.1)", border: "1px solid rgba(0, 230, 118, 0.2)", borderRadius: "8px", color: "var(--accent-green)", fontSize: "13px", marginBottom: "15px" }}>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handlePlaceOrder}>
              
              {/* Geolocation Section */}
              <div className="form-group" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ margin: 0 }}>Current Location</label>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={handleGetLocation}
                    disabled={locating}
                    style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "11px" }}
                  >
                    <Navigation size={12} className={locating ? "animate-spin" : ""} />
                    <span>{locating ? "Locating..." : "Get Location"}</span>
                  </button>
                </div>

                {coords ? (
                  <div style={{ fontSize: "13px", color: "var(--accent-green)" }}>
                    <MapPin size={12} style={{ marginRight: "4px" }} />
                    Coordinates: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                  </div>
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Location coordinates required to find the nearest bunks.
                  </span>
                )}

                {locError && (
                  <div style={{ fontSize: "11px", color: "var(--accent-orange)", marginTop: "6px" }}>
                    {locError}
                  </div>
                )}
              </div>

              {/* Bunk Selector Card Boxes */}
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ marginBottom: "10px" }}>Available Petrol Stations (Select One)</label>
                {coords ? (
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: "12px", 
                    maxHeight: "300px", 
                    overflowY: "auto", 
                    paddingRight: "6px",
                    marginTop: "4px"
                  }}>
                    {sortedBunks.map((b, idx) => {
                      const isSelected = selectedBunkId === b._id;
                      return (
                        <div 
                          key={b._id} 
                          onClick={() => setSelectedBunkId(b._id)}
                          style={{
                            padding: "14px",
                            background: isSelected ? "rgba(245, 158, 11, 0.1)" : "rgba(255, 255, 255, 0.02)",
                            border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                            borderRadius: "10px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <span style={{ fontWeight: "700", color: isSelected ? "var(--primary)" : "var(--text-main)", fontSize: "14px" }}>
                                {b.name}
                              </span>
                              {idx === 0 && (
                                <span style={{ background: "rgba(245, 158, 11, 0.2)", color: "var(--primary)", fontSize: "9px", padding: "2px 6px", borderRadius: "10px", fontWeight: "bold", textTransform: "uppercase" }}>
                                  Nearest
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                              {b.address}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <span style={{ 
                              display: "block", 
                              fontSize: "13px", 
                              fontWeight: "bold", 
                              color: isSelected ? "var(--primary)" : "var(--accent-green)" 
                            }}>
                              {b.distance ? `${b.distance.toFixed(2)} km` : "Calculating..."}
                            </span>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                              distance
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: "13px", padding: "16px", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-muted)", background: "rgba(255,255,255,0.01)", textAlign: "center" }}>
                    🔒 Click 'Get Location' above to find petrol stations near your area.
                  </div>
                )}
              </div>

              {/* Fuel Type Selector Boxes */}
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label style={{ marginBottom: "10px" }}>Select Fuel / Power Type</label>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(3, 1fr)", 
                  gap: "12px" 
                }}>
                  {[
                    { type: "Petrol", label: "Petrol", icon: "⛽", unit: "Liters" },
                    { type: "Diesel", label: "Diesel", icon: "🛢️", unit: "Liters" },
                    { type: "EV Charging", label: "EV Charging", icon: "⚡", unit: "kWh" }
                  ].map((fuel) => {
                    const isSelected = fuelType === fuel.type;
                    return (
                      <div
                        key={fuel.type}
                        onClick={() => setFuelType(fuel.type)}
                        style={{
                          padding: "14px 10px",
                          background: isSelected ? "rgba(245, 158, 11, 0.1)" : "rgba(255, 255, 255, 0.02)",
                          border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                          borderRadius: "10px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px"
                        }}
                      >
                        <span style={{ fontSize: "20px" }}>{fuel.icon}</span>
                        <span style={{ 
                          fontSize: "12px", 
                          fontWeight: "bold", 
                          color: isSelected ? "var(--primary)" : "var(--text-main)" 
                        }}>
                          {fuel.label}
                        </span>
                        <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                          ({fuel.unit})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quantity */}
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label>Quantity ({fuelType === "EV Charging" ? "kWh" : "Liters"})</label>
                <input
                  type="number"
                  placeholder={`e.g. ${fuelType === "EV Charging" ? "40" : "15"}`}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              {/* Address */}
              <div className="form-group">
                <label>Delivery Address Details</label>
                <textarea
                  rows="2"
                  placeholder="Enter house, apartment or street name details..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ resize: "none" }}
                  required
                />
              </div>

              {/* Contact phone */}
              <div className="form-group" style={{ marginBottom: "24px" }}>
                <label>Mobile Number (For Dispatcher)</label>
                <input
                  type="text"
                  placeholder="Enter contact number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: "100%" }}
                disabled={placingOrder}
              >
                <Fuel size={16} />
                <span>{placingOrder ? "Placing Order..." : "Place Order"}</span>
              </button>

            </form>
          </div>

          {/* Map and Order History Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* Interactive Stations Map (Visible when coordinates are fetched and no active order map is shown) */}
            {coords && !activeOrder && (
              <div className="glass-panel" style={{ padding: "20px" }}>
                <h3 style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={20} color="var(--primary)" />
                  <span>Nearby Real Petrol Bunks (Distance in Real-time)</span>
                </h3>
                <div style={{ height: "300px" }}>
                  <MapComponent 
                    customerCoords={coords} 
                    bunksList={sortedBunks} 
                    mapType={mapType}
                    setMapType={setMapType}
                    height="100%"
                  />
                </div>
              </div>
            )}

            {/* Customer Order History */}
            <div className="glass-panel" style={{ padding: "30px" }}>
              <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={20} color="var(--secondary)" />
                <span>Order Tracking Feed</span>
              </h3>

              {myOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No active or historical orders found. Place your first fuel delivery order now!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "550px", overflowY: "auto" }}>
                  {myOrders.map((o) => (
                    <div key={o._id} style={{ border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px", background: "rgba(255,255,255,0.01)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--primary)" }}>
                          {o.fuelType} - {o.quantity} {o.fuelType === "EV Charging" ? "kWh" : "Liters"}
                        </span>
                        <span className={`badge badge-${o.status.toLowerCase().replace(/ /g, "")}`}>
                          {o.status}
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                        <div><strong>Bunk:</strong> {o.bunk?.name || "Standard Station"}</div>
                        <div><strong>Address:</strong> {o.address}</div>
                        <div><strong>Ordered At:</strong> {new Date(o.createdAt).toLocaleString()}</div>
                        {o.partner && (
                          <div style={{ borderTop: "1px dashed var(--border-color)", marginTop: "8px", paddingTop: "8px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                            <ShieldCheck size={14} color="var(--accent-green)" />
                            <span>
                              <strong>Partner Assigned:</strong> {o.partner.name} ({o.partner.mobile})
                            </span>
                          </div>
                        )}
                        {(o.status === "Assigned" || o.status === "Out for Delivery") && o.deliveryOtp && (
                          <div style={{ fontSize: "11px", color: "var(--accent-orange)", marginTop: "4px" }}>
                            🔑 Delivery OTP: <strong>{o.deliveryOtp}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

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

export default CustomerDashboard;

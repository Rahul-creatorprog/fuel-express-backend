import React, { useEffect, useRef } from "react";

function MapComponent({ 
  customerCoords, 
  bunkCoords, 
  partnerCoords, 
  bunksList = [], 
  mapType = "street", 
  setMapType,
  height = "350px" 
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroup = useRef(null);

  useEffect(() => {
    // Check if Leaflet is loaded on window
    if (!window.L || !mapRef.current) return;

    const L = window.L;

    // 1. Initialize Leaflet Map Instance if not already created
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([12.9716, 77.5946], 13); // Default view (Bangalore)
      
      markersGroup.current = L.featureGroup().addTo(mapInstance.current);
    }

    const map = mapInstance.current;

    // 2. Clear existing markers
    markersGroup.current.clearLayers();

    // 3. Remove existing tile layers to reload correctly based on mapType
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // 4. Set Tile Layer based on selected mode
    if (mapType === "satellite") {
      // Base Satellite Imagery
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      }).addTo(map);

      // Roads & Street Overlays
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }).addTo(map);

      // Place Labels & Boundaries Overlays
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);
    }

    // 5. Custom marker builder helper using L.divIcon
    const createCustomIcon = (emoji, color, label) => {
      return L.divIcon({
        html: `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="
              background-color: ${color}; 
              width: 38px; 
              height: 38px; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              border: 2px solid #fff; 
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              font-size: 20px;
              animation: pulse 2s infinite ease-in-out;
            ">
              ${emoji}
            </div>
            ${label ? `
              <div style="
                background: rgba(0, 0, 0, 0.8); 
                color: #fff; 
                padding: 2px 6px; 
                border-radius: 4px; 
                font-size: 10px; 
                margin-top: 4px; 
                white-space: nowrap;
                border: 1px solid rgba(255,255,255,0.2);
                font-weight: bold;
              ">
                ${label}
              </div>
            ` : ''}
          </div>
        `,
        className: 'custom-leaflet-icon',
        iconSize: [60, 60],
        iconAnchor: [30, 25]
      });
    };

    // 6. Draw Customer Marker
    if (customerCoords && customerCoords.latitude && customerCoords.longitude) {
      const customerIcon = createCustomIcon('🏠', '#3b82f6', 'You');
      L.marker([customerCoords.latitude, customerCoords.longitude], { icon: customerIcon })
        .bindPopup('<b>Your Location</b><br/>Coordinates: ' + customerCoords.latitude.toFixed(6) + ', ' + customerCoords.longitude.toFixed(6))
        .addTo(markersGroup.current);
    }

    // 7. Draw Petrol Bunk Marker(s)
    if (bunkCoords && bunkCoords.latitude && bunkCoords.longitude) {
      // Selected single bunk (during delivery/after selection)
      const bunkIcon = createCustomIcon('⛽', '#f5af19', bunkCoords.name ? bunkCoords.name.substring(0, 15) + '...' : 'Bunk');
      L.marker([bunkCoords.latitude, bunkCoords.longitude], { icon: bunkIcon })
        .bindPopup(`<b>${bunkCoords.name || "Selected Petrol Bunk"}</b><br/>${bunkCoords.address || "Real location"}`)
        .addTo(markersGroup.current);
    } else if (bunksList && bunksList.length > 0) {
      // List of all nearby bunks (ordering stage)
      bunksList.forEach((bunk) => {
        if (bunk.latitude && bunk.longitude) {
          const bunkIcon = createCustomIcon('⛽', '#10b981', bunk.name ? bunk.name.substring(0, 12) + '...' : 'Bunk');
          L.marker([bunk.latitude, bunk.longitude], { icon: bunkIcon })
            .bindPopup(`<b>${bunk.name}</b><br/>${bunk.distance ? bunk.distance.toFixed(2) + ' km away' : ''}<br/>${bunk.address || ''}`)
            .addTo(markersGroup.current);
        }
      });
    }

    // 8. Draw Delivery Partner Marker
    if (partnerCoords && partnerCoords.latitude && partnerCoords.longitude) {
      const partnerIcon = createCustomIcon('🚚', '#ef4444', 'Partner');
      L.marker([partnerCoords.latitude, partnerCoords.longitude], { icon: partnerIcon })
        .bindPopup('<b>Delivery Partner Location</b><br/>Arriving soon!')
        .addTo(markersGroup.current);
    }

    // 9. Auto Adjust Map Zoom & Center Bounds
    const layers = markersGroup.current.getLayers();
    if (layers.length > 0) {
      if (layers.length === 1 && customerCoords && customerCoords.latitude && customerCoords.longitude) {
        map.setView([customerCoords.latitude, customerCoords.longitude], 17);
      } else {
        const group = new L.FeatureGroup(layers);
        map.fitBounds(group.getBounds().pad(0.2));
      }
    }
  }, [customerCoords, bunkCoords, partnerCoords, bunksList, mapType]);

  // Inject pulse keyframes for markers into the document
  useEffect(() => {
    const styleId = "leaflet-marker-pulse-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); box-shadow: 0 4px 15px rgba(245, 175, 25, 0.4); }
          100% { transform: scale(1); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: height }}>
      {/* Map Target */}
      <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "12px", border: "1px solid var(--border-color)", zIndex: 1 }} />
      
      {/* Layer Toggle overlay button */}
      <div style={{ 
        position: "absolute", 
        top: "10px", 
        right: "10px", 
        zIndex: 1000, 
        display: "flex", 
        gap: "6px" 
      }}>
        <button
          type="button"
          onClick={() => setMapType && setMapType("street")}
          style={{
            padding: "6px 12px",
            fontSize: "11px",
            borderRadius: "6px",
            cursor: "pointer",
            background: mapType === "street" ? "var(--primary)" : "rgba(0,0,0,0.7)",
            color: mapType === "street" ? "#000" : "#fff",
            border: "1px solid var(--border-color)",
            fontWeight: "bold"
          }}
        >
          Street
        </button>
        <button
          type="button"
          onClick={() => setMapType && setMapType("satellite")}
          style={{
            padding: "6px 12px",
            fontSize: "11px",
            borderRadius: "6px",
            cursor: "pointer",
            background: mapType === "satellite" ? "var(--primary)" : "rgba(0,0,0,0.7)",
            color: mapType === "satellite" ? "#000" : "#fff",
            border: "1px solid var(--border-color)",
            fontWeight: "bold"
          }}
        >
          Satellite
        </button>
      </div>
    </div>
  );
}

export default MapComponent;

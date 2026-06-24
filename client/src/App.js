import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";
import PartnerLogin from "./pages/PartnerLogin";
import PartnerRegister from "./pages/PartnerRegister";
import AdminLogin from "./pages/AdminLogin";
import CustomerDashboard from "./pages/CustomerDashboard";
import PartnerDashboard from "./pages/PartnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AccessDenied from "./pages/AccessDenied";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        
        {/* Customer Auth */}
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />
        
        {/* Partner Auth */}
        <Route path="/partner/login" element={<PartnerLogin />} />
        <Route path="/partner/register" element={<PartnerRegister />} />
        
        {/* Admin Auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Customer Routes */}
        <Route 
          path="/customer/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Partner Routes */}
        <Route 
          path="/partner/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["partner"]}>
              <PartnerDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Protected Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback Access Denied */}
        <Route path="/access-denied" element={<AccessDenied />} />
        
        {/* Catch-all redirects to home */}
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import ProtectedRoute from "../components/ProtectedRoute";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import EmailConfirm from "./pages/email_confirm";
import UpdatePassword from "./pages/update_password";
import ManageVets from "./pages/Admins/ManageVets";
import AdminDashboard from "./pages/Admins/AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";
import VetsDashboard from "./pages/Vets/VetsDashboard";
import AyDroitDashboard from "./pages/AyDroit/AyDroitDashboard";
import NotValidatedYet from "./pages/NotValidatedYet";

// Define UserRole enum to avoid magic strings
export const UserRole = {
  Adminis: "Administrateur",
  Vet: "Vétérinaire",
  AyDroit: "Ayant droit",
} as const;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/email_confirm" element={<EmailConfirm />} />
        <Route path="/notvalidatedyet" element={<NotValidatedYet />} />
        <Route path="/update_password" element={<UpdatePassword />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={[UserRole.AyDroit, UserRole.Adminis, UserRole.Vet]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admindashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Adminis]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/managevets"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Adminis]}>
              <ManageVets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vetsdashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Adminis, UserRole.Vet]}>
              <VetsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aydroitdashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Adminis, UserRole.AyDroit]}>
              <AyDroitDashboard />
            </ProtectedRoute>
          }
        />
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

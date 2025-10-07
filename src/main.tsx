import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Login />} />
        <Route path="" element={<Welcome />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

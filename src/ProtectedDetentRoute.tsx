import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedDetentRoute({
  children,
}: {
  children: React.ReactElement;
}) {
  const isAuthenticated = sessionStorage.getItem("detent_animal_id");
  if (!isAuthenticated) {
    return <Navigate to="/detent/login" replace />;
  }
  return children;
}

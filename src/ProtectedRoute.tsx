import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "./hooks/useAuth";
import { authState } from "./api/auth-state";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // You can show a loading spinner here
    return (
      <div className="flex justify-center items-center p-4 w-screen">
        Chargement...
      </div>
    );
  }

  if (!user) {
    // User not logged in, redirect to login page
    // UNLESS a manual logout is in progress.
    // If logging out, allow navigation to the public homepage.
    if (authState.isLoggingOut) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    // User does not have the required role, redirect to a "not authorized" page or dashboard
    return <Navigate to="/" replace />;
  }

  return children;
}

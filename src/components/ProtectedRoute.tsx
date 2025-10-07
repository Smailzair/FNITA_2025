import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "../supabaseClient";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuth(!!data.session);
    };
    checkAuth();
  }, []);

  if (isAuth === null) return <p>Loading...</p>;
  if (!isAuth) return <Navigate to="/login" />;
  return <>{children}</>;
}

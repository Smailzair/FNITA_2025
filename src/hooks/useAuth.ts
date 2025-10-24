import { useState, useEffect } from "react";
import { supabase } from "../api/supabaseClient";
import type { User } from "@supabase/supabase-js";

// Use the UserRole export from main.tsx to keep it consistent
import { UserRole as AppUserRole } from "../main";

export type UserRole = (typeof AppUserRole)[keyof typeof AppUserRole] | null;

interface AuthInfo {
  user: User | null;
  role: UserRole;
  loading: boolean;
}

export function useAuth(): AuthInfo {
  const [authInfo, setAuthInfo] = useState<AuthInfo>({
    user: null,
    role: null,
    loading: true,
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      let userRole: UserRole = null;
      if (session?.user) {
        // If there's a user, fetch their role from user_metadata
        // This is more efficient than a separate DB query.
        // Ensure you add 'type' to user_metadata when signing up.
        const type = session.user.user_metadata?.type;
        if (type) {
          userRole = type as UserRole;
        } else {
          // Fallback to query if not in metadata
          const { data: profile } = await supabase
            .from("tb_login")
            .select("type")
            .eq("id", session.user.id)
            .single();
          userRole = profile?.type as UserRole;
        }
      }

      setAuthInfo({
        user: session?.user ?? null,
        role: userRole,
        loading: false, // Always set loading to false after check
      });
    });

    // Also check the initial session, in case the auth state change event
    // doesn't fire on page load.
    const checkInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setAuthInfo({ user: null, role: null, loading: false });
      }
      // onAuthStateChange will handle the case where a session exists
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return authInfo;
}

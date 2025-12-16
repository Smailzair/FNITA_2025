import { authState } from "../api/auth-state";
import { supabase } from "../api/supabaseClient";
import { useIdleTimer } from "../hooks/useIdleTimer";

const IdleTimer = () => {
  const handleIdle = () => {
    // Clear the activity timestamp when the user is logged out.
    localStorage.removeItem("lastActivityTime");

    // Implement your logout logic here.
    console.log("User has been idle for 15 minutes. Locking session.");

    // window.location.href = '/login'; // Example redirect
    handleLogout();
  };

  // Set the idle time to 15 minutes (15 * 60 * 1000 milliseconds)
  useIdleTimer(handleIdle, 15 * 60 * 1000);

  return null; // This component does not render anything
};

const handleLogout = async () => {
  authState.isLoggingOut = true;
  await supabase.auth.signOut();
  window.location.href = "/login";
};

export default IdleTimer;

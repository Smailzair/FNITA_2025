import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) navigate("/login");
      else {
        const email = data.session.user.email;
        if (email !== undefined) {
          setEmail(email);
        }
      }
    };
    getSession();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!email) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Welcome, {email}</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

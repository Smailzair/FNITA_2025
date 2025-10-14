import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";

export default function Confirm() {
  const [message, setMessage] = useState("Confirming...");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return setMessage("Invalid link");

    supabase
      .from("tb_login")
      .update({ confirmed: true })
      .eq("id", id)
      .then(({ error }) => {
        if (error) setMessage("Error confirming email.");
        else setMessage("Your account has been confirmed!");
      });
  }, []);

  return <h3>{message}</h3>;
}

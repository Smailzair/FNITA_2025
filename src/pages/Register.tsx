import { useState } from "react";
import { supabase } from "../api/supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function Register() {
  const [email, setEmail] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const token = uuidv4(); // secure random token
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h validity

    const { data, error } = await supabase
      .from("tb_login")
      .insert([
        { email: email, fam_nme: familyName, nme: name, pass: password, confirmed: false, confirm_token: token, confirm_expires: expires }
      ])
      .select("id")
      .maybeSingle();

    if (error) {
      alert("Registration failed: " + error.message);
      return;
    }

    const userId = data?.id;
    const mailRes = await fetch("https://fnita.com/send-mail.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, familyName, name, userId, token }),
    });
    const mailJson = await mailRes.json();

    if (!mailJson.success) {
      console.log(mailJson);
      alert("Erreur lors de l'envoi de l'email: " + (mailJson.message || "Unknown error"));
      return;
    }

    alert("Enregistrement réussi! Veuillez vérifier votre email pour confirmer votre compte.");
  }

  return (
    <form onSubmit={handleRegister}>
      <input placeholder="Family Name" value={familyName} onChange={(e) => setFamilyName(e.target.value)} />
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Register</button>
    </form>
  );
}

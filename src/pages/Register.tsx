import { useState } from "react";
import { supabase } from "../api/supabaseClient";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("tb_login")
        .insert([{ ...form, confirmed: false }])
        .select("id")
        .single();

      if (error) throw error;

      await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTION_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          userId: data.id,
        }),
      });

      setMessage("Check your email to confirm registration.");
    } catch (err) {
      console.error(err);
      setMessage("Error during registration.");
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input name="nme" placeholder="nme" onChange={handleChange} />
        <input
          name="email"
          placeholder="Email"
          type="email"
          onChange={handleChange}
        />
        <input
          name="pass"
          placeholder="Password"
          type="pass"
          onChange={handleChange}
        />
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

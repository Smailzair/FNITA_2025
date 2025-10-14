// File: send-confirm-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Read data from frontend
  const { email, name, userId } = await req.json();

  // Create Supabase service client
  const supabase = createClient(
    Deno.env.get("VITE_SUPABASE_URL")!,
    Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY")! // not anon key!
  );

  // Generate confirmation link
  const confirmLink = `https://fnita.com/confirm?id=${userId}`;

  // Send email via Resend (you can replace with any email API)
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FNITA <noreply@fnita.com>",
      to: email,
      subject: "Confirm your registration",
      html: `
        <h2>Welcome, ${name}!</h2>
        <p>Click below to confirm your email:</p>
        <a href="${confirmLink}" target="_blank">Confirm Email</a>
      `,
    }),
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Email sent successfully" }), {
    headers: { "Content-Type": "application/json" },
  });
});

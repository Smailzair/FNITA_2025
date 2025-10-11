import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/dotenv/load.ts";

serve(async (req) => {
  const { email, name, userId } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const confirmLink = `https://fnita.com/confirm?id=${userId}`;

  // Use Resend or similar free email API
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "FNITA <noreply@fnita.com>",
      to: email,
      subject: "Confirmation d'inscription",
      html: `
        <h2>Bienvenue, ${name}!</h2>
        <p>Veuillez confirmer votre inscription :</p>
        <a href="${confirmLink}">Confirmer l'email</a>
      `,
    }),
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

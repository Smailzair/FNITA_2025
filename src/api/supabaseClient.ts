import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function emailExists(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .schema("public")
    .from("tb_login")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Error checking email:", error);
    return false;
  }

  return !!data;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .schema("public")
    .from("tb_login")
    .select("*") // or specify fields: "id, name, email, role"
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Error loading user by email:", error);
    return null;
  }

  return data; // will be null if not found
}

export async function sendPasswordResetEmail(email: string) {
  if (email === "") return;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // CRUCIAL: This is the URL where the user will land after clicking the link in the email.
    // It should point to a page in your app that handles the actual password change form.
    redirectTo:
      "https://fnita.com/update_password?token_hash={token}&type=recovery",
  });

  if (error) {
    console.error("Password reset failed:", error.message);
    alert(
      "Erreur de renitialisation de mot de passe. Veuillez essayer plus tard."
    );
  } else {
    alert(
      "Un lien de renitialisation de mot de passe a été envoyé à votre email."
    );
  }
}

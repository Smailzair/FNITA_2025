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
  if (!email) {
    return { success: false, message: "Veuillez saisir une adresse e-mail." };
  }

  // NOTE: We do not specify a redirectTo parameter here.
  // Supabase will use the link structure defined in your email template.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/update_password`,
  });

  if (error) {
    console.error("Password reset request error:", error);

    // AuthError 429 is for rate limiting
    if (error.status === 429) {
      return {
        success: false,
        message: "Trop de tentatives. \nVeuillez réessayer dans une minute.",
      };
    }

    // For general errors (e.g., email not found), it's best practice
    // to return a non-specific message for security.
    return {
      success: false,
      message:
        "Une erreur est survenue \nlors de l'envoi de l'e-mail. \nVeuillez vérifier l'adresse.",
    };
  }

  // The call was successful, meaning the request was accepted and the email is being sent.
  return {
    success: true,
    message:
      "Un lien de réinitialisation du \nmot de passe a été envoyé \nà votre adresse e-mail.",
  };
}

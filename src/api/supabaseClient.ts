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

// export async function sendPasswordResetEmail(email: string) {
//   if (email === "") return;
//   const { error } = await supabase.auth.resetPasswordForEmail(email, {
//     redirectTo:
//       // "http://localhost:5173/update-password", // Example redirect URL for local dev
//       "https://fnita.com/update_password", // Example for production
//   });

//   if (error) {
//     console.error("Password reset failed:", error.message);
//     alert(
//       "Erreur de renitialisation de mot de passe. Veuillez essayer plus tard."
//     );
//   } else {
//     alert(
//       "Un lien de renitialisation de mot de passe a été envoyé à votre email."
//     );
//   }
// }

// export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; message: string }> {

//   if (!email) {
//     return { success: false, message: "Veuillez saisir une adresse e-mail." };
//   }

//   // NOTE: We do not specify a redirectTo parameter here. 
//   // Supabase will use the link structure defined in your email template.
//   const { error } = await supabase.auth.resetPasswordForEmail(email, {
//     redirectTo:
//       // "http://localhost:5173/update-password", // Example redirect URL for local dev
//       "https://fnita.com/update_password", // Example for production
//   });

//   if (error) {
//     console.error('Password reset request error:', error);

//     // AuthError 429 is for rate limiting
//     if (error.status === 429) {
//       return {
//         success: false,
//         message: "Trop de tentatives. Veuillez réessayer dans une minute."
//       };
//     }

//     // For general errors (e.g., email not found), it's best practice 
//     // to return a non-specific message for security.
//     return {
//       success: false,
//       message: "Une erreur est survenue lors de l'envoi de l'e-mail. Veuillez vérifier l'adresse."
//     };
//   }

//   // The call was successful, meaning the request was accepted and the email is being sent.
//   return {
//     success: true,
//     message: "Un lien de réinitialisation du mot de passe a été envoyé à votre adresse e-mail."
//   };
// }


export async function sendPasswordResetEmail(email: string) {

  if (!email) {
    return { success: false, message: "Veuillez saisir une adresse e-mail." };
  }

  // NOTE: We do not specify a redirectTo parameter here. 
  // Supabase will use the link structure defined in your email template.
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);

  console.log("Resert data --- > ", data);

  if (error) {
    console.error('Password reset request error:', error);

    // AuthError 429 is for rate limiting
    if (error.status === 429) {
      return {
        success: false,
        message: "Trop de tentatives. \nVeuillez réessayer dans une minute."
      };
    }

    // For general errors (e.g., email not found), it's best practice 
    // to return a non-specific message for security.
    return {
      success: false,
      message: "Une erreur est survenue \nlors de l'envoi de l'e-mail. \nVeuillez vérifier l'adresse."
    };
  }

  // The call was successful, meaning the request was accepted and the email is being sent.
  return {
    success: true,
    message: "Un lien de réinitialisation du \nmot de passe a été envoyé \nà votre adresse e-mail."
  };
}
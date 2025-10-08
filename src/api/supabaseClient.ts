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

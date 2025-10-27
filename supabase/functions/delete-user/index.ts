import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    // Initialize Supabase client with service_role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Optional: Verify the calling user is an admin (by checking their JWT)
    // const authHeader = req.headers.get('Authorization');
    // if (!authHeader) {
    //   return new Response(JSON.stringify({ error: 'Unauthorized: No Authorization header' }), {
    //     headers: { 'Content-Type': 'application/json' },
    //     status: 401,
    //   });
    // }
    // const token = authHeader.split(' ')[1];
    // const { data: { user: adminUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    // if (authError || !adminUser || adminUser.app_metadata.user_role !== 'admin') { // Assuming you have a custom 'user_role' in app_metadata
    //   return new Response(JSON.stringify({ error: 'Unauthorized: Not an admin' }), {
    //     headers: { 'Content-Type': 'application/json' },
    //     status: 403,
    //   });
    // }

    // Delete user using admin client
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Error deleting user:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({ message: "User deleted successfully" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

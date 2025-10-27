// supabase/functions/update-user-email/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // This is needed if you're planning to invoke your function from a browser.
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { userId, newEmail } = await req.json();

        if (!userId || !newEmail) {
            return new Response(JSON.stringify({ error: 'User ID and new email are required.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // Create an admin client to update the user.
        // Ensure you have set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your project's secrets.
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // This will trigger the email change confirmation flow.
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: newEmail,
        });

        if (error) {
            throw error;
        }

        return new Response(JSON.stringify({ message: 'Email change initiated successfully.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

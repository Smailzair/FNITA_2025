// supabase/functions/delete-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { userId } = await req.json();

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID is required.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // First, delete from auth.users
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            throw authError;
        }

        // Then, delete from tb_login (assuming RLS is bypassed by service_role key)
        // This is important for data consistency if tb_login is not automatically cascaded by auth.users delete.
        const { error: dbError } = await supabaseAdmin.from('tb_login').delete().eq('id', userId);
        if (dbError) {
            // Log this error as a partial failure, but the auth user is already gone.
            console.error(`Error deleting user ${userId} from tb_login after auth delete:`, dbError);
            // You might want to throw here or handle it differently based on your application's needs.
            // For now, we'll let it pass if auth user is deleted, but log the DB error.
        }

        return new Response(JSON.stringify({ message: 'User deleted successfully.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
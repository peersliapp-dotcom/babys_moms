import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden — admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Resend API key not configured. Add RESEND_API_KEY as an edge function secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get store email from site_settings for the "from" address
    const { data: settings } = await supabase
      .from("site_settings")
      .select("email, site_name")
      .maybeSingle();

    const fromName = settings?.site_name || "Baby's and Mom's Clothing";
    const fromEmail = settings?.email || "onboarding@resend.dev";

    const body: SendEmailRequest = await req.json();

    if (!body.to || !body.subject || !body.html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipients = Array.isArray(body.to) ? body.to : [body.to];

    // If broadcast (more than 10 recipients), send via batch
    const sendPayload = {
      from: `${fromName} <${fromEmail}>`,
      to: recipients,
      subject: body.subject,
      html: body.html,
      ...(body.replyTo ? { reply_to: body.replyTo } : {}),
    };

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendPayload),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      return new Response(
        JSON.stringify({ error: `Resend API error: ${errorText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, data: result, sentTo: recipients.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

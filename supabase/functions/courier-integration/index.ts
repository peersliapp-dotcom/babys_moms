import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, provider, order_data, tracking_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get courier settings from site_settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("pathao_api_key, steadfast_api_key, courier_provider")
      .single();

    if (action === "create_shipment") {
      const courierProvider = provider ?? settings?.courier_provider ?? "manual";

      if (courierProvider === "pathao") {
        // Pathao API integration
        const apiKey = settings?.pathao_api_key;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Pathao API key not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create Pathao shipment
        const pathaoResponse = await fetch("https://api.pathao.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            store_id: order_data.store_id,
            merchant_order_id: order_data.order_number,
            sender_name: order_data.sender_name,
            sender_phone: order_data.sender_phone,
            recipient_name: order_data.recipient_name,
            recipient_phone: order_data.recipient_phone,
            recipient_address: order_data.recipient_address,
            recipient_city: order_data.recipient_city,
            recipient_zone: order_data.recipient_zone,
            recipient_area: order_data.recipient_area,
            delivery_type: 48, // Standard delivery
            item_type: 2, // Parcel
            item_quantity: order_data.item_quantity,
            item_weight: order_data.item_weight ?? 0.5,
            amount_to_collect: order_data.amount_to_collect,
            item_description: order_data.item_description,
          }),
        });

        const pathaoData = await pathaoResponse.json();

        if (pathaoResponse.ok) {
          // Update order with courier info
          await supabase
            .from("orders")
            .update({
              courier_name: "Pathao",
              courier_consignment_id: pathaoData.consignment_id?.toString(),
              courier_tracking_id: pathaoData.tracking_code,
              courier_status: "created",
            })
            .eq("id", order_data.order_id);

          return new Response(
            JSON.stringify({ success: true, tracking_id: pathaoData.tracking_code, consignment_id: pathaoData.consignment_id }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: pathaoData.message ?? "Pathao API error" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (courierProvider === "steadfast") {
        // Steadfast API integration
        const apiKey = settings?.steadfast_api_key;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Steadfast API key not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const steadfastResponse = await fetch("https://portal.steadfast.com.bd/api/v1/create_order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            order_id: order_data.order_number,
            recipient_name: order_data.recipient_name,
            recipient_phone: order_data.recipient_phone,
            recipient_address: order_data.recipient_address,
            destination: order_data.recipient_city,
            amount: order_data.amount_to_collect,
            note: order_data.item_description ?? "",
          }),
        });

        const steadfastData = await steadfastResponse.json();

        if (steadfastResponse.ok) {
          await supabase
            .from("orders")
            .update({
              courier_name: "Steadfast",
              courier_consignment_id: steadfastData.consignment_id?.toString(),
              courier_tracking_id: steadfastData.tracking_code,
              courier_status: "created",
            })
            .eq("id", order_data.order_id);

          return new Response(
            JSON.stringify({ success: true, tracking_id: steadfastData.tracking_code, consignment_id: steadfastData.consignment_id }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: steadfastData.message ?? "Steadfast API error" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Manual courier - just store tracking info
        return new Response(
          JSON.stringify({ success: true, message: "Manual courier - enter tracking info manually" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (action === "track_shipment") {
      const courierProvider = provider ?? settings?.courier_provider ?? "manual";

      if (courierProvider === "pathao") {
        const apiKey = settings?.pathao_api_key;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Pathao API key not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const trackResponse = await fetch(`https://api.pathao.com/v1/orders/${tracking_id}/status`, {
          headers: { "Authorization": `Bearer ${apiKey}` },
        });
        const trackData = await trackResponse.json();

        if (trackResponse.ok) {
          // Update order status
          await supabase
            .from("orders")
            .update({ courier_status: trackData.status })
            .eq("courier_tracking_id", tracking_id);

          return new Response(
            JSON.stringify({ success: true, status: trackData.status, details: trackData }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: trackData.message ?? "Tracking failed" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (courierProvider === "steadfast") {
        const apiKey = settings?.steadfast_api_key;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "Steadfast API key not configured" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const trackResponse = await fetch(`https://portal.steadfast.com.bd/api/v1/track/${tracking_id}`, {
          headers: { "Authorization": `Bearer ${apiKey}` },
        });
        const trackData = await trackResponse.json();

        if (trackResponse.ok) {
          await supabase
            .from("orders")
            .update({ courier_status: trackData.status })
            .eq("courier_tracking_id", tracking_id);

          return new Response(
            JSON.stringify({ success: true, status: trackData.status, details: trackData }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: trackData.message ?? "Tracking failed" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: "Manual courier - no automatic tracking available" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

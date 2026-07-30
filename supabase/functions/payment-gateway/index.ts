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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, order_id, payment_method, amount, order_number, customer_info, tran_id, status } = await req.json();

    // Get payment settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("sslcommerz_store_id, sslcommerz_store_password, bkash_app_key, bkash_app_secret, bkash_username, bkash_password, nagad_merchant_id, nagad_api_key, payment_mode")
      .single();

    const mode = settings?.payment_mode ?? "sandbox";

    if (action === "create_payment") {
      // Create a payment session for the order
      const orderId = order_id;
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (payment_method === "bkash") {
        // bKash payment creation
        const bkashTokenUrl = mode === "sandbox"
          ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant"
          : "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant";

        const bkashCreateUrl = mode === "sandbox"
          ? "https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create"
          : "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/create";

        // Get token
        const tokenRes = await fetch(bkashTokenUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "username": settings?.bkash_username ?? "",
            "password": settings?.bkash_password ?? "",
          },
          body: JSON.stringify({
            app_key: settings?.bkash_app_key ?? "",
            app_secret: settings?.bkash_app_secret ?? "",
          }),
        });
        const tokenData = await tokenRes.json();

        if (!tokenData.id_token) {
          return new Response(JSON.stringify({ error: "Failed to authenticate with bKash" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create payment
        const callbackUrl = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "")}/functions/v1/payment-gateway`;
        const createRes = await fetch(bkashCreateUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": tokenData.id_token,
            "X-APP-Key": settings?.bkash_app_key ?? "",
          },
          body: JSON.stringify({
            mode: "0011",
            payerReference: customer_info?.phone ?? " ",
            callback_url: `${callbackUrl}?action=callback&method=bkash&order=${order.order_number}`,
            amount: String(amount),
            currency: "BDT",
            intent: "sale",
            merchantInvoiceNumber: order.order_number,
          }),
        });
        const createData = await createRes.json();

        if (createData.bkashURL) {
          // Update order with transaction ID
          await supabase
            .from("orders")
            .update({
              payment_gateway: "bkash",
              payment_gateway_tran_id: createData.paymentID,
              payment_status: "pending",
            })
            .eq("id", orderId);

          return new Response(JSON.stringify({ success: true, payment_url: createData.bkashURL, tran_id: createData.paymentID }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({ error: createData.statusMessage ?? "bKash payment creation failed" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else if (payment_method === "nagad") {
        // Nagad payment creation
        const nagadUrl = mode === "sandbox"
          ? "https://sandbox-ssl.mynagad.com/api/dfs/check-out"
          : "https://ssl.mynagad.com/api/dfs/check-out";

        const merchantId = settings?.nagad_merchant_id ?? "";
        const orderIdNagad = order.order_number;
        const callbackUrl = `${callbackUrl}?action=callback&method=nagad&order=${order.order_number}`;

        // Nagad requires a specific encryption flow — this is a simplified version
        // In production, you'd need to encrypt the sensitive data with Nagad's public key
        const nagadRes = await fetch(nagadUrl + "/" + merchantId + "/" + orderIdNagad, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountNumber: customer_info?.phone,
            dateTime: new Date().toISOString(),
            sensitiveData: "",
            signature: "",
          }),
        });
        const nagadData = await nagadRes.json();

        if (nagadData.callBackUrl) {
          await supabase
            .from("orders")
            .update({
              payment_gateway: "nagad",
              payment_gateway_tran_id: nagadData.paymentReferenceId,
              payment_status: "pending",
            })
            .eq("id", orderId);

          return new Response(JSON.stringify({ success: true, payment_url: nagadData.callBackUrl, tran_id: nagadData.paymentReferenceId }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({ error: nagadData.message ?? "Nagad payment creation failed" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else if (payment_method === "card") {
        // SSLCommerz for card payments
        const sslczUrl = mode === "sandbox"
          ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
          : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

        const formData = new URLSearchParams();
        formData.append("store_id", settings?.sslcommerz_store_id ?? "");
        formData.append("store_passwd", settings?.sslcommerz_store_password ?? "");
        formData.append("total_amount", String(amount));
        formData.append("currency", "BDT");
        formData.append("tran_id", order.order_number);
        formData.append("success_url", `${callbackUrl}?action=success&method=sslcz&order=${order.order_number}`);
        formData.append("fail_url", `${callbackUrl}?action=fail&method=sslcz&order=${order.order_number}`);
        formData.append("cancel_url", `${callbackUrl}?action=cancel&method=sslcz&order=${order.order_number}`);
        formData.append("cus_name", customer_info?.full_name ?? "Customer");
        formData.append("cus_email", customer_info?.email ?? "noreply@example.com");
        formData.append("cus_phone", customer_info?.phone ?? "");
        formData.append("cus_add1", customer_info?.address ?? "");
        formData.append("cus_city", customer_info?.city ?? "");
        formData.append("cus_country", "Bangladesh");
        formData.append("product_name", "Baby & Mom Products");
        formData.append("product_category", "Clothing");
        formData.append("product_profile", "general");
        formData.append("ship_name", customer_info?.full_name ?? "Customer");
        formData.append("ship_add1", customer_info?.address ?? "");
        formData.append("ship_city", customer_info?.city ?? "");
        formData.append("ship_country", "Bangladesh");
        formData.append("shipping_method", "YES");

        const sslczRes = await fetch(sslczUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        });
        const sslczData = await sslczRes.json();

        if (sslczData.status === "SUCCESS" && sslczData.GatewayPageURL) {
          await supabase
            .from("orders")
            .update({
              payment_gateway: "sslcommerz",
              payment_gateway_tran_id: order.order_number,
              payment_gateway_url: sslczData.GatewayPageURL,
              payment_status: "pending",
            })
            .eq("id", orderId);

          return new Response(JSON.stringify({ success: true, payment_url: sslczData.GatewayPageURL, tran_id: order.order_number }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({ error: sslczData.failedreason ?? "SSLCommerz payment creation failed" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ error: "Invalid payment method" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "verify_payment") {
      // Verify a payment after callback
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", order_number)
        .single();

      if (!order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (status === "success") {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            payment_verified: true,
            status: "processing",
          })
          .eq("id", order.id);

        return new Response(JSON.stringify({ success: true, payment_status: "paid" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            payment_verified: false,
          })
          .eq("id", order.id);

        return new Response(JSON.stringify({ success: false, payment_status: "failed" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (action === "callback") {
      // Handle payment gateway callback (GET redirect from gateway)
      const url = new URL(req.url);
      const callbackStatus = url.searchParams.get("status") ?? status;
      const orderNum = url.searchParams.get("order") ?? order_number;
      const method = url.searchParams.get("method") ?? "";

      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNum)
        .single();

      if (!order) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (callbackStatus === "success" || status === "success") {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            payment_verified: true,
            status: "processing",
          })
          .eq("id", order.id);

        // Redirect to order confirmation page
        const redirectUrl = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "")}/order-confirmation/${orderNum}?payment=success`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, "Location": redirectUrl },
        });
      } else {
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", order.id);

        const redirectUrl = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "")}/order-confirmation/${orderNum}?payment=failed`;
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, "Location": redirectUrl },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

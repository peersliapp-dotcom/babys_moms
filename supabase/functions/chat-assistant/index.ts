import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Knowledge base for the store — used to answer common questions
const STORE_KB = {
  name: "Baby's & Mom's Clothing",
  shipping: "We offer free shipping on orders over 2000 BDT. Standard delivery takes 2-5 business days within Bangladesh.",
  returns: "You can return any item within 7 days of delivery, provided it's unworn and in original packaging with tags.",
  payment: "We accept bKash, Nagad, SSLCommerz (card), and Cash on Delivery (COD). COD orders are verified via phone call before dispatch.",
  sizing: "We have a detailed size guide available on each product page. If you're unsure, feel free to ask us!",
  cod: "Yes, Cash on Delivery is available nationwide. A verification call will be made to confirm your order before dispatch.",
  contact: "You can reach us via the Contact page, or chat with us right here! Our team responds during business hours (9 AM - 8 PM).",
  hours: "Our customer service team is available Saturday to Thursday, 9 AM to 8 PM.",
  exchange: "Exchanges are available within 7 days for different sizes or colors, subject to stock availability.",
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

    const { action, conversation_id, message, guest_id, guest_name, guest_email, user_id } = await req.json();

    if (action === "start_conversation") {
      const convData: Record<string, unknown> = {
        status: "active",
        last_message_at: new Date().toISOString(),
      };
      if (user_id) convData.user_id = user_id;
      if (guest_id) convData.guest_id = guest_id;
      if (guest_name) convData.guest_name = guest_name;
      if (guest_email) convData.guest_email = guest_email;

      const { data: conv, error: convError } = await supabase
        .from("chat_conversations")
        .insert(convData)
        .select()
        .single();

      if (convError) {
        return new Response(JSON.stringify({ error: convError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Send welcome message
      const welcome = `Hello! Welcome to ${STORE_KB.name}! How can I help you today? You can ask me about products, shipping, returns, payment methods, or sizing.`;
      await supabase.from("chat_messages").insert({
        conversation_id: conv.id,
        sender: "bot",
        content: welcome,
      });

      return new Response(JSON.stringify({ conversation: conv, welcome }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send_message") {
      // Save user message
      const { error: msgError } = await supabase.from("chat_messages").insert({
        conversation_id,
        sender: "user",
        content: message,
      });

      if (msgError) {
        return new Response(JSON.stringify({ error: msgError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update conversation timestamp
      await supabase.from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation_id);

      // Generate AI response based on keywords
      const lowerMsg = message.toLowerCase();
      let reply = "";

      if (lowerMsg.includes("shipping") || lowerMsg.includes("delivery") || lowerMsg.includes("deliver")) {
        reply = STORE_KB.shipping;
      } else if (lowerMsg.includes("return") || lowerMsg.includes("refund")) {
        reply = STORE_KB.returns;
      } else if (lowerMsg.includes("exchange") || lowerMsg.includes("swap")) {
        reply = STORE_KB.exchange;
      } else if (lowerMsg.includes("payment") || lowerMsg.includes("pay") || lowerMsg.includes("bkash") || lowerMsg.includes("nagad")) {
        reply = STORE_KB.payment;
      } else if (lowerMsg.includes("cod") || lowerMsg.includes("cash on delivery")) {
        reply = STORE_KB.cod;
      } else if (lowerMsg.includes("size") || lowerMsg.includes("sizing") || lowerMsg.includes("fit")) {
        reply = STORE_KB.sizing;
      } else if (lowerMsg.includes("contact") || lowerMsg.includes("reach") || lowerMsg.includes("phone") || lowerMsg.includes("email")) {
        reply = STORE_KB.contact;
      } else if (lowerMsg.includes("hour") || lowerMsg.includes("open") || lowerMsg.includes("time")) {
        reply = STORE_KB.hours;
      } else if (lowerMsg.includes("product") || lowerMsg.includes("item") || lowerMsg.includes("buy") || lowerMsg.includes("shop")) {
        reply = "You can browse our full collection on the Shop page. We have baby clothing, mom clothing, and accessories. Is there a specific product you're looking for?";
      } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi") || lowerMsg.includes("hey") || lowerMsg.includes("salam")) {
        reply = `Hello! Welcome to ${STORE_KB.name}. How can I assist you today?`;
      } else if (lowerMsg.includes("thank")) {
        reply = "You're welcome! Is there anything else I can help you with?";
      } else if (lowerMsg.includes("track") || lowerMsg.includes("order status")) {
        reply = "You can track your order in the My Account section if you're logged in. For guest orders, please share your order number and I'll look it up for you.";
      } else if (lowerMsg.includes("discount") || lowerMsg.includes("coupon") || lowerMsg.includes("offer")) {
        reply = "We regularly offer discounts and promotions! Check our homepage for current featured deals. You can also apply coupon codes at checkout for additional savings.";
      } else {
        // Try to find relevant products
        const { data: products } = await supabase
          .from("products")
          .select("name, slug, description")
          .ilike("name", `%${message.split(" ")[0]}%`)
          .limit(3);

        if (products && products.length > 0) {
          reply = `I found some products that might interest you: ${products.map((p) => p.name).join(", ")}. You can find them on our Shop page!`;
        } else {
          reply = "I'd be happy to help! Could you tell me more about what you're looking for? I can assist with products, shipping, returns, payment, sizing, or any other questions about our store.";
        }
      }

      // Save bot response
      await supabase.from("chat_messages").insert({
        conversation_id,
        sender: "bot",
        content: reply,
      });

      return new Response(JSON.stringify({ reply }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_messages") {
      const { data: messages, error: msgError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at", { ascending: true });

      if (msgError) {
        return new Response(JSON.stringify({ error: msgError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ messages }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "admin_reply") {
      // Admin sends a message to a conversation
      const { error: msgError } = await supabase.from("chat_messages").insert({
        conversation_id,
        sender: "admin",
        content: message,
      });

      if (msgError) {
        return new Response(JSON.stringify({ error: msgError.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation_id);

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

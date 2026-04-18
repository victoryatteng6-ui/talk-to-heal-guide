import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICE_NGN = 2500;
const PRICE_KOBO = PRICE_NGN * 100;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
    if (!reference || reference.length > 200) return json({ error: "Invalid reference" }, 400);

    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secret) return json({ error: "Server not configured" }, 500);

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
    const verifyJson = await verifyRes.json().catch(() => null);
    if (!verifyRes.ok || !verifyJson?.status) {
      return json({ error: "Verification failed" }, 400);
    }

    const tx = verifyJson.data;
    if (tx?.status !== "success") return json({ error: "Payment not successful" }, 400);
    if (Number(tx?.amount) < PRICE_KOBO) return json({ error: "Amount mismatch" }, 400);
    if (String(tx?.currency).toUpperCase() !== "NGN") return json({ error: "Currency mismatch" }, 400);

    // Idempotent insert by paystack_reference
    const { error: insertErr } = await supabase
      .from("premium_purchases")
      .insert({
        user_id: userId,
        amount: PRICE_NGN,
        currency: "NGN",
        status: "completed",
        paystack_reference: reference,
      });

    // Ignore unique violation (already processed)
    if (insertErr && !String(insertErr.message).toLowerCase().includes("duplicate")) {
      return json({ error: "Could not record purchase" }, 500);
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ premium_status: true, premium_since: new Date().toISOString() })
      .eq("user_id", userId);
    if (updateErr) return json({ error: "Could not update profile" }, 500);

    return json({ success: true });
  } catch (_e) {
    return json({ error: "Unexpected error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

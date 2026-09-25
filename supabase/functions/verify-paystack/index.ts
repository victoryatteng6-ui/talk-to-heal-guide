import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const PRICE_NGN = 2499;
const PRICE_KOBO = PRICE_NGN * 100;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
    if (!/^[A-Za-z0-9._-]{6,200}$/.test(reference)) return json({ error: "Invalid reference" }, 400);

    const secret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secret) return json({ error: "Server not configured" }, 500);

    // Admin client bypasses RLS for trusted server-side writes
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
    if (Number(tx?.amount) !== PRICE_KOBO) return json({ error: "Amount mismatch" }, 400);
    if (String(tx?.currency).toUpperCase() !== "NGN") return json({ error: "Currency mismatch" }, 400);
    if (String(tx?.reference ?? "") !== reference) return json({ error: "Reference mismatch" }, 400);

    // Check if this reference has already been claimed
    const { data: existing } = await adminClient
      .from("premium_purchases")
      .select("user_id")
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (existing) {
      if (existing.user_id !== userId) {
        return json({ error: "Reference already used" }, 409);
      }
      // Same user retrying — ensure premium is set, then succeed idempotently
    } else {
      const { error: insertErr } = await adminClient
        .from("premium_purchases")
        .insert({
          user_id: userId,
          amount: PRICE_NGN,
          currency: "NGN",
          status: "completed",
          paystack_reference: reference,
        });
      if (insertErr) {
        // Race: another insert won — re-check ownership
        const { data: race } = await adminClient
          .from("premium_purchases")
          .select("user_id")
          .eq("paystack_reference", reference)
          .maybeSingle();
        if (!race || race.user_id !== userId) {
          return json({ error: "Reference already used" }, 409);
        }
      }
    }

    const { error: updateErr } = await adminClient
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

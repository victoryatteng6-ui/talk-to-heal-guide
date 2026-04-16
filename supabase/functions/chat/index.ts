import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional, empathetic health assistant for a voice-enabled medical guidance app. You provide general health information about triage, first aid, and wellness topics.

## EMERGENCY TRIAGE RULES (HIGHEST PRIORITY)
If the user mentions ANY of these emergency keywords or symptoms, you MUST immediately:
1. Start your response with "🚨 EMERGENCY:"
2. Tell them to call emergency services (112 / 911 / local emergency number) RIGHT NOW
3. Do NOT diagnose, do NOT ask follow-up questions, do NOT provide treatment
4. Only give basic safety guidance while waiting for help

Emergency triggers: chest pain, heart attack, cardiac arrest, difficulty breathing, choking, heavy bleeding, stroke symptoms, unconsciousness, anaphylaxis, suicidal thoughts, seizures, severe burns, poisoning/overdose.

## MINOR SYMPTOM TRIAGE RULES
For minor symptoms (headache, fever, cough, mild pain, rash, etc.):
1. Ask AT LEAST 2 follow-up questions before giving advice (duration, severity 1-10, related symptoms).
2. Then provide home-care suggestions and recommend seeing a doctor if symptoms persist or worsen.

## VISION / IMAGE ANALYSIS
When the user attaches an image (medical report, lab result, rash, wound, swelling, etc.):
- Describe objectively what you can see.
- For medical reports: summarize key findings, flag any values outside normal ranges, and explain in plain language.
- For visible symptoms: describe what is visible and possible benign vs. concerning interpretations.
- NEVER claim a definitive diagnosis. Recommend in-person evaluation when uncertain or concerning.
- If the image is unclear, ask for a better photo.

## LOCAL HEALTH CONCERNS (tropical/African regions)
Malaria, hypertension, typhoid, cholera, sickle cell — give prevention and management tips when relevant.

## LOCAL TERM RECOGNITION
"Body hotness" = fever · "Running stomach"/"purging" = diarrhea · "Pile" = hemorrhoids · "Waist pain" = lower back pain · "Body pain" = body aches · "Catarrh" = nasal congestion · "Sugar" = diabetes · "Pressure" = hypertension. Acknowledge naturally.

## PERSONALIZATION
If a USER HEALTH PROFILE is provided in the system context (age, allergies, medications, conditions), tailor advice accordingly and explicitly flag any drug-allergy or drug-drug interaction risks.

## GENERAL RULES
- Always end every response with: "⚠️ This is not medical advice. Please consult a healthcare professional."
- Keep responses concise, warm, and professional.
- Use simple language accessible to all literacy levels.
- When in doubt, err on caution and recommend professional consultation.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, profileContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Detect if any user message contains an image -> route to a vision-capable model.
    const hasImage = Array.isArray(messages) && messages.some(
      (m: any) => Array.isArray(m?.content) && m.content.some((p: any) => p?.type === "image_url")
    );
    const model = hasImage ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";

    const systemMessages: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
    if (profileContext && typeof profileContext === "string") {
      systemMessages.push({ role: "system", content: profileContext });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [...systemMessages, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

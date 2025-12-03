import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // CORS preflight request handling
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/exotel-proxy", ""); // Remove the function path prefix

  try {
    // Get company_id from the request headers or body
    let companyId: string;
    
    if (req.method === "POST") {
      const body = await req.json();
      companyId = body.company_id;
    } else {
      // For GET requests, get company_id from query params
      companyId = url.searchParams.get("company_id") || "";
    }

    if (!companyId) {
      return new Response(JSON.stringify({ error: "Company ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Fetch company settings to get Exotel credentials
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('exotel_api_key, exotel_api_token, exotel_subdomain, exotel_account_sid')
      .eq('company_id', companyId)
      .single();

    if (settingsError || !settings) {
      console.error('Error fetching company settings:', settingsError);
      return new Response(JSON.stringify({ error: "Company settings not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (!settings.exotel_api_key || !settings.exotel_api_token || !settings.exotel_account_sid) {
      return new Response(JSON.stringify({ error: "Exotel credentials not configured" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Create Exotel API base URL and auth header
    const exotelSubdomain = settings.exotel_subdomain || "api.exotel.com";
    const EXOTEL_API_BASE_URL = `https://${exotelSubdomain}/v1/Accounts/${settings.exotel_account_sid}`;
    const EXOTEL_AUTH_HEADER = `Basic ${btoa(`${settings.exotel_api_key}:${settings.exotel_api_token}`)}`;

    let exotelResponse;
    if (req.method === "POST" && path === "/calls/connect") {
      const { from, to } = await req.json();

      // Normalize numbers to match the working curl format (strip non-digits and leading zeros)
      const normalizeNumber = (num: string) => {
        const digitsOnly = num.replace(/\D/g, "");
        return digitsOnly.replace(/^0+/, "");
      };

      const normalizedFrom = normalizeNumber(from);
      const normalizedTo = normalizeNumber(to);

      // Use a fixed CallerId as per Exotel configuration / working curl
      const FIXED_CALLER_ID = "073-146-26705";

      const body = new URLSearchParams({
        From: normalizedFrom,
        To: normalizedTo,
        CallerId: FIXED_CALLER_ID,
        Record: "true",
      });

      exotelResponse = await fetch(`${EXOTEL_API_BASE_URL}/Calls/connect.json`, {
        method: "POST",
        headers: {
          "Authorization": EXOTEL_AUTH_HEADER,
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: body.toString(),
      });
    } else if (req.method === "GET" && path.startsWith("/calls/")) {
      const callSid = path.split("/")[2]; // Extract call SID from path
      exotelResponse = await fetch(`${EXOTEL_API_BASE_URL}/Calls/${callSid}.json`, {
        method: "GET",
        headers: {
          "Authorization": EXOTEL_AUTH_HEADER,
          "Accept": "application/json",
        },
      });
    } else {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (!exotelResponse.ok) {
      const errorText = await exotelResponse.text();
      console.error(`Exotel API error: ${exotelResponse.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: `Exotel API error: ${exotelResponse.status} - ${errorText}` }), {
        status: exotelResponse.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const data = await exotelResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type ExotelConfig = {
  auth: string;
  baseUrl: string;
  callerId?: string | null;
};

async function getExotelConfig(companyId: string): Promise<ExotelConfig> {
  if (!companyId) {
    throw new Error("company_id is required");
  }

  const { data, error } = await supabase
    .from("company_settings")
    .select("exotel_api_key, exotel_api_token, exotel_account_sid, exotel_subdomain, caller_id")
    .eq("company_id", companyId)
    .single();

  if (error || !data) {
    throw new Error("Exotel settings not found for company");
  }

  const apiKey = data.exotel_api_key;
  const apiToken = data.exotel_api_token;
  const accountSid = data.exotel_account_sid || data.exotel_subdomain;

  if (!apiKey || !apiToken || !accountSid) {
    throw new Error("Incomplete Exotel credentials in company settings");
  }

  return {
    auth: `Basic ${btoa(`${apiKey}:${apiToken}`)}`,
    baseUrl: `https://api.exotel.com/v1/Accounts/${accountSid}`,
    callerId: data.caller_id,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // POST /exotel-proxy/calls/connect
    if (method === "POST" && path.endsWith("/calls/connect")) {
      const body = await req.json();
      const companyId = body.company_id;

      const exotelConfig = await getExotelConfig(companyId);

      if (!body.from || !body.to || !body.callerId) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: from, to, callerId",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      console.log("Initiating Exotel call:", {
        from: body.from,
        to: body.to,
        callerId: body.callerId,
        record: body.record,
      });

      const exotelResponse = await fetch(
        `${exotelConfig.baseUrl}/Calls/connect.json`,
        {
          method: "POST",
          headers: {
            Authorization: exotelConfig.auth,
            "Content-Type": "application/x-www-form-urlencoded",
            accept: "application/json",
          },
          body: new URLSearchParams({
            From: body.from,
            To: body.to,
            CallerId: body.callerId || exotelConfig.callerId || "",
            Record: body.record === false ? "false" : "true", // DEFAULT TRUE
          }),
        }
      );

      console.log("Exotel response status:", exotelResponse.status);

      if (!exotelResponse.ok) {
        const errorText = await exotelResponse.text();
        console.error("Exotel API error:", errorText);

        return new Response(
          JSON.stringify({
            error: `Exotel API error: ${exotelResponse.status} - ${errorText}`,
          }),
          {
            status: exotelResponse.status,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      const exotelData = await exotelResponse.json();
      console.log("Exotel call initiated successfully:", exotelData);

      return new Response(JSON.stringify(exotelData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // GET /exotel-proxy/calls/{callSid}
    if (method === "GET" && path.includes("/calls/")) {
      const callSid = path.split("/calls/")[1];
      const companyId = url.searchParams.get("company_id") || "";

      const exotelConfig = await getExotelConfig(companyId);

      if (!callSid) {
        return new Response(
          JSON.stringify({
            error: "Call SID is required",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      const exotelResponse = await fetch(
        `${exotelConfig.baseUrl}/Calls/${callSid}.json`,
        {
          method: "GET",
          headers: {
            Authorization: exotelConfig.auth,
            accept: "application/json",
          },
        }
      );

      if (!exotelResponse.ok) {
        const errorText = await exotelResponse.text();
        console.error("Exotel API error:", errorText);

        return new Response(
          JSON.stringify({
            error: `Exotel API error: ${exotelResponse.status} - ${errorText}`,
          }),
          {
            status: exotelResponse.status,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }

      const exotelData = await exotelResponse.json();
      return new Response(JSON.stringify(exotelData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // Default route
    return new Response(
      JSON.stringify({
        message: "Exotel Proxy API",
        endpoints: [
          "POST /calls/connect - Initiate a call",
          "GET /calls/{callSid} - Get call details",
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});

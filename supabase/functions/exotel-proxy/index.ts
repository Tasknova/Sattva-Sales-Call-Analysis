import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EXOTEL_AUTH =
  "Basic YTljZTA3ZmZlMGJmYWUwOTM2ZmM3NmE4YTYzZDFiNDc4YzgyZTQyMjQ5MGFmNTYxOjI4YmExNGRjNWFkYWFmYjI2NGM0ZTU3OGJhMDcyMjM0MDZhOTNiMTVhNDY0YzM2Ng==";
const EXOTEL_BASE_URL = "https://api.exotel.com/v1/Accounts/tasknova1";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // POST /exotel-proxy/calls/connect
    if (method === "POST" && path.endsWith("/calls/connect")) {
      const body = await req.json();

      if (!body.from || !body.to || !body.callerId) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: from, to, callerId",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
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
        `${EXOTEL_BASE_URL}/Calls/connect.json`,
        {
          method: "POST",
          headers: {
            Authorization: EXOTEL_AUTH,
            "Content-Type": "application/x-www-form-urlencoded",
            accept: "application/json",
          },
          body: new URLSearchParams({
            From: body.from,
            To: body.to,
            CallerId: body.callerId,
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
              "Access-Control-Allow-Origin": "*",
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
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // GET /exotel-proxy/calls/{callSid}
    if (method === "GET" && path.includes("/calls/")) {
      const callSid = path.split("/calls/")[1];

      if (!callSid) {
        return new Response(
          JSON.stringify({
            error: "Call SID is required",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const exotelResponse = await fetch(
        `${EXOTEL_BASE_URL}/Calls/${callSid}.json`,
        {
          method: "GET",
          headers: {
            Authorization: EXOTEL_AUTH,
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
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const exotelData = await exotelResponse.json();
      return new Response(JSON.stringify(exotelData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
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
          "Access-Control-Allow-Origin": "*",
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
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

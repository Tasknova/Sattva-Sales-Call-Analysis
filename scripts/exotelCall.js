/**
 * Simple Node.js script that makes the exact Exotel call request the
 * user tested via curl. Run with `node scripts/exotelCall.js`.
 */

import fetch from "node-fetch";

const EXOTEL_URL =
  "https://api.exotel.com/v1/Accounts/tasknova1/Calls/connect.json";
const AUTH_HEADER =
  "Basic YTljZTA3ZmZlMGJmYWUwOTM2ZmM3NmE4YTYzZDFiNDc4YzgyZTQyMjQ5MGFmNTYxOjI4YmExNGRjNWFkYWFmYjI2NGM0ZTU3OGJhMDcyMjM0MDZhOTNiMTVhNDY0YzM2Ng==";

const params = new URLSearchParams({
  From: "9175442260",
  To: "917517928086",
  CallerId: "073-146-26705",
  Record: "true",
});

async function makeCall() {
  console.log("Calling Exotel API with payload:", params.toString());
  try {
    const response = await fetch(EXOTEL_URL, {
      method: "POST",
      headers: {
        Authorization: AUTH_HEADER,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });

    const text = await response.text();
    console.log("Status:", response.status, response.statusText);
    console.log("Response body:", text);
  } catch (error) {
    console.error("Error calling Exotel:", error);
  }
}

makeCall();


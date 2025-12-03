/**
 * Fetch call details (including RecordingUrl) for a given Exotel Call SID.
 * Usage:
 *   node scripts/exotelCallDetails.js <CALL_SID>
 */

import fetch from "node-fetch";

const AUTH_HEADER =
  "Basic YTljZTA3ZmZlMGJmYWUwOTM2ZmM3NmE4YTYzZDFiNDc4YzgyZTQyMjQ5MGFmNTYxOjI4YmExNGRjNWFkYWFmYjI2NGM0ZTU3OGJhMDcyMjM0MDZhOTNiMTVhNDY0YzM2Ng==";

const callSid = process.argv[2];

if (!callSid) {
  console.error("Usage: node scripts/exotelCallDetails.js <CALL_SID>");
  process.exit(1);
}

const url = `https://api.exotel.com/v1/Accounts/tasknova1/Calls/${callSid}.json`;

async function fetchCallDetails() {
  console.log(`Fetching details for call SID: ${callSid}`);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: AUTH_HEADER,
        Accept: "application/json",
      },
    });

    const text = await response.text();
    console.log("Status:", response.status, response.statusText);
    console.log("Response body:", text);
  } catch (error) {
    console.error("Error fetching call details:", error);
  }
}

fetchCallDetails();


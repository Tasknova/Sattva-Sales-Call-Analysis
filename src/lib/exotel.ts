const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lsuuivbaemjqmtztrjqq.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdXVpdmJhZW1qcW10enRyanFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTUzMjMsImV4cCI6MjA3MzA3MTMyM30.0geG3EgNNZ5wH2ClKzZ_lwUgJlHRXr1CxcXo80ehVGM';

export async function fetchExotelCallDetails(callSid: string, companyId?: string) {
  if (!callSid) {
    throw new Error('Call SID is required to fetch Exotel details.');
  }

  const url = new URL(`${supabaseUrl}/functions/v1/exotel-proxy/calls/${callSid}`);
  if (companyId) {
    url.searchParams.set('company_id', companyId);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // Keep fallback error message.
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export function extractRecordingUrl(exotelPayload: any): string | null {
  const call = exotelPayload?.Call || exotelPayload;
  return call?.RecordingUrl || call?.recording_url || null;
}

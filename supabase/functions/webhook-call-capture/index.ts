import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

interface CallWebhookPayload {
  // Required fields
  lead_id?: string;
  employee_id?: string;
  company_id: string;
  
  // Call outcome details
  outcome?: 'converted' | 'follow_up' | 'not_answered' | 'completed' | 'not_interested';
  notes?: string;
  call_date?: string; // ISO 8601 format
  
  // Follow-up scheduling
  next_follow_up?: string; // Date in YYYY-MM-DD format
  next_follow_up_time?: string; // Time in HH:MM:SS format
  auto_call_followup?: boolean;
  
  // External system details (if client uses their own system)
  external_call_id?: string;
  external_system?: string;
  
  // Call metadata
  caller_number?: string;
  recipient_number?: string;
  duration_seconds?: number;
  recording_url?: string;
  call_status?: string;
  start_time?: string;
  end_time?: string;
  
  // Additional data
  call_details?: any; // JSON object for additional metadata
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate API Key from headers
    const apiKey = req.headers.get('x-api-key')
    const expectedApiKey = Deno.env.get('CLIENT_API_KEY')
    
    if (!apiKey || apiKey !== expectedApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Invalid or missing API key' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const payload: CallWebhookPayload = await req.json()
    
    // Validate required fields
    if (!payload.company_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request', 
          message: 'company_id is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Prepare call_history record
    const callHistoryRecord = {
      lead_id: payload.lead_id || null,
      employee_id: payload.employee_id || null,
      company_id: payload.company_id,
      call_date: payload.call_date ? new Date(payload.call_date).toISOString() : new Date().toISOString(),
      outcome: payload.outcome || 'follow_up',
      notes: payload.notes || null,
      next_follow_up: payload.next_follow_up || null,
      next_follow_up_time: payload.next_follow_up_time || null,
      auto_call_followup: payload.auto_call_followup || false,
      
      // Store external system info and call metadata in call_details JSON
      call_details: {
        external_call_id: payload.external_call_id,
        external_system: payload.external_system,
        caller_number: payload.caller_number,
        recipient_number: payload.recipient_number,
        duration_seconds: payload.duration_seconds,
        call_status: payload.call_status,
        ...(payload.call_details || {})
      },
      
      // Exotel-like fields (if client provides similar data)
      exotel_call_sid: payload.external_call_id || null,
      exotel_from_number: payload.caller_number || null,
      exotel_to_number: payload.recipient_number || null,
      exotel_status: payload.call_status || null,
      exotel_duration: payload.duration_seconds || null,
      exotel_recording_url: payload.recording_url || null,
      exotel_start_time: payload.start_time ? new Date(payload.start_time).toISOString() : null,
      exotel_end_time: payload.end_time ? new Date(payload.end_time).toISOString() : null,
      
      // Store complete request payload in exotel_response for reference
      exotel_response: payload,
    }

    // Insert into call_history table
    const { data, error } = await supabase
      .from('call_history')
      .insert(callHistoryRecord)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Database Error', 
          message: error.message,
          details: error 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Call record created successfully',
        data: {
          call_history_id: data.id,
          created_at: data.created_at
        }
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

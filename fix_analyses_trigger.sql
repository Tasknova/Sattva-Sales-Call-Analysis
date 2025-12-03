-- Fix: Remove call_id column reference from analyses table trigger
-- This migration fixes the error: column "call_id" of relation "analyses" does not exist
-- Date: November 26, 2025

-- First, let's check if there's a trigger that creates analysis records automatically
-- We need to drop and recreate it without the call_id column

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS create_analysis_on_call_insert ON call_history;
DROP FUNCTION IF EXISTS create_analysis_for_call();

-- Create the corrected function without call_id
CREATE OR REPLACE FUNCTION create_analysis_for_call()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create analysis if there's a recording URL
  IF NEW.exotel_recording_url IS NOT NULL AND NEW.exotel_recording_url != '' THEN
    -- Insert into analyses table WITHOUT call_id column
    INSERT INTO analyses (
      recording_id,
      user_id,
      company_id,
      status,
      created_at,
      updated_at
    ) VALUES (
      NULL, -- recording_id will be set later when recording is created
      NEW.employee_id,
      NEW.company_id,
      'pending',
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER create_analysis_on_call_insert
AFTER INSERT ON call_history
FOR EACH ROW
EXECUTE FUNCTION create_analysis_for_call();

-- Alternative: If you don't need automatic analysis creation, just drop the trigger
-- DROP TRIGGER IF EXISTS create_analysis_on_call_insert ON call_history;
-- DROP FUNCTION IF EXISTS create_analysis_for_call();

COMMENT ON FUNCTION create_analysis_for_call() IS 'Automatically creates an analysis record when a call with recording URL is inserted into call_history';

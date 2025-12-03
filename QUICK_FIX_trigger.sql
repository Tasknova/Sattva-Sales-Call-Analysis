-- Quick Fix: Disable the problematic trigger that references call_id
-- This migration fixes the error: column "call_id" of relation "analyses" does not exist
-- Run this in your Supabase SQL Editor

-- Option 1: Drop the trigger completely (RECOMMENDED)
DROP TRIGGER IF EXISTS create_analysis_on_call_insert ON call_history;
DROP FUNCTION IF EXISTS create_analysis_for_call();

-- Option 2: If you need the trigger, recreate it without call_id reference
-- (Uncomment the lines below if you need automatic analysis creation)

/*
CREATE OR REPLACE FUNCTION create_analysis_for_call()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create analysis if there's a recording URL
  IF NEW.exotel_recording_url IS NOT NULL AND NEW.exotel_recording_url != '' THEN
    INSERT INTO analyses (
      user_id,
      company_id,
      status,
      created_at,
      updated_at
    ) VALUES (
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

CREATE TRIGGER create_analysis_on_call_insert
AFTER INSERT ON call_history
FOR EACH ROW
EXECUTE FUNCTION create_analysis_for_call();
*/

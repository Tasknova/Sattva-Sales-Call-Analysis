-- Migration to fix lead status field for existing leads
-- Run this in your Supabase SQL Editor

-- Step 1: Add status column if it doesn't exist (with default value)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'contacted';

-- Step 2: Update existing leads that have NULL status
-- Set default status based on call outcomes if available
UPDATE leads
SET status = CASE 
  WHEN EXISTS (
    SELECT 1 FROM call_outcomes 
    WHERE call_outcomes.lead_id = leads.id 
    AND call_outcomes.outcome = 'completed'
  ) THEN 'converted'
  WHEN EXISTS (
    SELECT 1 FROM call_outcomes 
    WHERE call_outcomes.lead_id = leads.id 
    AND call_outcomes.outcome = 'follow_up'
  ) THEN 'follow_up'
  WHEN EXISTS (
    SELECT 1 FROM call_outcomes 
    WHERE call_outcomes.lead_id = leads.id 
    AND call_outcomes.outcome = 'not_interested'
  ) THEN 'not_interested'
  WHEN EXISTS (
    SELECT 1 FROM call_outcomes 
    WHERE call_outcomes.lead_id = leads.id
  ) THEN 'contacted'
  ELSE 'contacted'
END
WHERE status IS NULL;

-- Step 3: Verify the update
SELECT status, COUNT(*) as count
FROM leads
GROUP BY status
ORDER BY count DESC;

-- EMERGENCY FIX: Remove all triggers that reference call_id in analyses table
-- Run this IMMEDIATELY in your Supabase SQL Editor
-- Date: November 26, 2025

-- ============================================
-- STEP 1: Check existing triggers (for debugging)
-- ============================================
SELECT 
    trigger_name, 
    event_object_table, 
    action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%analysis%' OR trigger_name LIKE '%call%';

-- ============================================
-- STEP 2: Drop ALL possible triggers that might cause this issue
-- ============================================

-- Drop any trigger on call_history that creates analyses
DROP TRIGGER IF EXISTS create_analysis_on_call_insert ON call_history;
DROP TRIGGER IF EXISTS create_analysis_for_call ON call_history;
DROP TRIGGER IF EXISTS auto_create_analysis ON call_history;
DROP TRIGGER IF EXISTS insert_analysis_trigger ON call_history;
DROP TRIGGER IF EXISTS call_history_analysis_trigger ON call_history;

-- Drop any trigger on analyses table itself
DROP TRIGGER IF EXISTS before_insert_analysis ON analyses;
DROP TRIGGER IF EXISTS after_insert_analysis ON analyses;

-- ============================================
-- STEP 3: Drop the functions associated with these triggers
-- ============================================
DROP FUNCTION IF EXISTS create_analysis_for_call();
DROP FUNCTION IF EXISTS auto_create_analysis();
DROP FUNCTION IF EXISTS insert_analysis();
DROP FUNCTION IF EXISTS handle_call_analysis();

-- ============================================
-- STEP 4: Verify the analyses table structure
-- ============================================
-- This will show you the actual columns in the analyses table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'analyses'
ORDER BY ordinal_position;

-- ============================================
-- STEP 5: Check if call_id column exists and drop it if it does
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'analyses' 
        AND column_name = 'call_id'
    ) THEN
        -- Drop the column if it exists but shouldn't
        ALTER TABLE analyses DROP COLUMN IF EXISTS call_id;
        RAISE NOTICE 'Dropped call_id column from analyses table';
    ELSE
        RAISE NOTICE 'call_id column does not exist in analyses table (correct)';
    END IF;
END $$;

-- ============================================
-- VERIFICATION: Check that triggers are gone
-- ============================================
SELECT 
    'Remaining triggers:' as info,
    trigger_name, 
    event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('call_history', 'analyses');

-- If the above query returns no rows, the fix is complete!

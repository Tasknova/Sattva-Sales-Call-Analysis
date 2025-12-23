-- Drop and recreate the function to extract time portion correctly
DROP FUNCTION IF EXISTS public.get_employee_last_call_times(date);

-- Function to get employee's first and last call times for a given date
-- Extracts time portion directly from timestamp to avoid timezone conversion issues
CREATE OR REPLACE FUNCTION public.get_employee_last_call_times(target_date date)
RETURNS TABLE (
  employee_id uuid,
  last_call_time time
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ch.employee_id,
    -- Extract time portion directly from the timestamp string (format: HH:MM:SS)
    SUBSTRING(ch.call_date::text, 12, 8)::time as last_call_time
  FROM (
    SELECT 
      employee_id,
      MAX(call_date) as call_date
    FROM call_history
    WHERE DATE(call_date) = target_date
    GROUP BY employee_id
  ) ch
$$;

-- Function to get employee's first call time (for login_time)
CREATE OR REPLACE FUNCTION public.get_employee_first_call_times(target_date date)
RETURNS TABLE (
  employee_id uuid,
  first_call_time time
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    ch.employee_id,
    -- Extract time portion directly from the timestamp string (format: HH:MM:SS)
    SUBSTRING(ch.call_date::text, 12, 8)::time as first_call_time
  FROM (
    SELECT 
      employee_id,
      MIN(call_date) as call_date
    FROM call_history
    WHERE DATE(call_date) = target_date
    GROUP BY employee_id
  ) ch
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_employee_last_call_times(date) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_employee_first_call_times(date) TO anon, authenticated, service_role;

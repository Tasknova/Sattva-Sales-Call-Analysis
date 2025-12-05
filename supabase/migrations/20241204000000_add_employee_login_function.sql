-- Function to authenticate employee login (bypasses RLS)
CREATE OR REPLACE FUNCTION public.authenticate_employee(
    p_email VARCHAR,
    p_password VARCHAR
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    company_id UUID,
    manager_id UUID,
    full_name VARCHAR,
    email VARCHAR,
    is_active BOOLEAN,
    phone VARCHAR,
    contact_number VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    role_id UUID,
    role VARCHAR,
    role_company_id UUID
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.user_id,
        e.company_id,
        e.manager_id,
        e.full_name,
        e.email,
        e.is_active,
        e.phone,
        e.contact_number,
        e.created_at,
        e.updated_at,
        ur.id as role_id,
        ur.role,
        ur.company_id as role_company_id
    FROM public.employees e
    INNER JOIN public.user_roles ur ON ur.user_id = e.user_id
    WHERE e.email = p_email 
        AND e.password = p_password 
        AND e.is_active = true
        AND ur.role = 'employee'
        AND ur.is_active = true;
END;
$$;

-- Function to authenticate manager login (bypasses RLS)
CREATE OR REPLACE FUNCTION public.authenticate_manager(
    p_email VARCHAR,
    p_password VARCHAR
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    company_id UUID,
    full_name VARCHAR,
    email VARCHAR,
    is_active BOOLEAN,
    phone VARCHAR,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    role_id UUID,
    role VARCHAR,
    role_company_id UUID
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.user_id,
        m.company_id,
        m.full_name,
        m.email,
        m.is_active,
        m.phone,
        m.created_at,
        m.updated_at,
        ur.id as role_id,
        ur.role,
        ur.company_id as role_company_id
    FROM public.managers m
    INNER JOIN public.user_roles ur ON ur.user_id = m.user_id
    WHERE m.email = p_email 
        AND m.password = p_password 
        AND m.is_active = true
        AND ur.role = 'manager'
        AND ur.is_active = true;
END;
$$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.authenticate_employee(VARCHAR, VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_manager(VARCHAR, VARCHAR) TO anon, authenticated;

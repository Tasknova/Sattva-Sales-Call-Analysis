-- =====================================================
-- COMPLETE DATABASE MIGRATION FOR SATTVA CALL ANALYSIS
-- Generated: 2025-12-04
-- Database: Supabase PostgreSQL
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLE: companies
-- =====================================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: managers
-- =====================================================
CREATE TABLE IF NOT EXISTS public.managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    phone VARCHAR(20),
    contact_number VARCHAR(255),
    CONSTRAINT managers_user_id_unique UNIQUE (user_id),
    CONSTRAINT managers_email_company_unique UNIQUE (email, company_id)
);

-- =====================================================
-- TABLE: employees
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES public.managers(id),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    phone VARCHAR(20),
    contact_number VARCHAR(255),
    CONSTRAINT employees_user_id_unique UNIQUE (user_id),
    CONSTRAINT employees_email_company_unique UNIQUE (email, company_id)
);

-- =====================================================
-- TABLE: clients
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id),
    name VARCHAR NOT NULL,
    industry VARCHAR,
    contact_person VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    address TEXT,
    website VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: jobs
-- =====================================================
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id),
    client_id UUID REFERENCES public.clients(id),
    title VARCHAR NOT NULL,
    description TEXT,
    location VARCHAR,
    employment_type VARCHAR CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship', 'temporary')),
    experience_level VARCHAR CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
    salary_range VARCHAR,
    requirements TEXT,
    responsibilities TEXT,
    benefits TEXT,
    status VARCHAR DEFAULT 'open'::character varying CHECK (status IN ('open', 'closed', 'on-hold', 'filled')),
    positions_available INTEGER DEFAULT 1,
    posted_by UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: lead_groups
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lead_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID REFERENCES public.companies(id),
    assigned_to UUID REFERENCES public.managers(id)
);

-- =====================================================
-- TABLE: leads
-- =====================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    description TEXT,
    other JSONB,
    group_id UUID REFERENCES public.lead_groups(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID REFERENCES public.companies(id),
    assigned_to UUID,
    status VARCHAR(20) DEFAULT 'unassigned'::character varying,
    job_id UUID REFERENCES public.jobs(id),
    client_id UUID REFERENCES public.clients(id)
);

-- =====================================================
-- TABLE: lead_assignments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lead_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id),
    assigned_to UUID,
    assigned_by UUID,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'assigned'::character varying,
    CONSTRAINT lead_assignments_status_check CHECK (status IN ('assigned', 'completed', 'cancelled'))
);

-- =====================================================
-- TABLE: call_history
-- =====================================================
CREATE TABLE IF NOT EXISTS public.call_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.employees(user_id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    call_date TIMESTAMPTZ DEFAULT NOW(),
    outcome TEXT DEFAULT 'follow_up',
    notes TEXT,
    next_follow_up DATE,
    exotel_response JSONB NOT NULL,
    exotel_call_sid VARCHAR,
    exotel_from_number VARCHAR,
    exotel_to_number VARCHAR,
    exotel_caller_id VARCHAR,
    exotel_status VARCHAR,
    exotel_duration INTEGER,
    exotel_recording_url TEXT,
    exotel_start_time TIMESTAMPTZ,
    exotel_end_time TIMESTAMPTZ,
    exotel_answered_by VARCHAR,
    exotel_direction VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    auto_call_followup BOOLEAN DEFAULT false,
    call_details JSONB,
    next_follow_up_time TIME
);

-- =====================================================
-- TABLE: call_outcomes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.call_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id),
    call_date TIMESTAMPTZ DEFAULT NOW(),
    outcome VARCHAR NOT NULL CHECK (outcome IN ('successful', 'follow_up', 'not_interested', 'not_answered', 'failed')),
    notes TEXT,
    next_follow_up DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID,
    exotel_call_sid VARCHAR,
    exotel_from_number VARCHAR,
    exotel_to_number VARCHAR,
    exotel_caller_id VARCHAR,
    exotel_status VARCHAR,
    exotel_duration INTEGER,
    exotel_recording_url TEXT,
    exotel_start_time TIMESTAMPTZ,
    exotel_end_time TIMESTAMPTZ,
    call_in_progress BOOLEAN DEFAULT false
);

-- =====================================================
-- TABLE: recordings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    drive_file_id TEXT,
    file_name TEXT,
    file_size BIGINT,
    stored_file_url TEXT,
    status TEXT CHECK (status IN ('processing', 'transcribing', 'analyzing', 'completed', 'failed', 'queued', 'pending', 'uploaded')),
    duration_seconds INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    transcript TEXT,
    company_id UUID,
    assigned_to UUID REFERENCES public.employees(user_id),
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    call_history_id UUID REFERENCES public.call_history(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE: analyses
-- =====================================================
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recording_id UUID REFERENCES public.recordings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    participants_count INTEGER,
    participants_names TEXT,
    closure_probability NUMERIC(5,2),
    closure_probability_reasoning TEXT,
    script_adherence NUMERIC(5,2),
    candidate_acceptance_risk TEXT,
    candidate_acceptance_risk_reasoning TEXT,
    purpose_of_call TEXT,
    exec_summary TEXT,
    next_steps TEXT,
    ai_feedback_for_recruiter TEXT,
    outcome TEXT,
    objections_detected TEXT,
    objections_handeled TEXT,
    follow_up_details TEXT,
    objections_raised TEXT,
    objections_handled TEXT,
    call_id UUID,
    call_quality_score NUMERIC,
    call_quality_score_reasoning TEXT,
    compilience_expections_score NUMERIC,
    compilience_expections_score_reasoning TEXT,
    additional_details JSONB
);

-- =====================================================
-- TABLE: user_profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    company_email TEXT,
    company_industry TEXT,
    position TEXT,
    use_cases TEXT[],
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_profiles_user_id_key UNIQUE (user_id)
);

-- =====================================================
-- TABLE: user_roles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    company_id UUID REFERENCES public.companies(id),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
    manager_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_roles_user_company_unique UNIQUE (user_id, company_id)
);

-- =====================================================
-- TABLE: employee_daily_productivity
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employee_daily_productivity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    date DATE NOT NULL,
    profiles_downloaded INTEGER DEFAULT 0,
    calls_made INTEGER DEFAULT 0,
    calls_converted INTEGER DEFAULT 0,
    calls_follow_up INTEGER DEFAULT 0,
    productivity_score NUMERIC DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    manager_id UUID REFERENCES public.managers(id),
    login_time TIME,
    logout_time TIME,
    work_hours NUMERIC,
    CONSTRAINT employee_daily_productivity_employee_id_date_key UNIQUE (employee_id, date)
);

-- =====================================================
-- TABLE: metrics_aggregates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.metrics_aggregates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    total_calls INTEGER,
    avg_sentiment NUMERIC,
    avg_engagement NUMERIC,
    conversion_rate NUMERIC,
    objections_rate NUMERIC,
    company_id UUID REFERENCES public.companies(id),
    CONSTRAINT idx_metrics_aggregates_user_date UNIQUE (user_id, date)
);

-- =====================================================
-- TABLE: manager_client_assignments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.manager_client_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID REFERENCES public.managers(id),
    client_id UUID REFERENCES public.clients(id),
    assigned_by UUID,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT manager_client_assignments_manager_id_client_id_key UNIQUE (manager_id, client_id)
);

-- =====================================================
-- TABLE: removed_leads
-- =====================================================
CREATE TABLE IF NOT EXISTS public.removed_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id),
    employee_id UUID REFERENCES public.employees(id),
    company_id UUID REFERENCES public.companies(id),
    lead_name VARCHAR(255) NOT NULL,
    lead_email VARCHAR(255),
    lead_contact VARCHAR(20),
    lead_company VARCHAR(255),
    removal_reason TEXT NOT NULL,
    removal_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: company_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    caller_id VARCHAR DEFAULT '09513886363',
    from_numbers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    exotel_api_key VARCHAR,
    exotel_api_token VARCHAR,
    exotel_subdomain VARCHAR DEFAULT 'api.exotel.com',
    exotel_account_sid VARCHAR,
    exotel_setup_completed BOOLEAN DEFAULT false
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);

-- Managers indexes
CREATE INDEX IF NOT EXISTS idx_managers_user_id ON public.managers(user_id);
CREATE INDEX IF NOT EXISTS idx_managers_company_id ON public.managers(company_id);
CREATE INDEX IF NOT EXISTS idx_managers_email ON public.managers(email);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON public.employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

-- Lead groups indexes
CREATE INDEX IF NOT EXISTS idx_lead_groups_user_id ON public.lead_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_groups_company_id ON public.lead_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_lead_groups_assigned_to ON public.lead_groups(assigned_to);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_group_id ON public.leads(group_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON public.leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_job_id ON public.leads(job_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- Lead assignments indexes
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON public.lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_to ON public.lead_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_assigned_by ON public.lead_assignments(assigned_by);

-- Call history indexes
CREATE INDEX IF NOT EXISTS idx_call_history_lead_id ON public.call_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_history_employee_id ON public.call_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_call_history_company_id ON public.call_history(company_id);
CREATE INDEX IF NOT EXISTS idx_call_history_call_date ON public.call_history(call_date);
CREATE INDEX IF NOT EXISTS idx_call_history_exotel_call_sid ON public.call_history(exotel_call_sid);
CREATE INDEX IF NOT EXISTS idx_call_history_outcome ON public.call_history(outcome);
CREATE INDEX IF NOT EXISTS idx_call_history_auto_followup ON public.call_history(next_follow_up, auto_call_followup) WHERE (auto_call_followup = true AND next_follow_up IS NOT NULL);

-- Call outcomes indexes
-- Recordings indexes
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON public.recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_lead_id ON public.recordings(lead_id);
CREATE INDEX IF NOT EXISTS idx_recordings_call_history_id ON public.recordings(call_history_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON public.recordings(status);
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON public.recordings(created_at);

-- Analyses indexes
CREATE INDEX IF NOT EXISTS idx_analyses_recording_id ON public.analyses(recording_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at_new ON public.analyses(created_at);
-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding ON public.user_profiles(onboarding_completed);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON public.user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Employee daily productivity indexes
CREATE INDEX IF NOT EXISTS idx_employee_daily_productivity_employee ON public.employee_daily_productivity(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_daily_productivity_date ON public.employee_daily_productivity(date);
CREATE INDEX IF NOT EXISTS idx_employee_daily_productivity_company ON public.employee_daily_productivity(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_daily_productivity_manager ON public.employee_daily_productivity(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Employee daily productivity indexes
CREATE INDEX IF NOT EXISTS idx_employee_daily_productivity_employee_id ON public.employee_daily_productivity(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_daily_productivity_date ON public.employee_daily_productivity(date);

-- Metrics aggregates indexes
CREATE INDEX IF NOT EXISTS idx_metrics_aggregates_user_id ON public.metrics_aggregates(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_aggregates_date ON public.metrics_aggregates(date);

-- Manager client assignments indexes
CREATE INDEX IF NOT EXISTS idx_manager_client_assignments_manager_id ON public.manager_client_assignments(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_client_assignments_client_id ON public.manager_client_assignments(client_id);

-- Removed leads indexes
CREATE INDEX IF NOT EXISTS idx_removed_leads_company_id ON public.removed_leads(company_id);
CREATE INDEX IF NOT EXISTS idx_removed_leads_employee_id ON public.removed_leads(employee_id);
CREATE INDEX IF NOT EXISTS idx_removed_leads_lead_id ON public.removed_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_removed_leads_removal_date ON public.removed_leads(removal_date);

-- Company settings indexes
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON public.company_settings(company_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger for companies
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for managers
DROP TRIGGER IF EXISTS update_managers_updated_at ON public.managers;
CREATE TRIGGER update_managers_updated_at
    BEFORE UPDATE ON public.managers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for employees
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for jobs
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for lead_groups
DROP TRIGGER IF EXISTS update_lead_groups_updated_at ON public.lead_groups;
CREATE TRIGGER update_lead_groups_updated_at
    BEFORE UPDATE ON public.lead_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for leads
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for call_history
DROP TRIGGER IF EXISTS update_call_history_updated_at ON public.call_history;
CREATE TRIGGER update_call_history_updated_at
    BEFORE UPDATE ON public.call_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for recordings
DROP TRIGGER IF EXISTS update_recordings_updated_at ON public.recordings;
CREATE TRIGGER update_recordings_updated_at
    BEFORE UPDATE ON public.recordings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for employee_daily_productivity
DROP TRIGGER IF EXISTS update_employee_daily_productivity_updated_at ON public.employee_daily_productivity;
CREATE TRIGGER update_employee_daily_productivity_updated_at
    BEFORE UPDATE ON public.employee_daily_productivity
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for company_settings
DROP TRIGGER IF EXISTS update_company_settings_updated_at ON public.company_settings;
CREATE TRIGGER update_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_daily_productivity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.removed_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Companies policies
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- Managers policies
DROP POLICY IF EXISTS "Managers can view managers in their company" ON public.managers;
CREATE POLICY "Managers can view managers in their company" ON public.managers
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- Employees policies
DROP POLICY IF EXISTS "Users can view employees in their company" ON public.employees;
CREATE POLICY "Users can view employees in their company" ON public.employees
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- Clients policies
DROP POLICY IF EXISTS "Users can view clients in their company" ON public.clients;
CREATE POLICY "Users can view clients in their company" ON public.clients
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- Jobs policies
DROP POLICY IF EXISTS "Users can view jobs in their company" ON public.jobs;
CREATE POLICY "Users can view jobs in their company" ON public.jobs
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- Lead groups policies
DROP POLICY IF EXISTS "Users can view lead groups in their company" ON public.lead_groups;
CREATE POLICY "Users can view lead groups in their company" ON public.lead_groups
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- Leads policies
DROP POLICY IF EXISTS "Users can view leads in their company" ON public.leads;
CREATE POLICY "Users can view leads in their company" ON public.leads
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert leads in their company" ON public.leads;
CREATE POLICY "Users can insert leads in their company" ON public.leads
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update leads in their company" ON public.leads;
CREATE POLICY "Users can update leads in their company" ON public.leads
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete leads in their company" ON public.leads;
CREATE POLICY "Users can delete leads in their company" ON public.leads
    FOR DELETE USING (
        company_id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- Call history policies
DROP POLICY IF EXISTS "Users can view call history in their company" ON public.call_history;
CREATE POLICY "Users can view call history in their company" ON public.call_history
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- User profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- User roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Recordings policies
DROP POLICY IF EXISTS "Users can view recordings in their company" ON public.recordings;
CREATE POLICY "Users can view recordings in their company" ON public.recordings
    FOR SELECT USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id FROM public.user_roles 
            WHERE company_id IN (
                SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
            )
        )
    );

-- Analyses policies
DROP POLICY IF EXISTS "Users can view analyses in their company" ON public.analyses;
CREATE POLICY "Users can view analyses in their company" ON public.analyses
    FOR SELECT USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id FROM public.user_roles 
            WHERE company_id IN (
                SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
            )
        )
    );

-- Company settings policies
DROP POLICY IF EXISTS "Users can view company settings" ON public.company_settings;
CREATE POLICY "Users can view company settings" ON public.company_settings
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.user_roles WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- DATA INSERTS
-- =====================================================

-- Insert data into companies (1 rows)
INSERT INTO public.companies (id, name, email, industry, phone, address, website, created_at, updated_at)
VALUES
  ('78626c8f-108c-47f1-8d71-423305e3b3a4', 'Tasknova', 'contact.tasknova@gmail.com', 'HR', '9999999999', 'Pune Maharrashtra', 'https://tasknova.io', '2025-10-30T13:09:19.152598+00:00', '2025-10-30T13:09:19.152598+00:00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  industry = EXCLUDED.industry,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  website = EXCLUDED.website,
  updated_at = EXCLUDED.updated_at;

-- Insert data into managers (3 rows)
INSERT INTO public.managers (id, user_id, company_id, full_name, email, department, password, phone, contact_number, is_active, created_at, updated_at)
VALUES
  ('002ee72e-af81-4675-8fcd-baa5c382f088', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Mihir ', 'aarav2110@gmail.com', 'Marketing', 'Aarav@Manager', '', NULL, true, '2025-10-30T13:13:07.433556+00:00', '2025-10-30T13:13:07.433556+00:00'),
  ('97bc90a7-ad27-4333-b9f0-1add670a6765', 'd071a83b-172a-495a-8225-6e69fb29523a', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Rahul', 'rahul101@gmail.com', 'marketing', 'Rahul@Manager', '9175442260', NULL, true, '2025-11-20T10:47:51.860185+00:00', '2025-11-20T10:47:51.860185+00:00'),
  ('fe610b39-e206-4ebf-8467-66e4de986184', '24d8b2ba-9d8d-4d65-a713-8cfe6cf09977', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Sakshi', 'sakshi101@gmail.com', 'operations', 'Sakshi@Manager', '9999999999', NULL, true, '2025-11-20T10:49:08.593162+00:00', '2025-11-20T10:49:08.593162+00:00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  department = EXCLUDED.department,
  password = EXCLUDED.password,
  phone = EXCLUDED.phone,
  contact_number = EXCLUDED.contact_number,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- Insert data into employees (6 rows)
INSERT INTO public.employees (id, user_id, company_id, manager_id, full_name, email, password, phone, contact_number, is_active, created_at, updated_at)
VALUES
  ('fef57cba-9996-4736-8ed6-8d71ee160f4a', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '002ee72e-af81-4675-8fcd-baa5c382f088', 'Aarav Varma', 'aarav2110@gmail.com', 'Aarav@Employee', '999999999', NULL, true, '2025-10-30T13:24:56.339365+00:00', '2025-10-30T13:24:56.339365+00:00'),
  ('a00bf50c-2a12-41e9-88ac-a0e80cbbc699', '92e013fc-491d-4006-a8b1-9e00e748d9af', '78626c8f-108c-47f1-8d71-423305e3b3a4', '002ee72e-af81-4675-8fcd-baa5c382f088', 'Rajpal Singh', 'rajpalrathore4455@gmail.com', 'Rathore@1811', '9175442260', NULL, true, '2025-11-19T11:55:24.038375+00:00', '2025-11-19T11:55:24.038375+00:00'),
  ('1cb88917-8930-46a1-95e5-439d7f77835f', '9da4238c-1992-4dca-9899-3442fb13fefb', '78626c8f-108c-47f1-8d71-423305e3b3a4', '002ee72e-af81-4675-8fcd-baa5c382f088', 'Atharva', 'aatharva@gmail.com', 'Aatharva@Employee', '9999999999', NULL, true, '2025-11-20T10:21:27.205585+00:00', '2025-11-20T10:21:27.205585+00:00'),
  ('8cb8d567-706c-4567-b85d-381caed30bd2', 'da431211-d6e4-41bd-8267-af71f366af50', '78626c8f-108c-47f1-8d71-423305e3b3a4', '97bc90a7-ad27-4333-b9f0-1add670a6765', 'Ayush Ajith', 'ayushajith@gmail.com', 'Ayush@Employee', '09175442260', NULL, true, '2025-11-24T07:47:01.042429+00:00', '2025-11-24T07:47:01.042429+00:00'),
  ('38d004d9-c43d-4e03-be47-27f5580aefaf', '4d52f0ed-5c6a-4afb-9f31-3f301a2582e8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '97bc90a7-ad27-4333-b9f0-1add670a6765', 'Yash Padwal', 'yash101@gmail.com', 'Yash@Employee', '999999999', NULL, true, '2025-11-24T07:47:45.633917+00:00', '2025-11-24T07:47:45.633917+00:00'),
  ('e8079b85-23ba-4318-af6e-3323cde8fbe8', 'dc7c6176-3775-430c-9d69-9a5357dbd19c', '78626c8f-108c-47f1-8d71-423305e3b3a4', '97bc90a7-ad27-4333-b9f0-1add670a6765', 'Arya Rai', 'aarya101@gmail.com', 'Arya@Employee', '999999999', NULL, true, '2025-11-24T07:48:29.390963+00:00', '2025-11-24T07:48:29.390963+00:00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  manager_id = EXCLUDED.manager_id,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  phone = EXCLUDED.phone,
  contact_number = EXCLUDED.contact_number,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- Insert data into clients (5 rows)
INSERT INTO public.clients (id, company_id, name, industry, contact_person, email, phone, address, website, is_active, created_at, updated_at)
VALUES
  ('84057c47-1f8c-4f6f-ac9f-9e2232dcb0c7', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Tata Consultancy Services', 'IT Services', 'Rajesh Kumar', 'rajesh.kumar@tcs.com', '+91-22-6778-9999', NULL, NULL, true, '2025-11-19T10:33:37.541959+00:00', '2025-11-19T10:33:37.541959+00:00'),
  ('8cbd4255-86b5-4b56-b2ea-0141c4a1ff84', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Wipro Limited', 'Technology', 'Priya Sharma', 'priya.sharma@wipro.com', '+91-80-2844-0011', NULL, NULL, true, '2025-11-19T10:33:37.541959+00:00', '2025-11-19T10:33:37.541959+00:00'),
  ('63ad6f39-7c3d-444a-b50b-fbda4321beb6', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Capgemini India', 'Consulting', 'Amit Patel', 'amit.patel@capgemini.com', '+91-20-6632-0000', NULL, NULL, true, '2025-11-19T10:33:37.541959+00:00', '2025-11-19T10:33:37.541959+00:00'),
  ('8737ca2f-2d63-42e5-955b-c6ccc927aeb4', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Infosys Technologies', 'Software Development', 'Sneha Reddy', 'sneha.reddy@infosys.com', '+91-80-2852-0261', NULL, NULL, true, '2025-11-19T10:33:37.541959+00:00', '2025-11-19T10:33:37.541959+00:00'),
  ('b1ac0a84-2108-4c59-bab7-afaa92c520d6', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'HCL Technologies', 'IT Consulting', 'Vikram Singh', 'vikram.singh@hcl.com', '+91-120-438-2000', NULL, NULL, true, '2025-11-19T10:33:37.541959+00:00', '2025-11-19T10:33:37.541959+00:00')
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  industry = EXCLUDED.industry,
  contact_person = EXCLUDED.contact_person,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  website = EXCLUDED.website,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- Insert data into jobs (25 rows)
INSERT INTO public.jobs (id, company_id, client_id, title, description, location, employment_type, experience_level, salary_range, requirements, responsibilities, benefits, status, positions_available, posted_by, is_active, created_at, updated_at)
VALUES
  ('ae61de18-2bee-472c-8d74-29e6113aa68c', '78626c8f-108c-47f1-8d71-423305e3b3a4', '84057c47-1f8c-4f6f-ac9f-9e2232dcb0c7', 'Senior Software Developer', 'Experienced developer for enterprise projects', 'Bangalore, India', 'full-time', 'senior', '₹15-25 LPA', 'Java, Spring Boot, Microservices', 'Design and develop scalable applications', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('aae8e166-d7ed-473b-a79f-915ca00ddd31', '78626c8f-108c-47f1-8d71-423305e3b3a4', '84057c47-1f8c-4f6f-ac9f-9e2232dcb0c7', 'DevOps Engineer', 'Manage CI/CD pipelines and infrastructure', 'Bangalore, India', 'full-time', 'mid', '₹12-18 LPA', 'AWS, Docker, Kubernetes', 'Automate deployment processes', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('d026bcb1-3914-43aa-a04e-9ed2fa9d0f8b', '78626c8f-108c-47f1-8d71-423305e3b3a4', '84057c47-1f8c-4f6f-ac9f-9e2232dcb0c7', 'Data Analyst', 'Analyze business data and generate insights', 'Bangalore, India', 'full-time', 'mid', '₹8-12 LPA', 'SQL, Python, Power BI', 'Create reports and dashboards', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('89b5dcde-d090-4b31-979d-6a70007fad84', '78626c8f-108c-47f1-8d71-423305e3b3a4', '84057c47-1f8c-4f6f-ac9f-9e2232dcb0c7', 'Project Manager', 'Lead project teams and ensure delivery', 'Bangalore, India', 'full-time', 'mid', '₹15-20 LPA', 'PMP, Agile, Scrum', 'Manage project lifecycle', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('b9157e55-3e78-4cf1-9eb5-4d52c21cf43c', '78626c8f-108c-47f1-8d71-423305e3b3a4', '84057c47-1f8c-4f6f-ac9f-9e2232dcb0c7', 'UI/UX Designer', 'Design user interfaces and experiences', 'Bangalore, India', 'full-time', 'mid', '₹10-15 LPA', 'Figma, Adobe XD, Sketch', 'Create wireframes and prototypes', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('4cdfe23d-f0ce-4773-9d60-9893e33fad42', '78626c8f-108c-47f1-8d71-423305e3b3a4', '8cbd4255-86b5-4b56-b2ea-0141c4a1ff84', 'Senior Software Developer', 'Experienced developer for enterprise projects', 'Pune, India', 'full-time', 'senior', '₹15-25 LPA', 'Java, Spring Boot, Microservices', 'Design and develop scalable applications', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('f599c9fd-b17a-46ac-9a44-b8a80cced289', '78626c8f-108c-47f1-8d71-423305e3b3a4', '8cbd4255-86b5-4b56-b2ea-0141c4a1ff84', 'DevOps Engineer', 'Manage CI/CD pipelines and infrastructure', 'Pune, India', 'full-time', 'mid', '₹12-18 LPA', 'AWS, Docker, Kubernetes', 'Automate deployment processes', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('07be7b12-1f4d-4fe8-8258-d35739736031', '78626c8f-108c-47f1-8d71-423305e3b3a4', '8cbd4255-86b5-4b56-b2ea-0141c4a1ff84', 'Data Analyst', 'Analyze business data and generate insights', 'Pune, India', 'full-time', 'mid', '₹8-12 LPA', 'SQL, Python, Power BI', 'Create reports and dashboards', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('35040a6c-9d92-4779-9c35-9d0d58d1c90a', '78626c8f-108c-47f1-8d71-423305e3b3a4', '8cbd4255-86b5-4b56-b2ea-0141c4a1ff84', 'Project Manager', 'Lead project teams and ensure delivery', 'Pune, India', 'full-time', 'mid', '₹15-20 LPA', 'PMP, Agile, Scrum', 'Manage project lifecycle', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('65dd1d2e-f4aa-4fd3-b51c-ebcb653316c9', '78626c8f-108c-47f1-8d71-423305e3b3a4', '8cbd4255-86b5-4b56-b2ea-0141c4a1ff84', 'UI/UX Designer', 'Design user interfaces and experiences', 'Pune, India', 'full-time', 'mid', '₹10-15 LPA', 'Figma, Adobe XD, Sketch', 'Create wireframes and prototypes', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('714d35b9-d3a2-482a-9870-4289064ed3d9', '78626c8f-108c-47f1-8d71-423305e3b3a4', '63ad6f39-7c3d-444a-b50b-fbda4321beb6', 'Senior Software Developer', 'Experienced developer for enterprise projects', 'Mumbai, India', 'full-time', 'senior', '₹15-25 LPA', 'Java, Spring Boot, Microservices', 'Design and develop scalable applications', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('d60ce148-8b80-47ab-af7a-e47ea558967d', '78626c8f-108c-47f1-8d71-423305e3b3a4', '63ad6f39-7c3d-444a-b50b-fbda4321beb6', 'DevOps Engineer', 'Manage CI/CD pipelines and infrastructure', 'Mumbai, India', 'full-time', 'mid', '₹12-18 LPA', 'AWS, Docker, Kubernetes', 'Automate deployment processes', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('813f2cbd-6060-4cf9-9032-ec0065cb65ff', '78626c8f-108c-47f1-8d71-423305e3b3a4', '63ad6f39-7c3d-444a-b50b-fbda4321beb6', 'Data Analyst', 'Analyze business data and generate insights', 'Mumbai, India', 'full-time', 'mid', '₹8-12 LPA', 'SQL, Python, Power BI', 'Create reports and dashboards', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('145182b4-436f-4b98-890d-d8b32988506d', '78626c8f-108c-47f1-8d71-423305e3b3a4', '63ad6f39-7c3d-444a-b50b-fbda4321beb6', 'Project Manager', 'Lead project teams and ensure delivery', 'Mumbai, India', 'full-time', 'mid', '₹15-20 LPA', 'PMP, Agile, Scrum', 'Manage project lifecycle', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('15fe81bd-0143-4078-a675-890957108592', '78626c8f-108c-47f1-8d71-423305e3b3a4', '63ad6f39-7c3d-444a-b50b-fbda4321beb6', 'UI/UX Designer', 'Design user interfaces and experiences', 'Mumbai, India', 'full-time', 'mid', '₹10-15 LPA', 'Figma, Adobe XD, Sketch', 'Create wireframes and prototypes', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('160f39b6-a4d2-4ff6-a268-e3cc818b95fb', '78626c8f-108c-47f1-8d71-423305e3b3a4', '8737ca2f-2d63-42e5-955b-c6ccc927aeb4', 'Senior Software Developer', 'Experienced developer for enterprise projects', 'Hyderabad, India', 'full-time', 'senior', '₹15-25 LPA', 'Java, Spring Boot, Microservices', 'Design and develop scalable applications', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('1a5156ec-a3ea-40e1-a005-833b1df56998', '78626c8f-108c-47f1-8d71-423305e3b3a4', '8737ca2f-2d63-42e5-955b-c6ccc927aeb4', 'DevOps Engineer', 'Manage CI/CD pipelines and infrastructure', 'Hyderabad, India', 'full-time', 'mid', '₹12-18 LPA', 'AWS, Docker, Kubernetes', 'Automate deployment processes', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('48e629e2-9210-46ce-baed-f3d4b6d89e1c', '78626c8f-108c-47f1-8d71-423305e3b3a4', '8737ca2f-2d63-42e5-955b-c6ccc927aeb4', 'Data Analyst', 'Analyze business data and generate insights', 'Hyderabad, India', 'full-time', 'mid', '₹8-12 LPA', 'SQL, Python, Power BI', 'Create reports and dashboards', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('a65c443d-1155-486f-8ff8-d49ff44da28a', '78626c8f-108c-47f1-8d71-423305e3b3a4', '8737ca2f-2d63-42e5-955b-c6ccc927aeb4', 'Project Manager', 'Lead project teams and ensure delivery', 'Hyderabad, India', 'full-time', 'mid', '₹15-20 LPA', 'PMP, Agile, Scrum', 'Manage project lifecycle', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('5fd09861-884d-4234-8088-99e097bef7b4', '78626c8f-108c-47f1-8d71-423305e3b3a4', '8737ca2f-2d63-42e5-955b-c6ccc927aeb4', 'UI/UX Designer', 'Design user interfaces and experiences', 'Hyderabad, India', 'full-time', 'mid', '₹10-15 LPA', 'Figma, Adobe XD, Sketch', 'Create wireframes and prototypes', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('2dfa34a4-6008-4f8c-9f78-75b736afc56c', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'b1ac0a84-2108-4c59-bab7-afaa92c520d6', 'Senior Software Developer', 'Experienced developer for enterprise projects', 'Chennai, India', 'full-time', 'senior', '₹15-25 LPA', 'Java, Spring Boot, Microservices', 'Design and develop scalable applications', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('82e96174-d27c-44bc-a51f-da6ecae1c21c', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'b1ac0a84-2108-4c59-bab7-afaa92c520d6', 'DevOps Engineer', 'Manage CI/CD pipelines and infrastructure', 'Chennai, India', 'full-time', 'mid', '₹12-18 LPA', 'AWS, Docker, Kubernetes', 'Automate deployment processes', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('998e0c1d-42f5-42b2-83be-52ead0732459', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'b1ac0a84-2108-4c59-bab7-afaa92c520d6', 'Data Analyst', 'Analyze business data and generate insights', 'Chennai, India', 'full-time', 'mid', '₹8-12 LPA', 'SQL, Python, Power BI', 'Create reports and dashboards', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('9f5a22da-a661-465a-9737-a4f3b9b74d0d', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'b1ac0a84-2108-4c59-bab7-afaa92c520d6', 'Project Manager', 'Lead project teams and ensure delivery', 'Chennai, India', 'full-time', 'mid', '₹15-20 LPA', 'PMP, Agile, Scrum', 'Manage project lifecycle', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00'),
  ('2abe1bda-ca40-4632-a0ce-35edec4e2d1c', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'b1ac0a84-2108-4c59-bab7-afaa92c520d6', 'UI/UX Designer', 'Design user interfaces and experiences', 'Chennai, India', 'full-time', 'mid', '₹10-15 LPA', 'Figma, Adobe XD, Sketch', 'Create wireframes and prototypes', 'Health insurance, PF', 'open', 15, NULL, true, '2025-11-20T09:32:17.077883+00:00', '2025-11-20T13:52:03.93899+00:00')
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  client_id = EXCLUDED.client_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  employment_type = EXCLUDED.employment_type,
  experience_level = EXCLUDED.experience_level,
  salary_range = EXCLUDED.salary_range,
  requirements = EXCLUDED.requirements,
  responsibilities = EXCLUDED.responsibilities,
  benefits = EXCLUDED.benefits,
  status = EXCLUDED.status,
  positions_available = EXCLUDED.positions_available,
  posted_by = EXCLUDED.posted_by,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- Insert data into lead_groups (1 rows)
INSERT INTO public.lead_groups (id, user_id, company_id, assigned_to, group_name, created_at, updated_at)
VALUES
  ('a978f2e9-ced2-47fc-ad7b-3fc955c47c30', '510cf19e-123d-41e8-b58d-f1c99ee58296', '78626c8f-108c-47f1-8d71-423305e3b3a4', '002ee72e-af81-4675-8fcd-baa5c382f088', 'Customers', '2025-11-06T07:58:00.281579+00:00', '2025-11-06T08:50:56.315256+00:00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  assigned_to = EXCLUDED.assigned_to,
  group_name = EXCLUDED.group_name,
  updated_at = EXCLUDED.updated_at;

-- Insert data into leads (183 rows)
INSERT INTO public.leads (id, user_id, company_id, name, email, contact, description, other, group_id, client_id, job_id, assigned_to, status, created_at, updated_at)
VALUES
  ('673d7edd-7be1-48c6-bd1c-40bd9413c1f0', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Atharva', 'aa', '7517928086', NULL, '{"company":"dd"}'::jsonb, NULL, NULL, NULL, '93a34221-98be-4aec-b95f-ae69252e3cd8', 'not_interested', '2025-12-03T13:59:06.885445+00:00', '2025-12-03T13:59:14.780264+00:00'),
  ('e650bb71-b868-4bc8-9fb6-c333358c1cfe', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Aditya', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('bd21a604-5d5f-4cb6-b82b-6439fb9da592', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Wipro', 'Pranav', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('4740f2ac-217e-4ff2-84c9-9c0831eec971', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Sanket', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('37897cc5-aa6c-4857-9cd2-6d368aa35e45', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Rahul', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('846acf1f-7904-4930-945c-04796c9c71fc', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Technologies', 'Laxmi', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('0d854f7a-9e64-4f94-9c45-178dafe17b75', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'TCS', 'Krithika', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('ed34ff13-b254-4e76-8757-cae19eeba4d7', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Wipro', 'Arnav', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('4b2e4dc7-f1c9-45df-968c-53af3728ef6f', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Capgemini', 'Rishita', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('c22605db-7044-4ba0-9a17-ad10146466c3', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Harsh', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('68737483-c789-43cf-bde7-9203b7307227', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Rushabh', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('873076df-2b83-4ea1-aa64-86171291e0e5', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'TCS', 'Tanvi', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('c2c48229-b1e1-4738-b7ec-2d9cf6fedd77', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Karan', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('8775144a-3b00-4b31-bc71-a18701fdc626', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Capgemini', 'Megha', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('216332b2-a720-4786-b02d-501bc4a631bc', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Rohan', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('ed048c0b-6d70-4dd6-9996-0f16c97cdbc8', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Technologies', 'Divya', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('40fa3ef6-ca70-4331-9745-8243d96ef0e1', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Nikhil', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('b735c088-5e92-47ae-89da-9b9e4bd4bf02', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Wipro', 'Simran', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('1fda8f83-829f-4299-ab7f-876f405a53c5', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Capgemini', 'Amit', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('8c2441c3-4d19-45ee-9007-b2b1d9c488bb', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Infosys', 'Sneha', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('ab43b2f5-5d2b-42e9-a0fc-6cd89affdc07', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Technologies', 'Vivek', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('a0ac6352-e081-4672-9c89-5df6aa3f5484', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Kabir', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('06ef5ce9-421d-4d6c-9845-031fd1fc8876', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Mitali', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('8eff8cdc-357b-476b-b7a2-db6f00aaaa5e', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Samar', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('e7af27e2-b89c-40c0-8d01-c1d3742be994', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Jhanvi', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('d41d0aab-5088-4117-85e2-76ef23b69639', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Reyansh', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('1a907c0f-1cad-47b6-b160-58984fd3cf3c', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Navya', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('c9c5691c-6b25-43db-9b16-a3d0997ea1c5', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Wipro', 'Ira', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('0ed4e95c-29d0-4684-b0b2-4b0d39351e4c', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Vivaan', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('33dc1172-242b-4aaf-8d1a-75bf87b531e2', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Myra', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('0640f434-6884-43cc-85ea-0f7f4c5bc961', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Atharv', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('91b2ebde-9090-4a00-b5fd-01904691adbc', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'TCS', 'Advika', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('c73e2fed-eeec-4e9c-a6ec-cbbfc5373d2a', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Wipro', 'Rehaan', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('42cf626e-67df-4d3c-aa40-2616eab87e01', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Capgemini', 'Tanish', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('5bb49a8d-75cd-4753-aa86-ff54b657b8f8', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Samaira', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('d4e29189-b480-43d7-bdd0-ee8b7957395d', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Technologies', 'Aayush', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('748488e6-f68c-4e43-ad9e-297c9ecb0bc1', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Kritika', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('225aa6b2-fe42-4bda-89ad-5fa142797659', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Wipro', 'Dhruvi', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('3cc6b87c-6d52-4ea9-bcdc-f63d2f1d3da6', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Yuvraj', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('30c36f8a-2fc1-4e19-a732-78cfee65ec2c', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Anvi', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('ca1f9ff4-02b8-4ec8-9b8c-f728c335e661', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Technologies', 'Ishaan', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('0bf68996-2147-4dce-9669-92f510994fcf', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'TCS', 'Trisha', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('e7575338-ec70-454b-9e66-b49cbac45760', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Randeep', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('b5e449ae-4385-4412-92ee-47fb68872e2d', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Capgemini', 'Manisha', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('94d806c4-42f0-4431-832b-9eaa048048da', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Infosys', 'Devansh', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('f6e61189-22e2-4a85-a145-2c5f09a02fda', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Technologies', 'Kavya', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('085de4f4-747f-428c-9e7b-06a123a827e2', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'TCS', 'G', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('54ef9578-5662-4c70-bc3f-92aceb4b1c76', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Wipro', 'Neeraj', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('59ac7554-6342-4bd0-9555-9b7e810f1d68', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Bhavana', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('dba1b632-a56c-4279-ab82-84e0ae2ad535', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Zoya', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('ed5ae425-39c1-49fe-a6b5-c4d5a1b14e37', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Technologies', 'Sarvesh', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('c90ebe05-eaea-4c8d-b8d4-3cc2044738f1', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Prisha', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('e417f937-1b37-442f-b6bd-a5265f7f22e2', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Wipro', 'Harnoor', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('12ebf81c-6f72-4b23-83da-622ba51d7dc4', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Capgemini', 'Ahaan', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('240fd6e4-1fd1-44f5-8956-5de0a03f6db9', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Infosys', 'Rudra', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('755c15be-663c-41a9-a613-c5fd99fc3e09', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Technologies', 'Diya', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('bb175d14-ef32-467b-b954-41befd8c3e21', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'TCS', 'Aaradhya', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('59147aab-e2c5-419e-8a64-a1edd6b710d1', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Vihaan', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('e96a0bd2-0a61-4d6b-85b6-6a69dc32bb4b', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Role', 'gg@gmail.com', 'Candidate', 'Employee', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:32:02.423584+00:00'),
  ('9961bd79-b0f3-443b-b7ef-aff9c558d3cb', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Ansh', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('b2a9af12-a0f5-41d0-ac19-46879d905d61', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Siddhi', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('d104e579-2633-404b-9c93-985f575770a3', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Tejal', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('dcaa3d20-a54c-4e4e-b6f6-cbae7ee64907', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'TCS', 'Samarjit', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('3a6c21e9-b2ad-4d76-b155-cd9d480cf4be', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Anushka', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('5d013a67-9ebe-4847-9508-66e51038d572', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Capgemini', 'Devika', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('9c1d89b9-8fb9-4f46-b35e-31ddf5149d74', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Infosys', 'Keshav', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('46821fd4-48c7-4111-838b-af0a855a5a5a', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Technologies', 'Yashika', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('1d8524d2-23d6-4af7-99bf-e3cc1a822185', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'TCS', 'Aditi', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('a0632e1f-8647-4d74-97ca-a2dc0e52f85c', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Omkara', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('0d3f277a-4df0-46f4-a079-d61cffc7b809', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Chinmay', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('02c85605-0e80-4430-8d9c-fc8f59fa2f6a', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Lavanya', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('07de5647-e149-4016-90ea-07371b95bf4b', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Technologies', 'Shivansh', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('5182b779-d265-4e6f-b274-1aee78085a17', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'TCS', 'Aarush', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('dee1ba71-5b89-4638-a59f-0b8bd777bb17', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Wipro', 'Shanaya', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('20ff55cf-e351-4278-b698-456df1aea252', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Capgemini', 'Prithvi', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('1c9b35ae-4e7f-4bd9-9b12-7823bd6eac36', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Infosys', 'Nayan', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('0f21f292-b9c8-4055-8a94-e12480577d52', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Varnika', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('11fd2f70-6d19-4dc6-a747-1aa340ebf9d0', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Ishir', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('e2d94f3c-3090-42a6-855a-ec1ec0172758', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Tara', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('ac6ae9ca-9715-4054-b68f-4e08e6e8e8e8', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Rudransh', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('8c48b0ba-6787-457a-9e05-32d899f35cbb', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Mihika', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('610e0d0d-40dc-4c93-b412-4757dbbd29ad', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Technologies', 'Krupal', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('3460da35-a4dd-40ad-b356-667c57357ea4', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'TCS', 'Aarini', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('691ea9e7-9113-4b24-9b76-041099895cfc', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Wipro', 'Sarwin', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('7f49be85-ce8c-4a78-9763-0f8ae59537dc', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Capgemini', 'Keyur', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('c23599e2-90e1-4b3d-b293-24263a10027e', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Infosys', 'Ruhika', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('8d9e4459-fa74-4a01-ac31-d698430e5d78', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Vivik', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('1768c789-2ff0-4e8b-9c78-e49870dcdb57', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'TCS', 'Tanirika', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('a9d9be0e-3f49-474b-a563-7113ee79cbad', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Ehan', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('b67fe534-76aa-4875-ac60-3627c3e3d991', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Mahin', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('8b0ffd3f-5479-461a-998e-caee441158f8', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Shravani', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('c622d8d7-e91d-44ec-80a4-9f8b0104adde', NULL, '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Technologies', 'Hriday', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'unassigned', '2025-12-03T14:23:43.338973+00:00', '2025-12-03T14:23:43.338973+00:00'),
  ('0da5b94a-0834-4220-be8f-1845a7dba2cf', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Role', 'Company', 'Candidate', 'Employee', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('87b4edc5-3ac1-42da-bb42-d7bb7df51d6f', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Aditya', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('ec43b8f0-6a19-4782-b0ee-ac06c3afa03e', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Wipro', 'Pranav', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('9324cd1c-14ba-4af4-9baf-b0cf02b89f36', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Sanket', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('e68f1114-b450-431e-a117-b6c60dfcc594', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Rahul', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('1e74ee8d-298b-4f48-bc02-c033f0151c92', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Technologies', 'Laxmi', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('ab6f6406-c0fd-44f1-a948-061ddacc6c26', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'TCS', 'Krithika', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('042e6044-4c9c-4698-9305-c157add21705', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Wipro', 'Arnav', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('3062b12f-48a4-4428-bffa-038217df662f', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Capgemini', 'Rishita', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('e0b96999-bca5-4fcd-9673-9be6780c3ee0', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Harsh', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('36b0b9c9-9a40-4f81-9c68-d540a0f4ea0b', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Rushabh', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('0bf316cc-9cc5-4594-83ed-6e6fb1bb2910', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'TCS', 'Tanvi', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('40b5a6a4-4283-4a64-a8df-f2176f016b2f', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Karan', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('e17c760f-275f-41c0-b1d6-76e6edafaa83', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Capgemini', 'Megha', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('9a703642-71ae-41ee-a7b6-3422a3038106', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Rohan', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('90956c63-748c-4d52-82e6-5fdb6d29b207', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Technologies', 'Divya', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('407a8437-ce1b-4fd8-9770-23c46d55ac50', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Nikhil', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('ccb5c7ae-156a-48ee-8c29-cc32dc580e3f', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Wipro', 'Simran', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('d772c9af-677d-4caf-9e68-b90e45372592', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Capgemini', 'Amit', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('070c1da3-5e74-4d26-ae44-1208478173d6', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Infosys', 'Sneha', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('b92d0812-436f-4c4e-8690-c38c3ebbd9f6', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Technologies', 'Vivek', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('d5c94b61-b978-4b7c-8b4f-caaf1bdc9afb', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Kabir', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('48ea9f11-187c-40a9-ae3c-82b041d732bf', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Mitali', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('db666908-ad04-426c-81b8-eed53b2c56d3', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Samar', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('31f513a8-7828-45d9-a414-f09e8f313d54', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Jhanvi', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('e31ac98f-3382-4777-97d6-0c0d4bea2f16', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Reyansh', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('77e9a46d-3701-4bb2-b85b-fc9939423c79', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Navya', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('c6b584df-d79c-4e22-9e55-8a54803e9512', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Wipro', 'Ira', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('66b593d3-0ea7-4405-9124-b15685255366', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Vivaan', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('4e401916-f200-43c3-8caf-1e88f97e15a6', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Myra', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('c900e9e0-f34d-4c78-a9f5-6b30562f0997', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Atharv', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('34466e1c-ea5f-471b-81b3-61b6db17ea6c', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'TCS', 'Advika', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('0a600d47-a264-4aa4-a5ec-aca6276f997f', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Wipro', 'Rehaan', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('5e574493-86bb-4301-b897-ebd0b6754479', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Capgemini', 'Tanish', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('df2a29e5-803d-4657-a348-72a5b14e5c25', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Samaira', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('48b0709b-1884-4d8b-a710-2536ad4081f5', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Technologies', 'Aayush', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('d064de37-ecf2-4739-8fa7-227809ac8e41', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Kritika', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('71ca568b-9644-4436-9a61-e16219751bf7', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Wipro', 'Dhruvi', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('c9dbbb36-9bed-4cda-8337-aaa67d26c3e1', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Yuvraj', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('1c4c2112-8c46-4462-b5c4-a1d26995c18a', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Anvi', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('1227c943-bfc7-4c6d-9219-70466433ac91', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Technologies', 'Ishaan', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('1925b696-b441-4bbf-81cc-409f3296a219', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'TCS', 'Trisha', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('80587005-6c7f-4ac9-b1d2-9d042cc48782', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Randeep', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('45ca2475-b28a-4855-a4c3-7bf86323a1e4', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Capgemini', 'Manisha', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('956c02a5-8fc4-41a5-a3ef-f830bea54323', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Infosys', 'Devansh', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('c06424ff-f403-4a8c-9102-f93a6eea6d95', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Technologies', 'Kavya', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('14f68bc6-14eb-46fc-809b-4e3224a92377', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'TCS', 'G', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('d5537ff9-44a7-40ec-9c76-db6e6deb138d', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Wipro', 'Neeraj', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('fcee7bbd-5757-410c-a09c-c5c72b67b7f4', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Bhavana', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('6b33a435-ba4d-4275-95a1-be67b8b09617', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Zoya', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('14554801-d5be-4166-b0b3-21f66cb28a8a', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Technologies', 'Sarvesh', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('d76cbde9-90e6-4ff2-a16d-32e8a197213a', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Prisha', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('d675c0ca-9978-45c9-9869-51d625b72db3', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Wipro', 'Harnoor', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('cb0b4ce3-9e9a-4260-a02f-bbc6f52c6038', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Capgemini', 'Ahaan', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('dfb92414-c90c-4451-927c-4053591a6cb4', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Infosys', 'Rudra', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('b3da9b82-2426-48a1-934a-7634b17a6de1', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Technologies', 'Diya', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('de0321da-5dce-4dac-bcde-31ed341780ee', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'TCS', 'Aaradhya', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('8133dab5-ac79-4777-aba2-019d7c4557ec', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Vihaan', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('6ce7885a-471e-40cb-98e8-6be97feb886f', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Ansh', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('7d1c12eb-ceb4-4620-ba90-b35fed0ab2bc', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Siddhi', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('f8e4ad0e-981d-4ad5-804a-dd4b67a90fb8', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Tejal', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('6773b5eb-df46-4225-a4b4-001e548c7b37', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'TCS', 'Samarjit', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('a6e4f78f-65f9-4943-bc36-2dcbe5af0b3e', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Anushka', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('be3c0a99-299f-4106-9432-25316aa43fd2', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Capgemini', 'Devika', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('e1758a5e-38b0-4c0f-aacc-907706b02c85', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Infosys', 'Keshav', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('55abca70-e6f8-496b-832b-74c7c01ee67f', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Technologies', 'Yashika', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('1bf44c8d-ed10-4beb-a277-2aaa620266d7', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'TCS', 'Aditi', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('591f2507-a188-4ef3-aa68-0284255dac79', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Omkara', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('8fc49b39-0e6d-4b3f-b465-a37f85a224cc', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Chinmay', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('a93a919b-4744-42f5-a358-54ebdef41e0d', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Lavanya', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('eb9682dc-fde7-438e-8021-5923b0bc1d2d', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Technologies', 'Shivansh', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('c2a50251-a0dd-44e8-a51d-c66359611ba5', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'TCS', 'Aarush', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('05ec0adf-88fd-49c2-916a-5c838dcadc3d', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Wipro', 'Shanaya', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('10fdee35-1777-4ed6-9c0b-3e0fa4892ecb', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Capgemini', 'Prithvi', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('c0a0187f-d8c2-49c9-8076-29c011b4dbe1', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Infosys', 'Nayan', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('6ba660cf-3a64-402f-810b-87aec2530d50', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Varnika', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('76630791-4da0-42b7-9278-4ccb2b5fcb55', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'TCS', 'Ishir', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('21485cab-00fc-4774-83be-93cf827b3d0c', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Tara', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('74a2f423-9256-4577-a353-04451788b54f', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Rudransh', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('ab784d5c-2d84-4e91-bdf8-97e7842f943a', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Infosys', 'Mihika', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('91f9457b-a5b8-4baa-842d-6dcb7a552ff4', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Technologies', 'Krupal', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('d90bb4b2-4aae-47f6-95ab-71fe45a54384', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'TCS', 'Aarini', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('58e90356-f123-4cde-a9f3-b19e3ced8930', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Wipro', 'Sarwin', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('d605f48b-9611-4fce-bd4b-a5152ba7b0c2', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'Capgemini', 'Keyur', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('18088d11-2b3c-42d3-8f6e-9f279fa74807', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Manager', 'Infosys', 'Ruhika', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('fda8e2fc-5362-480b-8b58-925a6e184495', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Technologies', 'Vivik', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('8cac6a90-c577-4be5-b315-e5b0d326a12d', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Analyst', 'TCS', 'Tanirika', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('86fff1d0-11ed-452f-abf2-8699ffbf7620', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Wipro', 'Ehan', 'Rajpal', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('90cd8ca3-44a1-4f89-a977-408cdfb4cc73', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Capgemini', 'Mahin', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('c3fed6b1-461e-4df4-9311-196e43530d63', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Designer', 'Infosys', 'Shravani', 'Aarav', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00'),
  ('439f3156-972a-4be0-8011-4fb6d1074d8d', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'Engineer', 'Technologies', 'Hriday', 'Atharva', NULL, NULL, NULL, NULL, NULL, 'assigned', '2025-12-03T14:32:54.97323+00:00', '2025-12-03T14:32:54.97323+00:00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  contact = EXCLUDED.contact,
  description = EXCLUDED.description,
  other = EXCLUDED.other,
  group_id = EXCLUDED.group_id,
  client_id = EXCLUDED.client_id,
  job_id = EXCLUDED.job_id,
  assigned_to = EXCLUDED.assigned_to,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- Insert data into call_history (1 rows)
INSERT INTO public.call_history (id, lead_id, employee_id, company_id, call_date, outcome, notes, next_follow_up, next_follow_up_time, auto_call_followup, call_details, exotel_response, exotel_call_sid, exotel_from_number, exotel_to_number, exotel_caller_id, exotel_status, exotel_duration, exotel_recording_url, exotel_start_time, exotel_end_time, exotel_answered_by, exotel_direction, created_at, updated_at)
VALUES
  ('35aa4781-5795-4045-ac5c-557be4c207d6', '673d7edd-7be1-48c6-bd1c-40bd9413c1f0', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', '2025-12-03T13:59:14.499837+00:00', 'not_interested', 'aa', NULL, NULL, false, NULL, '{"To":"07517928086","Sid":"b0b55e6319131634d56d2fbc184419c3","Uri":"/v1/Accounts/tasknova1/Calls/b0b55e6319131634d56d2fbc184419c3.json","From":"09175442260","Price":null,"Status":"completed","EndTime":"2025-12-03 19:28:55","Duration":null,"Direction":"outbound-api","StartTime":"2025-12-03 19:28:09","AccountSid":"tasknova1","AnsweredBy":null,"CallerName":null,"DateCreated":"2025-12-03 19:28:09","DateUpdated":"2025-12-03 19:28:55","RecordingUrl":"https://recordings.exotel.com/exotelrecordings/tasknova1/b0b55e6319131634d56d2fbc184419c3.mp3","ForwardedFrom":null,"ParentCallSid":null,"PhoneNumberSid":"07314626705"}'::jsonb, 'b0b55e6319131634d56d2fbc184419c3', '9175442260', '7517928086', '07314626705', 'completed', NULL, 'https://recordings.exotel.com/exotelrecordings/tasknova1/b0b55e6319131634d56d2fbc184419c3.mp3', '2025-12-03T19:28:09+00:00', '2025-12-03T19:28:55+00:00', NULL, 'outbound-api', '2025-12-03T13:59:14.499837+00:00', '2025-12-03T13:59:14.499837+00:00')
ON CONFLICT (id) DO UPDATE SET
  lead_id = EXCLUDED.lead_id,
  employee_id = EXCLUDED.employee_id,
  company_id = EXCLUDED.company_id,
  call_date = EXCLUDED.call_date,
  outcome = EXCLUDED.outcome,
  notes = EXCLUDED.notes,
  next_follow_up = EXCLUDED.next_follow_up,
  next_follow_up_time = EXCLUDED.next_follow_up_time,
  auto_call_followup = EXCLUDED.auto_call_followup,
  call_details = EXCLUDED.call_details,
  exotel_response = EXCLUDED.exotel_response,
  exotel_call_sid = EXCLUDED.exotel_call_sid,
  exotel_from_number = EXCLUDED.exotel_from_number,
  exotel_to_number = EXCLUDED.exotel_to_number,
  exotel_caller_id = EXCLUDED.exotel_caller_id,
  exotel_status = EXCLUDED.exotel_status,
  exotel_duration = EXCLUDED.exotel_duration,
  exotel_recording_url = EXCLUDED.exotel_recording_url,
  exotel_start_time = EXCLUDED.exotel_start_time,
  exotel_end_time = EXCLUDED.exotel_end_time,
  exotel_answered_by = EXCLUDED.exotel_answered_by,
  exotel_direction = EXCLUDED.exotel_direction,
  updated_at = EXCLUDED.updated_at;

-- Insert data into user_profiles (2 rows)
INSERT INTO public.user_profiles (id, user_id, email, full_name, avatar_url, company_name, company_email, company_industry, position, use_cases, onboarding_completed, created_at, updated_at)
VALUES
  ('649110b7-de28-490b-9472-8d910d9ccd8b', '510cf19e-123d-41e8-b58d-f1c99ee58296', 'aarav2110@gmail.com', 'Aarav Varma ', NULL, 'Tasknova', 'contact.tasknova@gmail.com', 'Marketing', NULL, NULL, true, '2025-10-30T13:09:19.41391+00:00', '2025-10-30T13:09:19.41391+00:00'),
  ('664ec1ca-a830-4cad-8d10-02bd6878a656', 'da9f9588-aef8-4c8c-b3ac-465218b0eed7', 'contact.tasknova@gmail.com', 'TaskNova', 'https://lh3.googleusercontent.com/a/ACg8ocKINweqY-NRfzL_nWua6K6j6z6je-lWc_9_0vXtAPVW1iVpxM0=s96-c', 'Tasknova', 'contact.tasknova@gmail.com', 'Healthcare', 'COO / Chief Operating Officer', ARRAY['Sales Call Analysis', 'Recruitment Call Analysis'], true, '2025-11-04T07:14:01.164+00:00', '2025-11-04T07:14:01.165+00:00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  company_name = EXCLUDED.company_name,
  company_email = EXCLUDED.company_email,
  company_industry = EXCLUDED.company_industry,
  position = EXCLUDED.position,
  use_cases = EXCLUDED.use_cases,
  onboarding_completed = EXCLUDED.onboarding_completed,
  updated_at = EXCLUDED.updated_at;

-- Insert data into user_roles (10 rows)
INSERT INTO public.user_roles (id, user_id, company_id, role, manager_id, is_active, created_at, updated_at)
VALUES
  ('0881275d-7b86-4369-8727-f64c1901de3b', '510cf19e-123d-41e8-b58d-f1c99ee58296', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'admin', NULL, true, '2025-10-30T13:09:19.289442+00:00', '2025-10-30T13:09:19.289442+00:00'),
  ('5b6fc896-7037-43a1-8466-a4d6ef3235ef', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'manager', NULL, true, '2025-10-30T13:13:07.670161+00:00', '2025-10-30T13:13:07.670161+00:00'),
  ('054df347-a227-4df3-ae72-c3b94e08ce79', '93a34221-98be-4aec-b95f-ae69252e3cd8', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'employee', '002ee72e-af81-4675-8fcd-baa5c382f088', true, '2025-10-30T13:29:24.320549+00:00', '2025-10-30T13:29:24.320549+00:00'),
  ('0b766677-075c-4153-8a74-9cbb90c0a000', '92e013fc-491d-4006-a8b1-9e00e748d9af', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'employee', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', true, '2025-11-19T11:55:24.135555+00:00', '2025-11-19T11:55:24.135555+00:00'),
  ('6dd2e2bc-0bca-4c98-bc9f-d1de4f727617', '9da4238c-1992-4dca-9899-3442fb13fefb', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'employee', 'bdcf2dbf-7a31-48eb-8995-6b359e5d2c4f', true, '2025-11-20T10:21:27.351837+00:00', '2025-11-20T10:21:27.351837+00:00'),
  ('4139dd0d-6f96-400c-8d77-dcc5a5587a84', 'd071a83b-172a-495a-8225-6e69fb29523a', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'manager', NULL, true, '2025-11-20T10:47:51.974754+00:00', '2025-11-20T10:47:51.974754+00:00'),
  ('181b0735-bcdd-4e9f-935f-13f21a25f573', '24d8b2ba-9d8d-4d65-a713-8cfe6cf09977', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'manager', NULL, true, '2025-11-20T10:49:08.654906+00:00', '2025-11-20T10:49:08.654906+00:00'),
  ('81fe0e50-39e5-4df2-a440-62ecb623d154', 'da431211-d6e4-41bd-8267-af71f366af50', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'employee', '97bc90a7-ad27-4333-b9f0-1add670a6765', true, '2025-11-24T07:47:01.15556+00:00', '2025-11-24T07:47:01.15556+00:00'),
  ('7a97c92b-280c-42a6-a235-ec15137a8e9b', '4d52f0ed-5c6a-4afb-9f31-3f301a2582e8', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'employee', '97bc90a7-ad27-4333-b9f0-1add670a6765', true, '2025-11-24T07:47:45.695941+00:00', '2025-11-24T07:47:45.695941+00:00'),
  ('302f8039-3343-4d06-a2ba-d71b14f444b2', 'dc7c6176-3775-430c-9d69-9a5357dbd19c', '78626c8f-108c-47f1-8d71-423305e3b3a4', 'employee', '97bc90a7-ad27-4333-b9f0-1add670a6765', true, '2025-11-24T07:48:29.475516+00:00', '2025-11-24T07:48:29.475516+00:00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  role = EXCLUDED.role,
  manager_id = EXCLUDED.manager_id,
  is_active = EXCLUDED.is_active,
  updated_at = EXCLUDED.updated_at;

-- Insert data into manager_client_assignments (5 rows)
INSERT INTO public.manager_client_assignments (id, manager_id, client_id, assigned_by, assigned_at, is_active, created_at)
VALUES
  ('d646d665-0bec-4daa-87b4-d1c58c334053', '002ee72e-af81-4675-8fcd-baa5c382f088', '84057c47-1f8c-4f6f-ac9f-9e2232dcb0c7', '510cf19e-123d-41e8-b58d-f1c99ee58296', '2025-11-19T10:40:50.345+00:00', true, '2025-11-19T10:40:50.42339+00:00'),
  ('71f40b8d-aa19-4203-bc94-363d9bb0e6dd', '002ee72e-af81-4675-8fcd-baa5c382f088', '8cbd4255-86b5-4b56-b2ea-0141c4a1ff84', '510cf19e-123d-41e8-b58d-f1c99ee58296', '2025-11-19T10:40:50.345+00:00', true, '2025-11-19T10:40:50.42339+00:00'),
  ('114db594-75b0-467f-8b95-eb96ff553aa6', '97bc90a7-ad27-4333-b9f0-1add670a6765', '63ad6f39-7c3d-444a-b50b-fbda4321beb6', '510cf19e-123d-41e8-b58d-f1c99ee58296', '2025-11-20T10:47:52.544+00:00', true, '2025-11-20T10:47:52.16784+00:00'),
  ('66618660-1aa9-4391-85d1-8df2d5efcad4', '97bc90a7-ad27-4333-b9f0-1add670a6765', '8737ca2f-2d63-42e5-955b-c6ccc927aeb4', '510cf19e-123d-41e8-b58d-f1c99ee58296', '2025-11-20T10:47:52.551+00:00', true, '2025-11-20T10:47:52.16784+00:00'),
  ('bd7c8b36-a8e1-4a0c-a34f-4c06a517a011', 'fe610b39-e206-4ebf-8467-66e4de986184', 'b1ac0a84-2108-4c59-bab7-afaa92c520d6', '510cf19e-123d-41e8-b58d-f1c99ee58296', '2025-11-20T10:49:09.213+00:00', true, '2025-11-20T10:49:08.809973+00:00')
ON CONFLICT (id) DO UPDATE SET
  manager_id = EXCLUDED.manager_id,
  client_id = EXCLUDED.client_id,
  assigned_by = EXCLUDED.assigned_by,
  assigned_at = EXCLUDED.assigned_at,
  is_active = EXCLUDED.is_active;

-- Insert data into company_settings (1 rows)
INSERT INTO public.company_settings (id, company_id, caller_id, from_numbers, exotel_api_key, exotel_api_token, exotel_subdomain, exotel_account_sid, exotel_setup_completed, created_at, updated_at)
VALUES
  ('1e36ef04-9e32-4789-84fc-e71316471bf4', '78626c8f-108c-47f1-8d71-423305e3b3a4', '073-146-26705', '["7887766008", "9175442260"]'::jsonb, NULL, NULL, 'api.exotel.com', NULL, false, '2025-10-30T13:41:24.37435+00:00', '2025-11-17T09:33:16.486071+00:00')
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  caller_id = EXCLUDED.caller_id,
  from_numbers = EXCLUDED.from_numbers,
  exotel_api_key = EXCLUDED.exotel_api_key,
  exotel_api_token = EXCLUDED.exotel_api_token,
  exotel_subdomain = EXCLUDED.exotel_subdomain,
  exotel_account_sid = EXCLUDED.exotel_account_sid,
  exotel_setup_completed = EXCLUDED.exotel_setup_completed,
  updated_at = EXCLUDED.updated_at;

-- =============================================
-- CRON JOB SETUP (Optional - requires pg_cron extension)
-- =============================================
-- Example: Daily cleanup of old recordings at 2 AM
-- SELECT cron.schedule(
--   'cleanup-old-recordings',
--   '0 2 * * *',
--   $$ DELETE FROM public.recordings WHERE created_at < NOW() - INTERVAL '90 days' $$
-- );

-- Example: Weekly metrics aggregation every Sunday at 3 AM
-- SELECT cron.schedule(
--   'weekly-metrics-aggregation',
--   '0 3 * * 0',
--   $$ INSERT INTO public.metrics_aggregates (company_id, period_type, period_start, period_end, metrics_data, created_at)
--        SELECT company_id, 'week', date_trunc('week', NOW() - INTERVAL '1 week'), date_trunc('week', NOW()), 
--               jsonb_build_object('total_calls', COUNT(*)), NOW()
--        FROM public.call_history
--        WHERE call_date >= date_trunc('week', NOW() - INTERVAL '1 week')
--        GROUP BY company_id $$
-- );

-- =============================================
-- Migration Complete
-- =============================================
-- Database: Sattva Call Analysis (Supabase PostgreSQL)
-- Schema Version: 1.0
-- Tables: 19 (companies, managers, employees, clients, jobs, leads, lead_groups, lead_assignments, 
--             call_history, call_outcomes, recordings, analyses, user_profiles, user_roles, 
--             employee_daily_productivity, metrics_aggregates, manager_client_assignments, 
--             removed_leads, company_settings)
-- Total Rows Inserted: 243
-- Extensions: uuid-ossp, pg_cron, pgcrypto
-- Features: RLS Policies, Triggers (updated_at), Indexes (50+), Foreign Keys
-- Generated: December 2025
-- =============================================

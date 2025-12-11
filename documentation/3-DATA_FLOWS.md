# Data Flow Documentation - Sattva Call Analysis Platform

## Overview
This document maps all major data flows through the Sattva Call Analysis platform, from user interactions to database storage and external API integrations.

---

## 1. Authentication Flow

### Admin Login Flow
```
┌──────────────┐
│  User enters │
│  credentials │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ AdminLogin Component │
│ Validates form input │
└──────┬───────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ AuthContext.signInAdmin()       │
│ 1. Query admins table by email  │
│ 2. Verify password (bcrypt)     │
│ 3. Fetch company data           │
└──────┬──────────────────────────┘
       │
       ▼ Success
┌────────────────────────────────┐
│ Store in localStorage:         │
│ - custom_auth_session          │
│ - User object                  │
│ - Role: 'admin'                │
│ - Company ID                   │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────┐
│ Set AuthContext state: │
│ - user                 │
│ - userRole             │
│ - company              │
└──────┬─────────────────┘
       │
       ▼
┌──────────────────┐
│ Navigate to      │
│ Admin Dashboard  │
└──────────────────┘
```

**Data Storage Locations**:
1. **Database**: `admins` table (user credentials), `companies` table
2. **localStorage**: Session data
3. **React State**: AuthContext state

---

### Manager Login Flow
```
┌──────────────┐
│  User enters │
│  email, pwd, │
│  company ID  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ManagerLogin Component│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ AuthContext.signInManager()      │
│ 1. Query managers table          │
│ 2. Filter by email + company_id  │
│ 3. Verify password               │
└──────┬───────────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Create user_roles entry if │
│ not exists (role: manager) │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────┐
│ Store session data │
│ Navigate to        │
│ Manager Dashboard  │
└────────────────────┘
```

---

### Employee Login Flow
```
┌──────────────┐
│  Employee    │
│  enters      │
│  credentials │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ EmployeeLogin Component  │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ Call RPC: authenticate_employee    │
│ Parameters:                        │
│ - p_email                          │
│ - p_password                       │
│ - p_company_id                     │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────────────────────┐
│ RPC Function (Server-side):        │
│ 1. SELECT from employees WHERE     │
│    email AND company_id            │
│ 2. Verify password hash            │
│ 3. Return employee record if valid │
└──────┬─────────────────────────────┘
       │
       ▼
┌────────────────────┐
│ Fetch assigned     │
│ phone number from  │
│ phone_numbers      │
│ table              │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Store session      │
│ Navigate to        │
│ Employee Dashboard │
└────────────────────┘
```

---

## 2. Lead Management Flow

### Add Lead Flow
```
┌──────────────┐
│ User clicks  │
│ "Add Lead"   │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ AddLeadModal     │
│ Form displayed   │
└──────┬───────────┘
       │
       ▼
┌──────────────────────────┐
│ User fills:              │
│ - Name                   │
│ - Email                  │
│ - Contact                │
│ - Client (dropdown)      │
│ - Job (dropdown)         │
│ - Group (dropdown)       │
│ - Description            │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Form validation (Zod)    │
│ - Email format           │
│ - Phone: exactly 10 dig  │
│ - Required fields        │
└──────┬───────────────────┘
       │
       ▼ Valid
┌────────────────────────────────┐
│ INSERT into leads table:       │
│ {                              │
│   name, email, contact,        │
│   client_id, job_id,           │
│   group_id, description,       │
│   company_id, user_id,         │
│   status: 'unassigned',        │
│   created_at: now()            │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────┐
│ Refresh leads list     │
│ Show success toast     │
│ Close modal            │
└────────────────────────┘
```

**Database Tables Involved**:
- `leads` (insert)
- `clients` (reference)
- `jobs` (reference)
- `lead_groups` (reference)

---

### CSV Upload Flow
```
┌──────────────┐
│ User uploads │
│ CSV file     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ CSVUploadDialog          │
│ Parse CSV using PapaParse│
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Validate CSV headers:    │
│ Required: name, email,   │
│          contact         │
│ Optional: description,   │
│          other fields    │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Map CSV rows to lead obj:  │
│ leads = rows.map(row => ({ │
│   name: row.name,          │
│   email: row.email,        │
│   contact: row.contact,    │
│   description: row.desc,   │
│   other: {...}             │
│ }))                        │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Bulk INSERT:               │
│ supabase                   │
│   .from('leads')           │
│   .insert(leads.map(l => ({│
│     ...l,                  │
│     company_id,            │
│     user_id,               │
│     group_id,              │
│     status: 'unassigned'   │
│   })))                     │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────┐
│ Show success   │
│ Refresh UI     │
└────────────────┘
```

---

## 3. Call Making Flow

### Initiate Call Flow
```
┌──────────────┐
│ Employee     │
│ clicks call  │
│ button on    │
│ lead card    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│ PhoneDialer Component    │
│ Pre-fills lead's number  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Get employee's assigned  │
│ phone number from        │
│ phone_numbers table      │
│ WHERE employee_id = id   │
└──────┬───────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Get company Exotel settings:   │
│ SELECT * FROM company_settings │
│ WHERE company_id = ?           │
│ Returns:                       │
│ - exotel_api_key               │
│ - exotel_api_token             │
│ - exotel_account_sid           │
│ - caller_id                    │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Make Exotel API Call:          │
│ POST /Calls/connect.json       │
│ Body:                          │
│ {                              │
│   From: assigned_phone_number, │
│   To: lead_contact,            │
│   CallerId: company_caller_id, │
│   Url: webhook_url,            │
│   StatusCallback: webhook_url  │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Exotel Response:               │
│ {                              │
│   Call: {                      │
│     Sid: "unique-call-sid",    │
│     Status: "queued",          │
│     DateCreated: timestamp     │
│   }                            │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ INSERT into call_history:      │
│ {                              │
│   lead_id,                     │
│   employee_id,                 │
│   company_id,                  │
│   exotel_call_sid,             │
│   exotel_from_number,          │
│   exotel_to_number,            │
│   exotel_status: 'queued',     │
│   exotel_response: {...},      │
│   call_date: now()             │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────┐
│ Update login_time in   │
│ employee_daily_        │
│ productivity (if first │
│ call of the day)       │
└──────┬─────────────────┘
       │
       ▼
┌────────────────┐
│ Show calling   │
│ status in UI   │
└────────────────┘
```

---

### Call Status Update Flow (Webhook)
```
┌──────────────┐
│ Exotel sends │
│ webhook POST │
│ to Edge Func │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ Edge Function:                 │
│ webhook-call-capture           │
│ Receives payload:              │
│ {                              │
│   CallSid, Status, Duration,   │
│   RecordingUrl, StartTime,     │
│   EndTime, DialCallStatus, ... │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Extract phone number from "To" │
│ Search for lead:               │
│ SELECT * FROM leads            │
│ WHERE contact = extracted_num  │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ UPDATE call_history            │
│ SET                            │
│   exotel_status = Status,      │
│   exotel_duration = Duration,  │
│   exotel_recording_url = url,  │
│   exotel_start_time,           │
│   exotel_end_time,             │
│   outcome = map_status(),      │
│   updated_at = now()           │
│ WHERE exotel_call_sid = CallSid│
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ If Duration >= 30 seconds:     │
│   outcome = 'completed'        │
│   (relevant call)              │
│ Else if Duration < 30:         │
│   outcome = 'completed'        │
│   (irrelevant - too short)     │
│ Status mapping:                │
│ - 'busy' → outcome: 'busy'     │
│ - 'no-answer' → 'no-answer'    │
│ - 'failed' → 'failed'          │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────┐
│ Update employee        │
│ productivity metrics:  │
│ - Increment calls_made │
│ - Update avg duration  │
└──────┬─────────────────┘
       │
       ▼
┌────────────────┐
│ Send 200 OK to │
│ Exotel         │
└────────────────┘
```

**Database Tables Updated**:
- `call_history` (status, duration, recording URL)
- `employee_daily_productivity` (calls_made counter)

---

## 4. Call Analysis Flow

### Recording Upload & Analysis Flow
```
┌──────────────┐
│ Employee     │
│ uploads call │
│ recording    │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ AddRecordingModal              │
│ User selects:                  │
│ - Audio file                   │
│ - Assigned employee (optional) │
│ - Associated lead (optional)   │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Upload to Supabase Storage:    │
│ Bucket: 'recordings'           │
│ Path: {user_id}/{filename}     │
│ Returns: { path, fullPath }    │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Get public URL:                │
│ supabase.storage               │
│   .from('recordings')          │
│   .getPublicUrl(path)          │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ INSERT into recordings:        │
│ {                              │
│   user_id,                     │
│   file_name,                   │
│   recording_url,               │
│   recording_key: path,         │
│   assigned_to: employee_id,    │
│   lead_id,                     │
│   status: 'uploaded',          │
│   created_at: now()            │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Trigger AI Analysis            │
│ (Manual or automated)          │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Transcribe Audio               │
│ (External service or manual)   │
│ UPDATE recordings              │
│ SET transcript = text,         │
│     status = 'transcribing'    │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Call Google AI API:            │
│ model.generateContent({        │
│   prompt: analyze_template +   │
│           transcript           │
│ })                             │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Parse AI Response:             │
│ Extract:                       │
│ - Closure Probability          │
│ - Script Adherence             │
│ - Call Quality Score           │
│ - Objections Detected          │
│ - Objections Handled           │
│ - Executive Summary            │
│ - Next Steps                   │
│ - AI Feedback                  │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ INSERT into analyses:          │
│ {                              │
│   recording_id,                │
│   user_id,                     │
│   closure_probability,         │
│   script_adherence,            │
│   call_quality_score,          │
│   objections_detected,         │
│   objections_handled,          │
│   exec_summary,                │
│   next_steps,                  │
│   ai_feedback_for_recruiter,   │
│   status: 'completed',         │
│   created_at: now()            │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ UPDATE recordings              │
│ SET status = 'completed'       │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────┐
│ Show analysis  │
│ in UI          │
│ Send           │
│ notification   │
└────────────────┘
```

**Data Storage**:
- `recordings` table: Metadata, URL, transcript
- `analyses` table: AI-generated insights
- Supabase Storage: Actual audio files

---

## 5. Dashboard Metrics Flow

### Admin Dashboard Metrics
```
┌──────────────┐
│ Admin opens  │
│ Dashboard    │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ Fetch company overview:        │
│                                │
│ 1. Total Employees:            │
│    SELECT COUNT(*) FROM        │
│    employees WHERE company_id  │
│                                │
│ 2. Total Managers:             │
│    SELECT COUNT(*) FROM        │
│    managers WHERE company_id   │
│                                │
│ 3. Total Leads:                │
│    SELECT COUNT(*) FROM        │
│    leads WHERE company_id      │
│                                │
│ 4. Total Calls Today:          │
│    SELECT COUNT(*) FROM        │
│    call_history WHERE          │
│    company_id AND              │
│    DATE(call_date) = TODAY     │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Fetch Call Outcomes:           │
│ SELECT outcome,                │
│        COUNT(*) as count       │
│ FROM call_history              │
│ WHERE company_id = ?           │
│ GROUP BY outcome               │
│                                │
│ Returns:                       │
│ [                              │
│   {outcome: 'completed', cnt}, │
│   {outcome: 'busy', count},    │
│   {outcome: 'no-answer', cnt}, │
│   {outcome: 'failed', count}   │
│ ]                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Split 'completed' calls:       │
│                                │
│ Relevant (>= 30 sec):          │
│ SELECT COUNT(*) FROM           │
│ call_history WHERE             │
│ outcome = 'completed' AND      │
│ exotel_duration >= 30          │
│                                │
│ Irrelevant (< 30 sec):         │
│ SELECT COUNT(*) FROM           │
│ call_history WHERE             │
│ outcome = 'completed' AND      │
│ exotel_duration < 30           │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Calculate Avg Call Duration:   │
│ SELECT AVG(exotel_duration)    │
│ FROM call_history              │
│ WHERE company_id = ? AND       │
│       exotel_duration >= 30    │
│                                │
│ (Excludes calls < 30 seconds)  │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Fetch Top Performers:          │
│ SELECT e.full_name,            │
│        COUNT(ch.id) as calls   │
│ FROM employees e               │
│ LEFT JOIN call_history ch      │
│   ON e.user_id = ch.employee_id│
│ WHERE e.company_id = ?         │
│ GROUP BY e.id                  │
│ ORDER BY calls DESC            │
│ LIMIT 5                        │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Render Charts:                 │
│ - Pie Chart (Call Outcomes)    │
│ - Bar Chart (Calls Over Time)  │
│ - Stats Cards (Metrics)        │
│ - Table (Top Performers)       │
└────────────────────────────────┘
```

---

### Employee Dashboard Metrics
```
┌──────────────┐
│ Employee     │
│ logs in      │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ Fetch today's productivity:    │
│ SELECT * FROM                  │
│ employee_daily_productivity    │
│ WHERE employee_id = ? AND      │
│       date = CURRENT_DATE      │
│                                │
│ If not exists, create:         │
│ INSERT INTO                    │
│ employee_daily_productivity    │
│ (employee_id, date,            │
│  calls_made: 0,                │
│  calls_converted: 0)           │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Fetch call history:            │
│ SELECT * FROM call_history     │
│ WHERE employee_id = ?          │
│ ORDER BY call_date DESC        │
│ LIMIT 20                       │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Fetch assigned leads:          │
│ SELECT * FROM leads            │
│ WHERE assigned_to = ?          │
│   OR group_id IN (             │
│     SELECT id FROM lead_groups │
│     WHERE assigned_to =        │
│       employee.manager_id      │
│   )                            │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Display metrics:               │
│ - Calls made today             │
│ - Avg call duration            │
│ - Successful calls             │
│ - Pending follow-ups           │
│ - Lead list                    │
└────────────────────────────────┘
```

---

## 6. Profile Update Flow

### Admin Profile Update
```
┌──────────────┐
│ Admin clicks │
│ "Edit        │
│  Profile"    │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ ProfilePage displays form:     │
│ Pre-filled with current data   │
│ from AuthContext               │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ User updates fields:           │
│ - Full Name                    │
│ - Email                        │
│ - Phone                        │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Form validation (Zod)          │
└──────┬─────────────────────────┘
       │
       ▼ Valid
┌────────────────────────────────┐
│ Call RPC: update_admin_profile │
│ Parameters:                    │
│ {                              │
│   p_admin_id: currentUser.id,  │
│   p_full_name: formData.name,  │
│   p_email: formData.email,     │
│   p_phone: formData.phone      │
│ }                              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ RPC executes:                  │
│ UPDATE admins                  │
│ SET full_name = p_full_name,   │
│     email = p_email,           │
│     phone = p_phone,           │
│     updated_at = NOW()         │
│ WHERE id = p_admin_id          │
│ RETURNING *                    │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Update localStorage:           │
│ Merge updated fields into      │
│ custom_auth_session            │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Call refreshUserData():        │
│ Re-fetch admin record          │
│ Update AuthContext state       │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────┐
│ Show success   │
│ toast          │
│ UI updates     │
└────────────────┘
```

---

## 7. Phone Number Assignment Flow

### Assign Phone to Employee
```
┌──────────────┐
│ Manager      │
│ clicks       │
│ "Assign      │
│  Phone"      │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ Modal opens with:              │
│ - Phone number input           │
│ - Manager selector (dropdown)  │
│ - Employee selector (dropdown) │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Fetch managers:                │
│ SELECT * FROM managers         │
│ WHERE company_id = ?           │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ On manager select,             │
│ fetch their employees:         │
│ SELECT * FROM employees        │
│ WHERE manager_id = ?           │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ User fills form and submits    │
│ Validate: phone is 10 digits   │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Check if phone already exists: │
│ SELECT * FROM phone_numbers    │
│ WHERE phone_number = ?         │
└──────┬─────────────────────────┘
       │
       ▼ Not exists
┌────────────────────────────────┐
│ INSERT into phone_numbers:     │
│ {                              │
│   company_id,                  │
│   phone_number,                │
│   manager_id,                  │
│   employee_id (UNIQUE),        │
│   is_active: true,             │
│   created_at: now()            │
│ }                              │
│                                │
│ Note: employee_id has UNIQUE   │
│ constraint - one phone per     │
│ employee only                  │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────┐
│ Success toast  │
│ Refresh list   │
└────────────────┘
```

---

## Data Flow Summary

### Critical Data Paths
1. **Authentication**: Login → Validate → LocalStorage → AuthContext → Dashboard
2. **Call Flow**: UI → Exotel API → Webhook → Database → Metrics Update
3. **Lead Management**: Form → Validation → Database → UI Refresh
4. **Analysis**: Recording Upload → Storage → Transcription → AI Analysis → Database
5. **Metrics**: Database Queries → Aggregation → Chart Rendering

### Real-Time Updates
- **Call status**: Webhook-driven updates to `call_history`
- **Productivity**: Auto-updated via database triggers
- **Notifications**: Polling-based (could be upgraded to WebSocket)

### Data Consistency
- Foreign key constraints maintain referential integrity
- Transactions used for multi-table operations
- Timestamps track all changes (`created_at`, `updated_at`)

# Project Working Guide - Sattva Call Analysis Platform

## Table of Contents
1. [Project Overview](#project-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Core Features](#core-features)
4. [Workflow Processes](#workflow-processes)
5. [Integration Points](#integration-points)
6. [Common Operations](#common-operations)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## Project Overview

### Purpose
Sattva Call Analysis is a comprehensive recruitment call management platform that enables companies to:
- Manage leads and job postings
- Make and track calls via Exotel integration
- Analyze call recordings using AI
- Monitor employee productivity
- Generate performance reports

### Target Users
1. **Admins**: Company owners/administrators
2. **Managers**: Team leads managing employees
3. **Employees**: Recruiters making calls to candidates

---

## User Roles & Permissions

### Admin Role
**Access Level**: Full company access

**Capabilities**:
- Create and manage managers and employees
- Create and assign clients
- Create job postings
- View all leads across the company
- Upload CSV files to bulk import leads
- View company-wide analytics and reports
- Configure Exotel settings (API keys, phone numbers)
- Assign phone numbers to employees
- Update company profile
- Generate admin reports

**Dashboard Features**:
- Total employees count
- Total managers count
- Total leads count
- Total calls made today
- Call outcomes pie chart (completed relevant/irrelevant, busy, no-answer, failed)
- Average call duration (excluding calls < 30 seconds)
- Employee productivity table
- Recent call history

---

### Manager Role
**Access Level**: Assigned clients and team members

**Capabilities**:
- View assigned clients only
- Create and manage lead groups
- Assign leads to employees in their team
- View team member call history
- Access team productivity reports
- Make calls using assigned phone number
- Upload and analyze call recordings
- Monitor team performance metrics

**Dashboard Features**:
- Team overview (employees under management)
- Client assignments
- Lead group management
- Team call statistics
- Individual employee performance
- Manager-specific reports

---

### Employee Role
**Access Level**: Personal assignments only

**Capabilities**:
- View assigned leads
- Make calls using assigned phone number
- Log call outcomes and notes
- Schedule follow-ups
- Upload call recordings for analysis
- View personal call history
- Access personal productivity metrics
- View AI-generated call analysis

**Dashboard Features**:
- Personal productivity metrics
- Assigned leads list
- Recent call history
- Upcoming follow-ups
- Personal statistics (calls made, average duration, conversion rate)
- Phone dialer interface

---

## Core Features

### 1. Lead Management

#### Add Single Lead
**Process**:
1. Navigate to "All Leads" or specific client/job page
2. Click "Add Lead" button
3. Fill in lead details:
   - Name (required)
   - Email (required, validated format)
   - Contact (required, exactly 10 digits)
   - Client (dropdown, optional)
   - Job (dropdown, optional)
   - Group (dropdown, optional)
   - Description (optional)
4. Click "Add Lead"
5. Lead appears in the list immediately

**Validation Rules**:
- Email must be valid format
- Phone must be exactly 10 digits
- All required fields must be filled

---

#### CSV Bulk Upload
**Process**:
1. Navigate to "Upload CSV" page
2. Click "Select CSV File"
3. Choose CSV file from computer
4. System validates CSV structure
5. Preview displayed with row count
6. Click "Upload Leads"
7. All leads imported to selected group

**CSV Format Requirements**:
```csv
name,email,contact,description
John Doe,john@example.com,9876543210,Senior Developer
Jane Smith,jane@example.com,9876543211,Product Manager
```

**Required Headers**: `name`, `email`, `contact`
**Optional Headers**: `description`, custom fields in `other` column

---

### 2. Call Management

#### Making a Call
**Process**:
1. Employee navigates to leads list
2. Finds target lead
3. Clicks phone icon or "Call" button
4. Phone dialer opens with pre-filled number
5. Employee's assigned phone number auto-selected as "From"
6. Click "Call" button
7. Exotel initiates call
8. Call status tracked in real-time
9. Call logged in database automatically

**Behind the Scenes**:
1. Frontend calls Exotel API with credentials from `company_settings`
2. Exotel response includes Call SID
3. Record created in `call_history` with status "queued"
4. Exotel webhook updates status to "in-progress" → "completed"
5. Call duration, recording URL saved
6. Employee productivity metrics auto-updated

---

#### Call Outcomes
After call completes, system categorizes:

**1. Completed (Relevant)**: Duration >= 30 seconds
- Indicates meaningful conversation
- Counted in productivity metrics
- Included in average duration calculation

**2. Completed (Irrelevant)**: Duration < 30 seconds
- Very short call, likely wrong number or instant hangup
- Excluded from average duration
- Shown separately in charts

**3. Busy**: Lead's phone was busy
**4. No Answer**: Lead didn't pick up
**5. Failed**: Call couldn't connect

**Outcome Mapping**:
- Charts show 5 categories: Relevant, Irrelevant, Busy, No Answer, Failed
- Pie chart displays distribution
- Helps identify call quality

---

#### Call Logging & Notes
**Process**:
1. After call, employee can add:
   - Outcome selection
   - Call notes (conversation details)
   - Next follow-up date
   - Auto-schedule next call checkbox
2. Notes saved to `call_history.notes`
3. Follow-up date saved to `next_follow_up`
4. Lead status updated based on outcome

---

### 3. Recording Analysis

#### Upload Recording
**Process**:
1. Navigate to "Upload Recording" (via dashboard or dedicated page)
2. Click "Upload Recording" button
3. Modal opens
4. Select audio file (.mp3, .wav, .m4a)
5. Optionally assign to employee
6. Optionally link to lead
7. Click "Upload"
8. File uploaded to Supabase Storage
9. Record created in `recordings` table with status "uploaded"

**Storage Location**: `recordings/{user_id}/{filename}`

---

#### AI Analysis Process
**Automatic Flow**:
1. Recording uploaded → status: "uploaded"
2. Transcript generated (manual or automated) → status: "transcribing"
3. Transcript sent to Google AI (Gemini) → status: "analyzing"
4. AI returns structured analysis
5. Analysis saved to `analyses` table → status: "completed"
6. Recording status updated to "completed"

**Analysis Includes**:
- **Closure Probability** (0-100%): Likelihood of successful hire
- **Script Adherence** (0-100%): How well recruiter followed script
- **Call Quality Score** (0-100%): Overall call effectiveness
- **Objections Detected**: Number of objections raised by candidate
- **Objections Handled**: Number successfully addressed
- **Executive Summary**: Brief overview of call
- **Next Steps**: Recommended actions
- **AI Feedback**: Suggestions for recruiter improvement

---

#### View Analysis
**Process**:
1. Navigate to "Analyses" page
2. See list of all analyzed recordings
3. Click on recording to view detailed analysis
4. Analysis detail page shows:
   - All metrics and scores
   - Full transcript
   - AI-generated insights
   - Recommendations

---

### 4. Phone Number Management

#### Admin Assigns Phone Numbers
**Purpose**: Each employee gets one dedicated phone number for calls

**Process**:
1. Admin navigates to dashboard
2. Clicks "Assign Phone Number"
3. Modal opens
4. Enters phone number (10 digits)
5. Selects manager (dropdown)
6. Selects employee under that manager (dropdown)
7. Clicks "Assign"
8. Phone number saved with UNIQUE employee_id constraint

**Rules**:
- One phone number per employee (enforced by database UNIQUE constraint)
- Phone must be exactly 10 digits
- Phone number must not already exist for company
- Manager must be selected first, then employee

**What Employees See**:
- Only their assigned phone number in dialer
- Cannot use other numbers
- "From" field pre-populated with assigned number

---

### 5. Productivity Tracking

#### Daily Productivity Metrics
**Auto-Tracked**:
- **Login Time**: Set when employee makes first call of the day
- **Calls Made**: Incremented each time call initiated
- **Calls Converted**: Manually updated based on outcome
- **Calls Follow-up**: Calls requiring follow-up
- **Work Hours**: Calculated from login to logout time

**Table**: `employee_daily_productivity`

**Update Mechanism**:
- Database trigger on `call_history` insert
- Checks if productivity record exists for employee+date
- Creates if not exists
- Increments `calls_made`
- Sets `login_time` if first call

---

#### Performance Reports
**Admin Reports**:
- Company-wide call volume
- Employee rankings by calls made
- Average call duration trends
- Call outcome distribution
- Conversion rates

**Manager Reports**:
- Team call statistics
- Individual employee performance
- Team productivity trends
- Client-specific metrics

**Employee Reports**:
- Personal call history
- Daily/weekly/monthly stats
- Performance vs targets
- Improvement suggestions

---

## Workflow Processes

### New Employee Onboarding

**Step 1: Admin Creates Employee**
1. Admin logs in
2. Navigates to "Employees" page
3. Clicks "Add Employee"
4. Fills form:
   - Full Name
   - Email
   - Contact Number
   - Password
   - Assign to Manager
5. Clicks "Create"
6. Employee record created in `employees` table
7. User role created in `user_roles` table

**Step 2: Admin Assigns Phone Number**
1. Admin clicks "Assign Phone Number"
2. Selects manager
3. Selects newly created employee
4. Enters phone number
5. Saves assignment

**Step 3: Employee First Login**
1. Employee navigates to login page
2. Selects "Employee Login"
3. Enters email, password, company ID
4. System authenticates via `authenticate_employee` RPC
5. Session created in localStorage
6. Redirected to Employee Dashboard

**Step 4: Employee Makes First Call**
1. Views assigned leads
2. Clicks call on a lead
3. Phone dialer opens with assigned number
4. Makes call
5. Call logged
6. Login time auto-recorded in productivity table

---

### Lead-to-Call-to-Analysis Workflow

**Phase 1: Lead Acquisition**
```
CSV Upload → Leads Created → Assigned to Group → Manager Assigns to Employee
```

**Phase 2: Calling**
```
Employee Views Lead → Makes Call → Call Logged → Outcome Recorded → Follow-up Scheduled
```

**Phase 3: Analysis**
```
Call Recorded (Exotel) → Recording Downloaded → Uploaded to Platform → 
AI Analyzes → Results Saved → Manager Reviews → Feedback to Employee
```

**Phase 4: Follow-up**
```
Employee Checks Follow-ups → Calls Again → Updates Outcome → 
Repeat until Converted or Closed
```

---

### Client-Job-Lead Hierarchy

```
Company
 └── Client (e.g., ABC Corp)
      └── Job (e.g., Senior Developer)
           └── Leads (candidates for this job)
                └── Call History
                     └── Recordings
                          └── Analyses
```

**Usage**:
1. Admin creates Client
2. Admin creates Job under Client
3. Admin/Manager uploads Leads for Job
4. Employees call Leads
5. Calls analyzed
6. Reports generated by Client, Job, or Lead

---

## Integration Points

### Exotel Integration

**Setup (Admin)**:
1. Admin gets Exotel account
2. Obtains API Key, API Token, Account SID
3. Navigates to Company Settings
4. Enters Exotel credentials
5. Sets default Caller ID
6. Adds "From" phone numbers
7. Saves settings

**Configuration Stored**: `company_settings` table
- `exotel_api_key`
- `exotel_api_token`
- `exotel_account_sid`
- `exotel_subdomain`
- `caller_id`
- `exotel_setup_completed` (boolean flag)

**Usage in Calls**:
- Every call uses company's Exotel credentials
- Credentials fetched from `company_settings` before API call
- Call initiated with employee's assigned "From" number
- Company's Caller ID used
- Webhooks configured to receive status updates

---

### Google AI Integration

**Setup**:
- API key configured in environment variables
- Model: Gemini Pro

**Usage**:
- Transcripts sent for analysis
- Structured prompts for consistent output
- Results parsed and stored

**Analysis Prompt Template**:
```
You are an expert recruitment call analyst. Analyze this call transcript 
and provide detailed insights in JSON format:

{
  "closure_probability": 0-100,
  "script_adherence": 0-100,
  "call_quality_score": 0-100,
  "objections_detected": number,
  "objections_handled": number,
  "executive_summary": "Brief summary",
  "next_steps": "Recommended actions",
  "ai_feedback": "Feedback for recruiter"
}
```

---

## Common Operations

### How to Add a Client
1. Admin login
2. Navigate to "Clients" page
3. Click "Add Client"
4. Fill details (name, industry, contact person, etc.)
5. Save

### How to Create a Job
1. Navigate to "Jobs" page
2. Click "Add Job"
3. Select Client
4. Fill job details (title, description, requirements, salary, etc.)
5. Save

### How to Assign Leads to Employee
1. Manager navigates to Lead Groups
2. Creates group or selects existing
3. Uploads/adds leads to group
4. Assigns group to manager (can be self)
5. Leads become visible to employees under that manager

### How to View Reports
**Admin**:
- Dashboard → Overview metrics
- "Reports" → Detailed analytics
- Filter by date range, employee, client

**Manager**:
- Dashboard → Team metrics
- "My Team" → Individual employee reports

**Employee**:
- Dashboard → Personal stats
- "My Reports" → Call history and performance

### How to Change Password
1. Navigate to Profile page
2. Click "Change Password"
3. Enter current password
4. Enter new password
5. Confirm new password
6. Save (uses `update_admin_password` RPC for admins)

---

## Troubleshooting Guide

### Login Issues

**Problem**: Cannot login as admin
**Solution**:
- Verify email exists in `admins` table
- Check password is correct
- Ensure `is_active` = true
- Check browser console for errors
- Clear localStorage and try again

**Problem**: Employee login failing
**Solution**:
- Verify company ID is correct
- Check employee exists in `employees` table
- Ensure employee is linked to correct company
- Check `is_active` status

---

### Call Issues

**Problem**: Call not connecting
**Solution**:
- Verify Exotel credentials in `company_settings`
- Check phone number format (must include country code)
- Ensure employee has assigned phone number
- Check Exotel account balance
- Verify API keys are correct

**Problem**: Call status not updating
**Solution**:
- Check webhook URL is configured in Exotel
- Verify edge function `webhook-call-capture` is deployed
- Check `call_history` table for call record
- Look for errors in edge function logs

**Problem**: Recording URL not saving
**Solution**:
- Ensure Exotel account has call recording enabled
- Check webhook payload includes `RecordingUrl`
- Verify `exotel_recording_url` column in `call_history`

---

### Performance Issues

**Problem**: Dashboard loading slowly
**Solution**:
- Check database query performance
- Ensure proper indexes on foreign keys
- Limit date ranges for large datasets
- Optimize `.select()` queries to fetch only needed columns

**Problem**: Charts not displaying
**Solution**:
- Verify data exists for selected date range
- Check browser console for JavaScript errors
- Ensure Recharts library loaded correctly
- Check data format matches chart expectations

---

### Data Issues

**Problem**: Leads not appearing after CSV upload
**Solution**:
- Verify CSV format matches template
- Check for validation errors during upload
- Ensure all required columns present
- Look for error toast messages
- Check browser console for details

**Problem**: Employee not seeing assigned leads
**Solution**:
- Verify lead group is assigned to employee's manager
- Check `assigned_to` column in `leads` table
- Ensure `group_id` matches manager's group
- Verify employee is under correct manager

**Problem**: Productivity metrics not updating
**Solution**:
- Check if database trigger is active
- Verify `employee_daily_productivity` record exists
- Ensure date is correct (timezone issues)
- Look for errors in trigger execution

---

### Analysis Issues

**Problem**: AI analysis not generating
**Solution**:
- Verify Google AI API key is valid
- Check API quota/rate limits
- Ensure transcript exists and is not empty
- Look for errors in analysis logs
- Verify `analyses` table structure

**Problem**: Recording upload failing
**Solution**:
- Check file size (Supabase storage limits)
- Verify file format is supported (.mp3, .wav, .m4a)
- Ensure storage bucket exists and has proper permissions
- Check browser console for upload errors
- Verify network connection

---

## Best Practices

### For Admins
1. **Set up Exotel first** before assigning phone numbers
2. **Create manager accounts** before employees
3. **Assign clients to managers** for better organization
4. **Regularly review company settings** for accuracy
5. **Monitor employee productivity** to identify training needs

### For Managers
1. **Organize leads into groups** by client or job
2. **Regularly review team call history** for quality
3. **Provide feedback** based on AI analysis
4. **Balance lead distribution** among team members
5. **Set clear targets** for team members

### For Employees
1. **Log call outcomes immediately** after calls
2. **Add detailed notes** for context
3. **Schedule follow-ups** proactively
4. **Review AI feedback** to improve skills
5. **Maintain consistent calling hours** for better productivity tracking

---

## System Maintenance

### Regular Tasks
- **Daily**: Review call logs for errors
- **Weekly**: Check productivity metrics, analyze trends
- **Monthly**: Generate comprehensive reports, review AI analysis accuracy
- **Quarterly**: Review and update Exotel configuration, clean up old recordings

### Database Maintenance
- **Backup**: Supabase handles automated backups
- **Cleanup**: Periodically archive old call history (>1 year)
- **Optimization**: Monitor slow queries and add indexes as needed

### Security
- **Passwords**: Enforce strong password policy
- **API Keys**: Rotate Exotel and Google AI keys periodically
- **Access Control**: Regular audit of user roles and permissions
- **Session Management**: Clear inactive sessions from localStorage

# API Integration Guide - Sattva Call Analysis Platform

## Overview
This document covers all API integrations used in the Sattva Call Analysis platform, including Supabase, Exotel, and Google AI services.

---

## 1. Supabase API Integration

### Configuration
**File**: `src/lib/supabase.ts`

```typescript
const supabaseUrl = 'https://lsuuivbaemjqmtztrjqq.supabase.co'
const supabaseAnonKey = 'eyJhbGci...' // Anon public key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
```

### Database Operations

#### A. **Query Operations**

**Fetch All Records**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
```

**Fetch with Filters**
```typescript
const { data, error } = await supabase
  .from('employees')
  .select('*')
  .eq('company_id', companyId)
  .eq('is_active', true)
```

**Fetch Single Record**
```typescript
const { data, error } = await supabase
  .from('admins')
  .select('*')
  .eq('email', email)
  .single()
```

**Fetch with Joins**
```typescript
const { data, error } = await supabase
  .from('call_history')
  .select(`
    *,
    leads(name, email, contact),
    employees(full_name)
  `)
  .eq('company_id', companyId)
```

#### B. **Insert Operations**

**Insert Single Record**
```typescript
const { data, error } = await supabase
  .from('leads')
  .insert({
    name: 'John Doe',
    email: 'john@example.com',
    contact: '1234567890',
    company_id: companyId
  })
  .select()
```

**Insert Multiple Records**
```typescript
const { data, error } = await supabase
  .from('leads')
  .insert([
    { name: 'Lead 1', email: 'lead1@test.com' },
    { name: 'Lead 2', email: 'lead2@test.com' }
  ])
  .select()
```

#### C. **Update Operations**

**Update Record**
```typescript
const { data, error } = await supabase
  .from('employees')
  .update({ 
    full_name: 'Updated Name',
    updated_at: new Date().toISOString()
  })
  .eq('id', employeeId)
  .select()
```

#### D. **Delete Operations**

**Delete Record**
```typescript
const { data, error } = await supabase
  .from('leads')
  .delete()
  .eq('id', leadId)
```

### RPC Functions (Remote Procedure Calls)

#### 1. **authenticate_employee**
Validates employee login credentials.

**Usage**:
```typescript
const { data, error } = await supabase.rpc('authenticate_employee', {
  p_email: email,
  p_password: password,
  p_company_id: companyId
})
```

**Parameters**:
- `p_email`: Employee email
- `p_password`: Plain text password (hashed server-side)
- `p_company_id`: Company UUID

**Returns**: Employee record if authentication successful

---

#### 2. **update_admin_profile**
Updates admin profile information.

**Usage**:
```typescript
const { data, error } = await supabase.rpc('update_admin_profile', {
  p_admin_id: adminId,
  p_full_name: 'New Name',
  p_email: 'newemail@example.com',
  p_phone: '1234567890'
})
```

**Parameters**:
- `p_admin_id`: Admin UUID
- `p_full_name`: Full name
- `p_email`: Email address
- `p_phone`: Phone number (optional)

**Returns**: Updated admin record

---

#### 3. **update_admin_password**
Changes admin password.

**Usage**:
```typescript
const { data, error } = await supabase.rpc('update_admin_password', {
  p_admin_id: adminId,
  p_current_password: 'oldPassword',
  p_new_password: 'newPassword'
})
```

**Parameters**:
- `p_admin_id`: Admin UUID
- `p_current_password`: Current password for verification
- `p_new_password`: New password (will be hashed)

**Returns**: Success/failure status

---

#### 4. **update_company_info**
Updates company information.

**Usage**:
```typescript
const { data, error } = await supabase.rpc('update_company_info', {
  p_company_id: companyId,
  p_name: 'Company Name',
  p_email: 'info@company.com',
  p_industry: 'Technology',
  p_phone: '1234567890',
  p_address: '123 Main St',
  p_website: 'https://company.com'
})
```

**Parameters**:
- `p_company_id`: Company UUID
- `p_name`: Company name
- `p_email`: Company email
- `p_industry`: Industry (optional)
- `p_phone`: Phone (optional)
- `p_address`: Address (optional)
- `p_website`: Website URL (optional)

**Returns**: Updated company record

---

#### 5. **get_company_by_id**
Fetches company details by ID.

**Usage**:
```typescript
const { data, error } = await supabase.rpc('get_company_by_id', {
  p_company_id: companyId
})
```

**Parameters**:
- `p_company_id`: Company UUID

**Returns**: Company record

---

### Storage API

#### Upload File
```typescript
const { data, error } = await supabase.storage
  .from('recordings')
  .upload(`${userId}/${fileName}`, file, {
    contentType: file.type,
    upsert: false
  })
```

#### Get Public URL
```typescript
const { data } = supabase.storage
  .from('recordings')
  .getPublicUrl(filePath)
```

#### Download File
```typescript
const { data, error } = await supabase.storage
  .from('recordings')
  .download(filePath)
```

---

## 2. Exotel API Integration

### Configuration
**File**: `src/config/exotel.ts`

Exotel credentials stored in `company_settings` table:
- `exotel_api_key`: API Key
- `exotel_api_token`: API Token
- `exotel_subdomain`: Subdomain (default: api.exotel.com)
- `exotel_account_sid`: Account SID
- `caller_id`: Default caller ID

### API Endpoints

#### 1. **Make a Call**

**Endpoint**: `https://{api_key}:{api_token}@{subdomain}/v1/Accounts/{sid}/Calls/connect.json`

**Method**: POST

**Request Body**:
```json
{
  "From": "09513886363",
  "To": "919876543210",
  "CallerId": "09513886363",
  "Url": "https://your-webhook-url.com/webhook-call-capture",
  "StatusCallback": "https://your-webhook-url.com/webhook-call-capture"
}
```

**Response**:
```json
{
  "Call": {
    "Sid": "unique-call-sid",
    "Status": "queued",
    "From": "09513886363",
    "To": "919876543210",
    "DateCreated": "2024-01-01 10:00:00"
  }
}
```

**Frontend Implementation**:
```typescript
const makeCall = async (toNumber: string, fromNumber: string) => {
  const response = await fetch(
    `https://${apiKey}:${apiToken}@${subdomain}/v1/Accounts/${accountSid}/Calls/connect.json`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        From: fromNumber,
        To: toNumber,
        CallerId: callerId,
        Url: webhookUrl,
        StatusCallback: webhookUrl
      })
    }
  )
  return await response.json()
}
```

---

#### 2. **Get Call Details**

**Endpoint**: `https://{api_key}:{api_token}@{subdomain}/v1/Accounts/{sid}/Calls/{call_sid}.json`

**Method**: GET

**Response**:
```json
{
  "Call": {
    "Sid": "call-sid",
    "Status": "completed",
    "Duration": "120",
    "RecordingUrl": "https://recordings.exotel.com/...",
    "StartTime": "2024-01-01 10:00:00",
    "EndTime": "2024-01-01 10:02:00",
    "AnsweredBy": "human"
  }
}
```

---

#### 3. **Get All Calls**

**Endpoint**: `https://{api_key}:{api_token}@{subdomain}/v1/Accounts/{sid}/Calls.json`

**Method**: GET

**Query Parameters**:
- `From`: Filter by from number
- `To`: Filter by to number
- `StartTime`: Filter by start time
- `PageSize`: Number of results per page

---

### Webhook Integration

**Edge Function**: `supabase/functions/webhook-call-capture`

Receives call status updates from Exotel and stores in `call_history` table.

**Webhook Payload**:
```json
{
  "CallSid": "unique-call-sid",
  "Status": "completed",
  "From": "09513886363",
  "To": "919876543210",
  "Duration": "120",
  "RecordingUrl": "https://...",
  "StartTime": "2024-01-01T10:00:00Z",
  "EndTime": "2024-01-01T10:02:00Z",
  "DialCallStatus": "completed"
}
```

**Processing Logic**:
1. Extract call details from webhook payload
2. Find matching lead by phone number
3. Insert/update record in `call_history` table
4. Store Exotel response as JSONB

---

## 3. Google AI (Gemini) Integration

### Configuration

**Package**: `@google/generative-ai`

**API Key**: Stored in environment variables

### Call Analysis Flow

#### 1. **Initialize AI Model**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
```

#### 2. **Analyze Call Transcript**
```typescript
const analyzeTranscript = async (transcript: string) => {
  const prompt = `
    Analyze this recruitment call transcript:
    ${transcript}
    
    Provide:
    1. Closure Probability (0-100)
    2. Script Adherence Score (0-100)
    3. Objections Detected
    4. Call Quality Score (0-100)
    5. Executive Summary
    6. Next Steps
    7. AI Feedback for Recruiter
  `
  
  const result = await model.generateContent(prompt)
  const response = await result.response
  return response.text()
}
```

#### 3. **Store Analysis Results**
Analysis stored in `analyses` table with following fields:
- `closure_probability`
- `script_adherence`
- `call_quality_score`
- `objections_detected`
- `exec_summary`
- `next_steps`
- `ai_feedback_for_recruiter`

---

## API Error Handling

### Standard Error Response Pattern
```typescript
const handleApiError = (error: any) => {
  if (error.code === 'PGRST116') {
    // Multiple rows returned when single expected
    return 'Multiple records found'
  } else if (error.code === 'PGRST301') {
    // Permission denied
    return 'Access denied'
  } else {
    return error.message || 'Unknown error occurred'
  }
}
```

### Frontend Error Handling Pattern
```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select('*')
  
  if (error) throw error
  
  return data
} catch (error) {
  console.error('Database error:', error)
  toast.error('Failed to fetch data')
  return null
}
```

---

## API Rate Limits & Best Practices

### Supabase
- **Rate Limit**: 100 requests/second (Free tier)
- **Best Practice**: Use `.select()` to fetch only needed columns
- **Pagination**: Use `.range()` for large datasets

### Exotel
- **Rate Limit**: 10 calls/second
- **Best Practice**: Queue calls and implement retry logic
- **Webhook Timeout**: 30 seconds

### Google AI
- **Rate Limit**: 60 requests/minute
- **Best Practice**: Batch analyze transcripts
- **Token Limit**: ~30,000 tokens per request

---

## Environment Variables Required

```env
# Supabase
VITE_SUPABASE_URL=https://lsuuivbaemjqmtztrjqq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...

# Google AI
VITE_GOOGLE_AI_API_KEY=AIza...

# Exotel (stored in database per company)
# No frontend env variables needed
```

---

## API Testing

### Using Browser Console
```javascript
// Test Supabase connection
const { data, error } = await supabase.from('companies').select('*').limit(1)
console.log(data, error)

// Test RPC function
const result = await supabase.rpc('get_company_by_id', { 
  p_company_id: 'uuid-here' 
})
console.log(result)
```

### Using Postman/Thunder Client

**Supabase REST API**:
- Base URL: `https://lsuuivbaemjqmtztrjqq.supabase.co/rest/v1`
- Headers:
  - `apikey`: Your anon key
  - `Authorization`: Bearer {anon_key}
  - `Content-Type`: application/json

**Example Request**:
```
GET /companies?select=*
Headers:
  apikey: eyJhbGci...
  Authorization: Bearer eyJhbGci...
```

---

## API Security Considerations

1. **Never expose API keys in frontend code**: Use environment variables
2. **Validate all inputs**: Use Zod schemas before API calls
3. **Implement rate limiting**: On backend to prevent abuse
4. **Use HTTPS only**: All API calls over secure connection
5. **Sanitize user inputs**: Prevent SQL injection
6. **Implement request signing**: For webhook verification
7. **Monitor API usage**: Track and alert on unusual patterns

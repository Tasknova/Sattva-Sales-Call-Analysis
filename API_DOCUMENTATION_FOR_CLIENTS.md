# Call Capture API Documentation for Clients

## Overview

This API allows external systems to submit call data to Voice Axis Scan for analysis. Each call is stored in our system and can be linked to leads, employees, and companies for comprehensive tracking and analytics.

---

## Quick Start

### 1. Endpoint

```
POST https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/webhook-call-capture
```

### 2. Authentication

All requests must include an API key in the header:

```
x-api-key: YOUR_PROVIDED_API_KEY
```

### 3. Request Format

- **Method:** POST
- **Content-Type:** application/json
- **Body:** JSON payload with call details

### 4. Basic Example

```bash
curl -X POST https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/webhook-call-capture \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "company_id": "your-company-uuid",
    "caller_number": "+919876543210",
    "recipient_number": "+919123456789",
    "duration_seconds": 180,
    "outcome": "follow_up",
    "notes": "Customer interested in service"
  }'
```

---

## Request Payload Fields

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `company_id` | UUID (string) | Your unique company identifier in our system |

### Optional Fields - Call Basics

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `lead_id` | UUID (string) | ID of the lead being contacted (if available) | `"234e5678-e89b-12d3-a456-426614174001"` |
| `employee_id` | UUID (string) | ID of the employee making the call (if available) | `"345e6789-e89b-12d3-a456-426614174002"` |
| `outcome` | string | Call result | `"converted"`, `"follow_up"`, `"not_answered"`, `"completed"`, `"not_interested"` |
| `notes` | string | Call notes or summary | `"Customer interested but needs time"` |
| `call_date` | ISO 8601 string | When the call was made (defaults to now) | `"2025-11-25T10:30:00Z"` |

### Optional Fields - Call Metadata

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `caller_number` | string | Phone number that initiated the call | `"+919876543210"` |
| `recipient_number` | string | Phone number that was called | `"+919123456789"` |
| `duration_seconds` | integer | Call duration in seconds | `320` |
| `recording_url` | string | URL to the call recording | `"https://your-system.com/recordings/12345.mp3"` |
| `call_status` | string | Status of the call | `"completed"`, `"busy"`, `"no-answer"`, `"failed"` |
| `start_time` | ISO 8601 string | Call start timestamp | `"2025-11-25T10:30:00Z"` |
| `end_time` | ISO 8601 string | Call end timestamp | `"2025-11-25T10:35:20Z"` |

### Optional Fields - External System Integration

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `external_call_id` | string | Your system's unique call identifier | `"CALL-12345"` |
| `external_system` | string | Name of your calling system | `"MyDialer"` |

### Optional Fields - Follow-up Scheduling

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `next_follow_up` | date string | Next follow-up date | `"2025-11-27"` (YYYY-MM-DD) |
| `next_follow_up_time` | time string | Next follow-up time | `"14:00:00"` (HH:MM:SS) |
| `auto_call_followup` | boolean | Whether to auto-schedule follow-up | `true` or `false` |

### Optional Fields - Additional Data

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `call_details` | object | Any additional custom fields | `{"campaign_id": "CAMP-001", "tags": ["premium"]}` |

---

## Response Format

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Call record created successfully",
  "data": {
    "call_history_id": "456e7890-e89b-12d3-a456-426614174003",
    "created_at": "2025-11-25T10:36:00.000Z"
  }
}
```

### Error Responses

#### 401 Unauthorized (Invalid API Key)
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

#### 400 Bad Request (Missing Required Field)
```json
{
  "error": "Bad Request",
  "message": "company_id is required"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Detailed error message"
}
```

---

## Integration Examples

### Example 1: Minimal Call Record

Send only required and basic information:

```javascript
const response = await fetch('https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/webhook-call-capture', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    company_id: 'your-company-uuid',
    caller_number: '+919876543210',
    recipient_number: '+919123456789',
    duration_seconds: 180,
    outcome: 'completed'
  })
});

const result = await response.json();
console.log(result);
```

### Example 2: Complete Call Record

Send all available information:

```javascript
const callData = {
  // Required
  company_id: 'your-company-uuid',
  
  // Call basics
  lead_id: 'lead-uuid-if-available',
  employee_id: 'employee-uuid-if-available',
  outcome: 'follow_up',
  notes: 'Customer interested in premium package. Needs time to discuss with spouse.',
  call_date: '2025-11-25T10:30:00Z',
  
  // Call metadata
  caller_number: '+919876543210',
  recipient_number: '+919123456789',
  duration_seconds: 320,
  recording_url: 'https://your-system.com/recordings/12345.mp3',
  call_status: 'completed',
  start_time: '2025-11-25T10:30:00Z',
  end_time: '2025-11-25T10:35:20Z',
  
  // External system
  external_call_id: 'CALL-12345',
  external_system: 'YourDialer',
  
  // Follow-up
  next_follow_up: '2025-11-27',
  next_follow_up_time: '14:00:00',
  auto_call_followup: true,
  
  // Additional data
  call_details: {
    campaign_id: 'CAMP-001',
    agent_name: 'John Doe',
    disposition: 'interested',
    tags: ['premium', 'follow-up-needed']
  }
};

const response = await fetch('https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/webhook-call-capture', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify(callData)
});

const result = await response.json();
if (result.success) {
  console.log('Call recorded with ID:', result.data.call_history_id);
} else {
  console.error('Error:', result.message);
}
```

### Example 3: Python Integration

```python
import requests
import json
from datetime import datetime

endpoint = 'https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/webhook-call-capture'
api_key = 'YOUR_API_KEY'

call_data = {
    'company_id': 'your-company-uuid',
    'caller_number': '+919876543210',
    'recipient_number': '+919123456789',
    'duration_seconds': 180,
    'outcome': 'follow_up',
    'notes': 'Customer interested in service',
    'call_date': datetime.utcnow().isoformat() + 'Z',
    'external_call_id': 'CALL-12345',
    'call_status': 'completed'
}

headers = {
    'Content-Type': 'application/json',
    'x-api-key': api_key
}

response = requests.post(endpoint, json=call_data, headers=headers)
result = response.json()

if response.status_code == 201:
    print(f"Success! Call ID: {result['data']['call_history_id']}")
else:
    print(f"Error: {result.get('message', 'Unknown error')}")
```

### Example 4: PHP Integration

```php
<?php

$endpoint = 'https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/webhook-call-capture';
$apiKey = 'YOUR_API_KEY';

$callData = [
    'company_id' => 'your-company-uuid',
    'caller_number' => '+919876543210',
    'recipient_number' => '+919123456789',
    'duration_seconds' => 180,
    'outcome' => 'follow_up',
    'notes' => 'Customer interested in service',
    'call_date' => gmdate('Y-m-d\TH:i:s\Z'),
    'external_call_id' => 'CALL-12345'
];

$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($callData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: ' . $apiKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);

if ($httpCode === 201) {
    echo "Success! Call ID: " . $result['data']['call_history_id'];
} else {
    echo "Error: " . ($result['message'] ?? 'Unknown error');
}
?>
```

---

## Best Practices

### 1. **Error Handling**

Always implement proper error handling:

```javascript
try {
  const response = await fetch(endpoint, options);
  const result = await response.json();
  
  if (!response.ok) {
    // Log error for debugging
    console.error('API Error:', result);
    // Implement retry logic if needed
  }
} catch (error) {
  // Handle network errors
  console.error('Network Error:', error);
}
```

### 2. **Retry Logic**

Implement exponential backoff for transient errors:

```javascript
async function sendCallDataWithRetry(callData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(callData)
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status === 401 || response.status === 400) {
        // Don't retry authentication or validation errors
        throw new Error(await response.text());
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
}
```

### 3. **Data Validation**

Validate data before sending:

```javascript
function validateCallData(callData) {
  if (!callData.company_id) {
    throw new Error('company_id is required');
  }
  
  if (callData.duration_seconds && callData.duration_seconds < 0) {
    throw new Error('duration_seconds must be positive');
  }
  
  if (callData.outcome && !['converted', 'follow_up', 'not_answered', 'completed', 'not_interested'].includes(callData.outcome)) {
    throw new Error('Invalid outcome value');
  }
  
  return true;
}
```

### 4. **Batch Processing**

If sending multiple calls, add delays between requests:

```javascript
for (const call of calls) {
  await sendCallData(call);
  await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
}
```

---

## Testing

Use the provided test script to verify your integration:

```bash
node test-webhook.js
```

Or test with curl:

```bash
curl -X POST https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/webhook-call-capture \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "company_id": "your-company-uuid",
    "caller_number": "+919876543210",
    "recipient_number": "+919123456789",
    "duration_seconds": 60,
    "outcome": "follow_up",
    "notes": "Test call"
  }'
```

---

## Rate Limits

- No hard rate limits currently enforced
- Recommended: Max 10 requests per second
- For bulk operations, implement delays between requests

---

## Support

For technical support or questions:

- **Email:** support@voiceaxisscan.com
- **Documentation:** This guide
- **Status Page:** Monitor our service status

---

## Security

### API Key Protection

- **Never** share your API key publicly
- **Never** commit API keys to version control
- Store keys in environment variables or secure vaults
- Rotate keys periodically

### HTTPS Only

- Always use HTTPS
- Never send API keys over unencrypted connections

### Data Privacy

- Call recordings should be stored securely in your system
- Only send recording URLs (not the actual files) to our API
- Ensure you have proper consent for call recording

---

## Changelog

### v1.0.0 (2025-11-25)
- Initial API release
- Support for all call metadata fields
- External system integration fields
- Follow-up scheduling capabilities

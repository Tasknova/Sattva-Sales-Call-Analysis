/**
 * Test script for the webhook-call-capture endpoint
 * 
 * Usage:
 * 1. Update SUPABASE_URL and API_KEY with your values
 * 2. Update company_id with a valid UUID from your database
 * 3. Run: node test-webhook.js
 */

const SUPABASE_URL = 'https://lsuuivbaemjqmtztrjqq.supabase.co'; // Update with your Supabase URL
const API_KEY = 'YOUR_API_KEY_HERE'; // Update with your generated API key
const ENDPOINT = `${SUPABASE_URL}/functions/v1/webhook-call-capture`;

// Test payloads
const testCases = [
  {
    name: 'Minimal Payload (only required fields)',
    payload: {
      company_id: '123e4567-e89b-12d3-a456-426614174000', // Update with valid company_id
    }
  },
  {
    name: 'Complete Payload (all fields)',
    payload: {
      company_id: '123e4567-e89b-12d3-a456-426614174000', // Update with valid company_id
      lead_id: '234e5678-e89b-12d3-a456-426614174001', // Optional: update if you have a lead
      employee_id: '345e6789-e89b-12d3-a456-426614174002', // Optional: update if you have an employee
      outcome: 'follow_up',
      notes: 'Customer interested in the premium package. Needs time to discuss with spouse.',
      call_date: new Date().toISOString(),
      next_follow_up: '2025-11-27',
      next_follow_up_time: '14:00:00',
      auto_call_followup: true,
      external_call_id: 'EXT-CALL-' + Date.now(),
      external_system: 'TestDialer',
      caller_number: '+919876543210',
      recipient_number: '+919123456789',
      duration_seconds: 320,
      recording_url: 'https://example.com/recordings/test-' + Date.now() + '.mp3',
      call_status: 'completed',
      start_time: new Date(Date.now() - 320000).toISOString(),
      end_time: new Date().toISOString(),
      call_details: {
        campaign_id: 'CAMP-001',
        agent_name: 'Test Agent',
        queue_time_seconds: 5,
        disposition: 'interested',
        tags: ['premium', 'follow-up-needed']
      }
    }
  },
  {
    name: 'Converted Call',
    payload: {
      company_id: '123e4567-e89b-12d3-a456-426614174000',
      outcome: 'converted',
      notes: 'Customer signed up for the service!',
      caller_number: '+919876543210',
      recipient_number: '+919111111111',
      duration_seconds: 180,
      external_call_id: 'CONV-' + Date.now(),
      call_status: 'completed'
    }
  },
  {
    name: 'Not Answered Call',
    payload: {
      company_id: '123e4567-e89b-12d3-a456-426614174000',
      outcome: 'not_answered',
      caller_number: '+919876543210',
      recipient_number: '+919222222222',
      duration_seconds: 0,
      external_call_id: 'NO-ANS-' + Date.now(),
      call_status: 'no-answer',
      next_follow_up: '2025-11-26',
      next_follow_up_time: '10:00:00',
      auto_call_followup: true
    }
  }
];

// Function to test the webhook
async function testWebhook(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${testCase.name}`);
  console.log('='.repeat(60));
  console.log('Payload:', JSON.stringify(testCase.payload, null, 2));
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(testCase.payload)
    });

    const responseData = await response.json();
    
    console.log(`\nResponse Status: ${response.status}`);
    console.log('Response Body:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Test PASSED');
    } else {
      console.log('❌ Test FAILED');
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Test ERROR:', error.message);
    return false;
  }
}

// Test invalid API key
async function testInvalidAuth() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing: Invalid API Key (should fail)');
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'INVALID_KEY'
      },
      body: JSON.stringify({ company_id: '123e4567-e89b-12d3-a456-426614174000' })
    });

    const responseData = await response.json();
    
    console.log(`Response Status: ${response.status}`);
    console.log('Response Body:', JSON.stringify(responseData, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Test PASSED (correctly rejected invalid key)');
      return true;
    } else {
      console.log('❌ Test FAILED (should have rejected invalid key)');
      return false;
    }
  } catch (error) {
    console.error('❌ Test ERROR:', error.message);
    return false;
  }
}

// Test missing required field
async function testMissingRequiredField() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing: Missing Required Field (should fail)');
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({ notes: 'Missing company_id' })
    });

    const responseData = await response.json();
    
    console.log(`Response Status: ${response.status}`);
    console.log('Response Body:', JSON.stringify(responseData, null, 2));
    
    if (response.status === 400) {
      console.log('✅ Test PASSED (correctly rejected missing field)');
      return true;
    } else {
      console.log('❌ Test FAILED (should have rejected missing field)');
      return false;
    }
  } catch (error) {
    console.error('❌ Test ERROR:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('WEBHOOK API TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
  
  if (API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('\n❌ ERROR: Please update API_KEY in the script before running tests');
    process.exit(1);
  }
  
  const results = {
    passed: 0,
    failed: 0
  };

  // Test authentication
  if (await testInvalidAuth()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test missing required field
  if (await testMissingRequiredField()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test valid payloads
  for (const testCase of testCases) {
    if (await testWebhook(testCase)) {
      results.passed++;
    } else {
      results.failed++;
    }
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('='.repeat(60) + '\n');
}

// Run the tests
runTests().catch(console.error);

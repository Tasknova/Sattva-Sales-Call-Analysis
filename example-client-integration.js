/**
 * Example Client Integration
 * 
 * This is a sample Node.js application showing how a client would integrate
 * the webhook API into their call system.
 * 
 * Install dependencies: npm install express axios
 * Run: node example-client-integration.js
 */

const axios = require('axios');

// Configuration - Client should update these
const CONFIG = {
  WEBHOOK_URL: 'https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/webhook-call-capture',
  API_KEY: 'YOUR_API_KEY_HERE', // Replace with your actual API key
  COMPANY_ID: 'YOUR_COMPANY_UUID_HERE', // Replace with your company UUID
  
  // Optional: If you track leads and employees
  DEFAULT_EMPLOYEE_ID: null, // Set if calls are made by specific employees
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000
};

/**
 * Send call data to Voice Axis Scan webhook
 * 
 * @param {Object} callData - Call information
 * @returns {Promise<Object>} API response
 */
async function sendCallToWebhook(callData) {
  const payload = {
    // Required field
    company_id: CONFIG.COMPANY_ID,
    
    // Map your call data to the webhook format
    ...callData,
    
    // Add timestamp if not provided
    call_date: callData.call_date || new Date().toISOString(),
  };

  try {
    const response = await axios.post(CONFIG.WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.API_KEY
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('✅ Call sent successfully:', response.data);
    return response.data;

  } catch (error) {
    if (error.response) {
      // Server responded with error
      console.error('❌ API Error:', error.response.status, error.response.data);
      throw new Error(`API Error: ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      // No response received
      console.error('❌ Network Error: No response from server');
      throw new Error('Network Error: Could not reach webhook endpoint');
    } else {
      // Request setup error
      console.error('❌ Request Error:', error.message);
      throw error;
    }
  }
}

/**
 * Send call with automatic retry on failure
 */
async function sendCallWithRetry(callData, retries = CONFIG.MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await sendCallToWebhook(callData);
    } catch (error) {
      if (attempt === retries) {
        console.error(`Failed after ${retries} attempts:`, error.message);
        throw error;
      }
      
      // Check if error is retryable (5xx errors, network issues)
      const isRetryable = !error.response || error.response.status >= 500;
      
      if (!isRetryable) {
        // Don't retry 4xx errors (bad request, auth issues)
        throw error;
      }
      
      const delay = CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`Retry attempt ${attempt}/${retries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Example 1: Send a basic call
 */
async function example1_BasicCall() {
  console.log('\n📞 Example 1: Basic Call\n' + '='.repeat(50));
  
  const callData = {
    caller_number: '+919876543210',
    recipient_number: '+919123456789',
    duration_seconds: 180,
    outcome: 'completed',
    notes: 'Customer inquiry about product pricing'
  };

  try {
    const result = await sendCallWithRetry(callData);
    console.log('Call ID:', result.data.call_history_id);
  } catch (error) {
    console.error('Failed to send call:', error.message);
  }
}

/**
 * Example 2: Send a call with lead and employee information
 */
async function example2_CallWithLeadAndEmployee() {
  console.log('\n📞 Example 2: Call with Lead & Employee\n' + '='.repeat(50));
  
  const callData = {
    lead_id: 'YOUR_LEAD_UUID', // If you have lead tracking
    employee_id: 'YOUR_EMPLOYEE_UUID', // If you track which employee made the call
    caller_number: '+919876543210',
    recipient_number: '+919111111111',
    duration_seconds: 320,
    outcome: 'follow_up',
    notes: 'Discussed premium package. Customer needs time to think.',
    recording_url: 'https://your-system.com/recordings/call-12345.mp3',
    next_follow_up: '2025-11-27',
    next_follow_up_time: '14:00:00',
    auto_call_followup: true
  };

  try {
    const result = await sendCallWithRetry(callData);
    console.log('Call ID:', result.data.call_history_id);
  } catch (error) {
    console.error('Failed to send call:', error.message);
  }
}

/**
 * Example 3: Send a call with external system tracking
 */
async function example3_CallWithExternalTracking() {
  console.log('\n📞 Example 3: Call with External System Tracking\n' + '='.repeat(50));
  
  const callData = {
    // Your internal call ID for reference
    external_call_id: 'MY-SYSTEM-CALL-789',
    external_system: 'MyDialer v2.0',
    
    // Call details
    caller_number: '+919876543210',
    recipient_number: '+919222222222',
    duration_seconds: 150,
    outcome: 'converted',
    notes: 'Customer signed up for annual subscription!',
    
    // Call timing
    start_time: new Date(Date.now() - 150000).toISOString(),
    end_time: new Date().toISOString(),
    
    // Recording
    recording_url: 'https://your-system.com/recordings/call-789.mp3',
    
    // Additional metadata
    call_details: {
      campaign_id: 'SUMMER-PROMO-2025',
      agent_name: 'John Doe',
      queue_wait_seconds: 5,
      disposition: 'sale',
      product_interest: 'premium-annual',
      call_tags: ['converted', 'premium', 'annual']
    }
  };

  try {
    const result = await sendCallWithRetry(callData);
    console.log('Call ID:', result.data.call_history_id);
  } catch (error) {
    console.error('Failed to send call:', error.message);
  }
}

/**
 * Example 4: Send multiple calls (batch processing)
 */
async function example4_BatchCalls() {
  console.log('\n📞 Example 4: Batch Call Processing\n' + '='.repeat(50));
  
  const calls = [
    {
      caller_number: '+919876543210',
      recipient_number: '+919111111111',
      duration_seconds: 60,
      outcome: 'not_answered'
    },
    {
      caller_number: '+919876543210',
      recipient_number: '+919222222222',
      duration_seconds: 120,
      outcome: 'follow_up',
      notes: 'Interested but busy'
    },
    {
      caller_number: '+919876543210',
      recipient_number: '+919333333333',
      duration_seconds: 240,
      outcome: 'converted',
      notes: 'Sale completed'
    }
  ];

  console.log(`Processing ${calls.length} calls...`);
  
  for (let i = 0; i < calls.length; i++) {
    try {
      const result = await sendCallWithRetry(calls[i]);
      console.log(`✅ Call ${i + 1}/${calls.length} sent: ${result.data.call_history_id}`);
      
      // Add small delay between calls to avoid overwhelming the API
      if (i < calls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`❌ Call ${i + 1}/${calls.length} failed:`, error.message);
      // Continue processing other calls even if one fails
    }
  }
  
  console.log('Batch processing complete');
}

/**
 * Example 5: Simulate your call system integration
 * This shows how you might integrate the webhook into your actual dialer
 */
class CallSystemIntegration {
  constructor(config) {
    this.config = config;
  }

  /**
   * Called when a call is completed in your system
   */
  async onCallCompleted(callInfo) {
    console.log('\n📞 Call Completed - Sending to webhook...');
    console.log('Call Info:', JSON.stringify(callInfo, null, 2));

    const webhookData = {
      // Map your system's call data to webhook format
      external_call_id: callInfo.id,
      external_system: 'MyCallSystem',
      caller_number: callInfo.from,
      recipient_number: callInfo.to,
      duration_seconds: callInfo.duration,
      call_status: callInfo.status,
      start_time: callInfo.startedAt,
      end_time: callInfo.endedAt,
      recording_url: callInfo.recordingUrl,
      
      // Map call outcome
      outcome: this.mapOutcome(callInfo.disposition),
      notes: callInfo.notes,
      
      // Add any custom metadata
      call_details: {
        disposition: callInfo.disposition,
        campaign: callInfo.campaignId,
        agent: callInfo.agentId,
        ...callInfo.metadata
      }
    };

    try {
      const result = await sendCallWithRetry(webhookData);
      console.log('✅ Call synced to Voice Axis Scan:', result.data.call_history_id);
      return result.data.call_history_id;
    } catch (error) {
      console.error('❌ Failed to sync call:', error.message);
      // You might want to queue this for retry or log to a file
      throw error;
    }
  }

  /**
   * Map your system's disposition codes to webhook outcomes
   */
  mapOutcome(disposition) {
    const outcomeMap = {
      'ANSWERED_AND_CONVERTED': 'converted',
      'ANSWERED_INTERESTED': 'follow_up',
      'ANSWERED_NOT_INTERESTED': 'not_interested',
      'NO_ANSWER': 'not_answered',
      'COMPLETED': 'completed'
    };
    
    return outcomeMap[disposition] || 'follow_up';
  }
}

/**
 * Example usage of the integration class
 */
async function example5_SystemIntegration() {
  console.log('\n📞 Example 5: System Integration\n' + '='.repeat(50));
  
  const integration = new CallSystemIntegration(CONFIG);
  
  // Simulate a call completing in your system
  const callFromYourSystem = {
    id: 'CALL-' + Date.now(),
    from: '+919876543210',
    to: '+919123456789',
    duration: 180,
    status: 'completed',
    disposition: 'ANSWERED_INTERESTED',
    notes: 'Customer wants to schedule a demo',
    startedAt: new Date(Date.now() - 180000).toISOString(),
    endedAt: new Date().toISOString(),
    recordingUrl: 'https://your-system.com/recordings/latest.mp3',
    campaignId: 'DEMO-CAMPAIGN',
    agentId: 'AGENT-001',
    metadata: {
      lead_score: 8,
      source: 'website',
      interest_level: 'high'
    }
  };

  try {
    await integration.onCallCompleted(callFromYourSystem);
  } catch (error) {
    console.error('Integration failed:', error.message);
  }
}

/**
 * Validate configuration before running examples
 */
function validateConfig() {
  if (CONFIG.API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('❌ Error: Please update API_KEY in the CONFIG object');
    return false;
  }
  
  if (CONFIG.COMPANY_ID === 'YOUR_COMPANY_UUID_HERE') {
    console.error('❌ Error: Please update COMPANY_ID in the CONFIG object');
    return false;
  }
  
  return true;
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('\n' + '='.repeat(60));
  console.log('VOICE AXIS SCAN - CLIENT INTEGRATION EXAMPLES');
  console.log('='.repeat(60));
  
  if (!validateConfig()) {
    console.log('\nPlease update the CONFIG object with your credentials:');
    console.log('- API_KEY: The API key provided to you');
    console.log('- COMPANY_ID: Your company UUID in the system');
    return;
  }

  try {
    // Run examples sequentially
    await example1_BasicCall();
    await example2_CallWithLeadAndEmployee();
    await example3_CallWithExternalTracking();
    await example4_BatchCalls();
    await example5_SystemIntegration();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All examples completed!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Example execution failed:', error.message);
  }
}

// Export functions for use as a library
module.exports = {
  sendCallToWebhook,
  sendCallWithRetry,
  CallSystemIntegration,
  CONFIG
};

// Run examples if executed directly
if (require.main === module) {
  runExamples();
}

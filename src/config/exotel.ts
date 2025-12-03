// Exotel API Configuration
// Credentials loaded from environment variables for security

export const EXOTEL_CONFIG = {
  apiKey: import.meta.env.VITE_EXOTEL_API_KEY || '',
  apiToken: import.meta.env.VITE_EXOTEL_API_TOKEN || '',
  subdomain: import.meta.env.VITE_EXOTEL_SUBDOMAIN || 'api.exotel.com',
  accountSid: import.meta.env.VITE_EXOTEL_ACCOUNT_SID || '',
} as const;

// Helper function to get Exotel credentials
export const getExotelCredentials = () => {
  return EXOTEL_CONFIG;
};

// Helper function to check if Exotel is configured
export const isExotelConfigured = () => {
  return Boolean(
    EXOTEL_CONFIG.apiKey &&
    EXOTEL_CONFIG.apiToken &&
    EXOTEL_CONFIG.subdomain &&
    EXOTEL_CONFIG.accountSid
  );
};

// Log configuration status (for debugging)
if (!isExotelConfigured()) {
  console.warn('⚠️ Exotel configuration incomplete. Check your .env.local file.');
} else {
  console.log('✅ Exotel credentials loaded from environment variables');
}


import axios from 'axios';
import { generateHMACSignature } from './utils';

async function makeAuthenticatedRequest(endpoint, method = 'get', data = null) {
  const clientId = 'YOUR_CLIENT_ID';
  const clientSecret = 'YOUR_CLIENT_SECRET';
  const username = 'YOUR_USERNAME';
  const password = 'YOUR_PASSWORD';
  const nonce = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const timestamp = Math.floor(Date.now() / 1000);

  const headers = {
    Authorization: generateHMACSignature({
      clientId,
      clientSecret,
      username,
      password,
      nonce,
      timestamp,
    }),
  };

  const options = {
    method,
    url: `https://your-api-url.com/${endpoint}`,
    headers,
    data,
  };

  const response = await axios(options);
  return response.data;
}

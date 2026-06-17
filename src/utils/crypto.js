import CryptoJS from 'crypto-js';

function generateHMACSignature({
  clientId,
  clientSecret,
  username,
  password,
  timestamp,
  nonce,
}) {
  const message = `${clientId}${timestamp}${nonce}`;
  const key = clientSecret;
  const signature = CryptoJS.HmacSHA256(message, key).toString(CryptoJS.enc.Base64);
  const authString = `hmac ${clientId}:${signature}:${timestamp}:${nonce}:${username}:${password}`;
  return authString;
}

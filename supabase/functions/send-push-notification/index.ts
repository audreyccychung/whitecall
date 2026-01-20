// Edge Function: Send push notification when a heart is received
// Called by database trigger after heart insert

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// VAPID keys from secrets
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@whitecall.app';

interface HeartNotificationPayload {
  heart_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: HeartNotificationPayload = await req.json();
    const { sender_id, recipient_id, message } = payload;

    console.log(`[Push] Heart from ${sender_id} to ${recipient_id}`);

    // Create Supabase client with service role for full access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get sender's profile for notification content
    const { data: sender, error: senderError } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', sender_id)
      .single();

    if (senderError) {
      console.error('[Push] Failed to fetch sender:', senderError);
    }

    // Get recipient's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', recipient_id);

    if (subError) {
      console.error('[Push] Failed to fetch subscriptions:', subError);
      return new Response(JSON.stringify({
        code: 'ERROR',
        message: 'Failed to fetch subscriptions',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push] No subscriptions for recipient');
      return new Response(JSON.stringify({
        code: 'NO_SUBSCRIPTIONS',
        message: 'Recipient has no push subscriptions',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const senderName = sender?.display_name || sender?.username || 'Someone';

    // Build notification payload
    const notificationPayload = JSON.stringify({
      title: 'WhiteCall',
      body: `${senderName} ${message}`,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag: 'heart-notification',
      data: {
        type: 'heart',
        sender_id,
        url: '/home',
      },
    });

    console.log(`[Push] Sending to ${subscriptions.length} subscription(s)`);

    // Send to all subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const result = await sendWebPush(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            notificationPayload
          );

          return { id: sub.id, endpoint: sub.endpoint, success: true };
        } catch (error: unknown) {
          const err = error as { statusCode?: number; message?: string };
          console.error(`[Push] Failed for ${sub.endpoint}:`, err);

          // If subscription is invalid/expired (410 Gone or 404), delete it
          if (err.statusCode === 404 || err.statusCode === 410) {
            console.log(`[Push] Deleting stale subscription ${sub.id}`);
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }

          return {
            id: sub.id,
            endpoint: sub.endpoint,
            success: false,
            error: err.message || 'Unknown error',
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    console.log(`[Push] Sent ${successCount}/${results.length} notifications`);

    return new Response(JSON.stringify({
      code: 'SUCCESS',
      sent: successCount,
      total: results.length,
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Push] Error:', error);
    return new Response(JSON.stringify({
      code: 'ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Web Push implementation using Web Crypto API
// Based on RFC 8291 (Message Encryption for Web Push) and RFC 8292 (VAPID)
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string
): Promise<Response> {
  const { endpoint, keys } = subscription;

  // Import VAPID private key
  const vapidPrivateKeyBytes = base64UrlDecode(VAPID_PRIVATE_KEY);

  // Generate local key pair for encryption
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Import subscriber's public key
  const subscriberPublicKeyBytes = base64UrlDecode(keys.p256dh);
  const subscriberPublicKey = await crypto.subtle.importKey(
    'raw',
    subscriberPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );

  // Export local public key
  const localPublicKey = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);

  // Auth secret
  const authSecret = base64UrlDecode(keys.auth);

  // Derive encryption key and nonce using HKDF
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // IKM = ECDH(localPrivate, subscriberPublic)
  const ikm = new Uint8Array(sharedSecret);

  // PRK = HKDF-Extract(auth_secret, ikm)
  const prkKey = await crypto.subtle.importKey(
    'raw',
    authSecret,
    { name: 'HKDF' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Build info for content encryption key
  const keyInfoBuf = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const cekInfo = concatUint8Arrays(
    keyInfoBuf,
    new Uint8Array(1), // null byte
  );

  // Derive content encryption key
  const contentEncryptionKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt,
      info: buildInfo('aesgcm', new Uint8Array(localPublicKey), subscriberPublicKeyBytes),
    },
    await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveKey']),
    { name: 'AES-GCM', length: 128 },
    false,
    ['encrypt']
  );

  // Derive nonce
  const nonceInfo = buildInfo('nonce', new Uint8Array(localPublicKey), subscriberPublicKeyBytes);
  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: salt, info: nonceInfo },
    await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']),
    96
  );
  const nonce = new Uint8Array(nonceBits);

  // Pad and encrypt payload
  const paddedPayload = new Uint8Array(payload.length + 2);
  paddedPayload[0] = 0; // Padding length high byte
  paddedPayload[1] = 0; // Padding length low byte
  paddedPayload.set(new TextEncoder().encode(payload), 2);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    contentEncryptionKey,
    paddedPayload
  );

  // Build the encrypted content
  // Format: salt (16) + rs (4) + idlen (1) + keyid (65) + encrypted
  const recordSize = 4096;
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, recordSize, false);

  const body = concatUint8Arrays(
    salt,
    rs,
    new Uint8Array([65]), // keyid length (uncompressed P-256 point)
    new Uint8Array(localPublicKey),
    new Uint8Array(encrypted)
  );

  // Create VAPID JWT
  const vapidToken = await createVapidToken(endpoint);

  // Send the push
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Authorization': `vapid t=${vapidToken}, k=${VAPID_PUBLIC_KEY}`,
    },
    body: body,
  });

  if (!response.ok) {
    const error = new Error(`Push failed: ${response.status} ${response.statusText}`) as Error & { statusCode: number };
    error.statusCode = response.status;
    throw error;
  }

  return response;
}

async function createVapidToken(endpoint: string): Promise<string> {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: VAPID_SUBJECT,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import VAPID private key for signing
  const privateKeyBytes = base64UrlDecode(VAPID_PRIVATE_KEY);

  // The private key is just the 32-byte scalar, need to create proper JWK
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: base64UrlEncode(privateKeyBytes),
    // We need to derive the public key from the private key
    // For now, use the public key we have
    x: base64UrlEncode(base64UrlDecode(VAPID_PUBLIC_KEY).slice(1, 33)),
    y: base64UrlEncode(base64UrlDecode(VAPID_PUBLIC_KEY).slice(33, 65)),
  };

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw format if needed
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${unsignedToken}.${signatureB64}`;
}

function buildInfo(type: string, localPublicKey: Uint8Array, subscriberPublicKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeBytes = encoder.encode(`Content-Encoding: ${type}\0`);
  const p256Bytes = encoder.encode('P-256\0');

  return concatUint8Arrays(
    typeBytes,
    p256Bytes,
    new Uint8Array([0, 65]), // length of public key (65 bytes for uncompressed P-256)
    subscriberPublicKey,
    new Uint8Array([0, 65]),
    localPublicKey
  );
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

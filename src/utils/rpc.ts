// Centralized RPC response parsing and error normalization
// Single source of truth for handling Supabase RPC responses

/**
 * Parse RPC response data which may come as JSON string or object.
 * Supabase RPC functions return JSON, but the client may receive it
 * as a string or already-parsed object depending on the response.
 *
 * @param data - Raw response from supabase.rpc()
 * @returns Parsed object or null if parsing fails
 */
function parseRpcResponse<T>(data: unknown): T | null {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      // Make parse failures loud in dev to catch issues early
      if (import.meta.env.DEV) {
        console.error('[RPC] Failed to parse response as JSON:', data, e);
      }
      return null;
    }
  }

  if (data && typeof data === 'object') {
    return data as T;
  }

  // Unexpected type (null, undefined, number, etc.)
  if (import.meta.env.DEV) {
    console.error('[RPC] Unexpected response type:', typeof data, data);
  }
  return null;
}

/**
 * Normalize RPC result to ensure it always has a code.
 * Prevents error semantics from drifting across different hooks.
 *
 * @param parsed - Parsed RPC response (may be null or missing code)
 * @param fallbackCode - Code to use if response is invalid (default: 'UNKNOWN_ERROR')
 * @returns Object with guaranteed code property
 */
function normalizeRpcResult<T extends { code?: string }>(
  parsed: T | null,
  fallbackCode: string = 'UNKNOWN_ERROR'
): T & { code: string } {
  if (parsed && parsed.code) {
    return parsed as T & { code: string };
  }

  // Return fallback with any other properties from parsed
  return {
    ...(parsed || {}),
    code: fallbackCode,
  } as T & { code: string };
}

/**
 * Combined helper: parse and normalize in one call.
 * Use this for most RPC response handling.
 *
 * @param data - Raw response from supabase.rpc()
 * @param fallbackCode - Code to use if response is invalid
 * @returns Normalized result with guaranteed code
 */
export function handleRpcResponse<T extends { code?: string }>(
  data: unknown,
  fallbackCode: string = 'UNKNOWN_ERROR'
): T & { code: string } {
  const parsed = parseRpcResponse<T>(data);
  return normalizeRpcResult(parsed, fallbackCode);
}

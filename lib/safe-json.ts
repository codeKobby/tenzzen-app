/**
 * Safely parse JSON from a fetch response, checking content-type first
 * to prevent "Unexpected token '<', '<!DOCTYPE'" errors when HTML is returned
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    // Try to get text for better error message
    const text = await response.text().catch(() => '');
    const preview = text.substring(0, 100);
    throw new Error(
      `Server returned non-JSON response (${contentType || 'unknown'}): ${preview}`
    );
  }
  
  return response.json();
}

/**
 * Safely parse JSON from a fetch response with error handling
 * Returns null if parsing fails instead of throwing
 */
export async function safeJsonParseOrNull<T = any>(response: Response): Promise<T | null> {
  try {
    return await safeJsonParse<T>(response);
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    return null;
  }
}

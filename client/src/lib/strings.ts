/**
 * Safe string utilities to prevent runtime errors from undefined/null values
 */

/**
 * Safely extract initials from a name string
 * @param name - The name to extract initials from
 * @param fallback - Fallback string if name is invalid (default: "U")
 * @returns Initials string (e.g., "John Doe" -> "JD")
 */
export function safeInitials(name?: string | null, fallback = "U"): string {
  if (!name || typeof name !== 'string') {
    return fallback;
  }
  
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return fallback;
  }
  
  return trimmed
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2); // Limit to 2 characters max
}

/**
 * Safely extract a substring from a string
 * @param s - The string to extract from
 * @param start - Start position (default: 0)
 * @param len - Length to extract (default: undefined = to end)
 * @returns Safe substring or empty string
 */
export function safeSubstring(s?: string | null, start = 0, len?: number): string {
  if (s === null || s === undefined) {
    return '';
  }
  
  const str = String(s);
  const startPos = Math.max(0, start);
  
  if (len === undefined) {
    return str.substring(startPos);
  }
  
  const length = Math.max(0, len);
  return str.substring(startPos, startPos + length);
}

/**
 * Safely format a string with ellipsis if it exceeds max length
 * @param s - The string to format
 * @param maxLength - Maximum length before adding ellipsis
 * @param ellipsis - Ellipsis string (default: "...")
 * @returns Formatted string
 */
export function safeTruncate(s?: string | null, maxLength = 50, ellipsis = "..."): string {
  if (!s || typeof s !== 'string') {
    return '';
  }
  
  const str = String(s);
  if (str.length <= maxLength) {
    return str;
  }
  
  return safeSubstring(str, 0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Safely convert a value to a number with fallback
 * @param value - Value to convert
 * @param fallback - Fallback if conversion fails (default: 0)
 * @returns Safe number
 */
export function safeNumber(value: any, fallback = 0): number {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Safely calculate percentage with division by zero protection
 * @param part - The part value
 * @param total - The total value
 * @param fallback - Fallback if total is 0 (default: 0)
 * @returns Safe percentage (0-100)
 */
export function safePercentage(part: any, total: any, fallback = 0): number {
  const partNum = safeNumber(part);
  const totalNum = safeNumber(total);
  
  if (totalNum === 0) {
    return fallback;
  }
  
  return Math.round((partNum / totalNum) * 100);
}

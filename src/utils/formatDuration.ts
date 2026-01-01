/**
 * Formats duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string like "1h 23m" or "45m" or "2h 15m 30s"
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }
  
  if (minutes > 0) {
    if (secs > 0 && minutes < 5) {
      // Show seconds only for short durations
      return `${minutes}m ${secs}s`;
    }
    return `${minutes}m`;
  }
  
  return `${secs}s`;
}
